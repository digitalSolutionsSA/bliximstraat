import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import VideoBackground from "../components/layout/VideoBackground";

import imgBlueCap from "../../Graphics/merch/blue-cap.png";
import imgMenBlue from "../../Graphics/merch/men-blue.png";
import imgMenGrey from "../../Graphics/merch/men-grey.png";
import imgMooisteCap from "../../Graphics/merch/mooiste-cap.png";
import imgOrangeJeanCap from "../../Graphics/merch/orange-jean-cap.png";
import imgStupidCap from "../../Graphics/merch/stupid-cap.png";
import imgWomenBlue from "../../Graphics/merch/women-blue.png";
import imgWomenGrey from "../../Graphics/merch/women-grey.png";

type Category = "All" | "Shirts" | "Caps";

type MerchItem = {
  id: string;
  name: string;
  category: "Shirts" | "Caps";
  priceZar: number;
  description: string;
  isPreorder?: boolean;
  image: string;
  sizes: string[];
};

const MERCH: MerchItem[] = [
  {
    id: "men-tee-blue",
    name: "Men's Tee — Blue",
    category: "Shirts",
    priceZar: 350,
    description: "100% cotton, screen-printed BliximStraat logo. Regular fit.",
    image: imgMenBlue,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "men-tee-grey",
    name: "Men's Tee — Grey",
    category: "Shirts",
    priceZar: 350,
    description: "100% cotton, screen-printed BliximStraat logo. Regular fit.",
    image: imgMenGrey,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "women-tee-blue",
    name: "Women's Tee — Blue",
    category: "Shirts",
    priceZar: 350,
    description: "100% cotton, screen-printed BliximStraat logo. Slim fit.",
    image: imgWomenBlue,
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "women-tee-grey",
    name: "Women's Tee — Grey",
    category: "Shirts",
    priceZar: 350,
    description: "100% cotton, screen-printed BliximStraat logo. Slim fit.",
    image: imgWomenGrey,
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "cap-blue",
    name: "Blue Snapback Cap",
    category: "Caps",
    priceZar: 280,
    description: "Embroidered logo, adjustable snapback closure.",
    image: imgBlueCap,
    sizes: ["One Size"],
  },
  {
    id: "cap-mooiste",
    name: "Mooiste Cap",
    category: "Caps",
    priceZar: 280,
    description: "Embroidered logo, adjustable snapback closure.",
    image: imgMooisteCap,
    sizes: ["One Size"],
  },
  {
    id: "cap-orange-jean",
    name: "Orange Jean Cap",
    category: "Caps",
    priceZar: 300,
    description: "Denim-style brim, embroidered logo, adjustable strap.",
    image: imgOrangeJeanCap,
    sizes: ["One Size"],
  },
  {
    id: "cap-stupid",
    name: "Stupid Cap",
    category: "Caps",
    priceZar: 280,
    description: "Embroidered logo, adjustable snapback closure.",
    image: imgStupidCap,
    sizes: ["One Size"],
  },
];

const WHATSAPP_NUMBER = "27759572550";

