import crypto from "crypto";

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

const DELIVERY_FEE_CENTS = 12000; // R120 flat, standardized per order (South Africa only)

const PAYFAST_PROCESS_URL = "https://www.payfast.co.za/eng/process";

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

function pfEncode(value) {
  return encodeURIComponent(String(value).trim()).replace(/%20/g, "+");
}

function generateSignature(data, passphrase) {
  let pfOutput = "";
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== "" && data[key] !== undefined && data[key] !== null) {
      pfOutput += `${key}=${pfEncode(data[key])}&`;
    }
  }
  let getString = pfOutput.slice(0, -1);
  if (passphrase) {
    getString += `&passphrase=${pfEncode(passphrase)}`;
  }
  return crypto.createHash("md5").update(getString).digest("hex");
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
    const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
    const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";

    if (!MERCHANT_ID || !MERCHANT_KEY) {
      return json(500, { error: "Missing PAYFAST_MERCHANT_ID or PAYFAST_MERCHANT_KEY env vars" });
    }

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
    const postalCode = String(customer.postalCode ?? "").trim();

    if (!name || !email || !phone || !address1 || !city || !postalCode) {
      return json(400, { error: "Missing required delivery details" });
    }
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

    const totalCents = subtotalCents + DELIVERY_FEE_CENTS;
    const order_id = crypto.randomUUID();

    const origin = getOrigin(event);
    const amount = (totalCents / 100).toFixed(2);
    const [firstName, ...rest] = name.split(" ");

    // No database: the full order (items, contact, delivery address) travels with the
    // payment itself and lands in the PayFast merchant dashboard for fulfillment.
    const pfData = {
      merchant_id: MERCHANT_ID,
      merchant_key: MERCHANT_KEY,
      return_url: `${origin}/merch?payment=success&order_id=${encodeURIComponent(order_id)}`,
      cancel_url: `${origin}/merch?payment=cancelled&order_id=${encodeURIComponent(order_id)}`,
      notify_url: `${origin}/.netlify/functions/payfast-merch-itn`,
      name_first: firstName || name,
      name_last: rest.join(" ") || "",
      email_address: email,
      cell_number: phone,
      m_payment_id: order_id,
      amount,
      item_name: `BliximStraat Merch Order (${cleanItems.reduce((n, it) => n + it.quantity, 0)} items)`,
      item_description: cleanItems.map((it) => `${it.quantity}x ${it.name} (${it.size})`).join(", ").slice(0, 255),
      custom_str1: [address1, address2].filter(Boolean).join(", ").slice(0, 255),
      custom_str2: `${city}, ${postalCode}`.slice(0, 255),
    };

    const signature = generateSignature(pfData, PASSPHRASE);

    return json(200, {
      payfast_url: PAYFAST_PROCESS_URL,
      params: { ...pfData, signature },
      order_id,
    });
  } catch (err) {
    return json(500, {
      error: "Internal Server Error in create-payfast-merch-checkout",
      details: err?.message || String(err),
      extra: err?.data || null,
    });
  }
};
