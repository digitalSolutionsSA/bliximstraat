// src/pages/Merch.tsx
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { motion } from "framer-motion";
import { ShoppingBag, MessageCircle, CreditCard } from "lucide-react";
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
  price: number; // ZAR
  imageUrl: string;
  note?: string;
  isPreorder?: boolean;
};

const formatZar = (value: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);

export default function Merch() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const whatsappNumber = "27820000000";
  const email = "bookings@bliximstraat.com";

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
      price: Math.round((p.price_cents ?? 0) / 100),
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

  const buildMessage = (p?: ProductUI) => {
    const base = `Hi! I want to order merch from Bliximstraat.`;
    if (!p) return base;

    return `${base}\n\nItem: ${p.name}\nCategory: ${p.category}\nPrice: ${formatZar(
      p.price
    )}\n\nMy details:\nName:\nDelivery address:\nSize (if applicable):`;
  };

  const whatsappLink = (p?: ProductUI) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildMessage(p))}`;

  const mailtoLink = (p?: ProductUI) => {
    const subject = p ? `Merch order: ${p.name}` : "Merch order enquiry";
    const body = buildMessage(p);
    return `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden flex flex-col">
      {/* === FIXED VIDEO BACKGROUND (SAME AS MUSIC/SHOWS) === */}
      <div className="fixed inset-0 z-0">
        <video
          className="h-full w-full object-cover"
          src="/normal-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          {/* Header */}
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
                    Products: t-shirts, hoodies, caps, stickers, cassettes, vinyl
                    records.
                    <span className="text-white/50">
                      {" "}
                      Yes, humans still buy physical things.
                    </span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <a
                    href={whatsappLink()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Order
                  </a>
                  <a
                    href={mailtoLink()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
                  >
                    <CreditCard className="h-4 w-4" />
                    Email Order
                  </a>
                </div>
              </motion.div>

              {/* Categories */}
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

          {/* Errors / Empty */}
          <section className="px-6 pb-6">
            <div className="max-w-6xl mx-auto">
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

          {/* Products */}
          <section className="px-6 pb-16">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.03 }}
                  className="rounded-2xl border border-white/10 bg-black/35 overflow-hidden backdrop-blur-sm flex flex-col"
                >
                  <div className="relative aspect-square">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                    {p.isPreorder && (
                      <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur">
                        Preorder
                      </span>
                    )}
                  </div>

                  {/* CHANGED: Make the content fill and keep buttons aligned */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="text-xs text-white/60">{p.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatZar(p.price)}</div>
                        <div className="text-[11px] text-white/50">ZAR</div>
                      </div>
                    </div>

                    {/* Reserve space so cards align even without note */}
                    <div className="mt-3 min-h-[24px]">
                      {p.note ? (
                        <p className="text-sm text-white/70">{p.note}</p>
                      ) : (
                        <p className="text-sm text-transparent select-none">placeholder</p>
                      )}
                    </div>

                    {/* Push buttons to bottom */}
                    <div className="mt-auto pt-5 flex gap-2">
                      <a
                        href={whatsappLink(p)}
                        className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-center hover:bg-white/10 transition"
                      >
                        <ShoppingBag className="inline h-4 w-4 mr-1" />
                        Order
                      </a>
                      <a
                        href={mailtoLink(p)}
                        className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                      >
                        Email
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Checkout */}
          <section className="px-6 pb-24">
            <div className="max-w-6xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur-sm">
              <h2 className="text-xl font-semibold">Prices + checkout/contact</h2>
              <p className="mt-2 text-white/70 max-w-2xl">
                Message us what you want, we confirm stock, you pay, we ship.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
