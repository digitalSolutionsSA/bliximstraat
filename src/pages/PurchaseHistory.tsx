import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { supabase } from "../lib/supabase";

type OrderRow = {
  id: string;
  status: string;
  currency: string;
  total_cents: number;
  created_at: string;
  order_items: Array<{
    quantity: number;
    price_cents: number;
    songs: { id: string; title: string; artist: string | null } | null;
  }>;
};

const formatZar = (cents: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);

export default function PurchaseHistory() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          currency,
          total_cents,
          created_at,
          order_items (
            quantity,
            price_cents,
            songs:song_id (
              id,
              title,
              artist
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setOrders([]);
      } else {
        setOrders((data as OrderRow[]) ?? []);
      }

      setLoading(false);
    };

    load();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover">
          <source src="/normal-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen text-white">
        <Navbar overlayOnHome={false} />

        <main className="flex-1">
          <div className="mx-auto w-full max-w-4xl px-6 py-10">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Purchase History</h1>
            <p className="text-white/60 mt-2">Every fake checkout you’ve ever committed.</p>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                Failed to load orders: {error}
              </div>
            )}

            {loading ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm p-6 text-white/70">
                Loading…
              </div>
            ) : orders.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm p-6 text-white/70">
                No orders yet.
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-white/60">Order</div>
                        <div className="font-semibold break-all">{o.id}</div>
                        <div className="mt-1 text-xs text-white/60">
                          {new Date(o.created_at).toLocaleString("en-ZA")} • Status: {o.status}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-white/60">Total</div>
                        <div className="text-lg font-bold">{formatZar(o.total_cents)}</div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
                      {o.order_items?.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="min-w-0 pr-3">
                            <div className="font-semibold truncate">
                              {it.songs?.title ?? "Unknown song"}
                              <span className="text-white/60 font-normal">
                                {" "}
                                • {it.songs?.artist ?? "Bliximstraat"}
                              </span>
                            </div>
                            <div className="text-xs text-white/60">
                              Qty {it.quantity} • {formatZar(it.price_cents)} each
                            </div>
                          </div>

                          <div className="font-semibold">{formatZar(it.price_cents * it.quantity)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
