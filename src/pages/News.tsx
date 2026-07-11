import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import VideoBackground from "../components/layout/VideoBackground";
import PageContainer from "../components/layout/PageContainer";
import { NEWS } from "../data/news";

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function News() {
  const articles = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));

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
                  Latest
                </p>
                <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">
                  News
                </h1>
                <p className="mt-2 text-sm text-white/40 max-w-lg">
                  Stories, milestones, and updates from Bliximstraat.
                </p>
              </motion.div>
            </PageContainer>
          </section>

          <div className="h-px mx-6" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Articles */}
          <section className="pb-24">
            <PageContainer className="py-10 sm:py-14">
              {articles.length === 0 ? (
                <div
                  className="rounded-xl p-12 text-center"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="text-white/50 text-base font-light">No articles yet</div>
                  <div className="text-white/30 text-sm mt-2">Check back soon.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {articles.map((article, i) => (
                    <motion.div
                      key={article.slug}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                      <Link
                        to={`/news/${article.slug}`}
                        className="group block rounded-xl overflow-hidden h-full"
                        style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={article.cover}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 50%)" }}
                          />
                        </div>
                        <div className="p-5">
                          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35 mb-2">
                            {formatDate(article.date)}
                          </p>
                          <h2 className="text-base font-medium text-white leading-snug group-hover:text-white/80 transition-colors">
                            {article.title}
                          </h2>
                          <p className="mt-2 text-sm text-white/45 leading-relaxed line-clamp-3">
                            {article.excerpt}
                          </p>
                          <p
                            className="mt-4 text-xs font-medium uppercase tracking-[0.18em]"
                            style={{ color: "#FF0090" }}
                          >
                            Read more &rarr;
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </PageContainer>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
