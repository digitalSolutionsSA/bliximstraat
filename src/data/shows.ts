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
  {
    id: "welkom-bokkieweek-2026",
    title: "Kiefbeats & BliximStraat — Bokkieweek",
    venue: "Rovers Rugby Club",
    city: "Welkom",
    date: "2026-06-06",
    time: "15:00",
  },
];
