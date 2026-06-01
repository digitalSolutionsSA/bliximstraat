import LandingHero from "../components/home/LandingHero";
import HomeStats from "../components/home/HomeStats";
import HomeHighlights from "../components/home/HomeHighlights";
import Footer from "../components/layout/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* FIXED VIDEO BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Mobile */}
        <video
          className="sm:hidden h-full w-full object-cover object-center pointer-events-none select-none"
          autoPlay muted loop playsInline preload="auto" disablePictureInPicture
          poster="/video/mobile-hero-poster.jpg"
        >
          <source src="/video/mobile-hero.mp4" type="video/mp4" />
        </video>

        {/* Desktop */}
        <video
          className="hidden sm:block h-full w-full object-cover object-center pointer-events-none select-none"
          autoPlay muted loop playsInline preload="auto" disablePictureInPicture
        >
          <source src="/video/site-bg.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/50 sm:bg-black/38" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/65" />
      </div>

      {/* FOREGROUND */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1">
          <LandingHero />
          <HomeStats />
          <HomeHighlights />
        </main>
        <Footer />
      </div>
    </div>
  );
}
