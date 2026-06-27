import { useEffect, useState } from "react";
import imgWelkom from "../../Graphics/upcoming/welkom.jpeg";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import VideoBackground from "../components/layout/VideoBackground";
import { SHOWS } from "../data/shows";

// ── Gallery images ────────────────────────────────────────────────────────────

const GALLERY_IMAGES = [
  1, 2, 4, 5, 6, 7, 9, 12, 14, 15, 17, 18, 19, 20, 22, 24, 25, 29,
  30, 31, 33, 35, 37, 39, 40, 41, 43, 45, 47, 54, 55, 56, 60, 63, 66, 67,
].map(n => `/shows/${n}.png`);

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ images, index, onClose, onPrev, onNext }: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      {/* Image */}
      <img
        src={images[index]}
        alt={`Show photo ${index + 1}`}
        className="max-h-[88vh] max-w-[90vw] object-contain rounded-lg select-none"
        onClick={e => e.stopPropagation()}
        draggable={false}
      />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors text-3xl leading-none"
        aria-label="Close"
      >
        ×
      </button>

      {/* Prev */}
      <button
        onClick={e => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Previous"
      >
        ‹
      </button>

      {/* Next */}
      <button
        onClick={e => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Next"
      >
        ›
      </button>

      {/* Counter */}
      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-white/35 uppercase tracking-[0.25em]">
        {index + 1} / {images.length}
      </p>
    </div>
  );
}

// ── Gallery grid ──────────────────────────────────────────────────────────────

function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const open  = (i: number) => setLightboxIndex(i);
  const close = () => setLightboxIndex(null);
  const prev  = () => setLightboxIndex(i => (i! - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
  const next  = () => setLightboxIndex(i => (i! + 1) % GALLERY_IMAGES.length);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
        {GALLERY_IMAGES.map((src, i) => (
          <button
            key={src}
            onClick={() => open(i)}
            className="group relative aspect-square overflow-hidden rounded-lg focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <img
              src={src}
              alt={`Show ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white/80 text-2xl">⤢</span>
            </div>
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={GALLERY_IMAGES}
          index={lightboxIndex}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Shows() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = SHOWS.filter(s => {
    const [y, m, d] = s.date.split("-").map(Number);
    return new Date(y, m - 1, d) >= today;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const past = SHOWS.filter(s => {
    const [y, m, d] = s.date.split("-").map(Number);
    return new Date(y, m - 1, d) < today;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden flex flex-col"
      style={{ background: "#000000" }}
    >
      <VideoBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-6 py-12 space-y-14">

            {/* Header */}
            <header>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-3">
                Live
              </p>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">
                Shows
              </h1>
              <p className="mt-2 text-sm text-white/40">
                Upcoming shows, past chaos, and places we've made noise.
              </p>
            </header>

            <div className="h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

            {/* Upcoming */}
            <section className="space-y-5">
              <h2 className="text-base font-medium text-white">Upcoming Shows</h2>

              {upcoming.length === 0 ? (
                <div
                  className="rounded-xl p-12 text-center"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="text-4xl mb-4 text-white/15 select-none">♪</div>
                  <div className="text-white/50 text-base font-light">No upcoming shows yet</div>
                  <div className="text-white/30 text-sm mt-2">Watch this space. Something's coming.</div>
                  <div className="mt-8">
                    <a
                      href="/bookings"
                      className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-black bg-white rounded-sm hover:bg-white/90 transition-colors"
                    >
                      Book us for your event
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(show => (
                    <div
                      key={show.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-5 py-4 rounded-xl"
                      style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">{show.title || show.venue}</p>
                        <p className="text-xs text-white/40">{show.venue} · {show.city}</p>
                        {show.time && <p className="text-xs text-white/30">{show.time}</p>}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs text-white/50">
                          {formatDate(show.date)}
                        </span>
                        {show.ticketUrl && (
                          <a
                            href={show.ticketUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 text-xs font-medium text-black bg-white rounded-sm hover:bg-white/90 transition-colors"
                          >
                            Tickets
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Past shows */}
            {past.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-white/40">Past Shows</h2>
                <div className="space-y-2">
                  {past.map(show => (
                    <div key={show.id}>
                      {show.id === "welkom-bokkieweek-2026" && (
                        <img
                          src={imgWelkom}
                          alt="Welkom show poster"
                          className="rounded-lg object-cover mb-3"
                          style={{ width: "220px", maxWidth: "100%" }}
                        />
                      )}
                      <div
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3.5 rounded-lg"
                        style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}
                      >
                        <div>
                          <p className="text-sm text-white/55">{show.title || show.venue}</p>
                          <p className="text-xs text-white/30">{show.venue} · {show.city}</p>
                        </div>
                        <p className="text-xs text-white/30 shrink-0">{formatDate(show.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery */}
            <section className="space-y-6">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-2">
                  Photos
                </p>
                <h2 className="text-2xl font-light text-white">Gallery</h2>
              </div>
              <Gallery />
            </section>

          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
