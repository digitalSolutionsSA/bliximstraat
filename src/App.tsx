import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Music from "./pages/Music";
import Shows from "./pages/Shows";
import Merch from "./pages/Merch";
import About from "./pages/About";
import Bookings from "./pages/Bookings";

import CookieConsent from "./components/CookieConsent";

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
      const t = window.setTimeout(() => setMounted(false), 400);
      return () => window.clearTimeout(t);
    }
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-10">
        <img
          src="/blixim-logo.webp"
          alt="Bliximstraat"
          width={720}
          height={360}
          className="h-28 sm:h-36 md:h-44 w-auto object-contain select-none"
          draggable={false}
        />

        {/* Loading bar */}
        <div className="w-48 h-px overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full w-1/3"
            style={{
              background: "#FF0090",
              animation: "blixLoader 1.2s ease-in-out infinite",
            }}
          />
        </div>

        <p className="text-[9px] font-medium tracking-[0.4em] text-white/25 uppercase">Loading</p>
      </div>

      <style>{`
        @keyframes blixLoader {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(500%); }
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
    const MIN_SHOW_MS = 900;
    const MAX_WAIT_MS = 4500;

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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/music" element={<Music />} />
        <Route path="/shows" element={<Shows />} />
        <Route path="/merch" element={<Merch />} />
        <Route path="/about" element={<About />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="*" element={<Placeholder title="404" />} />
      </Routes>
    </BrowserRouter>
  );
}
