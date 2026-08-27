# Econi

A full-stack e-commerce platform built with Next.js 16 (App Router), MongoDB/Mongoose, JWT auth, and Tailwind CSS v4.

## Features

**Storefront**
- Live product search with instant card suggestions in the navbar
- Product catalog, categories, deals, wishlist, cart with coupon support
- Guest checkout and member checkout with cashback rewards
- Order tracking with status timeline, notifications bell

**Admin portal (role-protected)**
- Dashboard with net-revenue analytics and daily revenue chart
- Full product CRUD with stock management and restock
- Order fulfillment pipeline with cancellation, stock restore, refunds
- Customer CRM with aggregated metrics (orders, lifetime spend, AOV, last order)
- Coupons with max-uses and per-customer redemption limits
- Store settings

## Getting started

```bash
npm install
# configure .env
npx tsx --env-file=.env scripts/seed.ts
npm run dev
```

Environment variables (`.env`):

```
MONGODB_URI=<connection string>
AUTH_SECRET=<random 64-hex secret>
```

Demo accounts after seeding: `admin@ecomi.com / admin123`, `alina.putri@ecomi.com / customer123`.