function buildWhatsappLink(item: MerchItem) {
  const sizeNote =
    item.sizes.length === 1 && item.sizes[0] === "One Size"
      ? ""
      : " — Size: [please fill in]";
  const msg = encodeURIComponent(
    `Hi! I'd like to order the ${item.name} (R${item.priceZar})${sizeNote}. Please confirm availability and delivery details.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

const CATEGORIES: Category[] = ["All", "Shirts", "Caps"];

export default function Merch() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragDelta = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const filtered = MERCH.filter(
    (item) => activeCategory === "All" || item.category === activeCategory
  );

  // Clamp index when filtered list changes
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, filtered.length - 1)));
    },
    [filtered.length]
  );

  const prev = () => goTo(activeIndex - 1);
  const next = () => goTo(activeIndex + 1);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // Touch / mouse drag
  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStartX.current = e.clientX;
    dragDelta.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    dragDelta.current = e.clientX - dragStartX.current;
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragDelta.current < -50) next();
    else if (dragDelta.current > 50) prev();
    dragDelta.current = 0;
  };

  const item = filtered[activeIndex];

  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden flex flex-col"
      style={{ background: "#000000" }}
    >
      <VideoBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-6 py-12">

            {/* Header */}
            <header className="mb-10">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-3">
                Store
              </p>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">Merch</h1>
              <p className="mt-2 text-sm text-white/40 max-w-lg">
                Official BliximStraat gear. Order via WhatsApp — we'll confirm availability and handle delivery.
              </p>
            </header>

            {/* Category tabs */}
            <div className="flex items-center gap-1 mb-10">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveIndex(0);
                    }}
                    className="relative px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] rounded-full transition-all duration-200"
                    style={{
                      color: isActive ? "#000" : "rgba(255,255,255,0.45)",
                      background: isActive ? "#fff" : "transparent",
                      border: isActive
                        ? "1px solid #fff"
                        : "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {cat}
                    {cat !== "All" && (
                      <span
                        className="ml-2 text-[9px]"
                        style={{ color: isActive ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.25)" }}
                      >
                        {MERCH.filter((m) => m.category === cat).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Carousel */}
            {filtered.length > 0 && item ? (
              <div className="select-none">
                {/* Main card */}
                <div
                  ref={trackRef}
                  className="relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <div className="flex flex-col md:flex-row">

                    {/* Image panel */}
                    <div
                      className="md:w-1/2 aspect-square md:aspect-auto md:min-h-[480px] relative overflow-hidden flex-shrink-0"
                      style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <img
                        key={item.id}
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-opacity duration-300"
                        draggable={false}
                      />
                      {item.isPreorder && (
                        <span
                          className="absolute top-5 left-5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-white rounded-full"
                          style={{
                            background: "rgba(255,0,144,0.15)",
                            border: "1px solid rgba(255,0,144,0.3)",
                          }}
                        >
                          Pre-order
                        </span>
                      )}
                      {/* Slide counter badge */}
                      <span
                        className="absolute bottom-5 left-5 px-3 py-1 text-[10px] font-medium text-white/50 rounded-full"
                        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {activeIndex + 1} / {filtered.length}
                      </span>
                    </div>

                    {/* Info panel */}
                    <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/30 mb-3">
                          {item.category}
                        </p>
                        <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white leading-tight">
                          {item.name}
                        </h2>
                        <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-sm">
                          {item.description}
                        </p>

                        {/* Sizes */}
                        <div className="mt-8">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-white/30 mb-3">
                            Sizes
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.sizes.map((size) => (
                              <span
                                key={size}
                                className="px-3 py-1.5 text-xs font-medium text-white/70 rounded-md"
                                style={{ border: "1px solid rgba(255,255,255,0.14)" }}
                              >
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-10">
                        <div className="flex items-baseline gap-2 mb-6">
                          <span className="text-4xl font-light text-white">R{item.priceZar}</span>
                          <span className="text-xs text-white/30">ZAR</span>
                        </div>

                        <a
                          href={buildWhatsappLink(item)}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full text-center py-3.5 text-sm font-medium text-black bg-white rounded-lg hover:bg-white/90 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Order via WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation row */}
                <div className="mt-6 flex items-center justify-between">
                  {/* Prev / Next arrows */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={prev}
                      disabled={activeIndex === 0}
                      className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 disabled:opacity-20"
                      style={{ border: "1px solid rgba(255,255,255,0.14)" }}
                      aria-label="Previous"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 3L5 8L10 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={next}
                      disabled={activeIndex === filtered.length - 1}
                      className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 disabled:opacity-20"
                      style={{ border: "1px solid rgba(255,255,255,0.14)" }}
                      aria-label="Next"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 3L11 8L6 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  {/* Dot indicators */}
                  <div className="flex items-center gap-2">
                    {filtered.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goTo(i)}
                        className="transition-all duration-300 rounded-full"
                        style={{
                          width: i === activeIndex ? "24px" : "6px",
                          height: "6px",
                          background: i === activeIndex ? "#fff" : "rgba(255,255,255,0.2)",
                        }}
                        aria-label={`Go to item ${i + 1}`}
                      />
                    ))}
                  </div>

                  {/* Thumbnail strip */}
                  <div className="hidden sm:flex items-center gap-2">
                    {filtered.map((m, i) => (
                      <button
                        key={m.id}
                        onClick={() => goTo(i)}
                        className="w-12 h-12 rounded-lg overflow-hidden transition-all duration-200 flex-shrink-0"
                        style={{
                          border: i === activeIndex
                            ? "1.5px solid rgba(255,255,255,0.6)"
                            : "1.5px solid rgba(255,255,255,0.1)",
                          opacity: i === activeIndex ? 1 : 0.45,
                        }}
                        aria-label={m.name}
                      >
                        <img src={m.image} alt={m.name} className="w-full h-full object-cover" draggable={false} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl p-14 text-center"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="text-white/25 text-base font-light">No items in this category yet.</div>
              </div>
            )}

            <p className="mt-12 text-xs text-white/25 text-center">
              All orders handled via WhatsApp. Delivery within South Africa.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
