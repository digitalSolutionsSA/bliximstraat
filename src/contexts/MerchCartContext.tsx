import React, { createContext, useContext, useMemo, useState } from "react";

export type MerchCartItem = {
  id: string;
  name: string;
  size: string;
  priceCents: number;
  qty: number;
  image?: string;
};

type MerchCartContextValue = {
  items: MerchCartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<MerchCartItem, "qty">, qty?: number) => void;
  removeItem: (id: string, size: string) => void;
  increment: (id: string, size: string) => void;
  decrement: (id: string, size: string) => void;
  clearCart: () => void;
  subtotalCents: number;
  count: number;
};

const MerchCartContext = createContext<MerchCartContextValue | null>(null);

const STORAGE_KEY = "bliximstraat_merch_cart";

function sameLine(a: { id: string; size: string }, b: { id: string; size: string }) {
  return a.id === b.id && a.size === b.size;
}

function loadStoredItems(): MerchCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function MerchCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MerchCartItem[]>(loadStoredItems);
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage unavailable (private mode, blocked, etc.) — cart still works in-memory
    }
  }, [items]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addItem = (item: Omit<MerchCartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => sameLine(p, item));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: Math.min(20, copy[idx].qty + qty) };
        return copy;
      }
      return [...prev, { ...item, qty }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string, size: string) => {
    setItems((prev) => prev.filter((p) => !sameLine(p, { id, size })));
  };

  const increment = (id: string, size: string) => {
    setItems((prev) =>
      prev.map((p) => (sameLine(p, { id, size }) ? { ...p, qty: Math.min(20, p.qty + 1) } : p))
    );
  };

  const decrement = (id: string, size: string) => {
    setItems((prev) =>
      prev.map((p) => (sameLine(p, { id, size }) ? { ...p, qty: Math.max(1, p.qty - 1) } : p))
    );
  };

  const clearCart = () => setItems([]);

  const subtotalCents = useMemo(
    () => items.reduce((sum, it) => sum + it.priceCents * it.qty, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items]);

  const value: MerchCartContextValue = {
    items,
    isOpen,
    openCart,
    closeCart,
    addItem,
    removeItem,
    increment,
    decrement,
    clearCart,
    subtotalCents,
    count,
  };

  return <MerchCartContext.Provider value={value}>{children}</MerchCartContext.Provider>;
}

export function useMerchCart() {
  const ctx = useContext(MerchCartContext);
  if (!ctx) throw new Error("useMerchCart must be used within MerchCartProvider");
  return ctx;
}
