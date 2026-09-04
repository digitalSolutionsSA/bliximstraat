import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import VideoBackground from "../components/layout/VideoBackground";
import { SONGS, hasVideo } from "../data/songs";
import type { Song } from "../data/songs";

// ── Types ─────────────────────────────────────────────────────────────────────

type ReleaseType = "Single" | "Album";

type Release = {
  id: string;
  title: string;
  type: ReleaseType;
  year: string;
  cover: string | undefined;
  youtubeUrl: string;
  tracks: Song[];
};

type FilterTab = "Singles" | "Albums";

// ── Build releases list ───────────────────────────────────────────────────────

function useReleases(songs: Song[]): Release[] {
  return useMemo(() => {
    const releases: Release[] = [];
    const albumMap = new Map<string, Song[]>();
    const albumOrder: string[] = [];

    for (const song of songs) {
      if (song.album) {
        if (!albumMap.has(song.album)) {
          albumOrder.push(song.album);
          albumMap.set(song.album, []);
        }
        albumMap.get(song.album)!.push(song);
      } else {
        releases.push({
          id: song.id,
          title: song.title,
          type: "Single",
          year: song.year,
          cover: song.coverUrl,
          youtubeUrl: song.youtubeUrl,
          tracks: [song],
        });
      }
    }

    for (const albumName of albumOrder) {
      const tracks = albumMap.get(albumName)!;
      releases.push({
        id: `album-${albumName}`,
        title: albumName,
        type: "Album",
        year: tracks[0].year,
        cover: tracks[0].coverUrl,
        youtubeUrl: tracks[0].albumUrl ?? tracks.find(s => hasVideo(s))?.youtubeUrl ?? YT_CHANNEL,
        tracks,
      });
    }

    // newest first by year
    return releases.sort((a, b) => Number(b.year) - Number(a.year));
  }, [songs]);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const YT_CHANNEL = "https://www.youtube.com/channel/UCaRgHj3J8RjDuS_eyZXdepA";

const PLATFORMS = [
  {
    label: "Spotify",
    href: "https://open.spotify.com/artist/0Ch8nVFZCWFF95IXTcgLgT",
    color: "#1DB954",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
  },
  {
    label: "Apple Music",
    href: "https://music.apple.com/us/artist/blixim-straat/1761419580",
    color: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: YT_CHANNEL,
    color: "#FF0000",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@bliximstraat",
    color: "#fff",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
      </svg>
    ),
  },
];

// ── Animation CSS ─────────────────────────────────────────────────────────────

const ANIM_CSS = `
@keyframes cardFadeIn {
  from { opacity:0; transform:scale(0.95) translateY(8px); filter:blur(6px); }
  to   { opacity:1; transform:scale(1) translateY(0);      filter:none; }
}
.card-in { animation: cardFadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
`;

// ── Hover backdrop — crossfades to the hovered release's cover art ────────────

