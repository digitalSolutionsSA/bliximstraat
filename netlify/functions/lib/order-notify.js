// Merch order emails via Resend: one to the BliximStraat team (ship it), one to the customer (receipt).
// Env vars:
//   RESEND_API_KEY      – from resend.com → API keys (required)
//   ORDER_NOTIFY_TO     – comma-separated team addresses (required for the team email)
//   ORDER_NOTIFY_FROM   – sender on the verified domain (default "BliximStraat <orders@bliximstraat.com>")
//   ORDER_REPLY_TO      – where customer replies go (default: first ORDER_NOTIFY_TO address)

const RESEND_URL = "https://api.resend.com/emails";
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

function orderDetails(fields) {
  return {
    customerName: [fields.name_first, fields.name_last].filter(Boolean).join(" "),
    items: String(fields.item_description || "").split(", ").filter(Boolean),
    address: [fields.custom_str1, fields.custom_str2].filter(Boolean),
    // Short, human-friendly reference for the customer to quote.
    ref: String(fields.m_payment_id || "").slice(0, 8).toUpperCase(),
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
      // PayFast can resend the same ITN — this stops duplicate emails for one payment.
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from: process.env.ORDER_NOTIFY_FROM || DEFAULT_FROM, ...payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status}: ${data?.message || JSON.stringify(data)}`);
  return data;
}

export async function sendOrderNotification(fields) {
  const to = teamAddresses();
  if (!to.length) {
    console.warn("order-notify: ORDER_NOTIFY_TO not set — skipping team email");
    return { skipped: true };
  }

  const { customerName, items, address, ref } = orderDetails(fields);

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;color:#111">
  <h2 style="margin:0 0 4px">New merch order — ready to ship</h2>
  <p style="margin:0 0 20px;color:#666">Payment confirmed by PayFast.</p>

  <h3 style="margin:0 0 8px">Items</h3>
  <ul style="margin:0 0 20px;padding-left:20px">
    ${items.map((it) => `<li style="padding:2px 0">${esc(it)}</li>`).join("")}
  </ul>

  <h3 style="margin:0 0 8px">Ship to</h3>
  <table style="border-collapse:collapse;margin-bottom:20px">
    ${row("Name", esc(customerName))}
    ${row("Address", address.map(esc).join("<br>"))}
    ${row("Email", fields.email_address ? `<a href="mailto:${esc(fields.email_address)}">${esc(fields.email_address)}</a>` : "")}
    ${row("Phone", esc(fields.cell_number))}
  </table>

  <h3 style="margin:0 0 8px">Payment</h3>
  <table style="border-collapse:collapse">
    ${row("Amount paid", `R ${esc(fields.amount_gross)}`)}
    ${row("Order ref", esc(ref))}
    ${row("Order ID", esc(fields.m_payment_id))}
    ${row("PayFast ID", esc(fields.pf_payment_id))}
  </table>
</div>`;

  const text = [
    "New merch order — ready to ship (payment confirmed by PayFast)",
    "",
    "ITEMS",
    ...items.map((it) => `- ${it}`),
    "",
    "SHIP TO",
    customerName,
    ...address,
    fields.email_address ? `Email: ${fields.email_address}` : null,
    fields.cell_number ? `Phone: ${fields.cell_number}` : null,
    "",
    `Amount paid: R ${fields.amount_gross}`,
    `Order ref: ${ref}`,
    `Order ID: ${fields.m_payment_id}`,
    `PayFast ID: ${fields.pf_payment_id}`,
  ].filter((l) => l !== null).join("\n");

  return sendEmail(
    {
      to,
      reply_to: fields.email_address || undefined,
      subject: `🛒 New merch order #${ref} — R ${fields.amount_gross} — ${customerName || "customer"}`,
      html,
      text,
    },
    `merch-order-team-${fields.m_payment_id}`
  );
}

export async function sendCustomerConfirmation(fields) {
  const email = String(fields.email_address || "").trim();
  if (!email.includes("@")) {
    console.warn("order-notify: no customer email on ITN — skipping confirmation");
    return { skipped: true };
  }

  const { customerName, items, address, ref } = orderDetails(fields);
  const firstName = fields.name_first || customerName || "there";
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
    ${row("Total paid", `R ${esc(fields.amount_gross)} <span style="color:#666">(incl. delivery)</span>`)}
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
    `Total paid: R ${fields.amount_gross} (incl. delivery)`,
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
    `merch-order-customer-${fields.m_payment_id}`
  );
}
