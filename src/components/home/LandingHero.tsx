import Navbar from "../layout/Navbar";
import PageContainer from "../layout/PageContainer";
import { SONGS } from "../../data/songs";

// The first song in the array is always the latest release
const LATEST = SONGS[0];

function LatestReleaseCard() {
  return (
    <a
      href={LATEST.youtubeUrl}
      target="_blank"
      rel="noreferrer"
      className="group block w-72 sm:w-80 shrink-0 rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.22)";
        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.10)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)";
      }}
    >
      {/* Badge */}
      <div className="px-4 pt-4 pb-2">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-[0.2em]"
          style={{ background: "rgba(255,0,144,0.18)", color: "#FF0090", border: "1px solid rgba(255,0,144,0.25)" }}
        >
          <span className="h-1 w-1 rounded-full bg-current animate-pulse" />
          Latest Release
        </span>
      </div>

      {/* Cover art */}
      <div className="relative mx-4 rounded-xl overflow-hidden aspect-square">
        {LATEST.coverUrl ? (
          <img
            src={LATEST.coverUrl}
            alt={LATEST.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
            <span className="text-4xl text-white/20">♪</span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
            <span className="text-black text-xs ml-0.5">▶</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-3 pb-4">
        <p className="text-sm font-medium text-white leading-tight line-clamp-2">{LATEST.title}</p>
        <p className="mt-0.5 text-[11px] text-white/45">{LATEST.artist}</p>
        {LATEST.album && (
          <p className="mt-0.5 text-[10px] text-white/30 truncate">{LATEST.album}</p>
        )}
        <div
          className="mt-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.15em] text-white/50 group-hover:text-white transition-colors"
        >
          <span>Listen now</span>
          <span>&rarr;</span>
        </div>
      </div>
    </a>
  );
}

export default function LandingHero() {
  return (
    <section className="relative min-h-screen flex flex-col">
      <Navbar overlayOnHome />

      {/* Hero content */}
      <div className="flex-1 flex items-center">
        <PageContainer>
          <div className="flex flex-col lg:flex-row items-center lg:items-end gap-10 lg:gap-16 py-28 lg:py-24">

            {/* ── LEFT: Headline ── */}
            <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
              <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/40 mb-6">
                Afrikaans Music
              </p>

              <h1
                className="text-[clamp(2.8rem,8.5vw,7rem)] font-light leading-[0.92] tracking-tight text-white"
              >
                WHERE THE STREETS
                <br />
                MEET THE{" "}
                <span style={{ color: "#FF0090" }}>BEATS</span>
              </h1>

              <p className="mt-6 text-sm text-white/50 max-w-sm leading-relaxed">
                Fresh drops, underground energy, and Afrikaans music built from the streets of South Africa.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <a
                  href="/music"
                  className="px-7 py-3 text-sm font-medium bg-white text-black rounded-sm hover:bg-white/90 transition-colors duration-200"
                >
                  Explore Music
                </a>
                <a
                  href="/merch"
                  className="px-7 py-3 text-sm font-medium text-white/65 border border-white/15 rounded-sm hover:border-white/35 hover:text-white transition-colors duration-200"
                >
                  Merch
                </a>
              </div>

              <p className="mt-10 text-[10px] text-white/22 uppercase tracking-[0.3em]">Scroll</p>
            </div>

            {/* ── RIGHT: Stat + Latest release card ── */}
            <div className="flex flex-col items-center lg:items-end gap-4 lg:mb-4">
              <div className="w-72 sm:w-80 flex flex-col items-start gap-0.5 px-1">
                <span
                  className="font-light leading-none tracking-tight"
                  style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", color: "#FF0090" }}
                >
                  27M+
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/40">
                  Streams Worldwide
                </span>
              </div>
              <LatestReleaseCard />
            </div>

          </div>
        </PageContainer>
      </div>
    </section>
  );
}
