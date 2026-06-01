import { NavLink } from "react-router-dom";

const navLinks = [
  { label: "Music",    to: "/music" },
  { label: "Shows",    to: "/shows" },
  { label: "Merch",    to: "/merch" },
  { label: "About",    to: "/about" },
  { label: "Bookings", to: "/bookings" },
];

const socialLinks = [
  { label: "Instagram",   href: "https://www.instagram.com/blixim_straat?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" },
  { label: "TikTok",      href: "https://www.tiktok.com/@bliximstraat?is_from_webapp=1&sender_device=pc" },
  { label: "YouTube",     href: "http://www.youtube.com/channel/UCaRgHj3J8RjDuS_eyZXdepA" },
  { label: "Spotify",     href: "https://open.spotify.com/artist/0Ch8nVFZCWFF95IXTcgLgT?si=_XGxnXrjQ_CSVaxPAoNxNA" },
  { label: "Apple Music", href: "https://music.apple.com/us/artist/blixim-straat/1761419580" },
];

export default function Footer() {
  return (
    <footer
      className="relative text-white"
      style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "#000" }}
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-12 md:grid-cols-3">

          {/* SITE */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-5">
              Navigate
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className="text-sm text-white/50 hover:text-white transition-colors duration-200"
                  style={({ isActive }) => ({
                    color: isActive ? "#ffffff" : undefined,
                  })}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* SOCIAL */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-5">
              Follow
            </p>
            <ul className="space-y-2.5">
              {socialLinks.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-white/50 hover:text-white transition-colors duration-200"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-5">
              Contact
            </p>
            <p className="text-sm text-white/40 leading-relaxed mb-5">
              Bookings, media enquiries, and general questions.
            </p>
            <div className="space-y-2.5">
              <a
                href="mailto:management@bliximstraat.com"
                className="block text-sm text-white/55 hover:text-white transition-colors duration-200"
              >
                management@bliximstraat.com
              </a>
              <a
                href="tel:+27713348346"
                className="block text-sm text-white/55 hover:text-white transition-colors duration-200"
              >
                +27 71 334 8346
              </a>
            </div>
            <NavLink
              to="/bookings"
              className="inline-flex items-center mt-6 text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
            >
              Book us &rarr;
            </NavLink>
          </div>
        </div>

        {/* BOTTOM */}
        <div
          className="mt-12 pt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} Bliximstraat. All rights reserved.
          </p>
          <a
            href="https://www.digitalsolutionssa.co.za"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-white/25 hover:text-white/50 transition-colors duration-200"
          >
            Built by Digital Solutions SA
          </a>
        </div>
      </div>
    </footer>
  );
}
