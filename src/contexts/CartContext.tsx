import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";


/**
 * CartItem shape used by the UI.
 * id = song id (NOT cart_items row id) to keep your existing components happy.
 */
export type CartItem = {
  id: string; // song id
  title: string;
  artist?: string;
  price: number; // in ZAR (rands)
  coverUrl?: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;

  addItem: (item: Omit<CartItem, "qty">, qty?: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  setQty: (id: string, qty: number) => Promise<void>;
  clear: () => Promise<void>;

  /** ✅ Fake checkout: writes orders + purchases, clears cart */
  checkout: () => Promise<void>;

  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  loading: boolean;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Get current user id (or null). */
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Get or create a cart for current user, return cart_id. */
async function getOrCreateCartId(userId: string): Promise<string> {
  const { data: cart, error: getErr } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (getErr) throw getErr;
  if (cart?.id) return cart.id;

  const { data: created, error: createErr } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (createErr) throw createErr;
  return created.id;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      if (!userId) {
        setItems([]);
        return;
      }

      const cartId = await getOrCreateCartId(userId);

      // Pull cart items + song details in one go
      // NOTE: Your songs table appears to use price_cents (based on Music.tsx)
      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          quantity,
          song_id,
          songs:song_id (
            id,
            title,
            artist,
            price_cents,
            cover_url
          )
        `
        )
        .eq("cart_id", cartId)
        .order("added_at", { ascending: false });

      if (error) throw error;

      const mapped: CartItem[] =
        (data ?? [])
          .map((row: any) => {
            const s = row.songs;
            if (!s) return null;

            return {
              id: s.id,
              title: s.title,
              artist: s.artist ?? undefined,
              price: Number(s.price_cents ?? 0) / 100, // cents -> rands
              coverUrl: s.cover_url ?? undefined,
              qty: Number(row.quantity ?? 1),
            } as CartItem;
          })
          .filter(Boolean) as CartItem[];

      setItems(mapped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    refresh();

    // React to auth changes so carts don't bleed between users
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setItems([]); // kill ghost cart immediately
        setLoading(false);
      }
      if (event === "SIGNED_IN") {
        refresh();
      }
    });

    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem: CartContextValue["addItem"] = async (item, qty = 1) => {
    const userId = await getUserId();
    if (!userId) throw new Error("You must be signed in to add items to cart.");

    const cartId = await getOrCreateCartId(userId);

    // If already exists, increment. Otherwise insert.
    const { data: existing, error: exErr } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("song_id", item.id)
      .maybeSingle();

    if (exErr) throw exErr;

    if (!existing) {
      const { error } = await supabase
        .from("cart_items")
        .insert({ cart_id: cartId, song_id: item.id, quantity: qty });

      if (error) throw error;
    } else {
      const nextQty = Number(existing.quantity ?? 1) + qty;

      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: nextQty })
        .eq("id", existing.id);

      if (error) throw error;
    }

    setIsOpen(true);
    await refresh();
  };

  const removeItem: CartContextValue["removeItem"] = async (songId: string) => {
    const userId = await getUserId();
    if (!userId) {
      setItems([]);
      return;
    }

    const cartId = await getOrCreateCartId(userId);

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId)
      .eq("song_id", songId);

    if (error) throw error;

    await refresh();
  };

  const setQtyFn: CartContextValue["setQty"] = async (songId: string, qty: number) => {
    const userId = await getUserId();
    if (!userId) throw new Error("You must be signed in to change cart quantity.");

    const cartId = await getOrCreateCartId(userId);

    if (qty <= 0) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId)
        .eq("song_id", songId);

      if (error) throw error;
      await refresh();
      return;
    }

    // Find the row then update (since unique(cart_id, song_id) exists)
    const { data: existing, error: exErr } = await supabase
      .from("cart_items")
      .select("id")
      .eq("cart_id", cartId)
      .eq("song_id", songId)
      .maybeSingle();

    if (exErr) throw exErr;

    if (!existing?.id) {
      const { error } = await supabase
        .from("cart_items")
        .insert({ cart_id: cartId, song_id: songId, quantity: qty });

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: qty })
        .eq("id", existing.id);

      if (error) throw error;
    }

    await refresh();
  };

  const clear: CartContextValue["clear"] = async () => {
    const userId = await getUserId();
    if (!userId) {
      setItems([]);
      return;
    }

    const cartId = await getOrCreateCartId(userId);

    const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
    if (error) throw error;

    await refresh();
  };

  /**
   * ✅ Fake checkout:
   * - reads cart_items
   * - looks up song prices (price_cents)
   * - creates orders + order_items
   * - upserts user_purchases
   * - clears cart
   */
  const checkout: CartContextValue["checkout"] = async () => {
    const userId = await getUserId();
    if (!userId) throw new Error("Please sign in to checkout.");

    const cartId = await getOrCreateCartId(userId);

    // Get raw cart rows
    const { data: cartRows, error: cartErr } = await supabase
      .from("cart_items")
      .select("song_id, quantity")
      .eq("cart_id", cartId);

    if (cartErr) throw cartErr;
    if (!cartRows || cartRows.length === 0) throw new Error("Cart is empty.");

    const songIds = cartRows.map((r: any) => r.song_id);

    // Fetch song prices (authoritative, don’t trust client-side)
    const { data: songs, error: songsErr } = await supabase
      .from("songs")
      .select("id, price_cents")
      .in("id", songIds);

    if (songsErr) throw songsErr;

    const priceById = new Map<string, number>();
    (songs ?? []).forEach((s: any) => priceById.set(s.id, Number(s.price_cents ?? 0)));

    const totalCents = cartRows.reduce((sum: number, r: any) => {
      const priceCents = priceById.get(r.song_id) ?? 0;
      const qty = Number(r.quantity ?? 1);
      return sum + priceCents * qty;
    }, 0);

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "paid",
        currency: "ZAR",
        total_cents: totalCents,
      })
      .select("id")
      .single();

    if (orderErr) throw orderErr;
    const orderId = order.id as string;

    // Create order_items
    const orderItems = cartRows.map((r: any) => ({
      order_id: orderId,
      song_id: r.song_id,
      quantity: Number(r.quantity ?? 1),
      price_cents: priceById.get(r.song_id) ?? 0,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) throw itemsErr;

    // Create user_purchases (owned songs)
    const purchaseRows = cartRows.map((r: any) => ({
      user_id: userId,
      song_id: r.song_id,
      order_id: orderId,
    }));

    const { error: purchasesErr } = await supabase
      .from("user_purchases")
      .upsert(purchaseRows, { onConflict: "user_id,song_id" });

    if (purchasesErr) throw purchasesErr;

    // Clear cart
    const { error: clearErr } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
    if (clearErr) throw clearErr;

    await refresh();
  };

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    addItem,
    removeItem,
    setQty: setQtyFn,
    clear,
    checkout,

    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),

    loading,
    refresh,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