function HoverBackdrop({ src }: { src: string | null }) {
  const [layers, setLayers] = useState<[string | null, string | null]>([null, null]);
  const [active, setActive] = useState<0 | 1>(0);

  useEffect(() => {
    if (!src) return;
    setLayers(prev => {
      const next: [string | null, string | null] = [...prev];
      next[active === 0 ? 1 : 0] = src;
      return next;
    });
    setActive(a => (a === 0 ? 1 : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <>
      {[0, 1].map(i => (
        <div
          key={i}
          className="fixed inset-0 z-[1] pointer-events-none transition-opacity duration-300 ease-out"
          style={{
            backgroundImage: layers[i] ? `url(${layers[i]})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: src && active === i ? 0.95 : 0,
            filter: "blur(6px) saturate(1.35) brightness(0.9)",
            transform: "scale(1.08)",
          }}
        />
      ))}
    </>
  );
}

// ── Release Card ──────────────────────────────────────────────────────────────

function ReleaseCard({ release, isActive }: { release: Release; isActive: boolean }) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 select-none"
      style={{
        background: "rgba(20,12,30,0.95)",
        border: `1px solid ${isActive ? "rgba(255,0,144,0.3)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: isActive ? "0 0 60px rgba(255,0,144,0.15), 0 20px 60px rgba(0,0,0,0.6)" : "0 8px 30px rgba(0,0,0,0.5)",
        transform: isActive ? "translateY(-4px)" : "none",
      }}
    >
      {/* Cover art */}
      <div className="relative w-full aspect-square overflow-hidden">
        {release.cover ? (
          <a href={release.youtubeUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
            <img src={release.cover} alt={release.title}
              className="w-full h-full object-cover block cursor-pointer hover:opacity-80 transition-opacity duration-200" draggable={false} />
          </a>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="text-7xl text-white/10">♪</span>
          </div>
        )}

        {/* Type badge */}
        <span
          className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] rounded-full"
          style={{ background: "rgba(255,0,144,0.25)", border: "1px solid rgba(255,0,144,0.4)", color: "#FF0090" }}
        >
          {release.type}
        </span>
      </div>

      {/* Info below cover */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-base font-bold text-white leading-tight truncate mb-0.5">{release.title}</h3>
        <p className="text-xs text-white/40 mb-3">{release.year}</p>

        {/* Small circular streaming icons */}
        <div className="flex items-center gap-2">
          {PLATFORMS.slice(0, 3).map(p => (
            <a key={p.label} href={p.label === "YouTube" ? release.youtubeUrl : p.href}
              target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110"
              style={{ background: "rgba(255,255,255,0.08)", color: p.color, border: "1px solid rgba(255,255,255,0.1)" }}
              aria-label={p.label}
            >
              <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                {p.icon}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Album track list — only shown on album cards */}
      {release.type === "Album" && release.tracks.length > 0 && (
        <>
          <div className="mx-4 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="px-3 py-2">
            {release.tracks.map((song, i) => (
              <a
                key={song.id}
                href={hasVideo(song) ? song.youtubeUrl : YT_CHANNEL}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 px-2 py-1 rounded-md transition-colors"
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = ""; }}
              >
                <span className="shrink-0 w-4 text-right tabular-nums"
                  style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>{i + 1}</span>
                <span className="flex-1 truncate group-hover:text-white/90 transition-colors"
                  style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>{song.title}</span>
                {hasVideo(song)
                  ? <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ fontSize: "9px", color: "#FF3B3B" }}>▶</span>
                  : <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.18)" }}>·</span>
                }
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Music() {
  const allReleases = useReleases(SONGS);
  const [filter,   setFilter]   = useState<FilterTab | null>(null);
  const [search,   setSearch]   = useState("");
  const [hovered,  setHovered]  = useState<Release | null>(null);

  const filtered = useMemo(() => {
    let list = allReleases;
    if (filter === "Singles") list = list.filter(r => r.type === "Single");
    if (filter === "Albums")  list = list.filter(r => r.type === "Album");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q));
    }
    return list;
  }, [allReleases, filter, search]);

  const counts = useMemo(() => ({
    Singles: allReleases.filter(r => r.type === "Single").length,
    Albums:  allReleases.filter(r => r.type === "Album").length,
  }), [allReleases]);

  const TABS: FilterTab[] = ["Singles", "Albums"];

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "#080508" }}>
      <VideoBackground overlay={0.88} />

      <HoverBackdrop src={hovered?.cover ?? null} />

      {/* Subtle top-right radial glow */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 90% 0%, rgba(255,0,144,0.08) 0%, transparent 60%)" }} />

      <div className="relative z-10 flex flex-col min-h-screen text-white">
        <Navbar overlayOnHome={false} />

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-6 py-14">

            {/* ── Hero header ── */}
            <div className="flex items-start justify-between mb-12">
              <div>
                <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.35em] mb-5"
                  style={{ color: "#FF0090" }}>
                  <span className="inline-block w-8 h-px" style={{ background: "#FF0090" }} />
                  Full Catalogue
                </p>
                <h1 className="leading-none font-black uppercase">
                  <span className="block text-6xl md:text-8xl text-white" style={{ letterSpacing: "-0.02em" }}>THE</span>
                  <span className="block text-6xl md:text-8xl italic" style={{ letterSpacing: "-0.02em", color: "#FF0090" }}>MUSIC</span>
                </h1>
              </div>

              {/* Platform links — right side */}
              <div className="hidden md:flex flex-col gap-2 mt-2">
                {PLATFORMS.map(p => (
                  <a key={p.label} href={p.href} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:brightness-125"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: p.color, minWidth: "180px" }}
                  >
                    <span className="shrink-0">{p.icon}</span>
                    {p.label}
                  </a>
                ))}
              </div>
            </div>

            {/* ── Latest Release banner ── */}
            <div
              className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6 rounded-2xl overflow-hidden mb-16"
              style={{ background: "rgba(20,10,28,0.9)", border: "1px solid rgba(255,0,144,0.2)", boxShadow: "0 0 80px rgba(255,0,144,0.08)" }}
            >
              {/* Cover */}
              <div className="shrink-0 w-40 h-40 sm:w-52 sm:h-52 overflow-hidden">
                <img src="/covers/lente.jpeg" alt="Lente In Jou Oë"
                  className="w-full h-full object-cover block" />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-center px-4 sm:px-8 py-6 sm:py-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: "#FF0090" }}>
                  ✦ Latest Release
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1">
                  Lente In Jou Oë
                </h2>
                <p className="text-sm text-white/40 mb-5">Album &nbsp;·&nbsp; 2026</p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.slice(0, 3).map(p => (
                    <a key={p.label} href={p.label === "YouTube" ? "https://youtu.be/VJNQUzuFOrg" : p.href} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-200 hover:brightness-125"
                      style={{ background: "rgba(255,255,255,0.07)", color: p.color, border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{p.icon}</span>
                      {p.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Filter tabs + search ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-1">
                {TABS.map(tab => (
                  <button key={tab}
                    onClick={() => setFilter(f => (f === tab ? null : tab))}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-200 relative"
                    style={{ color: filter === tab ? "#fff" : "rgba(255,255,255,0.4)" }}
                  >
                    {tab}
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                      style={{
                        background: filter === tab ? "#FF0090" : "rgba(255,255,255,0.12)",
                        color: filter === tab ? "#fff" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {counts[tab]}
                    </span>
                    {filter === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#FF0090" }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 text-sm text-white/70 placeholder-white/25 rounded-full outline-none transition-all duration-200 focus:ring-1"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", width: "180px" }}
                />
              </div>
            </div>

            {/* Count + sort line */}
            <div className="flex items-center justify-between mb-10 text-[11px] uppercase tracking-[0.18em] text-white/30">
              <span>Showing <strong className="text-white/60">{filtered.length}</strong> of <strong className="text-white/60">{allReleases.length}</strong> releases</span>
              <span>Newest First</span>
            </div>

            {/* ── Grid ── */}
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-white/25 text-sm">No releases found.</div>
            ) : (
              <>
                <style>{ANIM_CSS}</style>

                <div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5"
                  onMouseLeave={() => setHovered(null)}
                >
                  {filtered.map((release, i) => (
                    <div
                      key={release.id}
                      className="card-in"
                      style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
                      onMouseEnter={() => setHovered(release)}
                      onFocus={() => setHovered(release)}
                    >
                      <ReleaseCard release={release} isActive={hovered?.id === release.id} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
