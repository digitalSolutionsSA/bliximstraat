import crypto from "crypto";

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

function getOrigin(event) {
  // Netlify Dev sets this, and you WANT it in local dev.
  const isDev = process.env.NETLIFY_DEV === "true";

  // ✅ Hard rule: in local dev, always return to Netlify Dev proxy (functions work there).
  if (isDev) return "http://localhost:8888";

  // In production on Netlify, URL is normally set (preferred).
  const envUrl =
    process.env.URL ||
    process.env.SITE_URL ||
    process.env.DEPLOY_PRIME_URL;

  if (envUrl) return envUrl;

  // Fallback to forwarded headers if available
  const proto =
    event.headers["x-forwarded-proto"] ||
    event.headers["X-Forwarded-Proto"];

  const host =
    event.headers["x-forwarded-host"] ||
    event.headers["X-Forwarded-Host"] ||
    event.headers["host"] ||
    event.headers["Host"];

  if (proto && host) return `${proto}://${host}`;

  // Absolute last resort (better than incorrectly forcing 5173)
  return "http://localhost:8888";
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
    if (!YOCO_SECRET_KEY) {
      return json(500, { error: "Missing YOCO_SECRET_KEY env var" });
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    const user_id = body.user_id ? String(body.user_id) : null;

    if (!items.length) return json(400, { error: "Cart is empty" });
    if (!user_id) return json(400, { error: "Missing user_id" });

    let total_cents = 0;

    const cleanItems = items.map((it) => {
      const song_id = String(it?.id ?? "").trim();
      const title = String(it?.title ?? "Song").trim() || "Song";
      const qty = Math.max(1, Math.round(Number(it?.qty ?? 1)));
      const price_cents = Math.max(1, Math.round(Number(it?.price_cents ?? 0)));

      if (!song_id) throw new Error("Item missing id (song_id)");
      if (!Number.isFinite(price_cents) || price_cents <= 0) {
        throw new Error("Invalid price_cents");
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error("Invalid qty");
      }

      total_cents += price_cents * qty;

      return { song_id, title, qty, price_cents };
    });

    const order_id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const origin = getOrigin(event);

    const successUrl = `${origin}/music?payment=success&order_id=${encodeURIComponent(order_id)}`;
    const cancelUrl = `${origin}/music?payment=cancel&order_id=${encodeURIComponent(order_id)}`;
    const failureUrl = `${origin}/music?payment=failed&order_id=${encodeURIComponent(order_id)}`;

    // Create pending order in Supabase
    await supabaseAdminFetch("orders", {
      method: "POST",
      body: {
        id: order_id,
        user_id,
        status: "pending",
        total_cents,
        currency: "ZAR",
      },
    });

    // Insert order items
    await supabaseAdminFetch("order_items", {
      method: "POST",
      body: cleanItems.map((it) => ({
        order_id,
        song_id: it.song_id,
        title: it.title,
        qty: it.qty,
        price_cents: it.price_cents,
      })),
    });

    const payload = {
      amount: total_cents,
      currency: "ZAR",
      successUrl,
      cancelUrl,
      failureUrl,
      metadata: {
        order_id,
        user_id,
      },
    };

    const res = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { rawText: text };
    }

    if (!res.ok) {
      await supabaseAdminFetch(`orders?id=eq.${order_id}`, {
        method: "PATCH",
        body: { status: "failed" },
      });

      return json(res.status, {
        error: "Yoco create-checkout failed",
        yoco: data,
      });
    }

    const redirectUrl = data?.redirectUrl;

    return json(200, { checkoutUrl: redirectUrl, order_id });
  } catch (err) {
    return json(500, {
      error: "Internal Server Error in create-checkout",
      details: err?.message || String(err),
      extra: err?.data || null,
    });
  }
};