import { useEffect, useState } from "react";

type ConsentChoice = "all" | "essential";

const STORAGE_KEY = "blix_cookie_consent_v1";

function getStoredConsent(): ConsentChoice | null {
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "all" || v === "essential") return v;
  return null;
}

function setStoredConsent(v: ConsentChoice) {
  localStorage.setItem(STORAGE_KEY, v);
}

export default function CookieConsent({
  privacyPath = "/privacy",
  brandName = "BliximStraat",
}: {
  privacyPath?: string;
  brandName?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // show once, first visit
    const existing = getStoredConsent();
    if (!existing) setOpen(true);
  }, []);

  function choose(choice: ConsentChoice) {
    setStoredConsent(choice);
    setOpen(false);

    // If you have analytics, you can enable/disable here:
    // if (choice === "all") enableAnalytics();
    // else disableAnalytics();
  }

  if (!open) return null;

  return (
    <>
      <div
        className="cc-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Cookie consent"
      >
        <div className="cc-card">
          <div className="cc-header">
            <div className="cc-title">Cookies & POPIA</div>
            <button
              className="cc-x"
              onClick={() => choose("essential")}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <p className="cc-text">
            We use essential cookies to keep {brandName} working properly. With
            your permission, we may also use optional cookies for analytics so we
            can improve the site and understand demand by region. Your choice is
            saved in your browser.
          </p>

          <div className="cc-actions">
            <button
              className="cc-btn cc-secondary"
              onClick={() => choose("essential")}
            >
              Essential only
            </button>
            <button
              className="cc-btn cc-primary"
              onClick={() => choose("all")}
            >
              Accept all
            </button>
          </div>

          <div className="cc-foot">
            Read our{" "}
            <a className="cc-link" href={privacyPath}>
              Privacy Policy
            </a>{" "}
            for details.
          </div>
        </div>
      </div>

      <style>{`
        :root{
          --blix-ink: #081a24;
          --blix-teal: #2fb6c6;
          --blix-teal2: #1d7e92;
          --blix-cream: #f2dfb0;
        }

        .cc-overlay{
          position: fixed;
          inset: 0;
          z-index: 12000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 18px;
          background: rgba(0,0,0,0.62);
        }

        .cc-card{
          width: min(720px, 100%);
          border-radius: 18px;
          border: 2px solid rgba(0,0,0,0.55);
          background: rgba(8,26,36,0.92);
          backdrop-filter: blur(10px);
          padding: 16px;
          box-shadow: 0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(47,182,198,0.16) inset;
        }

        .cc-header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 12px;
          margin-bottom: 8px;
        }

        .cc-title{
          font-weight: 900;
          letter-spacing: 0.02em;
          font-size: 16px;
          color: var(--blix-cream);
          text-shadow: 0 2px 0 rgba(0,0,0,0.45);
        }

        .cc-x{
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }
        .cc-x:hover{ color: rgba(255,255,255,0.95); }

        .cc-text{
          margin: 0;
          color: rgba(255,255,255,0.78);
          font-size: 13px;
          line-height: 1.35rem;
        }

        .cc-actions{
          display:flex;
          justify-content:flex-end;
          gap: 10px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .cc-btn{
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 900;
          letter-spacing: 0.01em;
        }

        .cc-secondary{
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.92);
          border: 1px solid rgba(255,255,255,0.10);
        }
        .cc-secondary:hover{ background: rgba(255,255,255,0.10); }

        .cc-primary{
          background:
            radial-gradient(circle at 25% 20%, rgba(255,255,255,0.18), transparent 45%),
            linear-gradient(135deg, var(--blix-teal), var(--blix-teal2));
          color: var(--blix-ink);
          border: 2px solid rgba(0,0,0,0.45);
          box-shadow: 0 10px 22px rgba(0,0,0,0.25), 0 0 0 4px rgba(47,182,198,0.10);
        }
        .cc-primary:hover{ filter: brightness(1.03); }

        .cc-foot{
          margin-top: 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.55);
        }
        .cc-link{
          color: rgba(242,223,176,0.95);
          font-weight: 800;
          text-decoration: none;
        }
        .cc-link:hover{ text-decoration: underline; }
      `}</style>
    </>
  );
}