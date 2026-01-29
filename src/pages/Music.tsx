import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { supabase } from "../lib/supabase";
import { useCart } from "../contexts/CartContext";

// ✅ Owned overlay image
import songOwnedBadge from "../assets/song-owned.png";

/**
 * 🧪 TESTING:
 * When true, we IGNORE purchases and act like nothing is owned after reload.
 */
const TEST_RESET_OWNERSHIP_EACH_RELOAD = false;

/**
 * 🔍 Debug helper:
 * Turn ON temporarily if you want a toast showing how many owned rows came back.
 */
const DEBUG_OWNERSHIP = false;

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
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);

const formatReleaseDate = (isoDate: string | null) => {
  if (!isoDate) return "—";
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "2-digit" });
};

const normalizeAlbumId = (v: unknown): string | null => {
  if (typeof v !== "string") return v ? String(v) : null;
  const t = v.trim();
  return t.length ? t : null;
};

const OwnedOverlay = ({ src, alt }: { src: string; alt: string }) => (
  <div className="absolute inset-0 z-20">
    <div className="absolute inset-0 bg-black/35 backdrop-blur-sm rounded-[inherit]" />
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-contain scale-[1.2] select-none opacity-95 pointer-events-none"
    />
  </div>
);

export default function Music() {
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [ownedSongIds, setOwnedSongIds] = useState<Set<string>>(new Set());
  const [loadingOwned, setLoadingOwned] = useState(false);

  // 🧪 Test override: when true, we force-owned set to empty and ignore DB purchases.
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
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      try {
        audio.currentTime = 0;
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
    const load = async () => {
      setLoading(true);
      setError(null);

      const songsRes = await supabase
        .from("songs")
        .select("id,title,artist,release_date,price_cents,cover_url,audio_url,album_id,track_number,created_at")
        .order("release_date", { ascending: false, nullsFirst: false });

      if (songsRes.error) {
        setError(songsRes.error.message);
        setSongs([]);
        setLoading(false);
        return;
      }

      setSongs((songsRes.data as SongRow[]) ?? []);
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

    load();
    void initAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "auto";
      a.crossOrigin = "anonymous";
      audioRef.current = a;
    }

    return () => {
      sub?.subscription?.unsubscribe();
      clearAllTimers();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ song ids we actually know about (client-side truth)
  const knownSongIds = useMemo(() => new Set(songs.map((s) => s.id)), [songs]);

  // -----------------------------------------
  // ✅ Fetch owned songs (SUPER defensive)
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

      // Fetch only song_id, keep it simple
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

      // HARD FILTERS:
      // - must match this user
      // - song_id must be a non-empty string
      // - song_id must exist in songs table we loaded
      const cleanedIds = raw
        .filter((r) => r.user_id === userId)
        .map((r) => r.song_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
        .filter((id) => knownSongIds.has(id));

      if (DEBUG_OWNERSHIP) {
        showToast(`Owned rows: raw=${raw.length}, cleaned=${cleanedIds.length}`);
      }

      setOwnedSongIds(new Set(cleanedIds));
      setLoadingOwned(false);
    };

    void loadOwned();

    return () => {
      cancelled = true;
    };
  }, [userId, testOwnershipReset, knownSongIds]);
  // -----------------------------------------
  // ✅ REALTIME: instantly show Owned overlay when purchase row is inserted
  // -----------------------------------------
  useEffect(() => {
    if (!userId) return;
    if (TEST_RESET_OWNERSHIP_EACH_RELOAD || testOwnershipReset) return;

    const channel = supabase
      .channel(`user_purchases:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_purchases",
          filter: `user_id=eq.${userId}`,
        },
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
        {
          event: "DELETE",
          schema: "public",
          table: "user_purchases",
          filter: `user_id=eq.${userId}`,
        },
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

  // ✅ Everything is a “single” now. Even album tracks.
  const singles: SingleCard[] = useMemo(() => {
    const fallbackCover = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/900`;

    const sorted = [...songs].sort((a, b) => {
      const ad = a.release_date ?? "";
      const bd = b.release_date ?? "";
      if (ad !== bd) return bd.localeCompare(ad);

      const aa = normalizeAlbumId(a.album_id) ?? "";
      const ba = normalizeAlbumId(b.album_id) ?? "";
      if (aa !== ba) return aa.localeCompare(ba);

      return (a.track_number ?? 999) - (b.track_number ?? 999);
    });

    return sorted.map((s) => {
      const year = s.release_date && s.release_date.length >= 4 ? s.release_date.slice(0, 4) : "—";
      return {
        id: s.id,
        title: s.title,
        artist: s.artist || "Bliximstraat",
        year,
        coverUrl: s.cover_url || fallbackCover(s.title),
        audioUrl: s.audio_url ?? null,
        releaseDate: s.release_date ?? null,
        priceCents: s.price_cents ?? 0,
        albumId: normalizeAlbumId(s.album_id),
        trackNumber: s.track_number ?? null,
      };
    });
  }, [songs]);

  // ✅ Add-to-cart for one song (HARD GUARDED)
  const addToCart = async (id: string, title: string, artist: string, priceCents: number, coverUrl: string | null) => {
    if (ownedSongIds.has(id)) {
      showToast("Already owned.");
      return;
    }

    try {
      await addItem(
        {
          id,
          title,
          artist,
          price: (priceCents || 0) / 100,
          coverUrl: coverUrl ?? undefined,
        },
        1
      );
      showToast("Added to cart.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Please sign in to add items to cart.";
      showToast(msg);
    }
  };

  // ------------------
  // Owned full playback
  // ------------------
  const playAudioUrl = async (opts: { id: string; audioUrl: string }) => {
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    audio.onended = () => stopAllAudio();
    audio.onerror = () => {
      showToast("Audio failed to load. Check bucket access / URL.");
      stopAllAudio();
    };

    try {
      audio.src = opts.audioUrl;
      audio.currentTime = 0;
      await audio.play();
      setNowPlayingSingleId(opts.id);
    } catch {
      showToast("Playback blocked. Click again, or check audio URL access.");
      stopAllAudio();
    }
  };

  const playOwnedSingle = async (r: SingleCard) => {
    if (!r.audioUrl) {
      showToast("No audio uploaded for this song yet.");
      return;
    }
    if (nowPlayingSingleId === r.id) {
      stopAllAudio();
      return;
    }
    setLockedSongId(null);
    stopAllAudio();
    await playAudioUrl({ id: r.id, audioUrl: r.audioUrl });
  };

  // ------------------
  // Demo logic (once per reload)
  // ------------------
  const showPurchaseGateForSingle = (songId: string) => {
    stopAllAudio();
    setLockedSongId(songId);
    showToast("To continue listening, please purchase this song.");
  };

  const playSingleDemo = async (r: SingleCard) => {
    if (ownedSongIds.has(r.id)) {
      await playOwnedSingle(r);
      return;
    }

    if (!r.audioUrl) {
      showToast("No audio uploaded for this song yet.");
      return;
    }

    if (playedSinglesThisSessionRef.current.has(r.id)) {
      showPurchaseGateForSingle(r.id);
      return;
    }

    if (nowPlayingSingleId === r.id) {
      stopAllAudio();
      return;
    }

    setLockedSongId(null);
    stopAllAudio();

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    audio.onended = () => {
      stopAllAudio();
      showPurchaseGateForSingle(r.id);
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

      demoSeekTimerRef.current = window.setTimeout(() => {
        const dur = audio.duration;
        if (Number.isFinite(dur) && dur > SINGLE_DEMO_SECONDS + 2) {
          const maxStart = Math.max(0, dur - SINGLE_DEMO_SECONDS);
          const start = (Date.now() / 1000) % maxStart;
          try {
            audio.currentTime = start;
          } catch {}
        }
      }, 250);

      clearAllTimers();
      demoStopTimerRef.current = window.setTimeout(() => {
        showPurchaseGateForSingle(r.id);
      }, SINGLE_DEMO_SECONDS * 1000);
    } catch {
      showToast("Playback blocked. Click again, or check audio URL access.");
      stopAllAudio();
    }
  };

  // 🧪 Reset ownership button behavior (local only)
  const resetOwnershipForTesting = () => {
    stopAllAudio();
    setLockedSongId(null);
    playedSinglesThisSessionRef.current = new Set();
    setOwnedSongIds(new Set());
    setTestOwnershipReset(true);
    showToast("Test reset: all purchases cleared (locally).");
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* BACKGROUND LAYER (video + overlay) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover">
          <source src="/normal-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 flex flex-col min-h-screen text-white">
        <Navbar overlayOnHome={false} />

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">Music</h1>
                <p className="text-white/60 mt-2 text-sm sm:text-base">
                  Singles only. And “owned” means owned. Revolutionary concept.
                </p>

                {/* 🧪 Test button */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                    onClick={resetOwnershipForTesting}
                    title="Testing only: clears owned state locally (does not delete DB purchases)"
                  >
                    🧪 Reset ownership (test)
                  </button>

                  {(TEST_RESET_OWNERSHIP_EACH_RELOAD || testOwnershipReset) && (
                    <div className="text-xs text-yellow-200/80">Test mode active: ownership is forced empty</div>
                  )}

                  {loadingOwned && <div className="text-xs text-white/50">Checking owned songs…</div>}
                </div>
              </div>

              <div className="shrink-0 sm:text-right rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm px-4 py-3">
                <div className="text-xs text-white/60">Cart</div>
                <div className="text-sm font-semibold">
                  {count} item{count === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            {toast && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-sm px-5 py-3 text-sm text-white/80">
                {toast}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                Failed to load music: {error}
              </div>
            )}

            {/* SINGLES */}
            <section className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">Singles</h2>
                <div className="text-sm text-white/60">
                  {loading ? "Loading…" : `${singles.length} song${singles.length === 1 ? "" : "s"}`}
                </div>
              </div>

              {!loading && !error && singles.length === 0 && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm p-6 text-white/70">
                  No songs found yet.
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {singles.map((r) => {
                  const isSongOwned = ownedSongIds.has(r.id);

                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden"
                    >
                      <div className="group relative w-full aspect-square overflow-hidden">
                        <img
                          src={r.coverUrl}
                          alt={`${r.title} cover`}
                          className="h-full w-full object-cover transition duration-300 md:group-hover:scale-[1.02]"
                          loading="lazy"
                        />

                        {isSongOwned && <OwnedOverlay src={songOwnedBadge} alt="Song owned" />}

                        <div className="absolute top-3 left-3 flex gap-2 text-[11px] sm:text-xs z-30">
                          <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15">Single</span>
                          <span className="px-2 py-1 rounded-full bg-black/40 border border-white/10">{r.year}</span>
                        </div>

                        <div className="pointer-events-none absolute inset-0 bg-black/60 opacity-0 transition duration-200 md:group-hover:opacity-100 z-10" />

                        {/* Controls */}
                        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition duration-200">
                          {isSongOwned ? (
                            <button
                              type="button"
                              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                              onClick={() => void playOwnedSingle(r)}
                            >
                              {nowPlayingSingleId === r.id ? "Stop" : "Play full song"}
                            </button>
                          ) : (
                            <>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  type="button"
                                  className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                                  onClick={() => void playSingleDemo(r)}
                                >
                                  {nowPlayingSingleId === r.id ? "Stop" : "Play demo"}
                                </button>

                                <button
                                  type="button"
                                  className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                                  onClick={() => void addToCart(r.id, r.title, r.artist, r.priceCents, r.coverUrl)}
                                >
                                  Add to cart
                                </button>
                              </div>

                              <div className="mt-2 text-[11px] text-white/65">
                                Demo plays {SINGLE_DEMO_SECONDS}s (once per page load)
                              </div>
                            </>
                          )}
                        </div>

                        {!isSongOwned && lockedSongId === r.id && (
                          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 sm:p-5">
                            <div className="w-full rounded-2xl border border-white/15 bg-black/80 backdrop-blur-sm p-4 text-center">
                              <div className="text-lg font-bold">Keep listening?</div>
                              <div className="mt-2 text-sm text-white/70">
                                To continue listening, please purchase this song.
                              </div>

                              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                <button
                                  type="button"
                                  className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                                  onClick={() => void addToCart(r.id, r.title, r.artist, r.priceCents, r.coverUrl)}
                                >
                                  Add to cart
                                </button>

                                <button
                                  type="button"
                                  className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                                  onClick={() => setLockedSongId(null)}
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info section */}
                      <div className="p-4 bg-black/35 backdrop-blur-sm">
                        <div className="text-base sm:text-lg font-semibold leading-tight">
                          {r.trackNumber ? `${r.trackNumber}. ` : ""}
                          {r.title}
                        </div>

                        <div className="text-sm text-white/60">{r.artist}</div>

                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          {isSongOwned ? (
                            <div className="text-sm text-white/70 font-semibold">Owned</div>
                          ) : (
                            <div className="font-semibold">{formatZar(r.priceCents)}</div>
                          )}
                          <div className="text-white/60">{formatReleaseDate(r.releaseDate)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
