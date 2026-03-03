// src/data/albumMap.ts
export type AlbumDef = {
  title: string;           // album display name
  year?: string;           // optional
  coverUrl?: string;       // optional (if you want album cards later)
  songIds: string[];       // IMPORTANT: use the song "id" from your songs table
};

export const ALBUMS: AlbumDef[] = [
  {
    title: "Neon Funeral",
    year: "2026",
    songIds: [
      "PUT_SONG_ID_1_HERE",
      "PUT_SONG_ID_2_HERE",
      "PUT_SONG_ID_3_HERE",
    ],
  },
  {
    title: "Midnight Tape Vol. 1",
    year: "2025",
    songIds: [
      "PUT_SONG_ID_4_HERE",
      "PUT_SONG_ID_5_HERE",
    ],
  },
];

// Optional bucket name for songs not listed above
export const SINGLES_LABEL = "Singles";