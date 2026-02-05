import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// This must match what Yoco gives you for webhook signing
const YOCO_WEBHOOK_SECRET = process.env.YOCO_WEBHOOK_SECRET;

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Verify webhook signature (HMAC SHA256).
 * Header name can vary; we check the common ones.
 */
function verifySignature(rawBody, signatureHeader) {
  if (!YOCO_WEBHOOK_SECRET) return false;
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", YOCO_WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  const sig = String(signatureHeader).replace(/^sha256=/, "").trim();

  // Avoid timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export const handler = async (event) => {
  // Yoco will POST here
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const rawBody = event.body || "";

  // Common signature header names (depends on Yoco config)
  const sig =
    event.headers?.["x-yoco-signature"] ||
    event.headers?.["X-Yoco-Signature"] ||
    event.headers?.["x-signature"] ||
    event.headers?.["X-Signature"];

  // 1) Verify signature (if you have a webhook secret configured)
  if (YOCO_WEBHOOK_SECRET) {
    const ok = verifySignature(rawBody, sig);
    if (!ok) {
      return { statusCode: 400, body: "Invalid signature" };
    }
  } else {
    // If you haven't set a webhook secret yet, do NOT ship this to prod.
    console.warn("⚠️ YOCO_WEBHOOK_SECRET not set. Webhook signature NOT verified.");
  }

  // 2) Parse payload
  const payload = safeJsonParse(rawBody);
  if (!payload) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: "Missing Supabase env vars" };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // -------------------------------
  // Extract status + metadata safely
  // -------------------------------
  const status =
    payload?.status ||
    payload?.data?.status ||
    payload?.payment?.status ||
    payload?.event?.status;

  const metadata =
    payload?.metadata ||
    payload?.data?.metadata ||
    payload?.payment?.metadata ||
    payload?.event?.metadata;

  const orderId = metadata?.order_id;
  const userId = metadata?.user_id;

  if (!orderId || !userId) {
    // Nothing we can fulfill
    return { statusCode: 200, body: "No order metadata. Ignored." };
  }

  // If your Yoco payload uses different status values, we handle a few common ones.
  const paid =
    status === "succeeded" ||
    status === "successful" ||
    status === "paid" ||
    status === "completed";

  const failed = status === "failed" || status === "cancelled" || status === "canceled";

  try {
    // 3) Mark order status (idempotent)
    if (paid) {
      await supabase
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", orderId);

      // 4) Load order items
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
        // Insert purchases (idempotent thanks to unique constraint)
        const { error: upErr } = await supabase
          .from("user_purchases")
          .upsert(rows, { onConflict: "user_id,song_id" });

        if (upErr) {
          console.error("user_purchases upsert error:", upErr);
          return { statusCode: 500, body: "Failed to write purchases" };
        }
      }

      // 5) Clear cart after successful payment
      await supabase.from("cart_items").delete().eq("user_id", userId);

      return { statusCode: 200, body: "OK" };
    }

    if (failed) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
      return { statusCode: 200, body: "Order marked failed" };
    }

    // Unknown status: don’t freak out, just acknowledge.
    return { statusCode: 200, body: "Ignored status" };
  } catch (e) {
    console.error("Webhook handler error:", e);
    return { statusCode: 500, body: "Webhook error" };
  }
};
