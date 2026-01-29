import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { supabase } from "../lib/supabase";

type PurchasedRow = {
  purchased_at: string;
  songs: {
    id: string;
    title: string;
    artist: string | null;
    release_date: string | null;
    cover_url: string | null;
    audio_url: string | null;
    price_cents: number | null;
  } | null;
};

const formatReleaseDate = (isoDate: string | null) => {
  if (!isoDate) return "—";
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "2-digit" });
};

export default function PurchasedSongs() {
  const [rows, setRows] = useState<PurchasedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const items = useMemo(() => {
    return (rows ?? [])
      .map((r) => ({ purchasedAt: r.purchased_at, song: r.songs }))
      .filter((x) => !!x.song)
      .map((x) => ({ purchasedAt: x.purchasedAt, song: x.song! }));
  }, [rows]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_purchases")
        .select(
          `
          purchased_at,
          songs:song_id (
            id,
            title,
            artist,
            release_date,
            cover_url,
            audio_url,
            price_cents
          )
        `
        )
        .order("purchased_at", { ascending: false });

      if (error) {
        setError(error.message);
        setRows([]);
      } else {
        setRows((data as PurchasedRow[]) ?? []);
      }

      setLoading(false);
    };

    load();

    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "auto";
      a.crossOrigin = "anonymous";
      audioRef.current = a;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const stop = () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    try {
      a.currentTime = 0;
    } catch {
      // ignore
    }
    setNowPlayingId(null);
  };

  const play = async (songId: string, audioUrl: string | null) => {
    if (!audioUrl) {
      showToast("No audio uploaded for this song yet.");
      return;
    }

    if (nowPlayingId === songId) {
      stop();
      return;
    }

    const a = audioRef.current ?? new Audio();
    audioRef.current = a;

    a.onended = () => setNowPlayingId(null);
    a.onerror = () => {
      showToast("Audio failed to load. Check bucket permissions / URL.");
      setNowPlayingId(null);
    };

    try {
      a.src = audioUrl;
      a.currentTime = 0;
      await a.play();
      setNowPlayingId(songId);
    } catch {
      showToast("Playback blocked. Try clicking again.");
      setNowPlayingId(null);
    }
  };

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
          <div className="mx-auto w-full max-w-6xl px-6 py-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Purchased Songs</h1>
                <p className="text-white/60 mt-2">Your personal vault. Only you get to hear these.</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-white/60">Owned</div>
                <div className="text-sm font-semibold">{items.length}</div>
              </div>
            </div>

            {toast && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-sm px-5 py-3 text-sm text-white/80">
                {toast}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                Failed to load purchased songs: {error}
              </div>
            )}

            {loading ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm p-6 text-white/70">
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm p-6 text-white/70">
                No purchases yet. Go press “Checkout (Fake)” like you mean it.
              </div>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(({ purchasedAt, song }) => (
                  <div
                    key={song.id}
                    className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden"
                  >
                    <div className="relative w-full aspect-square overflow-hidden">
                      <img
                        src={song.cover_url ?? "https://picsum.photos/seed/purchased/900/900"}
                        alt={`${song.title} cover`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="text-lg font-semibold leading-tight">{song.title}</div>
                        <div className="text-sm text-white/70">{song.artist ?? "Bliximstraat"}</div>
                        <div className="mt-1 text-[11px] text-white/60">
                          Released: {formatReleaseDate(song.release_date)} • Purchased:{" "}
                          {new Date(purchasedAt).toLocaleDateString("en-ZA")}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                            onClick={() => play(song.id, song.audio_url)}
                          >
                            {nowPlayingId === song.id ? "Stop" : "Play"}
                          </button>

                          {song.audio_url && (
                            <a
                              href={song.audio_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 text-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-xs text-white/60">Owned</div>
                      <div className="text-sm font-semibold">✅ Verified by RLS</div>
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
