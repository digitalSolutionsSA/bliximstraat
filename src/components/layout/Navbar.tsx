import { useEffect, useState } from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { X, Menu } from "lucide-react";

type NavbarProps = {
  overlayOnHome?: boolean;
};

// ── Social icon SVGs ──────────────────────────────────────────────────────────

function SpotifyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function YouTubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
    </svg>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function AppleMusicIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: "/music",    label: "Music"    },
  { to: "/shows",    label: "Shows"    },
  { to: "/merch",    label: "Merch"    },
  { to: "/about",    label: "About"    },
  { to: "/bookings", label: "Bookings" },
];

type IconComponent = React.ComponentType<{ size?: number }>;

const SOCIAL_LINKS: { href: string; label: string; Icon: IconComponent }[] = [
  { href: "https://open.spotify.com/artist/0Ch8nVFZCWFF95IXTcgLgT?si=_XGxnXrjQ_CSVaxPAoNxNA", label: "Spotify",     Icon: SpotifyIcon     },
  { href: "http://www.youtube.com/channel/UCaRgHj3J8RjDuS_eyZXdepA",                            label: "YouTube",     Icon: YouTubeIcon     },
  { href: "https://www.instagram.com/blixim_straat?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", label: "Instagram",   Icon: InstagramIcon   },
  { href: "https://www.tiktok.com/@bliximstraat?is_from_webapp=1&sender_device=pc",              label: "TikTok",      Icon: TikTokIcon      },
  { href: "https://music.apple.com/us/artist/blixim-straat/1761419580",                          label: "Apple Music", Icon: AppleMusicIcon  },
];

const BAR_H = 64;

// ── Component ─────────────────────────────────────────────────────────────────

export default function Navbar({ overlayOnHome = true }: NavbarProps) {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = overlayOnHome && pathname === "/";

  useEffect(() => {
    if (!isHome) { setScrolled(true); return; }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const bg     = scrolled ? "rgba(5,5,5,0.96)"         : "rgba(0,0,0,0)";
  const border = scrolled ? "rgba(255,255,255,0.07)"    : "rgba(255,255,255,0)";
  const blur   = scrolled ? "blur(20px)"                : "none";

  return (
    <>
      <audio id="main-audio" src="/audio/intro.mp3" preload="auto" loop />

      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{ height: BAR_H, background: bg, backdropFilter: blur, WebkitBackdropFilter: blur, borderBottom: `1px solid ${border}` }}
      >
        <div className="mx-auto h-full max-w-7xl px-6 flex items-center gap-8">

          {/* ── LEFT: Logo ── */}
          <RouterNavLink
            to="/"
            aria-label="Home"
            onClick={playClickAudio}
            className="shrink-0 flex items-center"
          >
            <img
              src="/bliximstraat-logo.png"
              alt="Bliximstraat"
              className="h-9 w-auto object-contain select-none"
              draggable={false}
            />
          </RouterNavLink>

          {/* ── CENTER: Nav links (desktop) ── */}
          <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {NAV_LINKS.map(l => <NavItem key={l.to} to={l.to} label={l.label} />)}
          </nav>

          {/* ── RIGHT: Social icons + Book Now (desktop) ── */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="text-white/40 hover:text-white transition-colors duration-200"
              >
                <s.Icon size={16} />
              </a>
            ))}

            <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.10)" }} />

            <RouterNavLink
              to="/bookings"
              onClick={playClickAudio}
              className="px-5 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white rounded-sm transition-opacity duration-200 hover:opacity-85"
              style={{ background: "#FF0090" }}
            >
              Book Now
            </RouterNavLink>
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            type="button"
            className="md:hidden ml-auto p-2 text-white/55 hover:text-white transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Spacer for non-overlay pages */}
      {!isHome && <div style={{ height: BAR_H }} />}

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            type="button"
          />
          <div
            className="absolute top-16 inset-x-0"
            style={{ background: "rgba(0,0,0,0.97)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <nav className="px-5 py-3 space-y-0.5">
              {NAV_LINKS.map(l => (
                <RouterNavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => { playClickAudio(); setMobileOpen(false); }}
                  className="flex items-center px-3 py-3.5 rounded-lg transition-colors"
                  style={({ isActive }) => ({
                    background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                    color:      isActive ? "#ffffff"                 : "rgba(255,255,255,0.48)",
                  })}
                >
                  <span className="text-[13px] font-medium tracking-[0.16em] uppercase">{l.label}</span>
                </RouterNavLink>
              ))}

              {/* Mobile: social icons + Book Now */}
              <div
                className="pt-4 mt-2 pb-2 px-3 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-4">
                  {SOCIAL_LINKS.map(s => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <s.Icon size={18} />
                    </a>
                  ))}
                </div>
                <RouterNavLink
                  to="/bookings"
                  onClick={() => { playClickAudio(); setMobileOpen(false); }}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white rounded-sm"
                  style={{ background: "#FF0090" }}
                >
                  Book Now
                </RouterNavLink>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function playClickAudio() {
  const audio = document.getElementById("main-audio") as HTMLAudioElement | null;
  audio?.play().catch(() => {});
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <RouterNavLink
      to={to}
      onClick={playClickAudio}
      className="relative text-[11px] font-medium uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-200"
    >
      {({ isActive }) => (
        <>
          <span style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.45)" }}>
            {label}
          </span>
          <span
            className="absolute -bottom-1 left-0 right-0 h-px transition-opacity duration-200"
            style={{ background: "#FF0090", opacity: isActive ? 1 : 0 }}
          />
        </>
      )}
    </RouterNavLink>
  );
}
