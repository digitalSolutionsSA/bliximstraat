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
          className="h-full w-full object-cover"
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
                    Orders are currently only processed via WhatsApp.
                  </p>
                </div>

                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Order
                </a>

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
          <section className="px-6 pb-10">
            <div className="max-w-6xl mx-auto">

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md py-12 px-6 text-center"
              >

                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  NEW MERCH COMING SOON
                </h2>

                <p className="text-white/70 mt-3 max-w-xl mx-auto">
                  We're cooking up fresh Bliximstraat gear. Stay tuned.
                </p>

              </motion.div>

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
                  className="text-left rounded-2xl border border-white/10 bg-black/35 overflow-hidden backdrop-blur-sm flex flex-col"
                >

                  <div className="relative aspect-square">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-5">

                    <h3 className="font-semibold text-lg">
                      {p.name}
                    </h3>

                    <p className="text-xs text-white/60 mt-1">
                      {p.category}
                    </p>

                    <div className="mt-2 text-xl font-bold">
                      {formatZar(p.priceCents)}
                    </div>

                  </div>

                </motion.button>
              ))}

            </div>
          </section>

        </main>

        <Footer />

      </div>
    </div>
  );
}