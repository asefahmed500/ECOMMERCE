import "server-only"
import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

let cached: Transporter | null = null

function getTransporter(): Transporter | null {
  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT, EMAIL_SECURE } = process.env
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) return null
  if (!cached) {
    cached = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT ?? 587),
      secure: EMAIL_SECURE === "true" || Number(EMAIL_PORT) === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    })
  }
  return cached
}

export function mailerConfigured() {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS)
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
  if (!mailerConfigured()) {
    console.warn("[mailer] Email not configured — skipped:", opts.subject)
    return { ok: false as const, reason: "not_configured" }
  }
  try {
    const transport = getTransporter()!
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.EMAIL_USER,
      ...opts,
    })
    return { ok: true as const, messageId: info.messageId }
  } catch (err) {
    console.error("[mailer] send failed:", err)
    return { ok: false as const, reason: "send_failed" }
  }
}

const WRAP = "max-width:560px;margin:0 auto;font-family:Segoe UI,Helvetica,Arial,sans-serif"

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#FAFAF8;padding:32px 16px;">
  <div style="${WRAP}">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <span style="width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#FF7A3D,#FF4D1C);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;">e</span>
      <span style="font-size:20px;font-weight:800;color:#18181B;">ecomi</span>
    </div>
    <div style="background:#ffffff;border:1px solid #E4E4E7;border-radius:14px;padding:28px;">
      <h1 style="margin:0 0 14px;font-size:18px;color:#18181B;">${title}</h1>
      ${body}
    </div>
    <p style="margin:16px 0 0;font-size:11px;color:#A1A1AA;text-align:center;">
      You received this email because you have an ecomi account or placed an order. © ${new Date().getFullYear()} ecomi
    </p>
  </div>
</body></html>`
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:18px;background:linear-gradient(135deg,#FF7A3D,#FF4D1C);color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:11px 22px;border-radius:999px;">${label}</a>`
}

export function orderTable(items: Array<{ name: string; price: number; qty: number }>, total: number) {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:7px 0;color:#52525B;font-size:13px;">${i.name} ×${i.qty}</td><td style="padding:7px 0;text-align:right;color:#18181B;font-size:13px;font-weight:600;">$${(i.price * i.qty).toFixed(2)}</td></tr>`
    )
    .join("")
  return `<table style="width:100%;border-collapse:collapse;margin-top:12px;border-top:1px solid #E4E4E7;">${rows}
  <tr><td style="padding:10px 0 0;border-top:1px solid #E4E4E7;color:#18181B;font-size:14px;font-weight:700;">Total</td>
  <td style="padding:10px 0 0;border-top:1px solid #E4E4E7;text-align:right;color:#18181B;font-size:14px;font-weight:700;">$${total.toFixed(2)}</td></tr></table>`
}

export function orderConfirmedEmail(opts: {
  name: string
  orderNo: string
  trackingNo: string
  items: Array<{ name: string; price: number; qty: number }>
  total: number
  orderUrl: string
}) {
  return {
    subject: `Order ${opts.orderNo} confirmed · ecomi`,
    html: layout(
      `Thanks for your order, ${opts.name}!`,
      `<p style="margin:0;color:#52525B;font-size:13px;line-height:1.6;">
        Order <strong style="color:#18181B;">${opts.orderNo}</strong> is confirmed and being prepared.
        Your tracking number is <strong style="color:#18181B;">${opts.trackingNo}</strong> (DHL Express).</p>
      ${orderTable(opts.items, opts.total)}
      ${button(opts.orderUrl, "Track Your Order")}`
    ),
  }
}

export function orderStatusEmail(opts: {
  name: string
  orderNo: string
  status: string
  detail: string
  orderUrl: string
}) {
  const titles: Record<string, string> = {
    Shipped: "Your order is on its way!",
    Delivered: "Your order was delivered",
    Cancelled: "Your order was cancelled",
    Processing: "Your order is being processed",
  }
  return {
    subject: `Order ${opts.orderNo} is ${opts.status} · ecomi`,
    html: layout(
      titles[opts.status] ?? `Order update: ${opts.status}`,
      `<p style="margin:0;color:#52525B;font-size:13px;line-height:1.6;">Hi ${opts.name},<br/><br/>${opts.detail}</p>
      ${button(opts.orderUrl, "View Order")}`
    ),
  }
}

export function welcomeEmail(opts: { name: string; homeUrl: string }) {
  return {
    subject: `Welcome to ecomi, ${opts.name}!`,
    html: layout(
      `Welcome aboard, ${opts.name}!`,
      `<p style="margin:0;color:#52525B;font-size:13px;line-height:1.6;">
        Your ecomi account is ready. Enjoy free express shipping over $50, up to 5% VIP cashback,
        30-day easy returns and 24/7 concierge support.</p>
      ${button(opts.homeUrl, "Start Shopping")}`
    ),
  }
}
