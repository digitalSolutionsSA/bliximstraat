import LandingHero from "../components/home/LandingHero";
import HomeHighlights from "../components/home/HomeHighlights";
import Footer from "../components/layout/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* FIXED BACKGROUND (sticky) */}
      <div className="fixed inset-0 z-0">
        <video
          className="h-full w-full object-cover"
          src="/video/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* darkness for readability */}
        <div className="absolute inset-0 bg-black/55" />
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
