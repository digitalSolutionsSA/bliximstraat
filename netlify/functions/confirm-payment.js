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

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }

    const order_id = body.order_id ? String(body.order_id) : null;
    const user_id = body.user_id ? String(body.user_id) : null;

    if (!order_id) return json(400, { error: "Missing order_id" });
    if (!user_id) return json(400, { error: "Missing user_id" });

    // 1) Load the order
    const orders = await supabaseAdminFetch(
      `orders?id=eq.${encodeURIComponent(order_id)}&select=id,user_id,status`,
      { method: "GET" }
    );

    const order = Array.isArray(orders) ? orders[0] : null;
    if (!order) return json(404, { error: "Order not found" });

    // 2) Ensure order belongs to this user
    if (String(order.user_id) !== String(user_id)) {
      return json(403, { error: "Order does not belong to this user" });
    }

    // 3) Mark as paid (safe to call multiple times — idempotent)
    const alreadyPaid = String(order.status || "").toLowerCase() === "paid";
    if (!alreadyPaid) {
      await supabaseAdminFetch(`orders?id=eq.${encodeURIComponent(order_id)}`, {
        method: "PATCH",
        body: { status: "paid" },
      });
    }

    // 4) Fetch order items
    const orderItems = await supabaseAdminFetch(
      `order_items?order_id=eq.${encodeURIComponent(order_id)}&select=song_id`,
      { method: "GET" }
    );

    const songIds = (Array.isArray(orderItems) ? orderItems : [])
      .map((r) => r.song_id)
      .filter(Boolean);

    if (!songIds.length) {
      return json(200, { ok: true, paid: true, inserted: 0, note: "No order_items found" });
    }

    // 5) Grant ownership — insert into user_purchases, ignore duplicates
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
        const isConflict =
          msg.includes("Supabase admin fetch failed: 409") ||
          code === "23505"; // unique_violation
        if (!isConflict) throw e;
      }
    }

    return json(200, { ok: true, paid: true, inserted });
  } catch (err) {
    return json(500, {
      error: "Internal Server Error in confirm-payment",
      details: err?.message || String(err),
      extra: err?.data || null,
    });
  }
};
