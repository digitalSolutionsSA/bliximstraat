import React, { useLayoutEffect, useRef, useState } from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";

// ✅ Cart badge button
import CartButton from "../cart/CartButton";


type NavbarProps = {
  overlayOnHome?: boolean;
};

export default function Navbar({ overlayOnHome = true }: NavbarProps) {
  const { pathname } = useLocation();

  const headerRef = useRef<HTMLElement | null>(null);
  const [contentTop, setContentTop] = useState<number>(0);

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

  return (
    <>
      <audio id="main-audio" src="/audio/intro.mp3" preload="auto" loop />

      {/* NAVBAR + ATTACHED BUTTONS */}
      <header ref={headerRef} className="fixed top-14 inset-x-0 z-50">
        <div className="relative mx-auto max-w-6xl px-6">
          {/* LEFT PILL */}
          <div
            className="
              absolute
              left-[-4.5rem]
              top-0
              h-12
              px-4
              flex items-center justify-center
              bg-black/60 backdrop-blur-sm
              border border-white/15
              rounded-2xl
            "
          >
            <NavItem to="/profile" label="Profile" />
          </div>

          {/* NAVBAR */}
          <div
            className="
              h-12
              flex items-center
              bg-black/60 backdrop-blur-sm
              border border-white/15
              rounded-2xl
            "
          >
            <nav className="grid grid-cols-7 w-full text-sm font-semibold tracking-wide text-white/90">
              <NavSlot>
                <NavItem to="/music" label="Music" />
              </NavSlot>
              <NavSlot>
                <NavItem to="/shows" label="Shows" />
              </NavSlot>
              <NavSlot>
                <NavItem to="/merch" label="Merch" />
              </NavSlot>
              <div />
              <NavSlot>
                <NavItem to="/about" label="About" />
              </NavSlot>
              <NavSlot>
                <NavItem to="/lyrics" label="Lyrics" />
              </NavSlot>
              <NavSlot>
                <NavItem to="/bookings" label="Bookings" />
              </NavSlot>
            </nav>

            {/* CENTER LOGO */}
            <RouterNavLink to="/" aria-label="Home">
              <img
                src="/bliximstraat-logo.png"
                alt="Bliximstraat"
                className="
                  absolute
                  left-1/2 top-1/2
                  -translate-x-1/2 -translate-y-[45%]
                  h-28 sm:h-32 md:h-36 lg:h-60
                  drop-shadow-[0_20px_56px_rgba(0,0,0,0.95)]
                  select-none
                "
              />
            </RouterNavLink>
          </div>

          {/* RIGHT PILL (Cart modal trigger + badge) */}
          <div
            className="
              absolute
              right-[-4.5rem]
              top-0
              h-12
              px-4
              flex items-center justify-center
              bg-black/60 backdrop-blur-sm
              border border-white/15
              rounded-2xl
            "
          >
            <CartPill />
          </div>
        </div>
      </header>

      {topOffset > 0 && <div style={{ height: topOffset }} />}
    </>
  );
}

/* ---------- helpers ---------- */

function NavSlot({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-center items-center">{children}</div>;
}

function NavItem({ to, label }: { to: string; label: string }) {
  const handleClick = () => {
    const audio = document.getElementById("main-audio") as HTMLAudioElement | null;
    audio?.play().catch(() => {});
  };

  return (
    <RouterNavLink
      to={to}
      onClick={handleClick}
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

/* ---------- cart pill ---------- */

function CartPill() {
  const handleClick = () => {
    const audio = document.getElementById("main-audio") as HTMLAudioElement | null;
    audio?.play().catch(() => {});
  };

  return (
    <div onClick={handleClick} className="flex items-center">
      {/* CartButton handles opening the modal + badge count */}
      <CartButton />
    </div>
  );
}
