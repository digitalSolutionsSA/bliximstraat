import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { SONGS } from "../../data/songs";

// ── UPDATE STREAMING NUMBERS HERE ────────────────────────────────────────────
const STREAMING_DATA = [
  { platform: "YouTube",     raw: 15,  suffix: "M+", label: "Total Views",   color: "#FF3B3B" },
  { platform: "Spotify",     raw: 10,  suffix: "M+", label: "Streams",       color: "#1DB954" },
  { platform: "Apple Music", raw: 2,   suffix: "M+", label: "Streams",       color: "#FF6B81" },
  { platform: "TikTok",      raw: 5,   suffix: "M+", label: "Views",         color: "#69C9D0" },
];

function deriveAlbumCount() {
  const seen = new Set<string>();
  SONGS.forEach(s => { if (s.album) seen.add(s.album); });
  return seen.size;
}

// ── Platform logo SVGs ────────────────────────────────────────────────────────

function YouTubeLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#FF3B3B" />
      <path d="M37.8 18.6a4 4 0 00-2.8-2.8C32.6 15 24 15 24 15s-8.6 0-11 .8a4 4 0 00-2.8 2.8C9.4 21 9.4 24 9.4 24s0 3 .8 5.4a4 4 0 002.8 2.8C15.4 33 24 33 24 33s8.6 0 11-.8a4 4 0 002.8-2.8c.8-2.4.8-5.4.8-5.4s0-3-.8-5.4z" fill="white" />
      <path d="M21 28l7-4-7-4v8z" fill="#FF3B3B" />
    </svg>
  );
}

function SpotifyLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="24" fill="#1DB954" />
      <path d="M33 21.5c-5.5-3.3-14.5-3.6-19.8-2-.8.2-1.7-.3-1.9-1.1-.2-.8.3-1.7 1.1-1.9 6-1.8 16-.5 22.4 2.3.8.4 1.1 1.3.7 2.1-.4.7-1.3 1-2.1.6h-.4z" fill="white" />
      <path d="M32.3 25.6c-.4.6-1.1.9-1.7.5-4.6-2.8-11.6-3.6-17-.2-.7.4-1.5.1-1.9-.5-.4-.7-.1-1.5.5-1.9 6.2-3.8 14-.9 19.3 2.6.6.4.8 1.2.4 1.8l.4-.3z" fill="white" />
      <path d="M31.5 29.6c-.3.5-.9.7-1.4.4-4-2.4-9-3-14.8-1.6-.6.1-1.1-.2-1.3-.8-.1-.6.2-1.1.8-1.3 6.4-1.5 12 -.8 16.4 1.9.5.3.7.9.3 1.4z" fill="white" />
    </svg>
  );
}

function AppleMusicLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="am-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FC5C7D" />
          <stop offset="1" stopColor="#9B2335" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#am-grad)" />
      <path
        d="M32 14H22a2 2 0 00-2 2v1l12-3v13.5A4.5 4.5 0 1130 32V21l-10 2.5V34a4 4 0 11-2-3.5V18a2 2 0 012-2h12a2 2 0 012 2v.5L32 14z"
        fill="white"
      />
    </svg>
  );
}

function TikTokLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#010101" />
      <path
        d="M30 10h-4v19a5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5c.5 0 1 .07 1.5.2V20a9 9 0 00-1.5-.12 9 9 0 00-9 9 9 9 0 009 9 9 9 0 009-9V19.5A14.5 14.5 0 0034 21v-4a10.5 10.5 0 01-4-7z"
        fill="white"
      />
      <path
        d="M32 10h-2v19a5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5c.5 0 1 .07 1.5.2V20a9 9 0 00-1.5-.12"
        stroke="#69C9D0"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
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

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      setVal(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, target, durationMs]);

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
          fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-2 relative">

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
