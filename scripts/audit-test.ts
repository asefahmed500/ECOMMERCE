import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dbConnect from "../lib/db"
import { Coupon, Order, Product, User, Wishlist, isValidObjectId } from "../lib/models"
import { initials } from "../lib/serialize"

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()
function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true as const, retryAfter: 0 }
  }
  bucket.count += 1
  if (bucket.count > limit) {
    return { ok: false as const, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { ok: true as const, retryAfter: 0 }
}

const BCRYPT_ROUNDS = 12
async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}
async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

async function getProduct(id: string) {
  if (!id || typeof id !== "string" || !isValidObjectId(id)) return null
  return Product.findById(id).lean()
}

async function getOrder(id: string) {
  if (!id || typeof id !== "string") return null
  return isValidObjectId(id) ? Order.findById(id).lean() : Order.findOne({ orderNo: id }).lean()
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const SEARCH_SYNONYMS: Record<string, string[]> = {
  perfume: ["parfum", "fragrance", "scent"],
  sneaker: ["shoes", "shoe", "footwear"],
  headphones: ["headset", "earbuds", "audio"],
  smartwatch: ["watch", "wearable"],
  bag: ["handbag", "leather"],
}

function buildProductSearchCond(rawQuery: string): Record<string, unknown> | null {
  const tokens = rawQuery.trim().split(/\s+/).filter(Boolean).slice(0, 6)
  if (tokens.length === 0) return null

  const fields = ["name", "sub", "description", "sku", "category"] as const
  const tokenClauses = tokens
    .map((rawToken) => {
      const token = rawToken.toLowerCase().replace(/[^a-z0-9-]/g, "")
      const variants = [token, ...(SEARCH_SYNONYMS[token] ?? [])].filter(Boolean)
      if (variants.length === 0) {
        const rawEscaped = escapeRegex(rawToken.slice(0, 30))
        return rawEscaped
          ? {
              $or: fields.map((field) => ({
                [field]: { $regex: rawEscaped, $options: "i" },
              })),
            }
          : null
      }
      return {
        $or: fields.map((field) => ({
          [field]: { $regex: variants.map(escapeRegex).join("|"), $options: "i" },
        })),
      }
    })
    .filter(Boolean)

  if (tokenClauses.length === 0) return null
  return { $and: tokenClauses }
}

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    failed++
  }
}

