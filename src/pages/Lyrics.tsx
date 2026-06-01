import { useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import VideoBackground from "../components/layout/VideoBackground";
import { LYRICS } from "../data/lyrics";

export default function Lyrics() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(LYRICS[0]?.id ?? "");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LYRICS;
    return LYRICS.filter(s =>
      `${s.title} ${s.album ?? ""} ${s.year ?? ""} ${s.lyrics}`.toLowerCase().includes(q)
    );
  }, [query]);

  const activeSong = useMemo(
    () => filtered.find(s => s.id === activeId) ?? filtered[0],
    [filtered, activeId]
  );

  useState(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden flex flex-col"
      style={{ background: "#000000" }}
    >
      <VideoBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-6 py-12">

            {/* Header */}
            <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-3">
                  Words
                </p>
                <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">
                  Lyrics
                </h1>
                <p className="mt-2 text-sm text-white/40">Official lyrics. No "I heard it on TikTok" versions.</p>
              </div>

              <div className="w-full md:w-[320px]">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search title, album, or lyrics..."
                  className="w-full px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none rounded-lg bg-transparent"
                  style={{
                    border: "1px solid rgba(255,255,255,0.09)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                />
              </div>
            </header>

            <div className="h-px mb-10" style={{ background: "rgba(255,255,255,0.07)" }} />

            {LYRICS.length === 0 ? (
              <div
                className="rounded-xl p-10 text-center text-white/35 text-sm"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
              >
                No lyrics yet. Add them in{" "}
                <code style={{ color: "#FF0090" }}>src/data/lyrics.ts</code>
              </div>
            ) : (
              <div>
                <div className="mb-6 text-xs text-white/30">
                  {filtered.length} song{filtered.length !== 1 ? "s" : ""}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                  {filtered.map(s => {
                    const active = s.id === activeId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setActiveId(s.id); setIsOpen(true); }}
                        className="group relative w-full text-left rounded-xl overflow-hidden transition-all duration-200"
                        style={{
                          border: `1px solid ${active ? "rgba(255,0,144,0.30)" : "rgba(255,255,255,0.07)"}`,
                          background: active ? "rgba(255,0,144,0.05)" : "rgba(255,255,255,0.02)",
                        }}
                        onMouseEnter={e => {
                          if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.14)";
                        }}
                        onMouseLeave={e => {
                          if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                        }}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-medium text-white leading-snug line-clamp-2">{s.title}</p>
                            {active && (
                              <span
                                className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ background: "#FF0090" }}
                              />
                            )}
                          </div>
                          <p className="text-[10px] text-white/35">
                            {s.album ?? "Single"}{s.year ? ` · ${s.year}` : ""}
                          </p>
                          <div className="mt-3 pt-3 text-[10px] text-white/25" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            Tap to view
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {filtered.length === 0 && (
                    <div className="col-span-full rounded-xl p-6 text-sm text-white/35" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                      Nothing found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>

      {/* Lyrics modal */}
      {isOpen && activeSong && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl"
            style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(8,8,8,0.97)", backdropFilter: "blur(24px)" }}
          >
            <div
              className="px-6 py-5 flex items-start justify-between gap-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div>
                <h2 className="text-lg font-medium text-white">{activeSong.title}</h2>
                <p className="mt-1 text-xs text-white/40">
                  {activeSong.album ?? "Single"}{activeSong.year ? ` · ${activeSong.year}` : ""}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="shrink-0 px-3 py-1.5 text-xs text-white/50 rounded-md hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
              >
                Close
              </button>
            </div>
            <div className="px-6 py-6 max-h-[68vh] overflow-auto">
              <pre className="whitespace-pre-wrap text-sm text-white/75 leading-relaxed font-mono">
                {activeSong.lyrics}
              </pre>
              <div className="mt-6">
                <button
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(activeSong.lyrics); } catch { }
                  }}
                  className="px-4 py-2 text-xs text-white/45 rounded-md hover:text-white transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
                >
                  Copy lyrics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
