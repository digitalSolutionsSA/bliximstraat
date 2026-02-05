import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Must match the signing secret returned when you created the webhook via Yoco API
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
 * Tries common header names.
 */
function verifySignature(rawBody, signatureHeader) {
  if (!YOCO_WEBHOOK_SECRET) return true; // allow if secret not set (dev only)
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", YOCO_WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  const sig = String(signatureHeader).replace(/^sha256=/, "").trim();

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"));
  } catch {
    return false;
  }
}

function pickSignature(headers) {
  // normalize keys
  const h = {};
  for (const [k, v] of Object.entries(headers || {})) h[String(k).toLowerCase()] = v;

  return (
    h["x-yoco-signature"] ||
    h["x-signature"] ||
    h["x-webhook-signature"] ||
    h["webhook-signature"]
  );
}

function extractStatusAndMetadata(payload) {
  // Yoco event formats can differ. Try multiple paths.
  const status =
    payload?.status ||
    payload?.data?.status ||
    payload?.payment?.status ||
    payload?.event?.status ||
    payload?.data?.payment?.status;

  const metadata =
    payload?.metadata ||
    payload?.data?.metadata ||
    payload?.payment?.metadata ||
    payload?.event?.metadata ||
    payload?.data?.payment?.metadata;

  return { status, metadata };
}

function isPaidStatus(status) {
  const s = String(status || "").toLowerCase();
  return ["succeeded", "successful", "paid", "completed"].includes(s);
}

function isFailedStatus(status) {
  const s = String(status || "").toLowerCase();
  return ["failed", "cancelled", "canceled"].includes(s);
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const rawBody = event.body || "";
  const sig = pickSignature(event.headers);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return { statusCode: 500, body: "Missing Supabase env vars" };
  }

  const sigOk = verifySignature(rawBody, sig);
  if (!sigOk) {
    console.error("Invalid webhook signature");
    return { statusCode: 400, body: "Invalid signature" };
  }

  const payload = safeJsonParse(rawBody);
  if (!payload) {
    console.error("Invalid JSON payload");
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { status, metadata } = extractStatusAndMetadata(payload);

  // Expecting create-checkout to embed these into metadata
  const orderId = metadata?.order_id || metadata?.orderId;
  const userId = metadata?.user_id || metadata?.userId;

  console.log("Webhook received:", {
    status,
    orderId,
    userId,
    hasMeta: Boolean(metadata),
  });

  if (!orderId || !userId) {
    console.log("No order/user metadata, ignoring.");
    return { statusCode: 200, body: "Ignored (missing metadata)" };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (isPaidStatus(status)) {
      // 1) mark order paid
      const { error: ordErr } = await supabase
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", orderId);

      if (ordErr) {
        console.error("orders update error:", ordErr);
        return { statusCode: 500, body: "Failed updating order" };
      }

      // 2) load order items
      const { data: orderItems, error: oiErr } = await supabase
        .from("order_items")
        .select("song_id")
        .eq("order_id", orderId);

      if (oiErr) {
        console.error("order_items fetch error:", oiErr);
        return { statusCode: 500, body: "Failed loading order items" };
      }

      const songIds = (orderItems || [])
        .map((x) => x.song_id)
        .filter((x) => typeof x === "string" && x.length > 0);

      // 3) insert purchases idempotently
      if (songIds.length) {
        const rows = songIds.map((songId) => ({
          user_id: userId,
          song_id: songId,
          order_id: orderId,
        }));

        const { error: upErr } = await supabase
          .from("user_purchases")
          .upsert(rows, { onConflict: "user_id,song_id" });

        if (upErr) {
          console.error("user_purchases upsert error:", upErr);
          return { statusCode: 500, body: "Failed writing purchases" };
        }
      } else {
        console.warn("No song_ids in order_items for order:", orderId);
      }

      // 4) clear cart items correctly (cart_items uses cart_id, not user_id)
      const { data: cartRow, error: cartErr } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cartErr) {
        console.error("carts fetch error:", cartErr);
        // do not fail the webhook if cart clear fails
      } else if (cartRow?.id) {
        const { error: delErr } = await supabase.from("cart_items").delete().eq("cart_id", cartRow.id);
        if (delErr) console.error("cart_items delete error:", delErr);
      } else {
        console.warn("No cart found for user to clear:", userId);
      }

      return { statusCode: 200, body: "OK" };
    }

    if (isFailedStatus(status)) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
      return { statusCode: 200, body: "Order marked failed" };
    }

    return { statusCode: 200, body: "Ignored status" };
  } catch (e) {
    console.error("Webhook handler error:", e);
    return { statusCode: 500, body: "Webhook error" };
  }
}
