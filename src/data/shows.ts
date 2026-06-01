// ─────────────────────────────────────────────────────────────────
// BLIXIMSTRAAT SHOWS
// Add upcoming shows here. The Shows page reads from this file.
// date format: "YYYY-MM-DD"
// ─────────────────────────────────────────────────────────────────
export type Show = {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  time?: string;
  ticketUrl?: string;
};

export const SHOWS: Show[] = [
  // ── Add upcoming shows below ──────────────────────────────────
  // {
  //   id: "show-1",
  //   title: "BliximStraat Live",
  //   venue: "The Venue",
  //   city: "Johannesburg",
  //   date: "2026-07-15",
  //   time: "20:00",
  //   ticketUrl: "https://tickets.example.com",
  // },
];
