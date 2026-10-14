// Merch order emails via Resend: one to the BliximStraat team (ship it), one to the customer (receipt).
// Env vars:
//   RESEND_API_KEY      – from resend.com → API keys (required)
//   ORDER_NOTIFY_TO     – comma-separated team addresses (required for the team email)
//   ORDER_NOTIFY_FROM   – sender on the verified domain (default "BliximStraat <orders@bliximstraat.com>")
//   ORDER_REPLY_TO      – where customer replies go (default: first ORDER_NOTIFY_TO address)

const RESEND_URL = "https://api.resend.com/emails";

// The Yoco account is shared (music store, other sites), so merch checkouts are tagged with
// this metadata source and yoco-merch-webhook ignores every payment without it.
export const MERCH_SOURCE = "bliximstraat-merch";
const DEFAULT_FROM = "BliximStraat <orders@bliximstraat.com>";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label, value) {
  if (!value) return "";
  return `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0">${value}</td></tr>`;
}

function teamAddresses() {
  return (process.env.ORDER_NOTIFY_TO || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function rand(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

// `order` is the merch checkout metadata Yoco echoes back on payment.succeeded,
// plus amount_cents and payment_id from the payment itself.
function orderDetails(order) {
  return {
    customerName: String(order.customer_name || ""),
    items: String(order.items || "").split(", ").filter(Boolean),
    address: [order.address, order.city_line].filter(Boolean),
    // Short, human-friendly reference for the customer to quote.
    ref: String(order.order_id || "").slice(0, 8).toUpperCase(),
    amount: rand(order.amount_cents),
  };
}

async function sendEmail(payload, idempotencyKey) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("order-notify: RESEND_API_KEY not set — skipping email");
    return { skipped: true };
  }

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Yoco retries webhooks until it gets a 2xx — this stops duplicate emails for one payment.
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from: process.env.ORDER_NOTIFY_FROM || DEFAULT_FROM, ...payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status}: ${data?.message || JSON.stringify(data)}`);
  return data;
}

export async function sendOrderNotification(order) {
  const to = teamAddresses();
  if (!to.length) {
    console.warn("order-notify: ORDER_NOTIFY_TO not set — skipping team email");
    return { skipped: true };
  }

  const { customerName, items, address, ref, amount } = orderDetails(order);

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;color:#111">
  <h2 style="margin:0 0 4px">New merch order — ready to ship</h2>
  <p style="margin:0 0 20px;color:#666">Payment confirmed by Yoco.</p>

  <h3 style="margin:0 0 8px">Items</h3>
  <ul style="margin:0 0 20px;padding-left:20px">
    ${items.map((it) => `<li style="padding:2px 0">${esc(it)}</li>`).join("")}
  </ul>

  <h3 style="margin:0 0 8px">Ship to</h3>
  <table style="border-collapse:collapse;margin-bottom:20px">
    ${row("Name", esc(customerName))}
    ${row("Address", address.map(esc).join("<br>"))}
    ${row("Email", order.email ? `<a href="mailto:${esc(order.email)}">${esc(order.email)}</a>` : "")}
    ${row("Phone", esc(order.phone))}
  </table>

  <h3 style="margin:0 0 8px">Payment</h3>
  <table style="border-collapse:collapse">
    ${row("Amount paid", `R ${esc(amount)}`)}
    ${row("Order ref", esc(ref))}
    ${row("Order ID", esc(order.order_id))}
    ${row("Yoco payment ID", esc(order.payment_id))}
  </table>
</div>`;

  const text = [
    "New merch order — ready to ship (payment confirmed by Yoco)",
    "",
    "ITEMS",
    ...items.map((it) => `- ${it}`),
    "",
    "SHIP TO",
    customerName,
    ...address,
    order.email ? `Email: ${order.email}` : null,
    order.phone ? `Phone: ${order.phone}` : null,
    "",
    `Amount paid: R ${amount}`,
    `Order ref: ${ref}`,
    `Order ID: ${order.order_id}`,
    `Yoco payment ID: ${order.payment_id}`,
  ].filter((l) => l !== null).join("\n");

  return sendEmail(
    {
      to,
      reply_to: order.email || undefined,
      subject: `🛒 New merch order #${ref} — R ${amount} — ${customerName || "customer"}`,
      html,
      text,
    },
    `merch-order-team-${order.order_id}`
  );
}

export async function sendCustomerConfirmation(order) {
  const email = String(order.email || "").trim();
  if (!email.includes("@")) {
    console.warn("order-notify: no customer email on order — skipping confirmation");
    return { skipped: true };
  }

  const { customerName, items, address, ref, amount } = orderDetails(order);
  const firstName = customerName.split(" ")[0] || "there";
  const replyTo = process.env.ORDER_REPLY_TO || teamAddresses()[0];

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;color:#111">
  <h2 style="margin:0 0 12px">Thanks for your order, ${esc(firstName)}!</h2>
  <p style="margin:0 0 20px">We've received your payment and we're getting your BliximStraat merch ready.
  We'll be in touch once it's on its way.</p>

  <h3 style="margin:0 0 8px">Your order <span style="color:#666;font-weight:normal">#${esc(ref)}</span></h3>
  <ul style="margin:0 0 20px;padding-left:20px">
    ${items.map((it) => `<li style="padding:2px 0">${esc(it)}</li>`).join("")}
  </ul>

  <table style="border-collapse:collapse;margin-bottom:20px">
    ${row("Total paid", `R ${esc(amount)} <span style="color:#666">(incl. delivery)</span>`)}
    ${row("Delivering to", [esc(customerName), ...address.map(esc)].filter(Boolean).join("<br>"))}
  </table>

  <p style="margin:0 0 4px">Questions about your order? Just reply to this email and quote <strong>#${esc(ref)}</strong>.</p>
  <p style="margin:20px 0 0">— BliximStraat</p>
</div>`;

  const text = [
    `Thanks for your order, ${firstName}!`,
    "",
    "We've received your payment and we're getting your BliximStraat merch ready.",
    "We'll be in touch once it's on its way.",
    "",
    `YOUR ORDER #${ref}`,
    ...items.map((it) => `- ${it}`),
    "",
    `Total paid: R ${amount} (incl. delivery)`,
    "",
    "DELIVERING TO",
    customerName,
    ...address,
    "",
    `Questions about your order? Just reply to this email and quote #${ref}.`,
    "",
    "— BliximStraat",
  ].join("\n");

  return sendEmail(
    {
      to: [email],
      reply_to: replyTo || undefined,
      subject: `Your BliximStraat order #${ref} is confirmed`,
      html,
      text,
    },
    `merch-order-customer-${order.order_id}`
  );
}
