// ─────────────────────────────────────────────────────────────────
// BLIXIMSTRAAT LYRICS
// Add lyrics for each song here. The Lyrics page reads from this file.
// ─────────────────────────────────────────────────────────────────
export type LyricEntry = {
  id: string;
  title: string;
  year?: string;
  album?: string;
  lyrics: string;
};

export const LYRICS: LyricEntry[] = [
  {
    id: "cherry-bubble-gum-milkshake",
    title: "Cherry En Bubble Gum Milkshake",
    year: "2024",
    album: "Singles",
    lyrics: `[Voeg lirieke hier in / Add lyrics here]`,
  },
  // ── Add more songs below ──────────────────────────────────────
  // {
  //   id: "unique-slug",
  //   title: "Song Title",
  //   year: "2025",
  //   album: "Album Name",
  //   lyrics: `Verse 1...`,
  // },
];
