import React, { useState } from "react";
import { X, Trash2, Minus, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCart } from "../../contexts/CartContext";

function moneyZARFromCents(cents: number) {
  const rands = (Number.isFinite(cents) ? cents : 0) / 100;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(rands);
}

/**
 * Back-compat:
 * - If you pass open/onClose props, it will use those.
 * - If you pass nothing, it uses CartContext isCartOpen/closeCart.
 */
export default function CartModal(props?: {
  open?: boolean;
  onClose?: () => void;
}) {
  const cart = useCart();

  const open = typeof props?.open === "boolean" ? props.open : cart.isCartOpen;
  const onClose = props?.onClose ?? cart.closeCart;

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const items = cart.items;
  const subtotalCents = cart.subtotalCents;

  const canCheckout = (items?.length ?? 0) > 0 && subtotalCents > 0 && !busy;

  async function doCheckout() {
    setErrorMsg(null);

    if (!items || items.length === 0) {
      setErrorMsg("Your cart is empty.");
      return;
    }
    if (subtotalCents <= 0) {
      setErrorMsg(
        "Subtotal is R0.00. Your add-to-cart is not sending price_cents (or it’s named differently)."
      );
      return;
    }

    setBusy(true);
    try {
      // user_id optional; server can treat as guest
      const { data: authRes, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        // not fatal
        console.warn("Auth getUser error (continuing):", authErr);
      }
      const user_id = authRes?.user?.id ?? null;

      const payload = {
        items: items.map((it) => ({
          id: it.id,
          title: it.title,
          artist: it.artist ?? null,
          cover_url: it.cover_url ?? null,
          price_cents: it.price_cents,
          qty: it.qty,
          sku: it.sku ?? null,
        })),
        user_id,
      };

      const res = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // ✅ Robust parsing: handles JSON, HTML error pages, plain text, etc.
      const contentType = res.headers.get("content-type") || "";
      const rawText = await res.text();

      let data: any = null;
      if (contentType.includes("application/json")) {
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch {
          data = { error: "Server returned invalid JSON", rawText };
        }
      } else {
        data = { error: "Server error (non-JSON response)", rawText };
      }

      if (!res.ok) {
        console.error("Checkout start failed:", {
          status: res.status,
          contentType,
          data,
        });
        console.log("RAW SERVER RESPONSE:", rawText);

        setErrorMsg(
          data?.error ||
            data?.message ||
            `Checkout failed (HTTP ${res.status}). Check console for raw response.`
        );
        return;
      }

      const checkoutUrl = data?.checkoutUrl;
      if (!checkoutUrl || typeof checkoutUrl !== "string") {
        console.error("Bad checkout response:", data);
        setErrorMsg("Checkout URL missing from server response.");
        return;
      }

      onClose();
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error("Checkout error:", err);
      setErrorMsg(err?.message || "Something went wrong starting checkout.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-end p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
      />

      {/* Panel (top-right popup) */}
      <div className="relative z-10 w-[min(520px,92vw)] rounded-2xl border border-white/10 bg-black/80 shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="text-white text-lg font-semibold">Your Cart</div>
          <button
            className="rounded-lg p-2 text-white/80 hover:text-white hover:bg-white/10 transition"
            onClick={() => !busy && onClose()}
            aria-label="Close"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error */}
        {errorMsg ? (
          <div className="px-5 pt-4">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 whitespace-pre-wrap">
              {errorMsg}
            </div>
          </div>
        ) : null}

        {/* Items */}
        <div className="max-h-[52vh] overflow-y-auto px-5 py-4">
          {items?.length ? (
            <div className="space-y-3">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  {/* Cover */}
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-white/10 flex-shrink-0">
                    {it.cover_url ? (
                      <img
                        src={it.cover_url}
                        alt={it.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-xs text-white/40">
                        No cover
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium truncate">
                      {it.title}
                    </div>
                    <div className="text-white/60 text-sm truncate">
                      {it.artist ?? ""}
                    </div>

                    {/* Qty */}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 bg-black/30 p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
                        onClick={() => cart.decrement(it.id)}
                        disabled={busy || it.qty <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <div className="w-10 text-center text-white/90 text-sm tabular-nums">
                        {it.qty}
                      </div>

                      <button
                        type="button"
                        className="rounded-lg border border-white/10 bg-black/30 p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
                        onClick={() => cart.increment(it.id)}
                        disabled={busy}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Price + remove */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-white font-semibold tabular-nums">
                      {moneyZARFromCents(it.price_cents)}
                    </div>

                    <button
                      type="button"
                      className="rounded-lg p-2 text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
                      onClick={() => !busy && cart.removeItem(it.id)}
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
            <div className="py-10 text-center text-white/60">
              Your cart is empty.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/70">Subtotal</div>
            <div className="text-white font-semibold tabular-nums">
              {moneyZARFromCents(subtotalCents)}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white hover:bg-white/15 transition disabled:opacity-50"
              onClick={() => !busy && onClose()}
              disabled={busy}
            >
              Continue
            </button>

            <button
              type="button"
              className="flex-1 rounded-xl bg-white px-4 py-3 text-black font-semibold hover:opacity-90 transition disabled:opacity-50"
              onClick={doCheckout}
              disabled={!canCheckout}
            >
              {busy ? "Starting..." : "Checkout"}
            </button>
          </div>

          {items?.length ? (
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                className="text-xs text-white/50 hover:text-white/80 transition"
                onClick={() => !busy && cart.clearCart()}
                disabled={busy}
              >
                Clear cart
              </button>
              <div className="text-xs text-white/40">Secure checkout</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}