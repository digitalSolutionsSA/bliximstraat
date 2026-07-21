import { Link, useParams, Navigate } from "react-router-dom";
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

export default function NewsArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = NEWS.find(a => a.slug === slug);

  if (!article) return <Navigate to="/news" replace />;

  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden flex flex-col"
      style={{ background: "#000000" }}
    >
      <VideoBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="relative z-10 flex-1">
          <article className="pb-24">
            {/* Banner image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-full overflow-hidden"
              style={{ height: "min(52vh, 480px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <img
                src={article.cover}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.15) 60%)" }}
              />
            </motion.div>
            {article.coverCaption && (
              <p className="text-center text-xs text-white/35 italic px-4 pt-2 pb-1">
                {article.coverCaption}
              </p>
            )}

            <PageContainer className="py-10 sm:py-14">
              <Link
                to="/news"
                className="inline-flex items-center text-xs font-medium uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors mb-6"
              >
                &larr; Back to News
              </Link>

              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-10"
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-3">
                  {formatDate(article.date)}
                </p>
                <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white leading-tight max-w-3xl">
                  {article.title}
                </h1>
              </motion.div>

              <div className="h-px mb-10" style={{ background: "rgba(255,255,255,0.07)" }} />

              {/* Article body */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4 }}
                className="max-w-3xl space-y-5"
              >
                {article.body.map((block, i) => {
                  if (block.type === "heading") {
                    return (
                      <h2 key={i} className="text-xl md:text-2xl font-medium text-white pt-4">
                        {block.text}
                      </h2>
                    );
                  }
                  if (block.type === "list") {
                    return (
                      <ul key={i} className="space-y-2 pl-1">
                        {block.items.map((item, j) => (
                          <li key={j} className="flex gap-3 text-sm text-white/60 leading-relaxed">
                            <span className="mt-2 h-1 w-1 rounded-full shrink-0" style={{ background: "#FF0090" }} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  if (block.type === "richParagraph") {
                    return (
                      <p key={i} className="text-sm md:text-base text-white/60 leading-relaxed">
                        {block.segments.map((seg, j) =>
                          seg.href ? (
                            <a
                              key={j}
                              href={seg.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium transition-colors"
                              style={{ color: "#FF0090" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "#ff40b0")}
                              onMouseLeave={e => (e.currentTarget.style.color = "#FF0090")}
                            >
                              {seg.text}
                            </a>
                          ) : (
                            <span key={j}>{seg.text}</span>
                          )
                        )}
                      </p>
                    );
                  }
                  if (block.type === "quote") {
                    return (
                      <p key={i} className="text-sm md:text-base font-semibold text-white leading-relaxed pl-4" style={{ borderLeft: "3px solid #FF0090" }}>
                        {block.text}
                      </p>
                    );
                  }
                  return (
                    <p key={i} className="text-sm md:text-base text-white/60 leading-relaxed">
                      {block.text}
                    </p>
                  );
                })}
              </motion.div>
            </PageContainer>
          </article>
        </main>

        <Footer />
      </div>
    </div>
  );
}
