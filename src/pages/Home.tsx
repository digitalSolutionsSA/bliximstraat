import LandingHero from "../components/home/LandingHero";
import HomeHighlights from "../components/home/HomeHighlights";
import Footer from "../components/layout/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* FIXED BACKGROUND (responsive sources) */}
      <div className="fixed inset-0 z-0">
        {/* Mobile video */}
        <video
          className="sm:hidden h-full w-full object-cover object-center"
          src="/video/mobile-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Desktop / tablet video */}
        <video
          className="hidden sm:block h-full w-full object-cover object-center"
          src="/video/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Base darkness for readability (a bit stronger on mobile) */}
        <div className="absolute inset-0 bg-black/65 sm:bg-black/55" />

        {/* Gradient overlay to keep navbar/logo readable like desktop */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/45 sm:from-black/55 sm:via-black/15 sm:to-black/40" />
      </div>

      {/* FOREGROUND */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1">
          <LandingHero />
          {/* This section is white + opaque, so it naturally hides the video behind it */}
          <HomeHighlights />
        </main>

        {/* Glass footer will show the background behind it */}
        <Footer />
      </div>
    </div>
  );
}
