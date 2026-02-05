console.log("YOCO_SECRET_KEY present:", Boolean(process.env.YOCO_SECRET_KEY));
console.log("YOCO_SECRET_KEY prefix:", (process.env.YOCO_SECRET_KEY || "").slice(0, 7));

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// We need an anon key to validate the user's JWT token safely
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export async function handler(event) {
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

    // ✅ Prefer Netlify-provided URL (works for deploy previews too)
    const siteUrl =
      process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";

    // 1) Read bearer token from header (CartModal sends it)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Missing Authorization Bearer token" }),
      };
    }
    const token = authHeader.slice("Bearer ".length).trim();

    // 2) Validate token + get user (anon client)
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: userErr } = await supabaseAnon.auth.getUser(token);

    if (userErr || !userData?.user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid or expired session. Please sign in again." }),
      };
    }

    const userId = userData.user.id;

    // 3) Service role client for server-side reads/writes
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 4) Load cart items (server truth)
    // Relationship name may differ depending on your FK setup.
    // Try this select first:
    let cartRes = await supabase
      .from("cart_items")
      .select("song_id, qty, songs ( title, price_cents )")
      .eq("user_id", userId);

    // If the relationship name isn't "songs", Supabase returns an error.
    // In that case, fall back to a no-join query and fetch song details separately.
    let cartItems = cartRes.data || [];
    if (cartRes.error) {
      console.warn("cart_items join query failed, falling back:", cartRes.error);

      const fallback = await supabase
        .from("cart_items")
        .select("song_id, qty")
        .eq("user_id", userId);

      if (fallback.error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to load cart_items", details: fallback.error }),
        };
      }

      cartItems = fallback.data || [];

      if (!cartItems.length) {
        return { statusCode: 400, body: JSON.stringify({ error: "Cart is empty" }) };
      }

      // Fetch songs for these ids
      const songIds = [...new Set(cartItems.map((r) => r.song_id).filter(Boolean))];
      const songsRes = await supabase
        .from("songs")
        .select("id,title,price_cents")
        .in("id", songIds);

      if (songsRes.error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to load songs", details: songsRes.error }),
        };
      }

      const songMap = new Map((songsRes.data || []).map((s) => [s.id, s]));
      cartItems = cartItems.map((r) => ({
        ...r,
        songs: songMap.get(r.song_id) || null,
      }));
    }

    if (!cartItems.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Cart is empty" }) };
    }

    // 5) Normalize + validate items
    const normalized = cartItems
      .map((r) => {
        const qty = Math.max(1, Number(r.qty || 1));
        const song = r.songs || null;
        return {
          song_id: r.song_id,
          qty,
          title: song?.title || "Song",
          price_cents: Number(song?.price_cents || 0),
        };
      })
      .filter((i) => typeof i.song_id === "string" && i.song_id.length > 0);

    if (!normalized.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Cart items are invalid" }) };
    }

    if (normalized.some((i) => !i.price_cents || i.price_cents < 50)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid price detected" }) };
    }

    const amountCents = normalized.reduce((sum, i) => sum + i.price_cents * i.qty, 0);

    // 6) Create order (pending)
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

    // 7) Insert order items
    const orderItemsPayload = normalized.map((i) => ({
      order_id: orderId,
      song_id: i.song_id,
      title: i.title,
      price_cents: i.price_cents,
      qty: i.qty,
    }));

    const oiInsert = await supabase.from("order_items").insert(orderItemsPayload);

    if (oiInsert.error) {
      // best-effort rollback
      await supabase.from("orders").delete().eq("id", orderId);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to create order items", details: oiInsert.error }),
      };
    }

    // 8) Create Yoco checkout for the whole cart
    const description =
      normalized.length === 1
        ? `BliximStraat: ${normalized[0].title}`
        : `BliximStraat cart (${normalized.length} items)`;

    const res = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountCents, // cents, not rands
        currency: "ZAR",
        description,

        // keep your original URL pattern, but include order id
        successUrl: `${siteUrl}/music?payment=success&order=${orderId}`,
        cancelUrl: `${siteUrl}/music?payment=cancelled&order=${orderId}`,
        failureUrl: `${siteUrl}/music?payment=failed&order=${orderId}`,

        // metadata is what we use in webhook later
        metadata: {
          order_id: orderId,
          user_id: userId,
        },
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      // mark order as failed for visibility
      await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);

      return {
        statusCode: res.status,
        body: JSON.stringify(data || { error: "Yoco checkout failed" }),
      };
    }

    // Store yoco checkout id if they provide it
    if (data?.id) {
      await supabase.from("orders").update({ yoco_checkout_id: data.id }).eq("id", orderId);
    }

    if (!data?.redirectUrl) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Yoco did not return redirectUrl" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ redirectUrl: data.redirectUrl }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || "Server error" }),
    };
  }
}
