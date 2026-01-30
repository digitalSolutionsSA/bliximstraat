import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { supabase } from "../lib/supabase";
import { useCart } from "../contexts/CartContext";

// ✅ Owned overlay image
import songOwnedBadge from "../assets/song-owned.png";

const TEST_RESET_OWNERSHIP_EACH_RELOAD = false;
const DEBUG_OWNERSHIP = false;

/* -------------------------------------------
   PLATFORM EMBEDS (Spotify / Apple / YouTube)
------------------------------------------- */
type PlatformEmbed = {
  id: string;
  platform: "Spotify" | "Apple Music" | "YouTube";
  title: string;
  src: string;
};

const PLATFORM_EMBEDS: PlatformEmbed[] = [
  {
    id: "spotify",
    platform: "Spotify",
    title: "BliximStraat on Spotify",
    src: "https://open.spotify.com/embed/artist/0Ch8nVFZCWFF95IXTcgLgT",
  },
  {
    id: "apple",
    platform: "Apple Music",
    title: "BliximStraat – Cherry En Bubble Gum Milkshake",
    // ✅ Song embed looks like a proper “player card” (better than artist page)
    src: "https://embed.music.apple.com/us/song/cherry-en-bubble-gum-milkshake/1855232589",
  },
  {
    id: "youtube",
    platform: "YouTube",
    title: "Latest on YouTube",
    src: "https://www.youtube.com/embed/dnzYfB9368U",
  },
];

const platformBadgeClass = (p: PlatformEmbed["platform"]) => {
  switch (p) {
    case "Spotify":
      return "bg-green-500/10 border-green-400/20 text-green-100";
    case "Apple Music":
      return "bg-pink-500/10 border-pink-400/20 text-pink-100";
    case "YouTube":
      return "bg-red-500/10 border-red-400/20 text-red-100";
    default:
      return "bg-white/10 border-white/15 text-white";
  }
};

/* -------------------------------------------
   TYPES
------------------------------------------- */
type SongRow = {
  id: string;
  title: string;
  artist: string;
  release_date: string | null;
  price_cents: number;
  cover_url: string | null;
  audio_url: string | null;
  created_at?: string;
  album_id?: string | null;
  track_number?: number | null;
};

type SingleCard = {
  id: string;
  title: string;
  artist: string;
  year: string;
  coverUrl: string;
  audioUrl: string | null;
  releaseDate: string | null;
  priceCents: number;
  albumId: string | null;
  trackNumber: number | null;
};

const formatZar = (cents: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format((cents || 0) / 100);

const formatReleaseDate = (isoDate: string | null) => {
  if (!isoDate) return "—";
  const d = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? isoDate
    : d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "2-digit" });
};

