import Navbar from "../layout/Navbar";

export default function LandingHero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background is now handled in Home.tsx (fixed/sticky).
          Keeping this component clean prevents double video layers. */}

      <Navbar overlayOnHome />

      {/* HERO CONTENT */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between px-6 pt-48 pb-24">
        {/* TOP SPACER (balances logo area) */}
        <div />

        {/* MAIN CONTENT */}
        <div className="w-full max-w-7xl mx-auto text-center">
          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight text-white">
            WHERE THE STREETS
            <br />
            MEET THE{" "}
            <span className="neon-beats text-teal-400">BEATS</span>
          </h1>

          {/* Subheading */}
          <p className="mt-10 text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto">
            Fresh drops, underground energy, and merch that actually belongs in the streets.
          </p>

          {/* CTA Buttons */}
          <div className="mt-14 flex justify-center">
            <div className="w-full max-w-4xl flex items-center justify-between gap-6">
              <a
                href="/music"
                className="
                  flex items-center justify-center
                  h-16 px-12
                  rounded-xl
                  bg-black/60 backdrop-blur-sm
                  border border-white/20
                  text-white text-lg font-extrabold uppercase tracking-tight
                  hover:border-teal-400 hover:text-teal-400
                  transition
                "
              >
                Explore Music
              </a>

              <a
                href="/merch"
                className="
                  flex items-center justify-center
                  h-16 px-12
                  rounded-xl
                  bg-black/60 backdrop-blur-sm
                  border border-white/20
                  text-white text-lg font-extrabold uppercase tracking-tight
                  hover:border-yellow-400 hover:text-yellow-400
                  transition
                "
              >
                View Merch
              </a>

              <a
                href="/bookings"
                className="
                  flex items-center justify-center
                  h-16 px-12
                  rounded-xl
                  bg-black/60 backdrop-blur-sm
                  border border-white/20
                  text-white text-lg font-extrabold uppercase tracking-tight
                  hover:border-white hover:text-white
                  transition
                "
              >
                Book Us
              </a>
            </div>
          </div>

          {/* Scroll hint */}
          <p className="mt-14 text-xs text-white/55">
            Scroll down for releases, highlights, and the good stuff.
          </p>
        </div>

        {/* BOTTOM SPACER (balances bottom gap) */}
        <div />
      </div>

      {/* Neon flicker styles */}
      <style>
        {`
          .neon-beats {
            text-shadow:
              0 0 4px rgba(45, 212, 191, 0.6),
              0 0 14px rgba(45, 212, 191, 0.75),
              0 0 34px rgba(45, 212, 191, 0.95);
            animation: neonFlicker 4.5s infinite;
          }

          @keyframes neonFlicker {
            0%, 18%, 22%, 25%, 53%, 57%, 100% {
              opacity: 1;
            }
            20%, 24%, 55% {
              opacity: 0.6;
            }
            21%, 23% {
              opacity: 0.3;
            }
          }
        `}
      </style>
    </section>
  );
}
