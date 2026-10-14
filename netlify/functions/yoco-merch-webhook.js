import crypto from "crypto";
import { MERCH_SOURCE, sendCustomerConfirmation, sendOrderNotification } from "./lib/order-notify.js";

// Yoco signs webhooks with the Standard Webhooks scheme. Env var:
//   YOCO_WEBHOOK_SECRET – the "whsec_…" secret returned when the webhook was registered
//                         (see scripts/register-yoco-webhook.mjs)
const MAX_CLOCK_SKEW_SECONDS = 3 * 60;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function header(event, name) {
  const headers = event.headers || {};
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  return key ? headers[key] : undefined;
}

function isValidSignature(event, rawBody, secret) {
  const id = header(event, "webhook-id");
  const timestamp = header(event, "webhook-timestamp");
  const signatures = header(event, "webhook-signature");
  if (!id || !timestamp || !signatures) return false;

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > MAX_CLOCK_SKEW_SECONDS) return false;

  const key = Buffer.from(secret.split("_").pop(), "base64");
  const expected = crypto
    .createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  // Header holds one or more space-separated "v1,<base64>" entries.
  return signatures.split(" ").some((entry) => {
    const [, sig] = entry.split(",");
    const given = Buffer.from(sig || "", "base64");
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const SECRET = process.env.YOCO_WEBHOOK_SECRET;
  if (!SECRET) {
    console.error("yoco-merch-webhook: YOCO_WEBHOOK_SECRET not set — rejecting");
    return json(500, { error: "Missing YOCO_WEBHOOK_SECRET env var" });
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : event.body || "";

  if (!isValidSignature(event, rawBody, SECRET)) {
    console.warn("yoco-merch-webhook: invalid signature");
    return json(403, { error: "Invalid signature" });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const payment = body.payload || {};
  const metadata = payment.metadata || {};

  // Shared Yoco account: ignore music, other sites, and anything that isn't a successful payment.
  if (body.type !== "payment.succeeded" || metadata.source !== MERCH_SOURCE) {
    return json(200, { ok: true, ignored: true });
  }

  const order = { ...metadata, amount_cents: payment.amount, payment_id: payment.id };

  console.log("yoco-merch-webhook: payment confirmed", {
    order_id: order.order_id,
    payment_id: order.payment_id,
    amount_cents: order.amount_cents,
    email: order.email,
  });

  // Notify the team so they can ship, and send the customer a receipt. Never fail
  // the webhook over an email problem — Yoco would just keep retrying.
  const [teamMail, customerMail] = await Promise.allSettled([
    sendOrderNotification(order),
    sendCustomerConfirmation(order),
  ]);
  for (const [label, result] of [["team", teamMail], ["customer", customerMail]]) {
    if (result.status === "fulfilled") {
      console.log(`yoco-merch-webhook: ${label} email`, result.value?.id || result.value);
    } else {
      console.error(`yoco-merch-webhook: ${label} email failed`, result.reason?.message || result.reason);
    }
  }

  return json(200, { ok: true, order_id: order.order_id });
};
