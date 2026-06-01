import { SONGS, hasVideo } from "../../data/songs";
import PageContainer from "../layout/PageContainer";

const PLATFORMS = [
  { label: "YouTube",     href: "http://www.youtube.com/channel/UCaRgHj3J8RjDuS_eyZXdepA" },
  { label: "Spotify",     href: "https://open.spotify.com/artist/0Ch8nVFZCWFF95IXTcgLgT" },
  { label: "Apple Music", href: "https://music.apple.com/us/artist/blixim-straat/1761419580" },
  { label: "TikTok",      href: "https://www.tiktok.com/@bliximstraat" },
  { label: "Instagram",   href: "https://www.instagram.com/blixim_straat" },
];

export default function HomeHighlights() {
  const featured = SONGS.filter(hasVideo).slice(0, 4);

  return (
    <section style={{ background: "#000000" }}>
      {/* Thin accent separator */}
      <div
        className="h-px w-full"
        style={{ background: "rgba(255,255,255,0.07)" }}
      />

      <PageContainer className="py-20 md:py-28">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-3">
            Latest
          </p>
          <h2 className="text-2xl font-light tracking-tight text-white">
            Latest Drops
          </h2>
        </div>

        {/* Songs grid */}
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((song) => (
              <a
                key={song.id}
                href={song.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="group block rounded-xl overflow-hidden transition-all duration-300"
                style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.14)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.07)";
                }}
              >
                {/* Cover */}
                <div className="relative aspect-square overflow-hidden">
                  {song.coverUrl ? (
                    <img
                      src={song.coverUrl}
                      alt={`${song.title} cover`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <span className="text-5xl text-white/20 select-none">♪</span>
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.95)" }}
                    >
                      <span className="text-black text-sm ml-0.5 select-none">▶</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="font-medium text-white text-sm leading-tight truncate">{song.title}</div>
                  <div className="mt-1 text-xs text-white/40">
                    {song.year}{song.genre ? ` · ${song.genre}` : ""}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl p-10 text-center text-white/35"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            Music coming soon.
          </div>
        )}

        {/* View all */}
        <div className="mt-8">
          <a
            href="/music"
            className="inline-flex items-center text-sm text-white/50 hover:text-white transition-colors duration-200"
          >
            View all music &rarr;
          </a>
        </div>

        {/* Streaming platforms */}
        <div
          className="mt-20 pt-10"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-5">
            Also on
          </p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <a
                key={p.label}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-medium text-white/45 rounded-full transition-colors duration-200 hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.18)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.08)";
                }}
              >
                {p.label}
              </a>
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
