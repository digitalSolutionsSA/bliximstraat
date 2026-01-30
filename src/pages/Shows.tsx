import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { supabase } from "../lib/supabase";

type ShowRowAny = {
  id: string;
  title?: string | null;
  venue?: string | null;
  city?: string | null;

  // possible date fields (depending on how your table was made)
  show_date?: string | null; // date or timestamptz
  date?: string | null;
  event_date?: string | null;
  starts_at?: string | null;

  // possible time fields
  show_time?: string | null;
  time?: string | null;
};

type ShowUI = {
  id: string;
  title: string | null;
  venue: string;
  city: string;
  show_date: string; // normalized ISO string
  show_time: string | null;
};

function pickFirst<T>(...vals: Array<T | null | undefined>): T | null {
  for (const v of vals) if (v !== null && v !== undefined) return v;
  return null;
}

// Parse date safely. If it's "YYYY-MM-DD", force local midnight to avoid timezone shifting.
function parseDateSafe(dateStr: string): Date {
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  return new Date(dateStr);
}

export default function Shows() {
  const [shows, setShows] = useState<ShowUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      // Select * so missing columns don't crash the entire request.
      // We'll normalize in JS.
      const { data, error } = await supabase.from("shows").select("*");

      if (error) {
        setError(error.message);
        setShows([]);
        setLoading(false);
        return;
      }

      const rows = (data as ShowRowAny[]) ?? [];

      const normalized: ShowUI[] = rows
        .map((r) => {
          const rawDate = pickFirst(r.show_date, r.date, r.event_date, r.starts_at) ?? "";

          // If we *still* don't have a date, we can't show it properly.
          // We'll drop it rather than lying to the UI.
          if (!rawDate) return null;

          const rawTime = pickFirst(r.show_time, r.time);

          return {
            id: r.id,
            title: r.title ?? null,
            venue: r.venue ?? "TBA",
            city: r.city ?? "TBA",
            show_date: rawDate,
            show_time: rawTime ?? null,
          };
        })
        .filter(Boolean) as ShowUI[];

      // Sort by date here, since DB ordering may not be possible without knowing the column name.
      normalized.sort(
        (a, b) => parseDateSafe(a.show_date).getTime() - parseDateSafe(b.show_date).getTime()
      );

      setShows(normalized);
      setLoading(false);
    };

    load();
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcomingShows = useMemo(() => {
    return shows.filter((s) => parseDateSafe(s.show_date) >= today);
  }, [shows, today]);

  const pastShows = useMemo(() => {
    return shows.filter((s) => parseDateSafe(s.show_date) < today);
  }, [shows, today]);

  const formatDate = (dateStr: string) => {
    const d = parseDateSafe(dateStr);
    return d.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden flex flex-col">
      {/* === FIXED VIDEO BACKGROUND === */}
      <div className="fixed inset-0 z-0">
        <video
          className="h-full w-full object-cover"
          src="/normal-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => window.dispatchEvent(new Event("bg-video-ready"))}
          onLoadedData={() => window.dispatchEvent(new Event("bg-video-ready"))}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* === FOREGROUND === */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-6 py-24 space-y-24">
            {/* PAGE TITLE */}
            <header className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-wide">Shows</h1>
              <p className="text-white/60 max-w-xl mx-auto">
                Upcoming shows, past chaos, and places we’ve made noise.
              </p>
            </header>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-200 text-sm">
                Failed to load shows: {error}
              </div>
            )}

            {loading && <div className="text-center text-white/60">Loading shows…</div>}

            {/* UPCOMING SHOWS */}
            {!loading && (
              <section className="space-y-8">
                <h2 className="text-2xl font-medium tracking-wide">Upcoming Shows</h2>

                {upcomingShows.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-5 text-white/60">
                    No upcoming shows yet. Fix that.
                  </div>
                )}

                <div className="space-y-4">
                  {upcomingShows.map((show) => (
                    <div
                      key={show.id}
                      className="
                        flex flex-col md:flex-row md:items-center md:justify-between
                        gap-4
                        p-5
                        rounded-xl
                        border border-white/15
                        bg-black/40
                        backdrop-blur-sm
                      "
                    >
                      <div className="space-y-1">
                        <p className="text-lg font-medium">{show.title || show.venue}</p>
                        <p className="text-white/60">
                          {show.venue} • {show.city}
                        </p>
                      </div>

                      <div className="text-sm text-white/70 md:text-right">
                        <p>{formatDate(show.show_date)}</p>
                        {show.show_time && <p>{show.show_time}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PAST SHOWS */}
            {!loading && pastShows.length > 0 && (
              <section className="space-y-8">
                <h2 className="text-2xl font-medium tracking-wide">Past Shows</h2>

                <div className="space-y-3">
                  {pastShows.map((show) => (
                    <div
                      key={show.id}
                      className="
                        flex flex-col sm:flex-row sm:items-center sm:justify-between
                        gap-2
                        p-4
                        rounded-lg
                        border border-white/10
                        bg-black/30
                        text-white/70
                      "
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{show.title || show.venue}</p>
                        <p className="text-sm text-white/60 truncate">
                          {show.venue} • {show.city}
                        </p>
                      </div>

                      <div className="text-sm shrink-0 sm:text-right">
                        <p>{formatDate(show.show_date)}</p>
                        {show.show_time ? <p>{show.show_time}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
