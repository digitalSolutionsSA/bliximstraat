import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { MoreHorizontal, X, User } from "lucide-react";

// ✅ Cart badge button
import CartButton from "../cart/CartButton";

type NavbarProps = {
  overlayOnHome?: boolean;
};

const NAV_LINKS = [
  { to: "/music", label: "Music" },
  { to: "/shows", label: "Shows" },
  { to: "/merch", label: "Merch" },
  { to: "/about", label: "About" },
  { to: "/lyrics", label: "Lyrics" },
  { to: "/bookings", label: "Bookings" },
];

export default function Navbar({ overlayOnHome = true }: NavbarProps) {
  const { pathname } = useLocation();

  const headerRef = useRef<HTMLElement | null>(null);
  const [contentTop, setContentTop] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useLayoutEffect(() => {
    const compute = () => {
      const header = headerRef.current;
      if (!header) return;
      const rect = header.getBoundingClientRect();
      setContentTop(Math.ceil(rect.bottom + 24));
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const topOffset = overlayOnHome && pathname === "/" ? 0 : contentTop;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      <audio id="main-audio" src="/audio/intro.mp3" preload="auto" loop />

      <header ref={headerRef} className="fixed top-14 inset-x-0 z-50">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* LEFT PILL – DESKTOP */}
          <div className="hidden md:flex absolute left-[-4.5rem] top-0 h-12 px-4 items-center justify-center bg-black/60 backdrop-blur-sm border border-white/15 rounded-2xl">
            <IconNavItem to="/profile" label="Profile">
              <User className="h-5 w-5" />
            </IconNavItem>
          </div>

          {/* NAVBAR */}
          <div className="relative h-12 flex items-center bg-black/60 backdrop-blur-sm border border-white/15 rounded-2xl">
            {/* DESKTOP NAV */}
            <nav className="hidden md:grid grid-cols-7 w-full text-sm font-semibold tracking-wide text-white/90">
              <NavSlot><NavItem to="/music" label="Music" /></NavSlot>
              <NavSlot><NavItem to="/shows" label="Shows" /></NavSlot>
              <NavSlot><NavItem to="/merch" label="Merch" /></NavSlot>
              <div />
              <NavSlot><NavItem to="/about" label="About" /></NavSlot>
              <NavSlot><NavItem to="/lyrics" label="Lyrics" /></NavSlot>
              <NavSlot><NavItem to="/bookings" label="Bookings" /></NavSlot>
            </nav>

            {/* MOBILE BAR */}
            <div className="md:hidden w-full flex items-center justify-between px-3">
              {/* Profile + Cart */}
              <div className="flex items-center gap-3">
                <IconNavItem to="/profile" label="Profile">
                  <User className="h-5 w-5" />
                </IconNavItem>
                <div onClick={playClickAudio}>
                  <CartButton />
                </div>
              </div>

              {/* Menu dots */}
              <button
                type="button"
                onClick={() => setMobileOpen(v => !v)}
                className="p-2 text-white/90 hover:text-white transition"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
              </button>
            </div>

            {/* CENTER LOGO */}
            <RouterNavLink to="/" aria-label="Home" onClick={playClickAudio}>
              <img
                src="/bliximstraat-logo.png"
                alt="Bliximstraat"
                className="
                  absolute left-1/2 top-1/2
                  -translate-x-1/2 -translate-y-[45%]
                  h-24 sm:h-28 md:h-36 lg:h-60
                  drop-shadow-[0_20px_56px_rgba(0,0,0,0.95)]
                  select-none
                "
              />
            </RouterNavLink>
          </div>

          {/* RIGHT PILL – DESKTOP */}
          <div className="hidden md:flex absolute right-[-4.5rem] top-0 h-12 px-4 items-center justify-center bg-black/60 backdrop-blur-sm border border-white/15 rounded-2xl">
            <CartPill />
          </div>
        </div>
      </header>

      {topOffset > 0 && <div style={{ height: topOffset }} />}

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu backdrop"
            type="button"
          />

          <div className="absolute left-1/2 top-[6.5rem] w-[92%] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-2xl">
            <div className="p-3 grid gap-1">
              {NAV_LINKS.map(l => (
                <RouterNavLink
                  key={l.to}
                  to={l.to}
                  onClick={playClickAudio}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-base font-semibold transition border border-white/10
                     ${isActive ? "bg-white/10 text-white" : "bg-white/5 text-white/85 hover:bg-white/10"}`
                  }
                >
                  {l.label}
                </RouterNavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- helpers ---------- */

function playClickAudio() {
  const audio = document.getElementById("main-audio") as HTMLAudioElement | null;
  audio?.play().catch(() => {});
}

function NavSlot({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-center items-center">{children}</div>;
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <RouterNavLink
      to={to}
      onClick={playClickAudio}
      className={({ isActive }) =>
        `group relative whitespace-nowrap transition-colors ${
          isActive ? "text-white" : "text-white/85 hover:text-white"
        }`
      }
    >
      {label}
      <span className="absolute left-0 -bottom-2 h-[2px] bg-white/70 w-0 group-hover:w-full transition-all" />
      <span className="absolute left-0 -bottom-2 h-[2px] bg-white/70 w-0 group-[.active]:w-full transition-all" />
    </RouterNavLink>
  );
}

function IconNavItem({
  to,
  label,
  children,
}: {
  to: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <RouterNavLink
      to={to}
      onClick={playClickAudio}
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        `inline-flex items-center justify-center h-8 w-8 transition-colors
         ${isActive ? "text-white" : "text-white/85 hover:text-white"}`
      }
    >
      {children}
    </RouterNavLink>
  );
}

function CartPill() {
  return (
    <div onClick={playClickAudio} className="flex items-center">
      <CartButton />
    </div>
  );
}
