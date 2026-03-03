import React, { useEffect, useMemo, useState } from "react";

type Province =
  | "Gauteng"
  | "Western Cape"
  | "KwaZulu-Natal"
  | "Eastern Cape"
  | "Free State"
  | "Limpopo"
  | "Mpumalanga"
  | "North West"
  | "Northern Cape";

const PROVINCES: Province[] = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

type FormState = {
  name: string;
  town: string;
  province: Province | "";
  wantsShow: boolean;
  isVenue: boolean;
  message: string;
};

function encodeWhatsAppText(text: string) {
  return encodeURIComponent(text);
}

export default function PinWhatsApp({
  artistName = "Storm Sintese",
  whatsappNumberE164 = "27720000000", // e.g. 27821234567 (NO +)
  submitEndpoint = "/.netlify/functions/booking-signal",
}: {
  artistName?: string;
  whatsappNumberE164: string;
  submitEndpoint?: string;
}) {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    town: "",
    province: "",
    wantsShow: true,
    isVenue: false,
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // speech bubble visibility (dismissible)
  const [showNudge, setShowNudge] = useState(true);

  // tasteful shake pulse: tiny nudge every ~8s (button also flickers constantly via CSS)
  const [shakePulse, setShakePulse] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setShakePulse(true);
      const t = setTimeout(() => setShakePulse(false), 650);
      return () => clearTimeout(t);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const canSubmit = useMemo(() => {
    return form.town.trim().length >= 2 && form.province !== "";
  }, [form.town, form.province]);

  const waText = useMemo(() => {
    const lines = [
      `Hi! I’m supporting ${artistName}.`,
      `I’m from: ${form.town}${form.province ? `, ${form.province}` : ""}`,
      `Want a show here: ${form.wantsShow ? "Yes" : "No"}`,
      `I’m a venue/organizer: ${form.isVenue ? "Yes" : "No"}`,
      form.name.trim() ? `Name: ${form.name.trim()}` : "",
      form.message.trim() ? `Message: ${form.message.trim()}` : "",
    ].filter(Boolean);

    return lines.join("\n");
  }, [artistName, form]);

  async function submit() {
    setError(null);

    if (!canSubmit) {
      setError("Please add your town and province.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(submitEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || null,
          town: form.town.trim(),
          province: form.province,
          wants_show: form.wantsShow,
          is_venue: form.isVenue,
          message: form.message.trim() || null,
          source: "pin_button",
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Submit failed");
      }

      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || "Something went wrong submitting.");
    } finally {
      setSubmitting(false);
    }
  }

  function openWhatsApp() {
    const url = `https://wa.me/${whatsappNumberE164}?text=${encodeWhatsAppText(
      waText
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* Floating Pin + Nudge Bubble */}
      <div className="pin-float-wrap" aria-hidden={false}>
        {!open && showNudge && (
          <div className="pin-nudge" role="note">
            <div className="pin-nudge-text">Want to see us perform near you?</div>
            <button
              type="button"
              className="pin-nudge-close"
              aria-label="Dismiss"
              onClick={() => setShowNudge(false)}
            >
              ✕
            </button>
            <div className="pin-nudge-arrow" />
          </div>
        )}

        <button
          type="button"
          aria-label="Share your location and request a performance"
          className={`pin-float ${shakePulse ? "pin-shake" : ""}`}
          onClick={() => {
            setSubmitted(false);
            setError(null);
            setOpen(true);
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 22s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12z"
              fill="currentColor"
              opacity="0.95"
            />
            <circle cx="12" cy="10" r="2.7" fill="#0b0f18" opacity="0.95" />
            <circle cx="12" cy="10" r="1.45" fill="#ffffff" opacity="0.95" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="pin-overlay" role="dialog" aria-modal="true">
          <div className="pin-modal">
            <div className="pin-header">
              <div>
                <div className="pin-title">Where are you listening from?</div>
                <div className="pin-sub">
                  Drop your town + province. Venues can see where demand is.
                </div>
              </div>
              <button
                className="pin-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {!submitted ? (
              <>
                <div className="pin-grid">
                  <label className="pin-label">
                    Name (optional)
                    <input
                      className="pin-input"
                      value={form.name}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, name: e.target.value }))
                      }
                      placeholder="e.g. Pieter"
                    />
                  </label>

                  <label className="pin-label">
                    Town / City *
                    <input
                      className="pin-input"
                      value={form.town}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, town: e.target.value }))
                      }
                      placeholder="e.g. Pretoria"
                      required
                    />
                  </label>

                  <label className="pin-label">
                    Province *
                    <select
                      className="pin-input pin-select"
                      value={form.province}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          province: e.target.value as Province,
                        }))
                      }
                      required
                    >
                      <option value="">Select province</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="pin-row">
                    <label className="pin-check">
                      <input
                        type="checkbox"
                        checked={form.wantsShow}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, wantsShow: e.target.checked }))
                        }
                      />
                      I want him to perform in my city
                    </label>

                    <label className="pin-check">
                      <input
                        type="checkbox"
                        checked={form.isVenue}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, isVenue: e.target.checked }))
                        }
                      />
                      I’m a venue / organizer
                    </label>
                  </div>

                  <label className="pin-label pin-span">
                    Message (optional)
                    <textarea
                      className="pin-input pin-textarea"
                      value={form.message}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, message: e.target.value }))
                      }
                      placeholder="Venue name, contact, or any info..."
                      rows={4}
                    />
                  </label>
                </div>

                {error && <div className="pin-error">{error}</div>}

                <div className="pin-actions">
                  <button
                    className="pin-btn pin-secondary"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    Not now
                  </button>

                  <button
                    className="pin-btn pin-primary"
                    onClick={submit}
                    disabled={!canSubmit || submitting}
                    type="button"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>

                <div className="pin-foot">
                  After submitting, you can also WhatsApp the artist with the same
                  details.
                </div>
              </>
            ) : (
              <>
                <div className="pin-success">
                  Saved. Your area now counts toward demand.
                </div>

                <div className="pin-actions">
                  <button
                    className="pin-btn pin-secondary"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                  <button className="pin-btn pin-primary" onClick={openWhatsApp}>
                    Send via WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        :root{
          --blix-bg: #0b0f18;
          --blix-panel: rgba(10,14,22,0.92);
          --blix-border: rgba(140,190,255,0.18);
          --blix-text: rgba(255,255,255,0.92);
          --blix-muted: rgba(255,255,255,0.68);
          --blix-cyan: #49d7ff;
          --blix-blue: #2a74ff;
          --blix-glow: rgba(73,215,255,0.22);
          --blix-glow-strong: rgba(42,116,255,0.25);
        }

        /* wrapper so we can attach a nudge bubble */
        .pin-float-wrap{
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        /* Nudge bubble */
        .pin-nudge{
          position: relative;
          max-width: 240px;
          background: rgba(8,12,20,0.88);
          border: 1px solid rgba(73,215,255,0.20);
          color: rgba(255,255,255,0.92);
          border-radius: 14px;
          padding: 10px 12px;
          box-shadow: 0 18px 48px rgba(0,0,0,0.45);
          backdrop-filter: blur(10px);
          animation: nudgeFloat 2.6s ease-in-out infinite;
        }
        @keyframes nudgeFloat{
          0%,100%{ transform: translateY(0); }
          50%{ transform: translateY(-3px); }
        }
        .pin-nudge-text{
          font-size: 12.5px;
          line-height: 1.25rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .pin-nudge-close{
          position: absolute;
          top: 6px;
          right: 8px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.65);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
        }
        .pin-nudge-close:hover{ color: rgba(255,255,255,0.9); }
        .pin-nudge-arrow{
          position: absolute;
          right: 18px;
          bottom: -8px;
          width: 14px;
          height: 14px;
          background: rgba(8,12,20,0.88);
          border-right: 1px solid rgba(73,215,255,0.20);
          border-bottom: 1px solid rgba(73,215,255,0.20);
          transform: rotate(45deg);
        }

        /* Floating button */
        .pin-float{
          width: 56px;
          height: 56px;
          border-radius: 999px;
          border: 1px solid rgba(73,215,255,0.25);
          cursor: pointer;
          display:flex;
          align-items:center;
          justify-content:center;

          background:
            radial-gradient(circle at 30% 20%, rgba(73,215,255,0.35), transparent 45%),
            linear-gradient(135deg, rgba(73,215,255,0.95), rgba(42,116,255,0.95));
          color: rgba(6,10,18,0.92);

          box-shadow:
            0 14px 30px rgba(0,0,0,0.35),
            0 0 0 6px rgba(73,215,255,0.08);
          transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;

          /* constant subtle flicker */
          animation: pinFlicker 2.2s ease-in-out infinite;
        }

        .pin-float:hover{
          transform: translateY(-1px);
          filter: saturate(1.05);
          box-shadow:
            0 16px 34px rgba(0,0,0,0.40),
            0 0 0 7px rgba(73,215,255,0.10);
        }

        @keyframes pinFlicker{
          0%{ box-shadow: 0 14px 30px rgba(0,0,0,0.35), 0 0 0 6px rgba(73,215,255,0.07); filter: brightness(1); }
          35%{ box-shadow: 0 16px 34px rgba(0,0,0,0.38), 0 0 0 6px rgba(73,215,255,0.11); filter: brightness(1.03); }
          55%{ box-shadow: 0 12px 26px rgba(0,0,0,0.32), 0 0 0 6px rgba(73,215,255,0.06); filter: brightness(0.98); }
          78%{ box-shadow: 0 18px 40px rgba(0,0,0,0.42), 0 0 0 7px rgba(42,116,255,0.12); filter: brightness(1.05); }
          100%{ box-shadow: 0 14px 30px rgba(0,0,0,0.35), 0 0 0 6px rgba(73,215,255,0.07); filter: brightness(1); }
        }

        .pin-shake{ animation: pinShake 0.65s ease-in-out; }
        @keyframes pinShake{
          0%{ transform: translateX(0) rotate(0deg); }
          18%{ transform: translateX(-2px) rotate(-3deg); }
          36%{ transform: translateX(2px) rotate(3deg); }
          54%{ transform: translateX(-1px) rotate(-2deg); }
          72%{ transform: translateX(1px) rotate(2deg); }
          100%{ transform: translateX(0) rotate(0deg); }
        }

        /* Modal */
        .pin-overlay{
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.66);
          z-index: 10000;
          display:flex;
          align-items:flex-end;
          justify-content:center;
          padding: 18px;
        }

        .pin-modal{
          width: min(580px, 100%);
          background: var(--blix-panel);
          color: var(--blix-text);
          border-radius: 18px;
          padding: 16px;
          border: 1px solid var(--blix-border);
          box-shadow:
            0 24px 70px rgba(0,0,0,0.55),
            0 0 0 1px rgba(255,255,255,0.04) inset;
          backdrop-filter: blur(10px);
        }

        .pin-header{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .pin-title{
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        .pin-sub{ font-size: 13px; color: var(--blix-muted); margin-top: 4px; }

        .pin-close{
          border:none;
          background: transparent;
          color: rgba(255,255,255,0.75);
          cursor:pointer;
          font-size: 18px;
          line-height: 1;
        }
        .pin-close:hover{ color: rgba(255,255,255,0.95); }

        .pin-grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .pin-span{ grid-column: 1 / -1; }

        .pin-label{
          display:flex;
          flex-direction:column;
          gap: 6px;
          font-size: 12px;
          color: rgba(255,255,255,0.82);
        }

        .pin-input{
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(140,190,255,0.16);
          border-radius: 12px;
          padding: 10px 12px;
          color: rgba(255,255,255,0.92);
          outline: none;
        }

        .pin-input::placeholder{
          color: rgba(255,255,255,0.45);
        }

        .pin-input:focus{
          border-color: rgba(73,215,255,0.55);
          box-shadow: 0 0 0 3px rgba(73,215,255,0.16);
        }

        /* make dropdown readable everywhere */
        .pin-select{
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding-right: 40px;
          background-image:
            linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.75) 50%),
            linear-gradient(135deg, rgba(255,255,255,0.75) 50%, transparent 50%);
          background-position:
            calc(100% - 18px) calc(50% - 2px),
            calc(100% - 12px) calc(50% - 2px);
          background-size: 6px 6px, 6px 6px;
          background-repeat: no-repeat;
        }

        /* The dropdown list itself (browser-dependent, but this helps a lot) */
        .pin-select option{
          background: #0b0f18;
          color: rgba(255,255,255,0.95);
        }

        .pin-textarea{ resize: vertical; min-height: 96px; }

        .pin-row{
          grid-column: 1 / -1;
          display:flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 2px;
        }

        .pin-check{
          display:flex;
          align-items:center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.88);
        }

        .pin-check input{
          width: 16px;
          height: 16px;
          accent-color: var(--blix-cyan);
        }

        .pin-actions{
          display:flex;
          justify-content:flex-end;
          gap: 10px;
          margin-top: 14px;
        }

        .pin-btn{
          border:none;
          border-radius: 12px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 800;
          letter-spacing: 0.01em;
        }

        .pin-btn:disabled{ opacity: 0.55; cursor: not-allowed; }

        .pin-secondary{
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.92);
          border: 1px solid rgba(255,255,255,0.10);
        }
        .pin-secondary:hover{ background: rgba(255,255,255,0.10); }

        .pin-primary{
          background:
            radial-gradient(circle at 25% 20%, rgba(73,215,255,0.35), transparent 45%),
            linear-gradient(135deg, rgba(73,215,255,0.95), rgba(42,116,255,0.95));
          color: rgba(6,10,18,0.92);
          box-shadow: 0 10px 22px rgba(0,0,0,0.25), 0 0 0 4px rgba(73,215,255,0.10);
        }
        .pin-primary:hover{
          filter: brightness(1.03);
          box-shadow: 0 12px 28px rgba(0,0,0,0.28), 0 0 0 5px rgba(73,215,255,0.12);
        }

        .pin-error{
          margin-top: 10px;
          padding: 10px 12px;
          background: rgba(255,45,45,0.12);
          border: 1px solid rgba(255,45,45,0.25);
          border-radius: 12px;
          font-size: 13px;
          color: rgba(255,255,255,0.9);
        }

        .pin-success{
          margin-top: 6px;
          padding: 12px;
          background: rgba(73,215,255,0.10);
          border: 1px solid rgba(73,215,255,0.22);
          border-radius: 12px;
          font-size: 14px;
          color: rgba(255,255,255,0.92);
        }

        .pin-foot{
          margin-top: 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.55);
        }

        @media (max-width: 520px){
          .pin-grid{ grid-template-columns: 1fr; }
          .pin-nudge{ max-width: 260px; }
        }
      `}</style>
    </>
  );
}