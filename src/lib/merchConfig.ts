// Delivery fee in Rand, set via the VITE_MERCH_DELIVERY_FEE env var (defaults to R120).
// netlify/functions/create-payfast-merch-checkout.js reads the same var, so the cart and the charged amount always match.
function parseFeeRand(raw: unknown, fallback: number) {
  const n = Number(raw);
  return raw === undefined || raw === "" || !Number.isFinite(n) || n < 0 ? fallback : n;
}

export const DELIVERY_FEE_CENTS = Math.round(parseFeeRand(import.meta.env.VITE_MERCH_DELIVERY_FEE, 120) * 100);

// Must match PROVINCES in netlify/functions/create-payfast-merch-checkout.js
export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;
