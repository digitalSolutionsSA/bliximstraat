import LandingHero from "../components/home/LandingHero";
import HomeHighlights from "../components/home/HomeHighlights";
import Footer from "../components/layout/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* FIXED BACKGROUND (fast + mobile-safe, responsive sources) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Mobile video */}
        <video
          className="sm:hidden h-full w-full object-cover object-center pointer-events-none select-none"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          poster="/video/mobile-hero-poster.jpg"
        >
          <source src="/video/mobile-hero.webm" type="video/webm" />
          <source src="/video/mobile-hero.mp4" type="video/mp4" />
        </video>

        {/* Desktop / tablet video */}
        <video
          className="hidden sm:block h-full w-full object-cover object-center pointer-events-none select-none"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          poster="/video/hero-poster.jpg"
        >
          <source src="/video/hero.webm" type="video/webm" />
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>

        {/* Base darkness for readability (a bit stronger on mobile) */}
        <div className="absolute inset-0 bg-black/65 sm:bg-black/55" />

        {/* Gradient overlay to keep navbar/logo readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/45 sm:from-black/55 sm:via-black/15 sm:to-black/40" />
      </div>

      {/* FOREGROUND */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1">
          <LandingHero />
          {/* Opaque section naturally hides background video */}
          <HomeHighlights />
        </main>

        <Footer />
      </div>
    </div>
  );
}
