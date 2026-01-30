// src/pages/Bookings.tsx
import React, { useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import {
  CalendarDays,
  Mail,
  MessageCircle,
  Phone,
  Send,
  MapPin,
  Banknote,
  User,
} from "lucide-react";

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
  // Update these to your real details
  const contact = useMemo(
    () => ({
      phoneDisplay: "+27 00 000 0000",
      phoneTel: "+27000000000",
      whatsappDisplay: "+27 00 000 0000",
      whatsappLink: "https://wa.me/27000000000",
      email: "bookings@bliximstraat.com",
      emailTo: "bookings@bliximstraat.com",
      subjectPrefix: "Booking Enquiry",
    }),
    []
  );

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    eventType: "Live Performance",
    date: "",
    location: "",
    budget: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const onChange =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const buildMailto = () => {
    const lines = [
      `${contact.subjectPrefix} - ${form.eventType}`,
      "",
      `Name: ${form.fullName || "-"}`,
      `Email: ${form.email || "-"}`,
      `Phone: ${form.phone || "-"}`,
      `Event Type: ${form.eventType || "-"}`,
      `Date: ${form.date || "-"}`,
      `Location/Venue: ${form.location || "-"}`,
      `Budget: ${form.budget || "-"}`,
      "",
      "Message:",
      form.message || "-",
      "",
      "Sent from the Bliximstraat website bookings page.",
    ];

    const subject = encodeURIComponent(
      `${contact.subjectPrefix} - ${form.eventType}`
    );
    const body = encodeURIComponent(lines.join("\n"));

    return `mailto:${contact.emailTo}?subject=${subject}&body=${body}`;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    window.location.href = buildMailto();
    setTimeout(() => setSubmitting(false), 600);
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden flex flex-col">
      {/* === FIXED VIDEO BACKGROUND (SAME PATTERN AS LYRICS) === */}
      <div className="fixed inset-0 z-0">
        <video
          className="h-full w-full object-cover"
          src="/normal-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => window.dispatchEvent(new Event("bg-video-ready"))}
          onLoadedData={() => window.dispatchEvent(new Event("bg-video-ready"))}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          {/* Spacer for fixed navbar */}
          <div className="h-20" />

          <div className="mx-auto max-w-6xl px-6 py-10">
            {/* Header */}
            <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  Bookings{" "}
                  <span className="text-teal-300 drop-shadow-[0_0_18px_rgba(20,184,166,0.35)]">
                    Contact
                  </span>
                </h1>
                <p className="mt-2 text-white/70">
                  Book the band. Ask questions. Provide dates. Basic human stuff.
                </p>
              </div>
            </header>

            {/* Content */}
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* Form */}
              <section className="md:col-span-8">
                <div className="relative rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] overflow-hidden">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400/60 via-fuchsia-400/30 to-yellow-300/40 opacity-70" />

                  <div className="px-6 py-5 border-b border-white/10">
                    <h2 className="text-2xl font-black tracking-tight">
                      Booking Form
                    </h2>
                    <p className="mt-1 text-sm text-white/60">
                      This opens your email app with everything pre-filled.
                    </p>
                  </div>

                  <form onSubmit={onSubmit} className="px-6 py-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field
                        icon={<User className="h-4 w-4" />}
                        label="Full Name"
                        value={form.fullName}
                        onChange={onChange("fullName")}
                        placeholder="Your name"
                        required
                      />
                      <Field
                        icon={<Mail className="h-4 w-4" />}
                        label="Email"
                        value={form.email}
                        onChange={onChange("email")}
                        placeholder="you@example.com"
                        type="email"
                        required
                      />
                      <Field
                        icon={<Phone className="h-4 w-4" />}
                        label="Phone"
                        value={form.phone}
                        onChange={onChange("phone")}
                        placeholder="+27 ..."
                      />

                      <div>
                        <label className="block text-xs text-white/60 mb-2">
                          Event Type
                        </label>
                        <select
                          value={form.eventType}
                          onChange={onChange("eventType")}
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                        >
                          <option>Live Performance</option>
                          <option>Private Event</option>
                          <option>Festival</option>
                          <option>Corporate</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <Field
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Date"
                        value={form.date}
                        onChange={onChange("date")}
                        type="date"
                      />
                      <Field
                        icon={<MapPin className="h-4 w-4" />}
                        label="Location / Venue"
                        value={form.location}
                        onChange={onChange("location")}
                        placeholder="City / venue name"
                      />
                      <Field
                        icon={<Banknote className="h-4 w-4" />}
                        label="Budget (optional)"
                        value={form.budget}
                        onChange={onChange("budget")}
                        placeholder="ZAR"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white/60 mb-2">
                        Message
                      </label>
                      <textarea
                        value={form.message}
                        onChange={onChange("message")}
                        rows={6}
                        placeholder="Set time, venue, PA provided, tech requirements, etc."
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 placeholder:text-white/40 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15 resize-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/85 hover:bg-white/10 transition disabled:opacity-60"
                      >
                        <Send className="h-4 w-4" />
                        {submitting ? "Opening email..." : "Send Enquiry"}
                      </button>
                    </div>
                  </form>
                </div>

                <p className="mt-4 text-xs text-white/50">
                  Tip: wire this to Supabase later. For now, it works everywhere
                  without backend drama.
                </p>
              </section>

              {/* Contact */}
              <aside className="md:col-span-4">
                <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-white/10">
                    <h2 className="text-2xl font-black tracking-tight">Contact</h2>
                    <p className="mt-1 text-sm text-white/60">
                      Choose your favorite method of communication.
                    </p>
                  </div>

                  <div className="px-6 py-6 space-y-4">
                    <ContactRow
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone"
                      value={contact.phoneDisplay}
                      href={`tel:${contact.phoneTel}`}
                    />
                    <ContactRow
                      icon={<MessageCircle className="h-4 w-4" />}
                      label="WhatsApp"
                      value={contact.whatsappDisplay}
                      href={contact.whatsappLink}
                    />
                    <ContactRow
                      icon={<Mail className="h-4 w-4" />}
                      label="Email"
                      value={contact.email}
                      href={`mailto:${contact.emailTo}`}
                    />
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
  const { icon, label, value, onChange, placeholder, type = "text", required } =
    props;

  return (
    <div>
      <label className="block text-xs text-white/60 mb-2">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/55">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-2xl border border-white/10 bg-black/40 pl-11 pr-4 py-3 text-white/90 placeholder:text-white/40 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
        />
      </div>
    </div>
  );
}

function ContactRow(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  const { icon, label, value, href } = props;

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-4 hover:bg-black/35 transition"
    >
      <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/80">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.22em] text-white/55">
          {label}
        </p>
        <p className="text-sm text-white/85 truncate">{value}</p>
      </div>
    </a>
  );
}
