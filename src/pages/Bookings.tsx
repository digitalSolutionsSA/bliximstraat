import React, { useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import VideoBackground from "../components/layout/VideoBackground";
import { CalendarDays, Mail, MessageCircle, Phone, Send, MapPin, Banknote, User } from "lucide-react";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  eventType: string;
  date: string;
  location: string;
  budget: string;
  message: string;
};

export default function Bookings() {
  const contact = useMemo(() => ({
    bookings: {
      phoneDisplay: "+27 82 301 0820",
      phoneTel: "+27823010820",
      whatsappDisplay: "+27 82 301 0820",
      whatsappLink: "https://wa.me/27823010820",
      email: "events@thelegacygroup.co.za",
    },
    prManager: {
      phoneDisplay: "071 334 8346",
      phoneTel: "+27713348346",
      email: "management@bliximstraat.com",
    },
    subjectPrefix: "Booking Enquiry",
  }), []);

  const [form, setForm] = useState<FormState>({
    fullName: "", email: "", phone: "",
    eventType: "Live Performance",
    date: "", location: "", budget: "", message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
    };

  const buildMailto = () => {
    const recipients = [contact.bookings.email, contact.prManager.email].join(",");
    const lines = [
      `${contact.subjectPrefix} - ${form.eventType}`, "",
      `Name: ${form.fullName || "-"}`,
      `Email: ${form.email || "-"}`,
      `Phone: ${form.phone || "-"}`,
      `Event Type: ${form.eventType || "-"}`,
      `Date: ${form.date || "-"}`,
      `Location/Venue: ${form.location || "-"}`,
      `Budget: ${form.budget || "-"}`, "",
      "Message:", form.message || "-", "",
      "Sent from the Bliximstraat website bookings page.",
    ];
    const subject = encodeURIComponent(`${contact.subjectPrefix} - ${form.eventType}`);
    const body = encodeURIComponent(lines.join("\n"));
    return `mailto:${recipients}?subject=${subject}&body=${body}`;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    window.location.href = buildMailto();
    setTimeout(() => setSubmitting(false), 600);
  };

  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden flex flex-col"
      style={{ background: "#000000" }}
    >
      <VideoBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-6 py-12">

            {/* Header */}
            <header className="mb-10">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/35 mb-3">
                Get in Touch
              </p>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">
                Bookings
              </h1>
              <p className="mt-2 text-sm text-white/40">
                Book the band. Ask questions. Provide dates. Basic human stuff.
              </p>
            </header>

            <div className="h-px mb-10" style={{ background: "rgba(255,255,255,0.07)" }} />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">

              {/* FORM */}
              <section className="md:col-span-8">
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                >
                  <div
                    className="px-6 py-5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <h2 className="text-base font-medium text-white">Booking Form</h2>
                    <p className="mt-1 text-xs text-white/40">
                      This opens your email app with everything pre-filled.
                    </p>
                  </div>

                  <form onSubmit={onSubmit} className="px-6 py-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field icon={<User className="h-3.5 w-3.5" />} label="Full Name"
                        value={form.fullName} onChange={onChange("fullName")} placeholder="Your name" required />
                      <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email"
                        value={form.email} onChange={onChange("email")} placeholder="you@example.com" type="email" required />
                      <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone"
                        value={form.phone} onChange={onChange("phone")} placeholder="+27 ..." />

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-white/35 mb-2">Event Type</label>
                        <select
                          value={form.eventType}
                          onChange={onChange("eventType")}
                          className="w-full px-4 py-3 text-sm text-white/80 outline-none rounded-lg appearance-none"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.09)",
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)")}
                          onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                        >
                          <option className="bg-zinc-900">Live Performance</option>
                          <option className="bg-zinc-900">Private Event</option>
                          <option className="bg-zinc-900">Festival</option>
                          <option className="bg-zinc-900">Corporate</option>
                          <option className="bg-zinc-900">Other</option>
                        </select>
                      </div>

                      <Field icon={<CalendarDays className="h-3.5 w-3.5" />} label="Date"
                        value={form.date} onChange={onChange("date")} type="date" />
                      <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Location / Venue"
                        value={form.location} onChange={onChange("location")} placeholder="City / venue name" />
                      <Field icon={<Banknote className="h-3.5 w-3.5" />} label="Budget (optional)"
                        value={form.budget} onChange={onChange("budget")} placeholder="ZAR" />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-white/35 mb-2">Message</label>
                      <textarea
                        value={form.message}
                        onChange={onChange("message")}
                        rows={5}
                        placeholder="Set time, venue, PA provided, tech requirements, etc."
                        className="w-full px-4 py-3 text-sm text-white/80 placeholder:text-white/20 outline-none resize-none rounded-lg"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.09)",
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-black bg-white rounded-sm hover:bg-white/90 transition-colors disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {submitting ? "Opening email..." : "Send Enquiry"}
                      </button>
                    </div>
                  </form>
                </div>
                <p className="mt-3 text-[10px] text-white/25">
                  This will send the enquiry to both the bookings email and the PR manager.
                </p>
              </section>

              {/* CONTACT ASIDE */}
              <aside className="md:col-span-4">
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                >
                  <div
                    className="px-6 py-5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <h2 className="text-base font-medium text-white">Contact</h2>
                    <p className="mt-1 text-xs text-white/40">Choose the right person to reach.</p>
                  </div>

                  <div className="px-6 py-6 space-y-7">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-4">Bookings</p>
                      <div className="space-y-2">
                        <ContactRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone"
                          value={contact.bookings.phoneDisplay} href={`tel:${contact.bookings.phoneTel}`} />
                        <ContactRow icon={<MessageCircle className="h-3.5 w-3.5" />} label="WhatsApp"
                          value={contact.bookings.whatsappDisplay} href={contact.bookings.whatsappLink} />
                        <ContactRow icon={<Mail className="h-3.5 w-3.5" />} label="Email"
                          value={contact.bookings.email} href={`mailto:${contact.bookings.email}`} />
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-4">PR Manager</p>
                      <div className="space-y-2">
                        <ContactRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone"
                          value={contact.prManager.phoneDisplay} href={`tel:${contact.prManager.phoneTel}`} />
                        <ContactRow icon={<Mail className="h-3.5 w-3.5" />} label="Email"
                          value={contact.prManager.email} href={`mailto:${contact.prManager.email}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

function Field(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  const { icon, label, value, onChange, placeholder, type = "text", required } = props;
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-white/35 mb-2">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-4 py-3 text-sm text-white/80 placeholder:text-white/20 outline-none rounded-lg"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)")}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
        />
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200"
      style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.02)";
      }}
    >
      <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 shrink-0"
        style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">{label}</p>
        <p className="text-xs text-white/60 truncate mt-0.5">{value}</p>
      </div>
    </a>
  );
}
