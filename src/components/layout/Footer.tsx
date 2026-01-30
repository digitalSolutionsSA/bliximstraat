import { NavLink } from "react-router-dom";

const navLinks = [
  { label: "Music", to: "/music" },
  { label: "Shows", to: "/shows" },
  { label: "Merch", to: "/merch" },
  { label: "About", to: "/about" },
  { label: "Lyrics", to: "/lyrics" },
  { label: "Bookings", to: "/bookings" },
  { label: "Profile", to: "/profile" },
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/blixim_straat?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" },
  { label: "TikTok", href: "https://www.tiktok.com/@bliximstraat?is_from_webapp=1&sender_device=pc" },
  { label: "YouTube", href: "http://www.youtube.com/channel/UCaRgHj3J8RjDuS_eyZXdepA" },
  { label: "Spotify", href: "https://open.spotify.com/artist/0Ch8nVFZCWFF95IXTcgLgT?si=_XGxnXrjQ_CSVaxPAoNxNA" },
  { label: "Apple Music", href: "https://music.apple.com/us/artist/blixim-straat/1761419580" },
];

export default function Footer() {
  return (
    <footer
      className="
        relative
        border-t border-white/10
        bg-black/60
        backdrop-blur-md
        text-white
      "
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-10 md:grid-cols-3">
          {/* SITE */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.25em] text-white/70">
              Site
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    [
                      "rounded-xl px-3 py-2 text-sm font-semibold transition",
                      "border backdrop-blur-sm",
                      isActive
                        ? "bg-white/90 text-black border-white/90"
                        : "bg-black/30 text-white/80 border-white/15 hover:border-white/30 hover:text-white",
                    ].join(" ")
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* SOCIAL */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.25em] text-white/70">
              Social
            </h3>

            <ul className="mt-4 space-y-2">
              {socialLinks.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-white/75 hover:text-white transition"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.25em] text-white/70">
              Contact us
            </h3>

            <p className="mt-4 text-sm text-white/65">
              Bookings, collaborations, press, or controlled chaos.
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <a
                href="mailto:bookings@bliximstraat.com"
                className="block font-semibold text-white/80 hover:text-white transition"
              >
                bookings@bliximstraat.com
              </a>
              <a
                href="tel:+27686771511"
                className="block font-semibold text-white/80 hover:text-white transition"
              >
                +27 68 677 1511
              </a>
            </div>

            <div className="mt-5">
              <NavLink
                to="/bookings"
                className="
                  inline-flex items-center justify-center
                  rounded-xl
                  bg-white/90 text-black
                  px-4 py-2
                  text-sm font-extrabold uppercase tracking-tight
                  hover:bg-white
                  transition
                "
              >
                Book us
              </NavLink>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} Bliximstraat. All rights reserved.
          </p>
          <p className="text-xs text-white/45">
            Built loud. Shipped clean.
          </p>
        </div>
      </div>
    </footer>
  );
}
