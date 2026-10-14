import crypto from "crypto";
import { MERCH_SOURCE } from "./lib/order-notify.js";

// Server-side price/size truth — never trust prices from the client.
// Keep in sync with src/pages/Merch.tsx if products change.
const CATALOG = {
  "men-tee-blue":       { name: "Men's Tee — Blue",        priceCents: 45000, sizes: ["S", "M", "L", "XL", "XXL"] },
  "men-tee-grey":       { name: "Men's Tee — Grey",        priceCents: 45000, sizes: ["S", "M", "L", "XL", "XXL"] },
  "women-tee-blue":     { name: "Women's Tee — Blue",      priceCents: 45000, sizes: ["XS", "S", "M", "L", "XL"] },
  "women-tee-grey":     { name: "Women's Tee — Grey",      priceCents: 45000, sizes: ["XS", "S", "M", "L", "XL"] },
  "cap-blue":           { name: "Blue Snapback Cap",       priceCents: 42000, sizes: ["One Size"] },
  "cap-mooiste":        { name: "Mooiste Cap",             priceCents: 42000, sizes: ["One Size"] },
  "cap-orange-jean":    { name: "Orange Jean Cap",         priceCents: 42000, sizes: ["One Size"] },
  "cap-stupid":         { name: "Stupid Cap",              priceCents: 42000, sizes: ["One Size"] },
  "cap-blue-cheaper":   { name: "Blue Cap",                priceCents: 12000, sizes: ["One Size"] },
  "cap-orange":         { name: "Orange Cap",              priceCents: 12000, sizes: ["One Size"] },
  "keyring":            { name: "BliximStraat Keyring",    priceCents: 3000,  sizes: ["One Size"] },
  "band":               { name: "BliximStraat Band",       priceCents: 3000,  sizes: ["One Size"] },
};

// Flat per-order delivery fee in Rand (South Africa only). Defaults to R120; override with the
// VITE_MERCH_DELIVERY_FEE env var — the cart (src/lib/merchConfig.ts) reads the same var so totals match.
function deliveryFeeCents() {
  const raw = process.env.VITE_MERCH_DELIVERY_FEE;
  const n = Number(raw);
  const rand = raw === undefined || raw === "" || !Number.isFinite(n) || n < 0 ? 120 : n;
  return Math.round(rand * 100);
}

// Must match SA_PROVINCES in src/lib/merchConfig.ts
const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function getOrigin(event) {
  const isDev = process.env.NETLIFY_DEV === "true";
  if (isDev) return "http://localhost:8888";

  const envUrl = process.env.URL || process.env.SITE_URL || process.env.DEPLOY_PRIME_URL;
  if (envUrl) return envUrl;

  const proto = event.headers["x-forwarded-proto"] || event.headers["X-Forwarded-Proto"];
  const host =
    event.headers["x-forwarded-host"] ||
    event.headers["X-Forwarded-Host"] ||
    event.headers["host"] ||
    event.headers["Host"];
  if (proto && host) return `${proto}://${host}`;

  return "http://localhost:8888";
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
    if (!YOCO_SECRET_KEY) return json(500, { error: "Missing YOCO_SECRET_KEY env var" });

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const customer = body.customer || {};

    if (!rawItems.length) return json(400, { error: "Cart is empty" });

    const name = String(customer.name ?? "").trim();
    const email = String(customer.email ?? "").trim();
    const phone = String(customer.phone ?? "").trim();
    const address1 = String(customer.address1 ?? "").trim();
    const address2 = String(customer.address2 ?? "").trim();
    const city = String(customer.city ?? "").trim();
    const province = String(customer.province ?? "").trim();
    const postalCode = String(customer.postalCode ?? "").trim();

    if (!name || !email || !phone || !address1 || !city || !province || !postalCode) {
      return json(400, { error: "Missing required delivery details" });
    }
    if (!PROVINCES.includes(province)) return json(400, { error: "Please select a valid province" });
    if (!email.includes("@")) return json(400, { error: "Invalid email address" });

    let subtotalCents = 0;
    const cleanItems = rawItems.map((it) => {
      const itemId = String(it?.id ?? "").trim();
      const product = CATALOG[itemId];
      if (!product) throw new Error(`Unknown item: ${itemId}`);

      const size = String(it?.size ?? "One Size").trim();
      if (!product.sizes.includes(size)) throw new Error(`Invalid size "${size}" for ${itemId}`);

      const qty = Math.max(1, Math.min(20, Math.round(Number(it?.qty ?? 1))));
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("Invalid qty");

      subtotalCents += product.priceCents * qty;

      return { name: product.name, size, quantity: qty };
    });

    const totalCents = subtotalCents + deliveryFeeCents();
    const order_id = crypto.randomUUID();
    const origin = getOrigin(event);
    const returnUrl = (status) =>
      `${origin}/merch?payment=${status}&order_id=${encodeURIComponent(order_id)}`;

    // No database: the full order (items, contact, delivery address) travels in the checkout
    // metadata. Yoco echoes it back on the payment.succeeded webhook, which emails it out.
    const metadata = {
      source: MERCH_SOURCE,
      order_id,
      customer_name: name.slice(0, 200),
      email: email.slice(0, 200),
      phone: phone.slice(0, 50),
      address: [address1, address2].filter(Boolean).join(", ").slice(0, 255),
      city_line: `${city}, ${province}, ${postalCode}`.slice(0, 255),
      items: cleanItems.map((it) => `${it.quantity}x ${it.name} (${it.size})`).join(", ").slice(0, 1000),
    };

    const res = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: totalCents,
        currency: "ZAR",
        successUrl: returnUrl("success"),
        cancelUrl: returnUrl("cancelled"),
        failureUrl: returnUrl("failed"),
        metadata,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.redirectUrl) {
      console.error("create-merch-checkout: Yoco create checkout failed", res.status, data);
      return json(res.ok ? 502 : res.status, { error: "Could not start Yoco checkout", yoco: data });
    }

    return json(200, { checkoutUrl: data.redirectUrl, order_id });
  } catch (err) {
    return json(500, {
      error: "Internal Server Error in create-merch-checkout",
      details: err?.message || String(err),
      extra: err?.data || null,
    });
  }
};
