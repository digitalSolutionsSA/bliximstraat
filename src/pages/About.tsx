import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import VideoBackground from "../components/layout/VideoBackground";
import PageContainer from "../components/layout/PageContainer";
import { motion } from "framer-motion";
import { MapPin, Users, SlidersHorizontal } from "lucide-react";
import pieterImage from "../assets/pieter.png";

export default function About() {
  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden flex flex-col"
      style={{ background: "#000000" }}
    >
      <VideoBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="relative z-10 flex-1">
          {/* Header */}
          <section className="pt-12 pb-8">
            <PageContainer>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-3">
                  The Story
                </p>
                <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">
                  About
                </h1>
                <p className="mt-2 text-sm text-white/40 max-w-lg">
                  The story, the sound, and the little details people pretend they "totally noticed" in your music.
                </p>
              </motion.div>
            </PageContainer>
          </section>

          <div className="h-px mx-6" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Content */}
          <section className="pb-24">
            <PageContainer className="py-10 sm:py-14">
              <div className="space-y-5">

                {/* BIO + IMAGE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Artist Bio */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4 }}
                    className="lg:col-span-2 rounded-xl p-6 md:p-8"
                    style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-4">
                      Artist Bio
                    </p>

                    <div className="space-y-4 text-sm text-white/55 leading-relaxed">
                      <p>
                        <span className="text-white font-medium">Bliximstraat</span>{" "}
                        is a unique Afrikaans music project that blends modern sounds with deep,
                        honest lyrics. The music moves between danceable and introspective, with themes
                        focused on life, consciousness, emotion, and the realities of the street.
                      </p>
                      <p>
                        Although the music is created with the help of AI technology, every lyric
                        is originally written, with meaning and feeling at its core. Bliximstraat
                        stands for authenticity, thought, and movement — music that makes you feel,
                        think, and dance.
                      </p>
                      <p>
                        The project's mission is to push Afrikaans music forward by merging
                        technology and creativity, without sacrificing soul or storytelling.
                      </p>
                      <p>
                        Born from a love of retro texture and modern punch,
                        Bliximstraat blends cinematic atmosphere with tight
                        songwriting. The goal is simple: make tracks that hit
                        emotionally and still knock in a live set.
                      </p>
                    </div>
                  </motion.div>

                  {/* Image */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4, delay: 0.06 }}
                    className="relative overflow-hidden rounded-xl min-h-[300px] lg:min-h-[400px]"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <img
                      src={pieterImage}
                      alt="Artist portrait"
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                    <div
                      className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}
                    />
                  </motion.div>
                </div>

                {/* QUICK FACTS */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="rounded-xl p-6 md:p-8"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-6">
                    Quick Facts
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { icon: <MapPin className="h-3.5 w-3.5" />, label: "Based in", value: "South Africa" },
                      { icon: <Users className="h-3.5 w-3.5" />, label: "For fans of", value: "Synth textures, indie edges, late-night energy" },
                      { icon: <SlidersHorizontal className="h-3.5 w-3.5" />, label: "Vibe", value: "Retro-futuristic, cinematic, nocturnal" },
                    ].map(f => (
                      <div
                        key={f.label}
                        className="rounded-lg p-4"
                        style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                      >
                        <div className="flex items-center gap-2 text-white/35 mb-3">
                          {f.icon}
                          <span className="text-[10px] uppercase tracking-[0.2em]">{f.label}</span>
                        </div>
                        <div className="text-sm text-white/65">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* SOUND / STYLE */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: 0.07 }}
                  className="rounded-xl p-6 md:p-8"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-6">
                    Sound &amp; Style
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "Core sound", value: "Afrikaans EDM / Trap / Synth-influenced songwriting with punchy hooks and cinematic space." },
                      { label: "Mood", value: "Neon nostalgia, tension, romance, and that 'something's about to happen' feeling." },
                      { label: "Live energy", value: "Tight, loud, and emotional. Built to translate from headphones to stage without losing the atmosphere." },
                    ].map(s => (
                      <div
                        key={s.label}
                        className="rounded-lg p-5"
                        style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                      >
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-3">{s.label}</div>
                        <div className="text-sm text-white/60 leading-relaxed">{s.value}</div>
                      </div>
                    ))}
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
