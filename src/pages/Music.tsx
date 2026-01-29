import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { supabase } from "../lib/supabase";
import { useCart } from "../contexts/CartContext";

// ✅ Owned overlay images
import songOwnedBadge from "../assets/song-owned.png";
import albumOwnedBadge from "../assets/album-owned.png";

/**
 * 🧪 TESTING:
 * When true, we IGNORE purchases and act like nothing is owned after reload.
 * Set to false when you're done testing.
 */
const TEST_RESET_OWNERSHIP_EACH_RELOAD = true;

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

type AlbumRow = {
  id: string;
  title: string;
  artist: string;
  release_date: string | null;
  cover_url: string | null;
  created_at?: string;
};

type AlbumCard = {
  id: string;
  title: string;
  artist: string;
  year: string;
  coverUrl: string;
  releaseDate: string | null;

  /** Sum of all track prices, then 15% discount applied */
  albumPriceCents: number;

  tracks: Array<{
    id: string;
    title: string;
    priceCents: number;
    audioUrl: string | null;
    trackNumber: number | null;
    releaseDate: string | null;
  }>;
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

export default function Music() {
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [ownedSongIds, setOwnedSongIds] = useState<Set<string>>(new Set());
  const [loadingOwned, setLoadingOwned] = useState(false);

  const { addItem, count } = useCart();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const demoStopTimerRef = useRef<number | null>(null);
  const demoSeekTimerRef = useRef<number | null>(null);

  const [nowPlayingSingleId, setNowPlayingSingleId] = useState<string | null>(null);
  const playedSinglesThisSessionRef = useRef<Set<string>>(new Set());
  const SINGLE_DEMO_SECONDS = 15;

  const [nowPlayingAlbumId, setNowPlayingAlbumId] = useState<string | null>(null);
  const [lockedAlbumId, setLockedAlbumId] = useState<string | null>(null);
  const ALBUM_DEMO_TOTAL_SECONDS = 30;

  const [nowPlayingTrackId, setNowPlayingTrackId] = useState<string | null>(null);
  const playedAlbumTracksThisSessionRef = useRef<Set<string>>(new Set());

  const [lockedAlbumTrackId, setLockedAlbumTrackId] = useState<string | null>(null);
  const [lockedSongId, setLockedSongId] = useState<string | null>(null);

  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);

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
    setNowPlayingAlbumId(null);
    setNowPlayingTrackId(null);
  };

  // -----------------------------
  // Load music + init audio + auth
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

      const albumsRes = await supabase
        .from("albums")
        .select("id,title,artist,release_date,cover_url,created_at")
        .order("release_date", { ascending: false, nullsFirst: false });

      if (albumsRes.error) {
        setError(albumsRes.error.message);
        setAlbums([]);
      } else {
        setAlbums((albumsRes.data as AlbumRow[]) ?? []);
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

  // -----------------------------------------
  // ✅ Fetch owned songs once per user session
  // -----------------------------------------
  useEffect(() => {
    let cancelled = false;

    const loadOwned = async () => {
      // 🧪 TEST MODE: pretend nothing is owned on reload
      if (TEST_RESET_OWNERSHIP_EACH_RELOAD) {
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
        .select("song_id")
        .eq("user_id", userId);

      if (cancelled) return;

      if (purchasesErr) {
        console.error("Failed to load user purchases:", purchasesErr);
        setOwnedSongIds(new Set());
        setLoadingOwned(false);
        return;
      }

      const ids = new Set<string>((data ?? []).map((r: any) => r.song_id).filter(Boolean));
      setOwnedSongIds(ids);
      setLoadingOwned(false);
    };

    void loadOwned();

    return () => {
      cancelled = true;
    };
  }, [userId]);
  const singles: SingleCard[] = useMemo(() => {
    const fallbackCover = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/900`;

    return songs
      .filter((s) => !s.album_id)
      .map((s) => {
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
        };
      });
  }, [songs]);

  const albumCards: AlbumCard[] = useMemo(() => {
    const fallbackCover = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/900`;

    const tracksByAlbum = new Map<string, SongRow[]>();
    for (const s of songs) {
      if (!s.album_id) continue;
      const arr = tracksByAlbum.get(s.album_id) ?? [];
      arr.push(s);
      tracksByAlbum.set(s.album_id, arr);
    }

    const cards: AlbumCard[] = albums.map((a) => {
      const year = a.release_date && a.release_date.length >= 4 ? a.release_date.slice(0, 4) : "—";
      const tracksRaw = tracksByAlbum.get(a.id) ?? [];

      const tracks = [...tracksRaw]
        .sort((x, y) => (x.track_number ?? 999) - (y.track_number ?? 999))
        .map((t) => ({
          id: t.id,
          title: t.title,
          priceCents: t.price_cents ?? 0,
          audioUrl: t.audio_url ?? null,
          trackNumber: t.track_number ?? null,
          releaseDate: t.release_date ?? null,
        }));

      const sumTracksCents = tracks.reduce((acc, t) => acc + (t.priceCents || 0), 0);
      const discountedAlbumCents = Math.round(sumTracksCents * 0.85);

      return {
        id: a.id,
        title: a.title,
        artist: a.artist || "Bliximstraat",
        year,
        coverUrl: a.cover_url || fallbackCover(a.title),
        releaseDate: a.release_date ?? null,
        albumPriceCents: discountedAlbumCents,
        tracks,
      };
    });

    return cards.filter((c) => c.tracks.length > 0);
  }, [albums, songs]);

  const albumById = useMemo(() => {
    const m = new Map<string, AlbumCard>();
    albumCards.forEach((a) => m.set(a.id, a));
    return m;
  }, [albumCards]);

  // ✅ Album is "owned" only if ALL its tracks are owned
  const albumOwnedIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of albumCards) {
      if (a.tracks.length > 0 && a.tracks.every((t) => ownedSongIds.has(t.id))) set.add(a.id);
    }
    return set;
  }, [albumCards, ownedSongIds]);

  // ✅ Song-only cart add (DB-backed)
  const addToCart = async (id: string, title: string, artist: string, priceCents: number, coverUrl: string | null) => {
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
    } catch (err: any) {
      showToast(err?.message || "Please sign in to add items to cart.");
    }
  };

  /**
   * ✅ Buy album (works even if cart supports only songs):
   * - Adds NON-OWNED tracks to cart
   * - Applies the 15% album discount by distributing discounted cents across tracks
   *   so the total matches albumPriceCents exactly.
   */
  const buyAlbum = async (album: AlbumCard) => {
    if (!album.tracks.length) {
      showToast("No tracks in this album yet.");
      return;
    }

    // If already owned, do nothing.
    if (albumOwnedIds.has(album.id)) return;

    // Only include tracks not owned (owned tracks shouldn't show "buy" options anyway)
    const buyable = album.tracks.filter((t) => !ownedSongIds.has(t.id));
    if (buyable.length === 0) {
      showToast("You already own all tracks in this album.");
      return;
    }

    // Compute original sum for buyable tracks
    const sumBuyable = buyable.reduce((acc, t) => acc + (t.priceCents || 0), 0);
    if (sumBuyable <= 0) {
      showToast("Album tracks have no pricing set.");
      return;
    }

    // Discounted total for buyable tracks:
    // If some tracks are already owned, we discount only the remaining ones.
    const discountedTotal = Math.round(sumBuyable * 0.85);

    // Distribute discountedTotal across tracks proportionally and fix rounding.
    const allocations = buyable.map((t) => ({
      track: t,
      cents: Math.floor(((t.priceCents || 0) / sumBuyable) * discountedTotal),
    }));

    let allocated = allocations.reduce((acc, a) => acc + a.cents, 0);
    let remainder = discountedTotal - allocated;

    // Add remaining cents to the first tracks to match exact total
    for (let i = 0; i < allocations.length && remainder > 0; i++) {
      allocations[i].cents += 1;
      remainder -= 1;
    }

    try {
      for (const a of allocations) {
        await addItem(
          {
            id: a.track.id,
            title: a.track.title,
            artist: album.artist,
            price: (a.cents || 0) / 100, // discounted per-track price
            coverUrl: album.coverUrl ?? undefined,
          },
          1
        );
      }
      showToast(`Album added to cart (discount applied).`);
    } catch (err: any) {
      showToast(err?.message || "Please sign in to add items to cart.");
    }
  };

  // ------------------
  // Owned full playback
  // ------------------
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
    setLockedAlbumId(null);
    setLockedAlbumTrackId(null);
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
    } catch {
      showToast("Playback blocked. Click again, or check audio URL access.");
      stopAllAudio();
    }
  };

  // ------------------
  // Single demo logic
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
      showToast("No audio uploaded for this single yet.");
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
    setLockedAlbumId(null);
    setLockedAlbumTrackId(null);
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

  // ------------------
  // Album demo-mix used on grid cards
  // ------------------
  const stopAlbumDemo = () => {
    if (nowPlayingAlbumId) stopAllAudio();
  };

  const showAlbumGate = (albumId: string) => {
    stopAllAudio();
    setLockedAlbumId(albumId);
  };

  const playAlbumDemoMix = async (album: AlbumCard) => {
    if (!album.tracks.length) {
      showToast("No tracks in this album yet.");
      return;
    }

    if (nowPlayingAlbumId === album.id) {
      stopAlbumDemo();
      return;
    }

    setLockedSongId(null);
    setLockedAlbumId(null);
    setLockedAlbumTrackId(null);
    stopAllAudio();

    const playable = album.tracks.filter((t) => !!t.audioUrl);
    if (!playable.length) {
      showToast("No audio uploaded for this album yet.");
      return;
    }

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    let idx = 0;
    let startedAt = Date.now();

    const playTrackSlice = async (trackIndex: number) => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, ALBUM_DEMO_TOTAL_SECONDS - elapsed);
      if (remaining <= 0) {
        showAlbumGate(album.id);
        return;
      }

      const t = playable[trackIndex];
      if (!t?.audioUrl) {
        showAlbumGate(album.id);
        return;
      }

      audio.onended = () => {
        idx = (idx + 1) % playable.length;
        playTrackSlice(idx).catch(() => {
          showToast("Album demo failed to play next track.");
          showAlbumGate(album.id);
        });
      };

      audio.onerror = () => {
        showToast("Audio failed to load for an album track.");
        showAlbumGate(album.id);
      };

      try {
        audio.src = t.audioUrl;
        audio.currentTime = 0;
        await audio.play();
        setNowPlayingAlbumId(album.id);

        demoSeekTimerRef.current = window.setTimeout(() => {
          const dur = audio.duration;
          if (Number.isFinite(dur) && dur > 20) {
            const start = Math.min(Math.max(0, (Date.now() / 1000) % (dur - 10)), dur - 10);
            try {
              audio.currentTime = start;
            } catch {}
          }
        }, 200);

        clearAllTimers();
        demoStopTimerRef.current = window.setTimeout(() => {
          showAlbumGate(album.id);
        }, remaining * 1000);
      } catch {
        showToast("Playback blocked. Click play demo first.");
        stopAllAudio();
      }
    };

    startedAt = Date.now();
    idx = 0;
    await playTrackSlice(idx);
  };

  // ------------------
  // Album modal track purchase gate
  // ------------------
  const showPurchaseGateForAlbumTrack = (trackId: string) => {
    stopAllAudio();
    setLockedAlbumTrackId(trackId);
    showToast("To continue listening, please purchase this song.");
  };

  // ------------------
  // Track demo logic INSIDE album modal (once per reload)
  // ------------------
  const playAlbumTrackDemo = async (track: AlbumCard["tracks"][number]) => {
    if (!track.audioUrl) {
      showToast("No audio uploaded for this track yet.");
      return;
    }

    if (nowPlayingTrackId === track.id) {
      stopAllAudio();
      return;
    }

    if (playedAlbumTracksThisSessionRef.current.has(track.id)) {
      showToast("Demo already played for this track. Reload the page to play it again.");
      return;
    }

    setLockedSongId(null);
    setLockedAlbumId(null);
    setLockedAlbumTrackId(null);
    stopAllAudio();

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    audio.onended = () => showPurchaseGateForAlbumTrack(track.id);
    audio.onerror = () => {
      showToast("Audio failed to load. Check bucket access / URL.");
      stopAllAudio();
    };

    try {
      audio.src = track.audioUrl;
      audio.currentTime = 0;
      await audio.play();
      setNowPlayingTrackId(track.id);

      playedAlbumTracksThisSessionRef.current.add(track.id);

      demoSeekTimerRef.current = window.setTimeout(() => {
        const dur = audio.duration;
        if (Number.isFinite(dur) && dur > SINGLE_DEMO_SECONDS + 2) {
          const maxStart = Math.max(0, dur - SINGLE_DEMO_SECONDS);
          const start = (Date.now() / 1000) % maxStart;
          try {
            audio.currentTime = start;
          } catch {}
        }
      }, 200);

      clearAllTimers();
      demoStopTimerRef.current = window.setTimeout(() => {
        showPurchaseGateForAlbumTrack(track.id);
      }, SINGLE_DEMO_SECONDS * 1000);
    } catch {
      showToast("Playback blocked. Click again, or check audio URL access.");
      stopAllAudio();
    }
  };

  const openAlbum = (id: string) => {
    setOpenAlbumId(id);
    setLockedAlbumId(null);
    setLockedAlbumTrackId(null);
  };

  const closeAlbum = () => {
    setOpenAlbumId(null);
    setLockedAlbumTrackId(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAlbum();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeAlbum = openAlbumId ? albumById.get(openAlbumId) : null;

  const modalWhiteBtn =
    "rounded-xl border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90";
  const modalWhiteBtnSm =
    "rounded-xl border border-white/20 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-white/90";
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
                  Albums and singles. Like it should’ve been from day one.
                </p>

                {TEST_RESET_OWNERSHIP_EACH_RELOAD && (
                  <div className="mt-2 text-xs text-yellow-200/80">
                    Test mode: ownership reset on reload (ignoring purchases)
                  </div>
                )}

                {loadingOwned && <div className="mt-2 text-xs text-white/50">Checking owned songs…</div>}
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

            {/* TABS */}
            <div className="mt-8 border-b border-white/10">
              <div className="flex gap-6 text-sm overflow-x-auto whitespace-nowrap pr-2 [-webkit-overflow-scrolling:touch]">
                <a href="#albums" className="py-3 text-white/85 hover:text-white shrink-0">
                  Albums
                </a>
                <a href="#singles" className="py-3 text-white/85 hover:text-white shrink-0">
                  Singles
                </a>
                <a href="#embeds" className="py-3 text-white/85 hover:text-white shrink-0">
                  Embeds
                </a>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                Failed to load music: {error}
              </div>
            )}

            {/* ALBUMS */}
            <section id="albums" className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">Albums</h2>
                <div className="text-sm text-white/60">
                  {loading ? "Loading…" : `${albumCards.length} album${albumCards.length === 1 ? "" : "s"}`}
                </div>
              </div>

              {!loading && !error && albumCards.length === 0 && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm p-6 text-white/70">
                  No albums found yet. Create one in the Admin panel.
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {albumCards.map((a) => {
                  const isAlbumOwned = albumOwnedIds.has(a.id);

                  return (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden"
                    >
                      <div className="group relative w-full aspect-square overflow-hidden">
                        <img
                          src={a.coverUrl}
                          alt={`${a.title} cover`}
                          className="h-full w-full object-cover transition duration-300 md:group-hover:scale-[1.02]"
                          loading="lazy"
                        />

                        {/* ✅ Album owned overlay */}
                        {isAlbumOwned && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                            <div className="rounded-2xl bg-black/55 backdrop-blur-md border border-white/10 shadow-lg px-4 py-3">
                              <img
                                src={albumOwnedBadge}
                                alt="Album owned"
                                className="h-32 sm:h-40 md:h-48 w-auto object-contain select-none opacity-95"
                              />
                            </div>
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex gap-2 text-[11px] sm:text-xs z-30">
                          <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15">Album</span>
                          <span className="px-2 py-1 rounded-full bg-black/40 border border-white/10">{a.year}</span>
                        </div>

                        {/* Hover overlay (ONLY on md+). */}
                        <div className="pointer-events-none absolute inset-0 bg-black/60 opacity-0 transition duration-200 md:group-hover:opacity-100 z-10" />

                        {/* Controls */}
                        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition duration-200">
                          <button
                            type="button"
                            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                            onClick={() => openAlbum(a.id)}
                          >
                            Go to album
                          </button>

                          <div className="mt-2 flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                              onClick={(e) => {
                                e.stopPropagation();
                                playAlbumDemoMix(a);
                              }}
                            >
                              {nowPlayingAlbumId === a.id ? "Stop demo" : "Play album demo"}
                            </button>

                            {!isAlbumOwned && (
                              <button
                                type="button"
                                className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void buyAlbum(a);
                                }}
                                title="Adds all tracks with the album discount applied."
                              >
                                Buy album
                              </button>
                            )}
                          </div>

                          <div className="mt-2 text-[11px] text-white/65">
                            Demo-mix up to {ALBUM_DEMO_TOTAL_SECONDS}s • {a.tracks.length} track
                            {a.tracks.length === 1 ? "" : "s"}
                          </div>
                        </div>

                        {lockedAlbumId === a.id && (
                          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 sm:p-5">
                            <div className="w-full rounded-2xl border border-white/15 bg-black/80 backdrop-blur-sm p-4 text-center">
                              <div className="text-lg font-bold">Keep listening?</div>
                              <div className="mt-2 text-sm text-white/70">Demo ended. Want the full album tracks?</div>

                              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                <button
                                  type="button"
                                  className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                                  onClick={() => openAlbum(a.id)}
                                >
                                  Go to album
                                </button>

                                <button
                                  type="button"
                                  className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                                  onClick={() => setLockedAlbumId(null)}
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Album info strip */}
                      <div className="p-4">
                        <div className="text-base sm:text-lg font-semibold leading-tight">{a.title}</div>
                        <div className="text-sm text-white/60">{a.artist}</div>

                        <div className="mt-3 flex items-center justify-between text-sm gap-3">
                          <div className="font-semibold">{formatZar(a.albumPriceCents)}</div>
                          <div className="text-white/60">{formatReleaseDate(a.releaseDate)}</div>
                        </div>

                        <div className="mt-1 text-[11px] text-white/55">Album price shown (sum − 15%).</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SINGLES */}
            <section id="singles" className="mt-14">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">Singles</h2>
                <div className="text-sm text-white/60">
                  {loading ? "Loading…" : `${singles.length} single${singles.length === 1 ? "" : "s"}`}
                </div>
              </div>

              {!loading && !error && singles.length === 0 && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm p-6 text-white/70">
                  No singles found yet.
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

                        {/* ✅ OWNED overlay */}
                        {isSongOwned && (
                          <div className="absolute inset-0 z-20">
                            <div className="absolute inset-0 bg-black/35 backdrop-blur-sm rounded-[inherit]" />
                            <img
                              src={songOwnedBadge}
                              alt="Song owned"
                              className="absolute inset-0 w-full h-full object-contain scale-[1.2] select-none opacity-95 pointer-events-none"
                            />
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex gap-2 text-[11px] sm:text-xs z-30">
                          <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15">Single</span>
                          <span className="px-2 py-1 rounded-full bg-black/40 border border-white/10">{r.year}</span>
                        </div>

                        <div className="pointer-events-none absolute inset-0 bg-black/60 opacity-0 transition duration-200 md:group-hover:opacity-100 z-10" />

                        {/* ✅ Cover controls ONLY for NOT-owned songs
                            (This fixes your earlier request: no “Play now” button over owned overlay + no small text) */}
                        {!isSongOwned && (
                          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition duration-200">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                type="button"
                                className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                                onClick={() => playSingleDemo(r)}
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
                          </div>
                        )}

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
                        <div className="text-base sm:text-lg font-semibold leading-tight">{r.title}</div>
                        <div className="text-sm text-white/60">{r.artist}</div>

                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          {isSongOwned ? (
                            <button
                              type="button"
                              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                              onClick={() => void playOwnedSingle(r)}
                            >
                              {nowPlayingSingleId === r.id ? "Stop" : "Play now"}
                            </button>
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

            {/* EMBEDS */}
            <section id="embeds" className="mt-14">
              <h2 className="text-lg sm:text-xl font-semibold">Embeds</h2>

              <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-4">
                  <div className="font-semibold mb-3">Spotify</div>
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <iframe
                      title="Spotify Embed"
                      src="https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl"
                      width="100%"
                      height="352"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-4">
                  <div className="font-semibold mb-3">Apple Music</div>
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <iframe
                      title="Apple Music Embed"
                      src="https://embed.music.apple.com/us/album/shape-of-you/1193701079?i=1193701359"
                      width="100%"
                      height="352"
                      frameBorder="0"
                      allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-4">
                  <div className="font-semibold mb-3">YouTube</div>
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <iframe
                      title="YouTube Embed"
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                      width="100%"
                      height="352"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>

      {/* ALBUM MODAL */}
      {activeAlbum && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAlbum();
          }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

          <div className="relative w-full max-w-3xl max-h-[88vh] rounded-2xl border border-white/15 bg-black/85 backdrop-blur-xl overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-black truncate">{activeAlbum.title}</div>
                <div className="text-white/60 mt-1">{activeAlbum.artist}</div>
                <div className="mt-2 text-sm text-white/75 font-semibold">
                  Album price: {formatZar(activeAlbum.albumPriceCents)}{" "}
                  <span className="text-white/50">(sum − 15%)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {!albumOwnedIds.has(activeAlbum.id) && (
                  <button type="button" className={`w-full sm:w-auto ${modalWhiteBtn}`} onClick={() => void buyAlbum(activeAlbum)}>
                    Buy album
                  </button>
                )}
                <button type="button" className={`w-full sm:w-auto ${modalWhiteBtn}`} onClick={closeAlbum}>
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-square w-full">
                  <img src={activeAlbum.coverUrl} alt="Album cover" className="h-full w-full object-cover" />
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-white/60">
                    {activeAlbum.tracks.length} track{activeAlbum.tracks.length === 1 ? "" : "s"} • Release:{" "}
                    {formatReleaseDate(activeAlbum.releaseDate)}
                  </div>

                  <div className="divide-y divide-white/10 rounded-2xl border border-white/10 overflow-hidden">
                    {activeAlbum.tracks.map((t) => {
                      const isTrackOwned = ownedSongIds.has(t.id);

                      return (
                        <div
                          key={t.id}
                          className="p-4 bg-black/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold truncate text-white">
                              {t.trackNumber ? `${t.trackNumber}. ` : ""}
                              {t.title}
                              {isTrackOwned && <span className="ml-2 text-xs text-white/60">(Owned)</span>}
                            </div>
                            <div className="text-xs text-white/60">
                              {formatZar(t.priceCents)} • {formatReleaseDate(t.releaseDate)}
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <button type="button" className={modalWhiteBtnSm} onClick={() => playAlbumTrackDemo(t)}>
                              {nowPlayingTrackId === t.id ? "Stop demo" : "Play demo"}
                            </button>

                            {/* ✅ If track is owned, hide buy option */}
                            {!isTrackOwned && (
                              <button
                                type="button"
                                className={modalWhiteBtnSm}
                                onClick={() =>
                                  void addToCart(t.id, t.title, activeAlbum.artist, t.priceCents, activeAlbum.coverUrl)
                                }
                              >
                                Add to cart
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-xs text-white/50">
                    Note: This modal is your “album page” without adding routes yet.
                  </div>
                </div>
              </div>
            </div>

            {lockedAlbumTrackId && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-5">
                <div className="absolute inset-0 bg-black/70" />
                <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-black/85 backdrop-blur-xl p-5 text-center">
                  <div className="text-lg font-bold">Keep listening?</div>
                  <div className="mt-2 text-sm text-white/70">To continue listening, please purchase this song.</div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      className={`flex-1 ${modalWhiteBtn}`}
                      onClick={() => {
                        const t = activeAlbum.tracks.find((x) => x.id === lockedAlbumTrackId);
                        if (!t) {
                          setLockedAlbumTrackId(null);
                          return;
                        }
                        if (ownedSongIds.has(t.id)) {
                          setLockedAlbumTrackId(null);
                          return;
                        }
                        void addToCart(t.id, t.title, activeAlbum.artist, t.priceCents, activeAlbum.coverUrl);
                        setLockedAlbumTrackId(null);
                      }}
                    >
                      Add to cart
                    </button>

                    <button
                      type="button"
                      className={`flex-1 ${modalWhiteBtn}`}
                      onClick={() => setLockedAlbumTrackId(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
