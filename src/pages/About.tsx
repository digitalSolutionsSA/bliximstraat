// src/pages/About.tsx
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import PageContainer from "../components/layout/PageContainer";
import { motion } from "framer-motion";
import { Music2, Sparkles, MapPin, Users, SlidersHorizontal } from "lucide-react";
import pieterImage from "../assets/pieter.png";

export default function About() {
  return (
    <div className="relative min-h-screen text-white overflow-x-hidden flex flex-col">
      {/* === FIXED VIDEO BACKGROUND === */}
      <div className="fixed inset-0 z-0">
        <video
          className="h-full w-full object-cover"
          src="/normal-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="relative z-10 flex-1">
          {/* Header */}
          <section className="pt-28 pb-10">
            <PageContainer>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col gap-4"
              >
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
                  About
                </h1>
                <p className="text-white/70 max-w-2xl">
                  The story, the sound, and the little details people pretend they
                  “totally noticed” in your music.
                </p>
              </motion.div>
            </PageContainer>
          </section>

          {/* Content */}
          <section className="pb-24">
            <PageContainer className="py-10 sm:py-14 md:py-16">
              <div className="space-y-6">
                {/* BIO + IMAGE ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Artist Bio */}
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4 }}
                    className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 md:p-8"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 grid place-items-center">
                        <Sparkles className="h-5 w-5 text-white/80" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-semibold">
                        Artist bio
                      </h2>
                    </div>

                    <div className="mt-5 space-y-4 text-white/75 leading-relaxed">
                      <p>
                        <span className="text-white font-semibold">
                          Bliximstraat
                        </span>{" "}
                        is a unique Afrikaans music project that blends modern sounds with deep,
                        honest lyrics. The music moves between danceable and introspective, with themes
                        focused on life, consciousness, emotion, and the realities of the street.
                        <br /><br />
                        Although the music is created with the help of AI technology, every lyric
                        is originally written, with meaning and feeling at its core. Bliximstraat
                        stands for authenticity, thought, and movement — music that makes you feel,
                        think, and dance.
                        <br /><br />
                        The project’s mission is to push Afrikaans music forward by merging
                        technology and creativity, without sacrificing soul or storytelling.
                      </p>

                      <p>
                        Born from a love of retro texture and modern punch,
                        Bliximstraat blends cinematic atmosphere with tight
                        songwriting. The goal is simple: make tracks that hit
                        emotionally and still knock in a live set.
                      </p>

                      <p className="text-white/60">
                        Replace this bio with the real story: where you’re from,
                        who’s involved, highlights (releases, shows, radio plays,
                        collaborations), and what you want the world to know.
                      </p>
                    </div>
                  </motion.div>

                  {/* IMAGE CARD – SHOW FULL IMAGE (NO CROPPING) */}
                  <motion.div
  initial={{ opacity: 0, y: 18 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.2 }}
  transition={{ duration: 0.4, delay: 0.05 }}
  className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm
             min-h-[320px] lg:min-h-[420px]"
>
  <img
    src={pieterImage}
    alt="Artist portrait"
    className="absolute inset-0 w-full h-full object-cover"
    draggable={false}
  />

  {/* subtle overlay so it matches the UI */}
  <div className="absolute inset-0 bg-black/15 pointer-events-none" />
</motion.div>

                </div>

                {/* QUICK FACTS */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: 0.06 }}
                  className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 md:p-8"
                >
                  <h3 className="text-lg font-semibold">Quick facts</h3>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-white/70" />
                        <span className="text-sm text-white/60">Based in</span>
                      </div>
                      <div className="mt-3 text-sm text-white/80">
                        South Africa
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-white/70" />
                        <span className="text-sm text-white/60">For fans of</span>
                      </div>
                      <div className="mt-3 text-sm text-white/80">
                        Synth textures, indie edges, late-night energy
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-white/70" />
                        <span className="text-sm text-white/60">Vibe</span>
                      </div>
                      <div className="mt-3 text-sm text-white/80">
                        Retro-futuristic, cinematic, nocturnal
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* SOUND / STYLE */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: 0.08 }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 md:p-8"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/40 grid place-items-center">
                      <Music2 className="h-5 w-5 text-white/80" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold">
                      Sound / style
                    </h2>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <div className="text-sm text-white/60">Core sound</div>
                      <div className="mt-2 text-white/80">
                        Dark-pop / alt / synth-influenced songwriting with punchy
                        hooks and cinematic space.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <div className="text-sm text-white/60">Mood</div>
                      <div className="mt-2 text-white/80">
                        Neon nostalgia, tension, romance, and that “something’s
                        about to happen” feeling.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                      <div className="text-sm text-white/60">Live energy</div>
                      <div className="mt-2 text-white/80">
                        Tight, loud, and emotional. Built to translate from
                        headphones to stage without losing the atmosphere.
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </PageContainer>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
