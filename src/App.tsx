import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Music from "./pages/Music";
import Shows from "./pages/Shows";
import Merch from "./pages/Merch";
import About from "./pages/About";
import Lyrics from "./pages/Lyrics";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

import PurchasedSongs from "./pages/PurchasedSongs";
import PurchaseHistory from "./pages/PurchaseHistory";

// ✅ Cart
import { CartProvider } from "./contexts/CartContext";
import CartModal from "./components/cart/CartModal";

// ✅ Floating Pin WhatsApp Component
import PinWhatsApp from "./components/PinWhatsapp";

// ✅ Cookie / POPIA consent
import CookieConsent from "./components/CookieConsent";

/* TEMP PLACEHOLDER */
function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-widest">{title}</h1>
        <p className="mt-3 text-white/70">Page coming soon.</p>
      </div>
    </div>
  );
}

/* ============================
   BOOT / LOADING SCREEN
   ============================ */
function BootLoader({ show }: { show: boolean }) {
  const [mounted, setMounted] = useState(show);

  useEffect(() => {
    if (show) setMounted(true);
    else {
      const t = window.setTimeout(() => setMounted(false), 300);
      return () => window.clearTimeout(t);
    }
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#05080f] to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,120,255,0.14),transparent_55%)]" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6">
        {/* LOGO (transparent, instant, from /public) */}
        <img
          src="/blixim-logo.webp"
          alt="Bliximstraat"
          width={720}
          height={360}
          className="h-36 sm:h-44 md:h-52 w-auto object-contain select-none drop-shadow-[0_0_30px_rgba(120,180,255,0.4)]"
          draggable={false}
        />

        <div className="h-12" />

        {/* Loading bar */}
        <div className="w-72 sm:w-80 md:w-96 h-3 rounded-full bg-white/10 overflow-hidden shadow-inner">
          <div
            className="h-full w-1/3 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(120,180,255,0.2), rgba(180,220,255,0.95), rgba(120,180,255,0.2))",
              animation: "blixLoader 1.2s ease-in-out infinite",
              boxShadow: "0 0 14px rgba(160,210,255,0.7)",
            }}
          />
        </div>

        <p className="mt-4 text-xs tracking-[0.25em] text-white/60">
          LOADING MEDIA
        </p>

        <style>
          {`
            @keyframes blixLoader {
              0% { transform: translateX(-130%); }
              50% { transform: translateX(120%); }
              100% { transform: translateX(330%); }
            }
          `}
        </style>
      </div>
    </div>
  );
}

/* ============================
   APP
   ============================ */
export default function App() {
  // Netlify-safe: do NOT read sessionStorage in the initial render.
  // Start booting true, then decide in useEffect.
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    // DEV: always show loader so you can see it
    if (import.meta.env.DEV) {
      setBooting(true);
      return;
    }

    try {
      // PROD: once per tab
      const alreadyReady =
        typeof window !== "undefined" &&
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("bgVideoReady") === "1";

      setBooting(!alreadyReady);
    } catch {
      // If storage is blocked, just show loader once
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
        try {
          sessionStorage.setItem("bgVideoReady", "1");
        } catch {
          // ignore
        }
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
      <CartProvider>
        <BootLoader show={booting} />

        {/* ✅ Cookie / POPIA consent (first visit only) */}
        <CookieConsent privacyPath="/privacy" brandName="BliximStraat" />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/music" element={<Music />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/about" element={<About />} />
          <Route path="/lyrics" element={<Lyrics />} />
          <Route path="/bookings" element={<Bookings />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/purchased" element={<PurchasedSongs />} />
          <Route path="/orders" element={<PurchaseHistory />} />

          <Route path="/admin" element={<Admin />} />

          <Route path="*" element={<Placeholder title="NOT FOUND" />} />
        </Routes>

        {/* ✅ Floating Map-Pin WhatsApp button (global) */}
        <PinWhatsApp
          artistName="Storm Sintese"
          whatsappNumberE164="27821234567"
          submitEndpoint="/.netlify/functions/booking-signal"
        />

        {/* ✅ Cart overlay mounted once globally */}
        <CartModal />
      </CartProvider>
    </BrowserRouter>
  );
}