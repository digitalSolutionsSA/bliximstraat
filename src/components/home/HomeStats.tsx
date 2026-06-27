import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { SONGS } from "../../data/songs";

// ── UPDATE STREAMING NUMBERS HERE ────────────────────────────────────────────
const STREAMING_DATA = [
  { platform: "YouTube",     raw: 16.5, suffix: "M+", label: "Total Views",   color: "#FF3B3B" },
  { platform: "Spotify",     raw: 11.9, suffix: "M+", label: "Streams",       color: "#1DB954" },
  { platform: "Apple Music", raw: 2.1,  suffix: "M+", label: "Streams",       color: "#FF6B81" },
  { platform: "TikTok",      raw: 5,    suffix: "M+", label: "Views",         color: "#69C9D0" },
];

function deriveAlbumCount() {
  const seen = new Set<string>();
  SONGS.forEach(s => { if (s.album) seen.add(s.album); });
  return seen.size;
}

// ── Platform logos ────────────────────────────────────────────────────────────

function YouTubeLogo({ size = 36 }: { size?: number }) {
  return <img src="/socials/yt.png" alt="YouTube" width={size} height={size} style={{ objectFit: "contain" }} />;
}

function SpotifyLogo({ size = 36 }: { size?: number }) {
  return <img src="/socials/spotify.png" alt="Spotify" width={size} height={size} style={{ objectFit: "contain" }} />;
}

function AppleMusicLogo({ size = 36 }: { size?: number }) {
  return <img src="/socials/apple.png" alt="Apple Music" width={size} height={size} style={{ objectFit: "contain" }} />;
}

function TikTokLogo({ size = 36 }: { size?: number }) {
  return <img src="/socials/tktk.png" alt="TikTok" width={size} height={size} style={{ objectFit: "contain" }} />;
}

function SongsIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <path d="M31 14v16a5 5 0 11-2-4V18l-8 2v12a5 5 0 11-2-4V13l12-3v4z" fill="white" opacity="0.8" />
    </svg>
  );
}

function AlbumIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <circle cx="24" cy="24" r="10" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />
      <circle cx="24" cy="24" r="3" fill="white" opacity="0.8" />
      <circle cx="24" cy="24" r="6" stroke="white" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  );
}

// ── Count-up hook ─────────────────────────────────────────────────────────────

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

function useCountUp(target: number, inView: boolean, durationMs = 1800) {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number>(0);
  const hasDecimal = !Number.isInteger(target);

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const current = target * easeOutCubic(progress);
      setVal(hasDecimal ? parseFloat(current.toFixed(1)) : Math.round(current));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, target, durationMs, hasDecimal]);

  return val;
}

// ── Single stat block ─────────────────────────────────────────────────────────

type StatDef = {
  platform: string;
  raw: number;
  suffix: string;
  label: string;
  color: string;
  logo: React.ReactNode;
};

function StatBlock({ stat, inView, index }: { stat: StatDef; inView: boolean; index: number }) {
  const count = useCountUp(stat.raw, inView, 1600 + index * 120);

  return (
    <div
      className="flex flex-col items-center text-center gap-3 px-4 py-2"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s ease ${index * 80}ms`,
      }}
    >
      {/* Logo */}
      <div className="mb-1">{stat.logo}</div>

      {/* Number */}
      <div
        className="font-thin tracking-tight leading-none"
        style={{
          fontSize: "clamp(1.8rem, 3.2vw, 3.2rem)",
          color: stat.color,
          textShadow: `0 0 40px ${stat.color}55`,
        }}
      >
        {count}{stat.suffix}
      </div>

      {/* Platform name */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60">
          {stat.platform}
        </span>
        <span className="text-[9px] text-white/30 uppercase tracking-[0.18em]">
          {stat.label}
        </span>
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export default function HomeStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  const songCount  = SONGS.length;
  const albumCount = deriveAlbumCount();

  const ALL: StatDef[] = [
    { ...STREAMING_DATA[0], logo: <YouTubeLogo size={44} /> },
    { ...STREAMING_DATA[1], logo: <SpotifyLogo size={44} /> },
    { ...STREAMING_DATA[2], logo: <AppleMusicLogo size={44} /> },
    { ...STREAMING_DATA[3], logo: <TikTokLogo size={44} /> },
    { platform: "Songs",  raw: songCount,  suffix: "", label: "Released", color: "#ffffff", logo: <SongsIcon size={44} /> },
    { platform: "Albums", raw: albumCount, suffix: "", label: "Released", color: "#ffffff", logo: <AlbumIcon size={44} /> },
  ];

  return (
    <section
      ref={sectionRef}
      style={{
        background: "linear-gradient(to bottom, rgba(0,0,0,0.97), rgba(8,0,12,1))",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Top accent line */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,0,144,0.5), rgba(0,212,255,0.4), transparent)" }} />

      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">

        {/* Section label */}
        <div
          className="text-center mb-12"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-white/30">
            By the numbers
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-4 relative">

          {/* Vertical dividers (desktop only) */}
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="hidden lg:block absolute top-0 bottom-0"
              style={{
                left: `${(i / 6) * 100}%`,
                width: 1,
                background: "rgba(255,255,255,0.06)",
              }}
            />
          ))}

          {ALL.map((stat, i) => (
            <StatBlock key={stat.platform} stat={stat} inView={inView} index={i} />
          ))}
        </div>
      </div>

      {/* Bottom accent line */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.4), rgba(255,0,144,0.5), transparent)" }} />
    </section>
  );
}