const OwnedOverlay = ({ src, alt }: { src: string; alt: string }) => (
  <div className="absolute inset-0 z-20">
    <div className="absolute inset-0 bg-black/35 backdrop-blur-sm rounded-[inherit]" />
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-contain scale-[1.2] opacity-95 pointer-events-none"
    />
  </div>
);
export default function Music() {
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Owned state
  const [ownedSongIds, setOwnedSongIds] = useState<Set<string>>(new Set());
  const [loadingOwned, setLoadingOwned] = useState(false);

  // 🧪 local-only override for testing
  const [testOwnershipReset, setTestOwnershipReset] = useState(false);

  const { addItem, count } = useCart();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const demoStopTimerRef = useRef<number | null>(null);
  const demoSeekTimerRef = useRef<number | null>(null);

  const [nowPlayingSingleId, setNowPlayingSingleId] = useState<string | null>(null);
  const playedSinglesThisSessionRef = useRef<Set<string>>(new Set());
  const SINGLE_DEMO_SECONDS = 15;

  const [lockedSongId, setLockedSongId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  };

  const clearAllTimers = () => {
    if (demoStopTimerRef.current) window.clearTimeout(demoStopTimerRef.current);
    if (demoSeekTimerRef.current) window.clearTimeout(demoSeekTimerRef.current);
    demoStopTimerRef.current = null;
    demoSeekTimerRef.current = null;
  };

  const stopAllAudio = () => {
    clearAllTimers();
    const a = audioRef.current;
    if (a) {
      a.pause();
      try {
        a.currentTime = 0;
      } catch {
        // ignore
      }
    }
    setNowPlayingSingleId(null);
  };

  // -----------------------------
  // Load songs + init audio + auth
  // -----------------------------
  useEffect(() => {
    const loadSongs = async () => {
      setLoading(true);
      setError(null);

      const res = await supabase.from("songs").select("*").order("release_date", { ascending: false });

      if (res.error) {
        setError(res.error.message);
        setSongs([]);
      } else {
        setSongs((res.data ?? []) as SongRow[]);
      }

      setLoading(false);
    };

    const initAuth = async () => {
      const { data, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.warn("supabase.auth.getUser() failed:", authErr);
        setUserId(null);
        return;
      }
      setUserId(data?.user?.id ?? null);
    };

    void loadSongs();
    void initAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));

    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "auto";
      a.crossOrigin = "anonymous";
      audioRef.current = a;
    }

    return () => {
      sub?.subscription?.unsubscribe();
      stopAllAudio();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ known song ids (client-side truth)
  const knownSongIds = useMemo(() => new Set(songs.map((s) => s.id)), [songs]);
  // -----------------------------------------
  // ✅ Load owned song ids from user_purchases
  // -----------------------------------------
  useEffect(() => {
    let cancelled = false;

    const loadOwned = async () => {
      if (TEST_RESET_OWNERSHIP_EACH_RELOAD || testOwnershipReset) {
        setOwnedSongIds(new Set());
        return;
      }

      if (!userId) {
        setOwnedSongIds(new Set());
        return;
      }

      setLoadingOwned(true);

      const { data, error: purchasesErr } = await supabase
        .from("user_purchases")
        .select("user_id,song_id")
        .eq("user_id", userId);

      if (cancelled) return;

      if (purchasesErr) {
        console.error("Failed to load user purchases:", purchasesErr);
        setOwnedSongIds(new Set());
        setLoadingOwned(false);
        return;
      }

      const raw = (data ?? []) as Array<{ user_id: string | null; song_id: string | null }>;

      const cleanedIds = raw
        .filter((r) => r.user_id === userId)
        .map((r) => r.song_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
        .filter((id) => knownSongIds.has(id));

      if (DEBUG_OWNERSHIP) showToast(`Owned: raw=${raw.length}, cleaned=${cleanedIds.length}`);

      setOwnedSongIds(new Set(cleanedIds));
      setLoadingOwned(false);
    };

    void loadOwned();

    return () => {
      cancelled = true;
    };
  }, [userId, testOwnershipReset, knownSongIds]);

  // -----------------------------------------
  // ✅ Realtime owned updates (insert/delete)
  // -----------------------------------------
  useEffect(() => {
    if (!userId) return;
    if (TEST_RESET_OWNERSHIP_EACH_RELOAD || testOwnershipReset) return;

    const channel = supabase
      .channel(`user_purchases:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_purchases", filter: `user_id=eq.${userId}` },
        (payload: any) => {
          const songId = payload?.new?.song_id as string | undefined;
          if (!songId) return;
          if (!knownSongIds.has(songId)) return;

          setOwnedSongIds((prev) => {
            const next = new Set(prev);
            next.add(songId);
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "user_purchases", filter: `user_id=eq.${userId}` },
        (payload: any) => {
          const songId = payload?.old?.song_id as string | undefined;
          if (!songId) return;

          setOwnedSongIds((prev) => {
            const next = new Set(prev);
            next.delete(songId);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, knownSongIds, testOwnershipReset]);

  const singles: SingleCard[] = useMemo(() => {
    return songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist || "BliximStraat",
      year: s.release_date?.slice(0, 4) ?? "—",
      coverUrl: s.cover_url ?? "",
      audioUrl: s.audio_url ?? null,
      releaseDate: s.release_date ?? null,
      priceCents: s.price_cents ?? 0,
      albumId: s.album_id ?? null,
      trackNumber: s.track_number ?? null,
    }));
  }, [songs]);

  const playOwnedSingle = async (r: SingleCard) => {
    if (!r.audioUrl) return showToast("No audio uploaded.");
    if (nowPlayingSingleId === r.id) return stopAllAudio();

    stopAllAudio();

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    audio.onended = () => stopAllAudio();
    audio.onerror = () => {
      showToast("Audio failed to load. Check bucket access / URL.");
      stopAllAudio();
    };

    try {
      audio.src = r.audioUrl;
      audio.currentTime = 0;
      await audio.play();
      setNowPlayingSingleId(r.id);
      setLockedSongId(null);
    } catch {
      showToast("Playback blocked. Click again.");
      stopAllAudio();
    }
  };

  const playSingleDemo = async (r: SingleCard) => {
    if (ownedSongIds.has(r.id)) return playOwnedSingle(r);
    if (!r.audioUrl) return showToast("No audio uploaded.");

    if (playedSinglesThisSessionRef.current.has(r.id)) {
      stopAllAudio();
      setLockedSongId(r.id);
      return showToast("To continue listening, please purchase this song.");
    }

    if (nowPlayingSingleId === r.id) return stopAllAudio();

    setLockedSongId(null);
    stopAllAudio();

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    audio.onended = () => {
      stopAllAudio();
      setLockedSongId(r.id);
      showToast("To continue listening, please purchase this song.");
    };
    audio.onerror = () => {
      showToast("Audio failed to load. Check bucket access / URL.");
      stopAllAudio();
    };

    try {
      audio.src = r.audioUrl;
      audio.currentTime = 0;
      await audio.play();
      setNowPlayingSingleId(r.id);

      playedSinglesThisSessionRef.current.add(r.id);

      clearAllTimers();
      demoStopTimerRef.current = window.setTimeout(() => {
        stopAllAudio();
        setLockedSongId(r.id);
        showToast("To continue listening, please purchase this song.");
      }, SINGLE_DEMO_SECONDS * 1000);
    } catch {
      showToast("Playback blocked. Click again.");
      stopAllAudio();
    }
  };

  const resetOwnershipForTesting = () => {
    stopAllAudio();
    setLockedSongId(null);
    playedSinglesThisSessionRef.current = new Set();
    setOwnedSongIds(new Set());
    setTestOwnershipReset(true);
    showToast("Test reset: purchases cleared locally.");
  };

  const addToCart = async (r: SingleCard) => {
    if (ownedSongIds.has(r.id)) return showToast("Already owned.");

    try {
      await addItem(
        {
          id: r.id,
          title: r.title,
          artist: r.artist,
          price: (r.priceCents || 0) / 100,
          coverUrl: r.coverUrl || undefined,
        },
        1
      );
      showToast("Added to cart.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Please sign in to add items to cart.";
      showToast(msg);
    }
  };
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay muted loop className="h-full w-full object-cover">
          <source src="/normal-bg.mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen text-white">
        <Navbar overlayOnHome={false} />

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-semibold">Music</h1>
                <div className="mt-2 text-sm text-white/60">
                  {loading ? "Loading…" : `${singles.length} song${singles.length === 1 ? "" : "s"}`}
                  {loadingOwned ? " • checking owned…" : ""}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm px-4 py-3">
                <div className="text-xs text-white/60">Cart</div>
                <div className="text-sm font-semibold">
                  {count} item{count === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <button
              onClick={resetOwnershipForTesting}
              className="mt-4 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
              title="Testing only: clears owned state locally (does NOT delete DB purchases)"
            >
              Reset ownership (test)
            </button>

            {toast && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-sm px-5 py-3 text-sm text-white/80">
                {toast}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                Failed to load music: {error}
              </div>
            )}

            {/* SINGLES */}
            <section className="mt-10">
              <h2 className="text-xl font-semibold mb-4">Singles</h2>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {singles.map((r) => {
                  const isOwned = ownedSongIds.has(r.id);

                  return (
                    <div key={r.id} className="rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={r.coverUrl}
                          className="w-full h-full object-cover"
                          alt={`${r.title} cover`}
                          loading="lazy"
                        />
                        {isOwned && <OwnedOverlay src={songOwnedBadge} alt="Owned" />}
                      </div>

                      <div className="p-4 bg-black/35 backdrop-blur-sm">
                        <div className="font-semibold">{r.title}</div>
                        <div className="text-sm text-white/60">{r.artist}</div>

                        <div className="mt-3 flex items-center justify-between text-sm">
                          {isOwned ? (
                            <span className="text-white/70 font-semibold">Owned</span>
                          ) : (
                            <span className="font-semibold">{formatZar(r.priceCents)}</span>
                          )}
                          <span className="text-white/60">{formatReleaseDate(r.releaseDate)}</span>
                        </div>

                        {isOwned ? (
                          <button
                            className="mt-3 w-full rounded-xl border border-white/15 bg-white/10 py-2 text-sm font-semibold hover:bg-white/15"
                            onClick={() => void playOwnedSingle(r)}
                          >
                            {nowPlayingSingleId === r.id ? "Stop" : "Play full song"}
                          </button>
                        ) : (
                          <>
                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                              <button
                                className="flex-1 rounded-xl border border-white/15 bg-white/10 py-2 text-sm font-semibold hover:bg-white/15"
                                onClick={() => void playSingleDemo(r)}
                              >
                                {nowPlayingSingleId === r.id ? "Stop" : `Play demo (${SINGLE_DEMO_SECONDS}s)`}
                              </button>
                              <button
                                className="flex-1 rounded-xl border border-white/15 bg-white/10 py-2 text-sm font-semibold hover:bg-white/15"
                                onClick={() => void addToCart(r)}
                              >
                                Add to cart
                              </button>
                            </div>

                            {!isOwned && lockedSongId === r.id && (
                              <div className="mt-3 rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-white/70">
                                Demo used. Purchase to continue listening.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* PLATFORM EMBEDS */}
            <section className="mt-14">
              <h2 className="text-xl font-semibold mb-2">Listen on platforms</h2>
              <p className="text-sm text-white/60 mb-6">Same music. Different billion-dollar apps.</p>

              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {PLATFORM_EMBEDS.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden"
                  >
                    {/* EMBED AREA (black fill behind iframe so empty zones don’t look awkward) */}
                    <div className="bg-black/70">
                      <div
                        className={`relative w-full overflow-hidden ${
                          e.platform === "Apple Music"
                            ? "aspect-[16/7]"
                            : "aspect-square"
                        }`}
                      >
                        {/* Black “fill” + subtle vignette behind iframe */}
                        <div className="absolute inset-0 bg-black" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/35 pointer-events-none" />

                        {e.platform === "Apple Music" ? (
                          <iframe
                            src={e.src}
                            title={e.title}
                            loading="lazy"
                            frameBorder={0}
                            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                            className="absolute inset-0 h-full w-full"
                          />
                        ) : (
                          <iframe
                            src={e.src}
                            title={e.title}
                            loading="lazy"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            className="absolute inset-0 h-full w-full"
                          />
                        )}
                      </div>
                    </div>

                    {/* INFO AREA (attached directly under) */}
                    <div className="p-4 bg-black/35 backdrop-blur-sm border-t border-white/10">
                      <div className="text-base sm:text-lg font-semibold leading-tight">{e.title}</div>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${platformBadgeClass(
                            e.platform
                          )}`}
                        >
                          {e.platform}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