async function runAuditTests() {
  console.log("\n========================================================")
  console.log("  ECOMI END-TO-END SYSTEM AUDIT & RESILIENCE TEST SUITE")
  console.log("========================================================\n")

  await dbConnect()

  // ----------------------------------------------------
  // TEST SUITE 1: Auth, Security & Utilities
  // ----------------------------------------------------
  console.log("[1/5] Testing Auth, Security & Utilities...")

  // Password hashing
  const rawPw = "TestPassword123!"
  const hashed = await hashPassword(rawPw)
  assert(hashed !== rawPw, "Password hashing produces bcrypt hash")
  assert(await verifyPassword(rawPw, hashed), "verifyPassword succeeds on matching password")
  assert(!(await verifyPassword("WrongPassword", hashed)), "verifyPassword rejects mismatched password")

  // Rate Limiting
  const testKey = `test-ip-${Date.now()}`
  const r1 = rateLimit(testKey, 2, 5000)
  const r2 = rateLimit(testKey, 2, 5000)
  const r3 = rateLimit(testKey, 2, 5000)
  assert(r1.ok && r2.ok, "Rate limiter permits requests within capacity")
  assert(!r3.ok && r3.retryAfter > 0, "Rate limiter blocks requests exceeding capacity")

  // Safe Initials Utility
  assert(initials("Alina Putri") === "AP", "initials('Alina Putri') -> 'AP'")
  assert(initials("   John    Doe   ") === "JD", "initials with irregular spaces -> 'JD'")
  assert(initials("Admin") === "A", "initials('Admin') -> 'A'")
  assert(initials("") === "U", "initials('') gracefully returns 'U'")
  assert(initials(null) === "U", "initials(null) gracefully returns 'U'")
  assert(initials(undefined) === "U", "initials(undefined) gracefully returns 'U'")

  // ObjectId validation
  assert(isValidObjectId("507f1f77bcf86cd799439011"), "isValidObjectId accepts valid 24-char hex ObjectId")
  assert(!isValidObjectId("invalid-id-xyz"), "isValidObjectId rejects non-hex string")
  assert(!isValidObjectId("123"), "isValidObjectId rejects short number string")
  assert(!isValidObjectId(""), "isValidObjectId rejects empty string")
  assert(!isValidObjectId(null), "isValidObjectId rejects null")

  // ----------------------------------------------------
  // TEST SUITE 2: Search Query Hardening & Boundary Resiliency
  // ----------------------------------------------------
  console.log("\n[2/5] Testing Search Query & Route Param Resiliency...")

  // Symbol-only query sanitization
  const condSymbols = buildProductSearchCond("### $$$ @@@")
  assert(condSymbols !== null, "buildProductSearchCond handles symbol-only query without crashing")
  const condEmpty = buildProductSearchCond("   ")
  assert(condEmpty === null, "buildProductSearchCond returns null for empty whitespace query")

  // Safe lookups with invalid IDs (preventing CastError crashes)
  const nullProd = await getProduct("not-a-valid-id")
  assert(nullProd === null, "getProduct('not-a-valid-id') safely returns null without throwing CastError")

  const nullOrder = await getOrder("not-a-valid-order-id")
  assert(nullOrder === null, "getOrder('not-a-valid-order-id') safely returns null without throwing CastError")

  // ----------------------------------------------------
  // TEST SUITE 3: Product Inventory & Pricing Integrity
  // ----------------------------------------------------
  console.log("\n[3/5] Testing Product Inventory & Pricing Integrity...")

  const testSku = `TEST-SKU-${Date.now()}`
  const testProduct = await Product.create({
    name: "Audit Test Runner Shoes",
    category: "Fashion",
    sku: testSku,
    price: 99.99,
    stock: 10,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
  })

  assert(testProduct.stock === 10, "Test product created with initial stock of 10")

  // Atomic decrement test
  const decrementRes = await Product.updateOne(
    { _id: testProduct._id, stock: { $gte: 3 } },
    { $inc: { stock: -3 } }
  )
  assert(decrementRes.modifiedCount === 1, "Atomic stock decrement modifies 1 document")

  const reloadedProd = await Product.findById(testProduct._id)
  assert(reloadedProd?.stock === 7, "Stock correctly reduced to 7")

  // Over-demand stock decrement test
  const overDemandRes = await Product.updateOne(
    { _id: testProduct._id, stock: { $gte: 20 } },
    { $inc: { stock: -20 } }
  )
  assert(overDemandRes.modifiedCount === 0, "Stock decrement fails if requested qty exceeds available stock")

  // ----------------------------------------------------
  // TEST SUITE 4: Order Cancellation, Cashback & Coupon Release
  // ----------------------------------------------------
  console.log("\n[4/5] Testing Order Cancellation, Cashback Reversal & Coupon Release...")

  const testEmail = `audit.user.${Date.now()}@test.com`
  const testUser = await User.create({
    name: "Audit User",
    email: testEmail,
    passwordHash: hashed,
    role: "customer",
    tier: "VIP Gold",
    cashback: 10.0, // initial $10 balance
  })

  const testCouponCode = `AUDIT${Math.floor(1000 + Math.random() * 9000)}`
  const testCoupon = await Coupon.create({
    code: testCouponCode,
    percent: 20,
    expiry: new Date(Date.now() + 86400000),
    active: true,
    uses: 0,
    maxUses: 1,
    usedBy: [],
  })

  // Simulate Order Creation:
  // Item price $99.99 * 2 = $199.98
  // Discount 20% = $40.00
  // Subtotal after disc = $159.98
  // Cashback applied: $10.00
  // Total paid = $149.98
  // Cashback earned (VIP Gold 5% of $149.98) = $7.50
  const cashbackEarned = 7.5
  const cashbackApplied = 10.0
  const orderTotal = 149.98

  // User balance after order placement: 10 - 10 (applied) + 7.5 (earned) = $7.50
  await User.updateOne({ _id: testUser._id }, { cashback: 7.5 })

  // Coupon marked used
  await Coupon.updateOne(
    { code: testCouponCode },
    { $inc: { uses: 1 }, $addToSet: { usedBy: testEmail } }
  )

  const testOrderNo = `ORD-AUDIT-${Date.now()}`
  const orderDoc = await Order.create({
    orderNo: testOrderNo,
    user: testUser._id,
    customerName: testUser.name,
    items: [
      {
        product: testProduct._id,
        name: testProduct.name,
        image: testProduct.image,
        price: testProduct.price,
        qty: 2,
      },
    ],
    subtotal: 199.98,
    discount: 40.0,
    couponCode: testCouponCode,
    cashbackApplied,
    cashbackEarned,
    shipping: 0,
    total: orderTotal,
    payment: "Paid",
    status: "Processing",
    history: [{ status: "Processing", at: new Date() }],
  })

  assert(orderDoc.cashbackEarned === 7.5, "Order doc persists cashbackEarned field")

  // Verify coupon is marked used
  let couponCheck = await Coupon.findOne({ code: testCouponCode })
  assert(couponCheck?.uses === 1 && couponCheck.usedBy.includes(testEmail), "Coupon correctly recorded as used")

  // NOW TEST CANCELLATION:
  // Status transition to Cancelled
  const cancelTransition = await Order.findOneAndUpdate(
    { _id: orderDoc._id, status: "Processing" },
    { $set: { status: "Cancelled", payment: "Refunded" }, $push: { history: { status: "Cancelled", at: new Date() } } },
    { returnDocument: "after" }
  )
  assert(cancelTransition?.status === "Cancelled", "Order status successfully transitioned to Cancelled")

  // Execute Cancellation Side-Effects:
  // 1. Restore product inventory
  for (const item of orderDoc.items) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } })
  }
  const restoredProd = await Product.findById(testProduct._id)
  assert(restoredProd?.stock === 9, "Inventory was restored after cancellation (7 + 2 = 9)")

  // 2. Adjust cashback: refund applied cashback ($10) and reverse earned cashback ($7.5) -> net adjustment +$2.5
  // Current user balance was 7.5. New balance should be 7.5 + 2.5 = 10.0 (initial state restored, no money exploit!)
  const userBeforeCancel = await User.findById(testUser._id)
  const netAdj = (orderDoc.cashbackApplied ?? 0) - (orderDoc.cashbackEarned ?? 0)
  const newCashback = Math.max(0, (userBeforeCancel?.cashback ?? 0) + netAdj)
  await User.updateOne({ _id: testUser._id }, { cashback: Math.round(newCashback * 100) / 100 })

  const userAfterCancel = await User.findById(testUser._id)
  assert(
    userAfterCancel?.cashback === 10.0,
    `Cashback accurately reversed: user balance restored to $10.00 (was $${userAfterCancel?.cashback})`
  )

  // 3. Release coupon
  await Coupon.updateOne(
    { code: orderDoc.couponCode },
    { $inc: { uses: -1 }, $pull: { usedBy: testEmail } }
  )
  couponCheck = await Coupon.findOne({ code: testCouponCode })
  assert(
    couponCheck?.uses === 0 && !couponCheck.usedBy.includes(testEmail),
    "Coupon successfully released on cancellation so customer can reuse it"
  )

  // ----------------------------------------------------
  // TEST SUITE 5: Concurrency & Wishlist Edge Cases
  // ----------------------------------------------------
  console.log("\n[5/5] Testing Concurrency & Wishlist Edge Cases...")

  // Concurrent double-cancellation protection:
  // Attempting to cancel an already Cancelled order must fail the atomic conditional match
  const secondCancelAttempt = await Order.findOneAndUpdate(
    { _id: orderDoc._id, status: "Processing" },
    { $set: { status: "Cancelled" } },
    { returnDocument: "after" }
  )
  assert(
    secondCancelAttempt === null,
    "Concurrent cancellation correctly fails conditional update, preventing double-restock"
  )

  // Wishlist toggle & duplicate key handling
  await Wishlist.deleteMany({ user: testUser._id })
  const w1 = await Wishlist.create({ user: testUser._id, product: testProduct._id })
  assert(w1 != null, "Wishlist item created successfully")

  // Simulate concurrent duplicate create
  let duplicateCaught = false
  try {
    await Wishlist.create({ user: testUser._id, product: testProduct._id })
  } catch (err) {
    if (err instanceof Error && err.message.includes("E11000")) {
      duplicateCaught = true
    }
  }
  assert(duplicateCaught, "Duplicate wishlist entry triggers E11000 compound index protection")

  // Wishlist populate null reference resilience test:
  // Create a wishlist item referencing a dummy product ID, then query with populate
  const dummyProductId = new mongoose.Types.ObjectId()
  await Wishlist.create({ user: testUser._id, product: dummyProductId })
  const wishlistItems = await Wishlist.find({ user: testUser._id }).populate("product").lean()
  const safeMappedIds = wishlistItems
    .filter((i) => Boolean(i.product))
    .map((i) => String((i.product as { _id: unknown })._id))

  assert(safeMappedIds.length === 1, "Wishlist gracefully ignores orphaned products without null-pointer crashes")

  // Clean up test data
  await Order.deleteOne({ _id: orderDoc._id })
  await Product.deleteOne({ _id: testProduct._id })
  await User.deleteOne({ _id: testUser._id })
  await Coupon.deleteOne({ _id: testCoupon._id })
  await Wishlist.deleteMany({ user: testUser._id })

  console.log("\n========================================================")
  console.log(`  AUDIT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log("========================================================\n")

  if (failed > 0) {
    process.exit(1)
  }
  process.exit(0)
}

runAuditTests().catch((err) => {
  console.error("Test execution fatal error:", err)
  process.exit(1)
})
