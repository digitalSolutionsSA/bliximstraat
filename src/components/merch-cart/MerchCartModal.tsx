import { useState } from "react";
import { X, Trash2, Minus, Plus } from "lucide-react";
import { useMerchCart } from "../../contexts/MerchCartContext";
import { DELIVERY_FEE_CENTS, SA_PROVINCES } from "../../lib/merchConfig";

function moneyZAR(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
};

const EMPTY_FORM: CustomerForm = { name: "", email: "", phone: "", address1: "", address2: "", city: "", province: "", postalCode: "" };

export default function MerchCartModal() {
  const cart = useMerchCart();
  const [step, setStep] = useState<"cart" | "details">("cart");
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!cart.isOpen) return null;

  const total = cart.subtotalCents + DELIVERY_FEE_CENTS;

  function updateField<K extends keyof CustomerForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitOrder() {
    setErrorMsg(null);

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.address1.trim() || !form.city.trim() || !form.province || !form.postalCode.trim()) {
      setErrorMsg("Please fill in all required delivery details.");
      return;
    }
    if (!form.email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/.netlify/functions/create-payfast-merch-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((it) => ({ id: it.id, size: it.size, qty: it.qty })),
          customer: form,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.payfast_url || !data?.params) {
        setErrorMsg(data?.error || "Could not start checkout. Please try again.");
        setBusy(false);
        return;
      }

      const formEl = document.createElement("form");
      formEl.method = "POST";
      formEl.action = data.payfast_url;
      Object.entries(data.params as Record<string, string>).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        formEl.appendChild(input);
      });
      document.body.appendChild(formEl);
      formEl.submit();
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong starting checkout.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-end p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !busy && cart.closeCart()} />

      <div className="relative z-10 w-[min(520px,92vw)] rounded-2xl border border-white/10 bg-black/85 shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="text-white text-lg font-semibold">{step === "cart" ? "Your Cart" : "Delivery Details"}</div>
          <button
            className="rounded-lg p-2 text-white/80 hover:text-white hover:bg-white/10 transition"
            onClick={() => !busy && cart.closeCart()}
            aria-label="Close"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="px-5 pt-4">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 whitespace-pre-wrap">
              {errorMsg}
            </div>
          </div>
        )}

        {step === "cart" ? (
          <>
            <div className="max-h-[52vh] overflow-y-auto px-5 py-4">
              {cart.items.length ? (
                <div className="space-y-3">
                  {cart.items.map((it) => (
                    <div key={`${it.id}-${it.size}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="h-14 w-14 overflow-hidden rounded-xl bg-white/10 flex-shrink-0">
                        {it.image ? (
                          <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-xs text-white/40">—</div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-white font-medium truncate">{it.name}</div>
                        <div className="text-white/60 text-sm truncate">Size: {it.size}</div>

                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-white/10 bg-black/30 p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
                            onClick={() => cart.decrement(it.id, it.size)}
                            disabled={busy || it.qty <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <div className="w-10 text-center text-white/90 text-sm tabular-nums">{it.qty}</div>
                          <button
                            type="button"
                            className="rounded-lg border border-white/10 bg-black/30 p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
                            onClick={() => cart.increment(it.id, it.size)}
                            disabled={busy}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-white font-semibold tabular-nums">{moneyZAR(it.priceCents * it.qty)}</div>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
                          onClick={() => !busy && cart.removeItem(it.id, it.size)}
                          disabled={busy}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-white/60">Your cart is empty.</div>
              )}
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              <div className="flex items-center justify-between text-sm text-white/70 mb-1">
                <span>Subtotal</span>
                <span className="tabular-nums">{moneyZAR(cart.subtotalCents)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/70 mb-4">
                <span>Delivery (South Africa)</span>
                <span className="tabular-nums">{DELIVERY_FEE_CENTS ? moneyZAR(DELIVERY_FEE_CENTS) : "Free"}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-white/70">Total</div>
                <div className="text-white font-semibold tabular-nums">{moneyZAR(total)}</div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white hover:bg-white/15 transition disabled:opacity-50"
                  onClick={() => !busy && cart.closeCart()}
                  disabled={busy}
                >
                  Continue Shopping
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-white px-4 py-3 text-black font-semibold hover:opacity-90 transition disabled:opacity-50"
                  onClick={() => setStep("details")}
                  disabled={cart.items.length === 0}
                >
                  Checkout
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="max-h-[58vh] overflow-y-auto px-5 py-4 space-y-3">
              <Field label="Full Name *" value={form.name} onChange={(v) => updateField("name", v)} />
              <Field label="Email *" type="email" value={form.email} onChange={(v) => updateField("email", v)} />
              <Field label="Cell Number *" value={form.phone} onChange={(v) => updateField("phone", v)} />
              <Field label="Address Line 1 *" value={form.address1} onChange={(v) => updateField("address1", v)} />
              <Field label="Address Line 2" value={form.address2} onChange={(v) => updateField("address2", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City *" value={form.city} onChange={(v) => updateField("city", v)} />
                <Field label="Postal Code *" value={form.postalCode} onChange={(v) => updateField("postalCode", v)} />
              </div>
              <label className="block">
                <span className="block text-xs text-white/50 mb-1.5">Province *</span>
                <select
                  value={form.province}
                  onChange={(e) => updateField("province", e.target.value)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white bg-white/5 outline-none transition-all focus:ring-1 focus:ring-white/30"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <option value="" disabled className="bg-neutral-900">Select a province</option>
                  {SA_PROVINCES.map((p) => (
                    <option key={p} value={p} className="bg-neutral-900">{p}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-white/70">Total (incl. delivery)</div>
                <div className="text-white font-semibold tabular-nums">{moneyZAR(total)}</div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white hover:bg-white/15 transition disabled:opacity-50"
                  onClick={() => !busy && setStep("cart")}
                  disabled={busy}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-white px-4 py-3 text-black font-semibold hover:opacity-90 transition disabled:opacity-50"
                  onClick={submitOrder}
                  disabled={busy}
                >
                  {busy ? "Redirecting…" : "Pay with PayFast"}
                </button>
              </div>
              <div className="mt-3 text-center text-xs text-white/40">Secure checkout via PayFast</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="block text-xs text-white/50 mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white bg-white/5 outline-none transition-all focus:ring-1 focus:ring-white/30"
        style={{ border: "1px solid rgba(255,255,255,0.12)" }}
      />
    </label>
  );
}
