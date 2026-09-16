import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Music from "./pages/Music";
import Shows from "./pages/Shows";
import Merch from "./pages/Merch";
import About from "./pages/About";
import Bookings from "./pages/Bookings";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";

import CookieConsent from "./components/CookieConsent";
import MerchCartModal from "./components/merch-cart/MerchCartModal";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen text-white flex items-center justify-center px-6 bg-black">
      <div className="text-center">
        <h1 className="text-3xl font-light tracking-widest text-white/60">{title}</h1>
        <p className="mt-3 text-sm text-white/30">Page not found.</p>
      </div>
    </div>
  );
}

function BootLoader({ show }: { show: boolean }) {
  const [mounted, setMounted] = useState(show);

  useEffect(() => {
    if (show) setMounted(true);
    else {
      const t = window.setTimeout(() => setMounted(false), 460);
      return () => window.clearTimeout(t);
    }
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden ${show ? "boot-in" : "boot-out"}`}
      style={{ background: "#050005" }}
    >
      {/* Scanlines */}
      <div className="boot-scanlines" aria-hidden="true" />

      {/* Faint magenta precision grid */}
      <div className="boot-grid" aria-hidden="true" />

      {/* Pulsing glow behind the logo */}
      <div className="boot-glow" aria-hidden="true" />

      <div className="relative flex flex-col items-center gap-9 boot-content">
        {/* Logo with glitch burst */}
        <div className="relative boot-logo-wrap">
          <img
            src="/blixim-logo.webp"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="boot-logo-ghost absolute inset-0 h-28 sm:h-36 md:h-44 w-auto object-contain"
          />
          <img
            src="/blixim-logo.webp"
            alt="Bliximstraat"
            width={720}
            height={360}
            draggable={false}
            className="boot-logo-main relative h-28 sm:h-36 md:h-44 w-auto object-contain select-none"
          />
        </div>

        {/* Loading bar */}
        <div className="boot-bar-track">
          <div className="boot-bar-fill" />
          <div className="boot-bar-blip" />
        </div>

        <p className="boot-loading-text" aria-label="Loading">
          {"LOADING".split("").map((ch, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.04}s` }}>{ch}</span>
          ))}
        </p>
      </div>

      <style>{`
        @keyframes bootFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes bootFadeOutGlitch {
          0%   { opacity: 1; clip-path: inset(0 0 0 0); transform: translateX(0); filter: none; }
          8%   { filter: brightness(2.2) saturate(2); }
          20%  { clip-path: inset(0 0 42% 0);  transform: translateX(-2%); }
          34%  { clip-path: inset(58% 0 0 0);  transform: translateX(1.5%); }
          48%  { clip-path: inset(18% 0 30% 0); filter: brightness(3); }
          62%  { clip-path: inset(0 0 0 0); transform: translateX(0); opacity: 1; }
          78%  { opacity: 0.5; }
          100% { opacity: 0; }
        }
        .boot-in  { animation: bootFadeIn 0.35s ease-out both; }
        .boot-out { animation: bootFadeOutGlitch 0.46s cubic-bezier(0.6,0,0.9,0.3) both; }

        .boot-content {
          animation: bootContentIn 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes bootContentIn {
          from { opacity: 0; transform: translateY(10px) scale(0.96); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: none; }
        }

        .boot-scanlines {
          position: absolute; inset: 0; pointer-events: none;
          background-image: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.05) 0px,
            rgba(255,255,255,0.05) 1px,
            transparent 1px,
            transparent 3px
          );
          animation: bootScan 9s linear infinite;
          mix-blend-mode: overlay;
          opacity: 0.5;
        }
        @keyframes bootScan {
          from { background-position-y: 0; }
          to   { background-position-y: 300px; }
        }

        .boot-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,0,144,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,0,144,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
                  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
        }

        .boot-glow {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 440px 280px at center, rgba(255,0,144,0.35), transparent 70%);
          animation: bootPulse 2.4s ease-in-out infinite;
        }
        @keyframes bootPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.95; transform: scale(1.08); }
        }

        .boot-logo-wrap { position: relative; }
        .boot-logo-ghost {
          object-fit: contain;
          filter: hue-rotate(300deg) saturate(6) brightness(1.5);
          mix-blend-mode: screen;
          opacity: 0;
          animation: bootGlitchGhost 2.8s steps(1) infinite;
        }
        @keyframes bootGlitchGhost {
          0%, 91%, 100% { opacity: 0; transform: translate(0,0); clip-path: none; }
          92%  { opacity: 0.75; transform: translate(4px,-1px); clip-path: inset(8% 0 62% 0); }
          93%  { opacity: 0;    transform: translate(-2px,1px); }
          94%  { opacity: 0.6;  transform: translate(-4px,2px); clip-path: inset(62% 0 4% 0); }
          95%  { opacity: 0; }
          96%  { opacity: 0.5;  transform: translate(3px,-2px); clip-path: inset(30% 0 40% 0); }
          97%, 100% { opacity: 0; transform: translate(0,0); }
        }
        .boot-logo-main {
          animation: bootGlitchMain 2.8s steps(1) infinite;
        }
        @keyframes bootGlitchMain {
          0%, 91%, 100% { clip-path: none; transform: translate(0,0); filter: none; }
          92%  { clip-path: inset(0 0 45% 0);  transform: translate(-4px,0); }
          93%  { clip-path: inset(55% 0 0 0);  transform: translate(3px,0); }
          94%  { clip-path: inset(20% 0 30% 0); transform: translate(-2px,0) skewX(2deg); filter: brightness(1.6); }
          95%  { clip-path: none; transform: translate(1px,0); }
          96%  { clip-path: inset(0 0 70% 0); transform: translate(-3px,0); }
          97%, 100% { clip-path: none; transform: translate(0,0); filter: none; }
        }

        .boot-bar-track {
          position: relative;
          width: 220px; height: 3px;
          overflow: hidden;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
        }
        .boot-bar-fill {
          position: absolute; inset: 0;
          width: 40%;
          border-radius: 2px;
          background: linear-gradient(90deg, transparent, #FF0090, #fff, #FF0090, transparent);
          animation: bootBarSweep 1.3s cubic-bezier(0.4,0,0.2,1) infinite;
        }
        @keyframes bootBarSweep {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
        .boot-bar-blip {
          position: absolute; top: 0; bottom: 0;
          width: 6px;
          background: #fff;
          opacity: 0;
          animation: bootBarBlip 2.8s steps(1) infinite;
        }
        @keyframes bootBarBlip {
          0%, 90%, 100% { opacity: 0; left: 0%; }
          91% { opacity: 1; left: 12%; }
          92% { opacity: 0; }
          94% { opacity: 1; left: 68%; }
          95% { opacity: 0; }
        }

        .boot-loading-text {
          display: flex; gap: 2px;
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.4em; text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }
        .boot-loading-text span {
          animation: bootLetterFlicker 2.8s steps(1) infinite;
        }
        @keyframes bootLetterFlicker {
          0%, 90%, 100% { color: rgba(255,255,255,0.35); transform: translateY(0); }
          92% { color: #FF0090; transform: translateY(-1px); }
          94% { color: #fff; }
          96% { color: rgba(255,255,255,0.35); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (import.meta.env.DEV) { setBooting(true); return; }
    try {
      const alreadyReady =
        typeof window !== "undefined" &&
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("bgVideoReady") === "1";
      setBooting(!alreadyReady);
    } catch {
      setBooting(true);
    }
  }, []);

  useEffect(() => {
    if (!booting) return;
    const startedAt = Date.now();
    const MIN_SHOW_MS = 550;
    const MAX_WAIT_MS = 1400;

    const finish = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_SHOW_MS - elapsed);
      window.setTimeout(() => {
        try { sessionStorage.setItem("bgVideoReady", "1"); } catch { }
        setBooting(false);
      }, remaining);
    };

    const onReady = () => finish();
    window.addEventListener("bg-video-ready", onReady as EventListener);
    const timeout = window.setTimeout(() => finish(), MAX_WAIT_MS);
    return () => {
      window.removeEventListener("bg-video-ready", onReady as EventListener);
      window.clearTimeout(timeout);
    };
  }, [booting]);

  return (
    <BrowserRouter>
      <BootLoader show={booting} />
      <CookieConsent privacyPath="/privacy" brandName="BliximStraat" />
      <MerchCartModal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/music" element={<Music />} />
        <Route path="/shows" element={<Shows />} />
        <Route path="/merch" element={<Merch />} />
        <Route path="/about" element={<About />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<NewsArticle />} />
        <Route path="*" element={<Placeholder title="404" />} />
      </Routes>
    </BrowserRouter>
  );
}
