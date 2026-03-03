function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function supabaseAdminFetch(path, { method = "GET", body } = {}) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { rawText: text };
  }

  if (!res.ok) {
    const err = new Error(`Supabase admin fetch failed: ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

function isPaidStatus(status) {
  const s = String(status || "").toLowerCase();
  return ["paid", "succeeded", "completed", "success"].includes(s);
}

/**
 * Verify payment status via Yoco API (server-side).
 * This avoids webhook signing secret problems.
 */
async function yocoFetchCheckout(checkoutId) {
  const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;

  if (!YOCO_SECRET_KEY) {
    throw new Error("Missing YOCO_SECRET_KEY env var");
  }

  // Yoco Online API: fetch checkout/session details
  // If your integration uses a different endpoint, we log and you adjust.
  const url = `https://online.yoco.com/v1/checkouts/${encodeURIComponent(checkoutId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${YOCO_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { rawText: text };
  }

  if (!res.ok) {
    const err = new Error(`Yoco fetch checkout failed: ${res.status}`);
    err.data = data;
    throw err;
  }

  return data;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  // Log minimal info for debugging
  console.log("yoco-webhook received type:", body.type || body.event || "unknown");

  // Common Yoco shapes:
  // { type, payload: {...} } OR { event, data: {...} }
  const eventType = body.type || body.event || null;
  const payload = body.payload || body.data || body;

  const status = payload?.status || payload?.paymentStatus || payload?.payment?.status || null;
  const metadata = payload?.metadata || payload?.payment?.metadata || {};

  const order_id = metadata?.order_id ? String(metadata.order_id) : null;
  const user_id = metadata?.user_id ? String(metadata.user_id) : null;

  // IMPORTANT: find a checkout/payment identifier to verify via Yoco API
  // These are common keys, depends on the event shape
  const checkoutId =
    payload?.id ||
    payload?.checkoutId ||
    payload?.checkout_id ||
    payload?.payment?.id ||
    payload?.paymentId ||
    payload?.payment_id ||
    null;

  // If not a "paid-like" status, ignore quickly (still 200)
  if (!isPaidStatus(status)) {
    console.log(`yoco-webhook: ignoring eventType="${eventType}" status="${status}"`);
    return json(200, { ok: true, ignored: true, status });
  }

  if (!order_id || !user_id) {
    console.warn("yoco-webhook: missing order_id or user_id in metadata", metadata);
    return json(200, { ok: true, ignored: true, reason: "missing metadata" });
  }

  try {
    // Optional but recommended: verify with Yoco API if we have an ID
    if (checkoutId) {
      const checkout = await yocoFetchCheckout(checkoutId);

      // Yoco checkout object shapes vary; check a few likely fields
      const verifiedStatus =
        checkout?.status ||
        checkout?.payment?.status ||
        checkout?.payments?.[0]?.status ||
        null;

      console.log("yoco-webhook: verifiedStatus from API:", verifiedStatus);

      if (!isPaidStatus(verifiedStatus)) {
        // Do NOT mark as paid if Yoco API doesn't confirm
        return json(200, {
          ok: true,
          ignored: true,
          reason: "api_not_paid",
          verifiedStatus,
        });
      }
    } else {
      console.warn("yoco-webhook: no checkout/payment id found in payload; skipping API verify");
    }

    // Mark order as paid
    await supabaseAdminFetch(`orders?id=eq.${encodeURIComponent(order_id)}`, {
      method: "PATCH",
      body: { status: "paid" },
    });

    // Fetch order items
    const orderItems = await supabaseAdminFetch(
      `order_items?order_id=eq.${encodeURIComponent(order_id)}&select=song_id`,
      { method: "GET" }
    );

    const songIds = (Array.isArray(orderItems) ? orderItems : [])
      .map((r) => r.song_id)
      .filter(Boolean);

    let inserted = 0;
    for (const song_id of songIds) {
      try {
        await supabaseAdminFetch("user_purchases", {
          method: "POST",
          body: { user_id, song_id },
        });
        inserted += 1;
      } catch (e) {
        const msg = String(e?.message || "");
        const code = e?.data?.code;
        const isConflict = msg.includes("Supabase admin fetch failed: 409") || code === "23505";
        if (!isConflict) throw e;
      }
    }

    return json(200, { ok: true, inserted, order_id, user_id });
  } catch (err) {
    console.error("yoco-webhook error:", err?.message || err, err?.data || "");
    // Still return 200 to avoid spam retries; you can change to 500 once stable
    return json(200, { ok: false, error: err?.message || String(err) });
  }
};