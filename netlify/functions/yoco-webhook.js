// netlify/functions/yoco-webhook.js
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Yoco will POST an event payload here.
    // We'll parse it and, if it's a successful payment, write to Supabase.

    const payload = JSON.parse(event.body || "{}");

    // Different gateways name this differently; log once if unsure.
    // console.log("YOCO WEBHOOK PAYLOAD:", JSON.stringify(payload, null, 2));

    // Try common structures:
    const evtType =
      payload?.type ||
      payload?.event?.type ||
      payload?.eventType ||
      payload?.name ||
      null;

    // Checkout/payment object often lives here:
    const checkout =
      payload?.data?.checkout ||
      payload?.data ||
      payload?.checkout ||
      payload?.payment ||
      null;

    // Payment status signals
    const status =
      checkout?.status ||
      payload?.data?.status ||
      payload?.status ||
      null;

    // Metadata we sent from create-checkout:
    const metadata =
      checkout?.metadata ||
      payload?.data?.metadata ||
      payload?.metadata ||
      {};

    const itemId = metadata?.itemId || metadata?.songId || metadata?.item_id;
    const userId = metadata?.userId || metadata?.user_id;

    // We only fulfill on success.
    // Depending on Yoco event naming, success might be evtType or status-based.
    const looksSuccessful =
      evtType?.toLowerCase?.().includes("succeeded") ||
      evtType?.toLowerCase?.().includes("paid") ||
      status?.toLowerCase?.() === "succeeded" ||
      status?.toLowerCase?.() === "paid" ||
      status?.toLowerCase?.() === "successful";

    if (!looksSuccessful) {
      // Acknowledge webhook so Yoco doesn't keep retrying
      return { statusCode: 200, body: "Ignored (not a success event)" };
    }

    if (!itemId || !userId) {
      console.error("Missing metadata itemId/userId:", { itemId, userId, metadata });
      return { statusCode: 400, body: "Missing metadata" };
    }

    // Write purchase to Supabase using SERVICE ROLE key (server-side only)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing Supabase env vars for webhook:", {
        supabaseUrlPresent: Boolean(supabaseUrl),
        serviceKeyPresent: Boolean(serviceKey),
      });
      return { statusCode: 500, body: "Server not configured" };
    }

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/user_purchases`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates", // works if you have a unique constraint
      },
      body: JSON.stringify({
        user_id: userId,
        song_id: itemId,
      }),
    });

    const insertText = await insertRes.text();

    if (!insertRes.ok) {
      console.error("Supabase insert failed:", insertRes.status, insertText);
      return { statusCode: 500, body: "DB insert failed" };
    }

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error("Webhook error:", err);
    return { statusCode: 500, body: "Webhook error" };
  }
}
