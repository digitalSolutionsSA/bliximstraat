import { useState } from "react";
import { X, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { supabase } from "../../lib/supabase";

export default function CartModal() {
  const { isOpen, close, items, subtotal, setQty, removeItem, loading } = useCart();

  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const run = async (itemId: string, fn: () => Promise<void>) => {
    try {
      setBusyItemId(itemId);
      await fn();
    } catch (e: any) {
      showToast(e?.message || "Something failed. Humans remain consistent.");
    } finally {
      setBusyItemId(null);
    }
  };

  /**
   * ✅ Real checkout:
   * - Only happens from cart
   * - Calls Netlify function to create a Yoco checkout session
   * - Redirects user to Yoco hosted checkout page
   */
  const doCheckout = async () => {
    try {
      setCheckingOut(true);

      if (loading) {
        showToast("Cart still loading…");
        return;
      }

      if (!items.length) {
        showToast("Cart is empty.");
        return;
      }

      // ✅ Get auth token to prove who the user is (server-side should verify)
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.error(sessionErr);
        showToast("Session error. Please sign in again.");
        return;
      }

      const token = sessionData?.session?.access_token;
      if (!token) {
        showToast("Please sign in to checkout.");
        return;
      }

      // ✅ Create checkout session server-side (Netlify Function)
      const res = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Body can be empty if server loads cart from DB (preferred)
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.redirectUrl) {
        console.error("Checkout start failed:", data);
        showToast("Payment failed to start. Check Netlify function + env vars.");
        return;
      }

      // ✅ Redirect to Yoco
      window.location.href = data.redirectUrl as string;
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "Checkout failed.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/70"
        onClick={close}
        aria-label="Close cart"
        type="button"
      />

      {/* Modal */}
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-2xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-2xl overflow-hidden text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="font-semibold">Your Cart</h3>
            <button
              onClick={close}
              className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Toast */}
          {toast && (
            <div className="px-5 pt-4">
              <div className="rounded-xl border border-white/10 bg-black/45 backdrop-blur-sm px-4 py-2 text-sm text-white/80">
                {toast}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="max-h-[50vh] overflow-auto">
            {loading ? (
              <div className="px-5 py-8 text-white/60 text-sm">Loading cart…</div>
            ) : items.length === 0 ? (
              <div className="px-5 py-8 text-white/60 text-sm">Cart is empty. Music awaits.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {items.map((it) => {
                  const busy = busyItemId === it.id;

                  return (
                    <li key={it.id} className="px-5 py-4 flex gap-4">
                      {it.coverUrl && (
                        <img
                          src={it.coverUrl}
                          alt={it.title}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      )}

                      <div className="flex-1">
                        <div className="flex justify-between gap-3">
                          <div>
                            <div className="font-medium">{it.title}</div>
                            {it.artist && <div className="text-xs text-white/60">{it.artist}</div>}
                          </div>

                          <button
                            onClick={() => run(it.id, () => removeItem(it.id))}
                            className="text-white/60 hover:text-white disabled:opacity-40"
                            type="button"
                            disabled={busy || checkingOut}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => run(it.id, () => setQty(it.id, it.qty - 1))}
                              className="p-1 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40"
                              type="button"
                              disabled={busy || checkingOut}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>

                            <span className="w-6 text-center text-sm">{it.qty}</span>

                            <button
                              onClick={() => run(it.id, () => setQty(it.id, it.qty + 1))}
                              className="p-1 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40"
                              type="button"
                              disabled={busy || checkingOut}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-sm font-semibold">R {(it.price * it.qty).toFixed(2)}</div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-white/10">
            <div className="flex justify-between mb-3 text-sm">
              <span className="text-white/60">Subtotal</span>
              <span className="font-semibold">R {subtotal.toFixed(2)}</span>
            </div>

            <button
              disabled={loading || checkingOut || items.length === 0}
              className="w-full rounded-xl bg-white text-black py-2.5 font-semibold hover:bg-white/90 disabled:opacity-40"
              type="button"
              onClick={doCheckout}
            >
              {checkingOut ? "Redirecting to payment…" : "Checkout"}
            </button>

            <div className="mt-2 text-[11px] text-white/50">
              You’ll be redirected to secure payment. After payment, you’ll return to the site.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
