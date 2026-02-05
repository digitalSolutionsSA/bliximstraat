console.log("YOCO_SECRET_KEY present:", Boolean(process.env.YOCO_SECRET_KEY));
console.log("YOCO_SECRET_KEY prefix:", (process.env.YOCO_SECRET_KEY || "").slice(0, 7));

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Netlify env vars",
        }),
      };
    }

    if (!SUPABASE_ANON_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) in Netlify env vars",
        }),
      };
    }

    if (!process.env.YOCO_SECRET_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing YOCO_SECRET_KEY in Netlify env vars" }),
      };
    }

    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

    // ---- Auth token from client ----
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { statusCode: 401, body: JSON.stringify({ error: "Missing Authorization Bearer token" }) };
    }
    const token = authHeader.slice("Bearer ".length).trim();

    // Validate token with anon client
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: userErr } = await supabaseAnon.auth.getUser(token);

    if (userErr || !userData?.user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid or expired session. Please sign in again." }),
      };
    }

    const userId = userData.user.id;

    // Service role client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ---- 1) Find user's latest cart ----
    const { data: cartRow, error: cartErr } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cartErr) {
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to load cart", details: cartErr }) };
    }

    const cartId = cartRow?.id;
    if (!cartId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Cart is empty" }) };
    }

    // ---- 2) Load cart items by cart_id ----
    // IMPORTANT: your column is `quantity`, not `qty`
    const { data: cartItemsRaw, error: ciErr } = await supabase
      .from("cart_items")
      .select("song_id, quantity")
      .eq("cart_id", cartId);

    if (ciErr) {
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to load cart_items", details: ciErr }) };
    }

    if (!cartItemsRaw?.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Cart is empty" }) };
    }

    const items = (cartItemsRaw || [])
      .map((r) => ({
        song_id: r.song_id,
        qty: Math.max(1, Number(r.quantity || 1)),
      }))
      .filter((r) => typeof r.song_id === "string" && r.song_id.length > 0);

    if (!items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Cart items are invalid" }) };
    }

    // ---- 3) Load songs ----
    const songIds = [...new Set(items.map((i) => i.song_id))];

    const { data: songs, error: songsErr } = await supabase
      .from("songs")
      .select("id,title,price_cents")
      .in("id", songIds);

    if (songsErr) {
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to load songs", details: songsErr }) };
    }

    const songMap = new Map((songs || []).map((s) => [s.id, s]));

    const normalized = items
      .map((i) => {
        const s = songMap.get(i.song_id);
        return {
          song_id: i.song_id,
          qty: i.qty,
          title: s?.title || "Song",
          price_cents: Number(s?.price_cents || 0),
        };
      })
      .filter((i) => i.price_cents >= 50);

    if (!normalized.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid price detected" }) };
    }

    const amountCents = normalized.reduce((sum, i) => sum + i.price_cents * i.qty, 0);

    // ---- 4) Create order ----
    const orderInsert = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        currency: "ZAR",
        amount_cents: amountCents,
      })
      .select("id")
      .single();

    if (orderInsert.error || !orderInsert.data?.id) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to create order", details: orderInsert.error }),
      };
    }

    const orderId = orderInsert.data.id;

    // ---- 5) Create order items ----
    const orderItemsPayload = normalized.map((i) => ({
      order_id: orderId,
      song_id: i.song_id,
      title: i.title,
      price_cents: i.price_cents,
      qty: i.qty,
    }));

    const oiInsert = await supabase.from("order_items").insert(orderItemsPayload);
    if (oiInsert.error) {
      await supabase.from("orders").delete().eq("id", orderId);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to create order items", details: oiInsert.error }),
      };
    }

    const description =
      normalized.length === 1
        ? `BliximStraat: ${normalized[0].title}`
        : `BliximStraat cart (${normalized.length} items)`;

    // ---- 6) Create Yoco checkout ----
    const res = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountCents,
        currency: "ZAR",
        description,
        successUrl: `${siteUrl}/music?payment=success&order=${orderId}`,
        cancelUrl: `${siteUrl}/music?payment=cancelled&order=${orderId}`,
        failureUrl: `${siteUrl}/music?payment=failed&order=${orderId}`,
        metadata: { order_id: orderId, user_id: userId, cart_id: cartId },
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
      return { statusCode: res.status, body: JSON.stringify(data || { error: "Yoco checkout failed" }) };
    }

    if (data?.id) {
      await supabase.from("orders").update({ yoco_checkout_id: data.id }).eq("id", orderId);
    }

    if (!data?.redirectUrl) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
      return { statusCode: 500, body: JSON.stringify({ error: "Yoco did not return redirectUrl" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ redirectUrl: data.redirectUrl }) };
  } catch (err) {
    console.error("create-checkout error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Server error" }) };
  }
};
