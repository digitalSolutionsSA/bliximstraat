// src/pages/Merch.tsx
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { motion } from "framer-motion";
import { ShoppingBag, MessageCircle, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price_cents: number;
  image_url: string | null;
  note: string | null;
  is_preorder: boolean;
  created_at?: string;
};

type ProductUI = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  imageUrl: string;
  note?: string;
  isPreorder?: boolean;
};

type OrderForm = {
  name: string;
  number: string;
  address: string;
  size: string;
};

const formatZar = (cents: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format((cents || 0) / 100);

export default function Merch() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const whatsappNumber = "27686771511";

  const [selected, setSelected] = useState<ProductUI | null>(null);
  const [order, setOrder] = useState<OrderForm>({
    name: "",
    number: "",
    address: "",
    size: "",
  });
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("products")
        .select("id,name,category,price_cents,image_url,note,is_preorder,created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setItems([]);
        setLoading(false);
        return;
      }

      setItems((data as ProductRow[]) ?? []);
      setLoading(false);
    };

    load();
  }, []);

  const products: ProductUI[] = useMemo(() => {
    const fallbackImg = (seed: string) =>
      `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/900`;

    return items.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      priceCents: p.price_cents ?? 0,
      imageUrl: p.image_url || fallbackImg(p.name),
      note: p.note ?? undefined,
      isPreorder: !!p.is_preorder,
    }));
  }, [items]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  function openModal(p: ProductUI) {
    setSelected(p);
    setOrderError(null);
    setOrder({
      name: "",
      number: "",
      address: "",
      size: "",
    });

    const prev = document.body.style.overflow;
    document.body.dataset.prevOverflow = prev;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    setSelected(null);
    setOrderError(null);
    const prev = document.body.dataset.prevOverflow ?? "";
    document.body.style.overflow = prev;
    delete document.body.dataset.prevOverflow;
  }

  function buildWhatsAppOrderMessage(p: ProductUI, f: OrderForm) {
    const lines = [
      "Hi! I want to order merch from Bliximstraat.",
      "",
      `Item: ${p.name}`,
      `Category: ${p.category}`,
      `Price: ${formatZar(p.priceCents)}`,
      p.isPreorder ? "Preorder: Yes" : "",
      p.note ? `Note: ${p.note}` : "",
      "",
      "Customer details:",
      `Name: ${f.name}`,
      `Number: ${f.number}`,
      `Delivery address: ${f.address}`,
      `Size: ${f.size || "N/A"}`,
      "",
      "Please confirm stock + total and I’ll proceed.",
    ].filter(Boolean);

    return lines.join("\n");
  }

  function whatsappLinkForOrder(p: ProductUI, f: OrderForm) {
    const text = buildWhatsAppOrderMessage(p, f);
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  }

  function validateOrder(f: OrderForm) {
    if (f.name.trim().length < 2) return "Please enter your name.";
    if (f.number.trim().length < 7) return "Please enter your phone number.";
    if (f.address.trim().length < 8) return "Please enter your delivery address.";
    if (f.size.trim().length < 1) return "Please enter a size (or type N/A).";
    return null;
  }

  function orderNow() {
    if (!selected) return;

    const msg = validateOrder(order);
    if (msg) {
      setOrderError(msg);
      return;
    }

    setOrderError(null);

    const url = whatsappLinkForOrder(selected, order);
    window.open(url, "_blank", "noopener,noreferrer");

    closeModal();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selected) closeModal();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden flex flex-col">
      {/* VIDEO BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          poster="/normal-bg-poster.jpg"
          className="h-full w-full object-cover pointer-events-none select-none"
        >
          <source src="/normal-bg.webm" type="video/webm" />
          <source src="/normal-bg.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          {/* HEADER */}
          <section className="pt-28 pb-10 px-6">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex items-start justify-between gap-6 flex-col md:flex-row"
              >
                <div>
                  <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
                    Merch
                  </h1>

                  <p className="mt-3 text-white/70 max-w-2xl">
                    Orders are currently only processed via WhatsApp, but we keep
                    this page updated with all available products and details.
                    Browse around, pick your favourites, and tap to order via
                    WhatsApp. We’ll confirm stock and total before you commit.
                    <span className="text-white/50">
                      {" "}
                      Yes, humans still buy physical things.
                    </span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                      "Hi! I want to order merch from Bliximstraat."
                    )}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Order
                  </a>
                </div>
              </motion.div>

              {/* CATEGORIES */}
              <div className="mt-8 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/80"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* NEW MERCH COMING SOON BANNER */}
          <section className="px-6 pb-8">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl border border-white/15 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-md px-6 py-8 md:px-10 md:py-10 text-center"
              >
                <div className="text-xs md:text-sm uppercase tracking-[0.35em] text-white/55 font-semibold">
                  Bliximstraat Drop
                </div>

                <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                  NEW MERCH COMING SOON!!
                </h2>

                <p className="mt-3 text-sm md:text-base text-white/70 max-w-2xl mx-auto">
                  Fresh pieces are on the way. Keep an eye on this page and hit
                  us on WhatsApp if you want first dibs before the next drop
                  disappears into the chaos.
                </p>
              </motion.div>
            </div>
          </section>

          {/* ERRORS / EMPTY / LOADING */}
          <section className="px-6 pb-6">
            <div className="max-w-6xl mx-auto">
              {loading && (
                <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm p-6 text-white/70">
                  Loading merch...
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                  Failed to load merch: {error}
                </div>
              )}

              {!loading && !error && products.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm p-6 text-white/70">
                  No merch products yet. Add some in the Admin panel.
                </div>
              )}
            </div>
          </section>

          {/* PRODUCTS */}
          <section className="px-6 pb-24">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p, i) => (
                <motion.button
                  key={p.id}
                  type="button"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.03 }}
                  onClick={() => openModal(p)}
                  className="text-left rounded-2xl border border-white/10 bg-black/35 overflow-hidden backdrop-blur-sm flex flex-col hover:border-white/20 hover:bg-black/40 transition"
                >
                  <div className="relative aspect-square">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {p.isPreorder && (
                      <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur">
                        Preorder
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">
                        {p.name}
                      </h3>

                      <p className="text-xs text-white/60 mt-1">{p.category}</p>

                      <div className="mt-2 text-xl font-bold text-white tracking-tight">
                        {formatZar(p.priceCents)}
                      </div>

                      <div className="text-xs text-white/50 mt-1">
                        Tap to order
                      </div>
                    </div>

                    <div className="mt-3 min-h-[24px]">
                      {p.note ? (
                        <p className="text-sm text-white/70">{p.note}</p>
                      ) : (
                        <p className="text-sm text-transparent select-none">
                          placeholder
                        </p>
                      )}
                    </div>

                    <div className="mt-auto pt-5">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition">
                        <ShoppingBag className="h-4 w-4" />
                        Order via WhatsApp
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {/* ORDER MODAL */}
      {selected && (
        <div
          className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />

          <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-5 border-b border-white/10">
              <div>
                <div className="text-white font-semibold text-lg">
                  {selected.name}
                </div>
                <div className="text-white/60 text-sm">{selected.category}</div>
                <div className="mt-1 text-white font-semibold">
                  {formatZar(selected.priceCents)}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-white/15 bg-white/5 p-2 hover:bg-white/10 transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-white/80">
                  Name *
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/25"
                    value={order.name}
                    onChange={(e) =>
                      setOrder((s) => ({ ...s, name: e.target.value }))
                    }
                    placeholder="e.g. Pieter"
                  />
                </label>

                <label className="text-sm text-white/80">
                  Phone number *
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/25"
                    value={order.number}
                    onChange={(e) =>
                      setOrder((s) => ({ ...s, number: e.target.value }))
                    }
                    placeholder="e.g. 0721234567"
                  />
                </label>

                <label className="text-sm text-white/80 sm:col-span-2">
                  Delivery address *
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/25 resize-none"
                    rows={3}
                    value={order.address}
                    onChange={(e) =>
                      setOrder((s) => ({ ...s, address: e.target.value }))
                    }
                    placeholder="Street, suburb, city, province"
                  />
                </label>

                <label className="text-sm text-white/80 sm:col-span-2">
                  Size *
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/25"
                    value={order.size}
                    onChange={(e) =>
                      setOrder((s) => ({ ...s, size: e.target.value }))
                    }
                    placeholder="e.g. S / M / L / XL (or N/A)"
                  />
                </label>
              </div>

              {orderError && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {orderError}
                </div>
              )}

              <div className="mt-5 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={orderNow}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/15 transition"
                >
                  Order now
                </button>
              </div>

              <div className="mt-3 text-xs text-white/50">
                Tapping “Order now” opens WhatsApp with your details pre-filled.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}