import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { supabase } from "../lib/supabase";

type LyricRow = {
  id: string;
  title: string;
  year: string | null;
  album: string | null;
  lyrics: string;
  created_at?: string;
};

export default function Lyrics() {
  const [songs, setSongs] = useState<LyricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("lyrics")
        .select("id,title,year,album,lyrics,created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setLoadError(error.message);
        setSongs([]);
        setActiveId("");
        setLoading(false);
        return;
      }

      const rows = (data as LyricRow[]) ?? [];
      setSongs(rows);
      setActiveId(rows[0]?.id ?? "");
      setLoading(false);
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;

    return songs.filter((s) =>
      `${s.title} ${s.album ?? ""} ${s.year ?? ""} ${s.lyrics}`
        .toLowerCase()
        .includes(q)
    );
  }, [query, songs]);

  // Keep active selection valid when filtering changes
  useEffect(() => {
    if (!filtered.length) return;
    const stillExists = filtered.some((s) => s.id === activeId);
    if (!stillExists) setActiveId(filtered[0].id);
  }, [filtered, activeId]);

  const activeSong = useMemo(() => {
    return filtered.find((s) => s.id === activeId) ?? filtered[0];
  }, [filtered, activeId]);

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden flex flex-col">
      {/* === FIXED VIDEO BACKGROUND (SAME AS MUSIC/SHOWS/MERCH/ABOUT) === */}
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

      {/* Foreground */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          {/* Spacer for fixed navbar */}
          <div className="h-20" />

          <div className="mx-auto max-w-6xl px-6 py-10">
            {/* Header */}
            <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  Lyrics{" "}
                  <span className="text-teal-300 drop-shadow-[0_0_18px_rgba(20,184,166,0.35)]">
                    Vault
                  </span>
                </h1>
                <p className="mt-2 text-white/70">
                  Official lyrics. No “I heard it on TikTok” versions.
                </p>
              </div>

              {/* Search */}
              <div className="w-full md:w-[360px]">
                <label className="block text-xs text-white/60 mb-2">Search</label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, album, or lyrics..."
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 placeholder:text-white/40 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                />
              </div>
            </header>

            {/* Load states */}
            {loadError && (
              <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                Failed to load lyrics: {loadError}
              </div>
            )}

            {loading && (
              <div className="mt-10 text-white/60">Loading lyrics…</div>
            )}

            {!loading && !loadError && songs.length === 0 && (
              <div className="mt-10 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm p-6 text-white/70">
                No lyrics yet. Add some in the Admin panel.
              </div>
            )}

            {/* Content */}
            {!loading && songs.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
                {/* Song list */}
                <aside className="md:col-span-4">
                  <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                      <p className="text-sm text-white/70">
                        {filtered.length} song{filtered.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="max-h-[62vh] overflow-auto">
                      {filtered.map((s) => {
                        const active = s.id === activeSong?.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setActiveId(s.id)}
                            className={`w-full text-left px-5 py-4 border-b border-white/5 transition ${
                              active ? "bg-white/5" : "hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-white">{s.title}</p>
                                <p className="mt-1 text-xs text-white/60">
                                  {s.album ?? "Unknown"}{" "}
                                  {s.year ? `• ${s.year}` : ""}
                                </p>
                              </div>

                              {active && (
                                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.6)]" />
                              )}
                            </div>
                          </button>
                        );
                      })}

                      {filtered.length === 0 && (
                        <div className="px-5 py-10 text-white/60 text-sm">
                          Nothing found. Try fewer words.
                        </div>
                      )}
                    </div>
                  </div>
                </aside>

                {/* Lyrics viewer */}
                <section className="md:col-span-8">
                  <div className="relative rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] overflow-hidden">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400/60 via-fuchsia-400/30 to-yellow-300/40 opacity-70" />

                    <div className="px-6 py-5 border-b border-white/10">
                      <h2 className="text-2xl font-black tracking-tight">
                        {activeSong?.title ?? "Select a song"}
                      </h2>
                      <p className="mt-1 text-sm text-white/60">
                        {activeSong?.album ?? "Unknown"}{" "}
                        {activeSong?.year ? `• ${activeSong.year}` : ""}
                      </p>
                    </div>

                    <div className="px-6 py-6">
                      <pre className="whitespace-pre-wrap text-white/90 leading-relaxed text-base font-mono">
                        {activeSong?.lyrics ?? "Pick a song on the left."}
                      </pre>

                      {activeSong && (
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(activeSong.lyrics);
                              } catch {
                                // browser drama
                              }
                            }}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
                          >
                            Copy lyrics
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-white/50">
                    Tip: You can keep adding lyrics via Admin. This page updates on refresh.
                  </p>
                </section>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
