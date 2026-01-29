import { supabase } from "@/integrations/supabase/client";

export async function getOrCreateCartId(): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not signed in");

  // 1) Try get existing cart
  const { data: cart, error: getErr } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (getErr) throw getErr;
  if (cart?.id) return cart.id;

  // 2) Create new cart
  const { data: created, error: createErr } = await supabase
    .from("carts")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (createErr) throw createErr;
  return created.id;
}

export async function fetchCartItems() {
  const cartId = await getOrCreateCartId();

  // If you want song details in one go, include a join:
  // NOTE: this assumes foreign key exists cart_items.song_id -> songs.id (it does)
  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      quantity,
      added_at,
      song_id,
      songs:song_id (
        id,
        title,
        artist,
        price_cents,
        cover_url
      )
    `)
    .eq("cart_id", cartId)
    .order("added_at", { ascending: false });

  if (error) throw error;
  return { cartId, items: data ?? [] };
}

export async function addToCart(songId: string, quantity = 1) {
  const cartId = await getOrCreateCartId();

  // Upsert means: if same song already in cart, update quantity instead of duplicating
  const { data: existing, error: exErr } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("song_id", songId)
    .maybeSingle();

  if (exErr) throw exErr;

  if (!existing) {
    const { error } = await supabase
      .from("cart_items")
      .insert({ cart_id: cartId, song_id: songId, quantity });

    if (error) throw error;
    return;
  }

  const nextQty = existing.quantity + quantity;
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: nextQty })
    .eq("id", existing.id);

  if (error) throw error;
}

export async function setCartItemQty(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId);

  if (error) throw error;
}

export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) throw error;
}

export async function clearCart() {
  const cartId = await getOrCreateCartId();
  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (error) throw error;
}
