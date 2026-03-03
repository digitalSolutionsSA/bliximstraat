import React, { createContext, useContext, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  title: string;
  artist?: string | null;
  cover_url?: string | null;

  // REQUIRED for checkout math
  price_cents: number;

  qty: number;

  sku?: string | null;
};

type AddInput =
  | CartItem
  | (Omit<CartItem, "qty"> & { qty?: number })
  | {
      id: string;
      title: string;
      artist?: string | null;
      cover_url?: string | null;
      // allow sloppy old naming
      price?: number | string | null;
      price_cents?: number | string | null;
      qty?: number;
      sku?: string | null;
    };

type CartContextValue = {
  // state
  items: CartItem[];
  isCartOpen: boolean;
  lastAddedId: string | null;

  // modal controls
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // core actions (new)
  addItem: (item: AddInput) => void;
  removeItem: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  clearCart: () => void;

  // core actions (legacy aliases)
  addToCart: (item: AddInput) => void;
  removeFromCart: (id: string) => void;

  // computed
  subtotalCents: number;

  // ✅ legacy computed + controls used by older UI components
  // These are aliases only; they do NOT change behavior/layout/workflow.
  count: number;
  open: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizePriceCents(input: any): number {
  // Prefer explicit cents
  const pc = input?.price_cents;
  const pcNum = typeof pc === "string" ? parseFloat(pc) : Number(pc);
  if (Number.isFinite(pcNum) && pcNum > 0) return Math.round(pcNum);

  // Fallback: "price" in rands
  const pr = input?.price;
  const prNum = typeof pr === "string" ? parseFloat(pr) : Number(pr);
  if (Number.isFinite(prNum) && prNum > 0) return Math.round(prNum * 100);

  return 0;
}

function normalizeQty(input: any): number {
  const q = Number(input?.qty ?? 1);
  if (!Number.isFinite(q)) return 1;
  return Math.max(1, Math.min(99, Math.round(q)));
}

function normalizeItem(input: AddInput): CartItem {
  const price_cents = normalizePriceCents(input);
  const qty = normalizeQty(input);

  return {
    id: String((input as any).id),
    title: String((input as any).title),
    artist: (input as any).artist ?? null,
    cover_url: (input as any).cover_url ?? null,
    price_cents,
    qty,
    sku: (input as any).sku ?? null,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((v) => !v);

  const addItem = (input: AddInput) => {
    const incoming = normalizeItem(input);

    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === incoming.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          // keep existing price unless incoming is non-zero and existing is zero
          price_cents:
            copy[idx].price_cents > 0
              ? copy[idx].price_cents
              : incoming.price_cents,
          qty: Math.min(99, copy[idx].qty + incoming.qty),
          cover_url: copy[idx].cover_url ?? incoming.cover_url,
          artist: copy[idx].artist ?? incoming.artist,
        };
        return copy;
      }
      return [...prev, incoming];
    });

    setLastAddedId(incoming.id);

    // your "popup top-right when adding"
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const increment = (id: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, qty: Math.min(99, p.qty + 1) } : p
      )
    );
  };

  const decrement = (id: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, qty: Math.max(1, p.qty - 1) } : p
      )
    );
  };

  const clearCart = () => setItems([]);

  const subtotalCents = useMemo(() => {
    return items.reduce(
      (sum, it) =>
        sum + (Number(it.price_cents) || 0) * (Number(it.qty) || 0),
      0
    );
  }, [items]);

  // ✅ legacy-friendly count (total quantity, not distinct items)
  const count = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  }, [items]);

  const value: CartContextValue = {
    items,
    isCartOpen,
    lastAddedId,
    openCart,
    closeCart,
    toggleCart,
    addItem,
    removeItem,
    increment,
    decrement,
    clearCart,
    // legacy aliases
    addToCart: addItem,
    removeFromCart: removeItem,
    subtotalCents,

    // ✅ legacy aliases used by older components
    count,
    open: openCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}