import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Yoco gives you a secret like: whsec_XXXX...=
// IMPORTANT: keep the full string (including whsec_)
const YOCO_WEBHOOK_SECRET = process.env.YOCO_WEBHOOK_SECRET;

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Yoco webhook verification (per docs):
 * signedContent = `${webhook-id}.${webhook-timestamp}.${rawBody}`
 * expectedSignature = base64(HMAC_SHA256(secretBytes, signedContent))
 *
 * Header: webhook-signature can contain multiple entries:
 *   "v1,<sig> v1,<sig2> v2,<sig3>"
 * We accept if ANY v1 signature matches expected.
 */
function verifyYocoSignature({ rawBody, headers }) {
  if (!YOCO_WEBHOOK_SECRET) return { ok: false, reason: "YOCO_WEBHOOK_SECRET missing" };

  const webhookId =
    headers["webhook-id"] || headers["Webhook-Id"] || headers["WEBHOOK-ID"];
  const webhookTimestamp =
    headers["webhook-timestamp"] ||
    headers["Webhook-Timestamp"] ||
    headers["WEBHOOK-TIMESTAMP"];
  const webhookSignature =
    headers["webhook-signature"] ||
    headers["Webhook-Signature"] ||
    headers["WEBHOOK-SIGNATURE"];

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return { ok: false, reason: "Missing required webhook signature headers" };
  }

  // Optional replay-attack mitigation: only accept within 3 minutes
  const nowSec = Math.floor(Date.now() / 1000);
  const ts = Number(webhookTimestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "Invalid webhook-timestamp" };
  const age = Math.abs(nowSec - ts);
  if (age > 180) return { ok: false, reason: "Webhook timestamp too old/new" };

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;

  // Remove "whsec_" prefix and base64 decode the remainder
  const parts = String(YOCO_WEBHOOK_SECRET).split("_");
  if (parts.length < 2) return { ok: false, reason: "Invalid YOCO_WEBHOOK_SECRET format" };

  const secretB64 = parts.slice(1).join("_"); // in case secret contains extra underscores
  let secretBytes;
  try {
    secretBytes = Buffer.from(secretB64, "base64");
  } catch {
    return { ok: false, reason: "Failed to base64 decode webhook secret" };
  }

  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent, "utf8")
    .digest("base64");

  // webhook-signature can include multiple versions/signatures
  // Example: "v1,abc= v1,def= v2,ghi="
  const candidates = String(webhookSignature)
    .split(" ")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [ver, sig] = chunk.split(",", 2);
      return { ver, sig };
    })
    .filter((x) => x.ver && x.sig);

  const v1Sigs = candidates.filter((c) => c.ver === "v1").map((c) => c.sig);

  const match = v1Sigs.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    } catch {
      return false;
    }
  });

  return match ? { ok: true } : { ok: false, reason: "Signature mismatch" };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      }),
    };
  }

  const rawBody = event.body || "";

  // 1) Verify signature (do not accept unsigned in prod)
  const sigCheck = verifyYocoSignature({ rawBody, headers: event.headers || {} });
  if (!sigCheck.ok) {
    console.warn("Webhook signature rejected:", sigCheck.reason);
    return { statusCode: 403, body: "Invalid signature" };
  }

  // 2) Parse payload
  const eventObj = safeJsonParse(rawBody);
  if (!eventObj) return { statusCode: 400, body: "Invalid JSON" };

  // Yoco event shape (Checkout API): { id, type, payload: { status, metadata, ... } }
  const eventType = eventObj?.type;
  const payload = eventObj?.payload || {};
  const status = payload?.status; // "succeeded" / "failed"
  const metadata = payload?.metadata || {};

  // You must put these into metadata when creating checkout
  const orderId = metadata?.order_id || metadata?.orderId;
  const userId = metadata?.user_id || metadata?.userId;

  if (!orderId || !userId) {
    // Not our checkout, or metadata missing. Acknowledge so Yoco doesn't retry forever.
    console.warn("Webhook missing order/user metadata. Ignored.", {
      eventType,
      status,
      metadata,
    });
    return { statusCode: 200, body: "Ignored (missing metadata)" };
  }

  const paid = eventType === "payment.succeeded" || status === "succeeded";
  const failed = eventType === "payment.failed" || status === "failed";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (paid) {
      // 3) Mark order paid
      const { error: updErr } = await supabase
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", orderId);

      if (updErr) {
        console.error("orders update error:", updErr);
        return { statusCode: 500, body: "Failed to update order" };
      }

      // 4) Load order items and write user_purchases
      const { data: orderItems, error: oiErr } = await supabase
        .from("order_items")
        .select("song_id")
        .eq("order_id", orderId);

      if (oiErr) {
        console.error("order_items fetch error:", oiErr);
        return { statusCode: 500, body: "Failed to load order items" };
      }

      const rows = (orderItems || [])
        .map((it) => it.song_id)
        .filter(Boolean)
        .map((songId) => ({
          user_id: userId,
          song_id: songId,
          order_id: orderId,
        }));

      if (rows.length) {
        const { error: upErr } = await supabase
          .from("user_purchases")
          .upsert(rows, { onConflict: "user_id,song_id" });

        if (upErr) {
          console.error("user_purchases upsert error:", upErr);
          return { statusCode: 500, body: "Failed to write purchases" };
        }
      }

      // (Optional) you can clear cart here, but ONLY if you have a reliable cart_id link.
      return { statusCode: 200, body: "OK" };
    }

    if (failed) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
      return { statusCode: 200, body: "Order marked failed" };
    }

    return { statusCode: 200, body: "Ignored status" };
  } catch (e) {
    console.error("Webhook handler error:", e);
    return { statusCode: 500, body: "Webhook error" };
  }
}
