// src/lib/groupSongsByAlbum.ts
import { ALBUMS, SINGLES_LABEL } from "../data/albumMap";

export type AlbumGroup<TSong> = {
  albumTitle: string;
  year?: string;
  coverUrl?: string;
  songs: TSong[];
};

export function groupSongsByAlbum<TSong extends { id: string }>(
  songs: TSong[]
): AlbumGroup<TSong>[] {
  const byId = new Map(songs.map((s) => [s.id, s]));

  const used = new Set<string>();
  const groups: AlbumGroup<TSong>[] = [];

  // Build album groups in the order defined in ALBUMS
  for (const album of ALBUMS) {
    const albumSongs: TSong[] = [];

    for (const id of album.songIds) {
      const song = byId.get(id);
      if (song) {
        albumSongs.push(song);
        used.add(id);
      }
    }

    // Only show album if it actually has songs that exist in this fetch
    if (albumSongs.length) {
      groups.push({
        albumTitle: album.title,
        year: album.year,
        coverUrl: album.coverUrl,
        songs: albumSongs,
      });
    }
  }

  // Everything else falls into Singles
  const singles = songs.filter((s) => !used.has(s.id));
  if (singles.length) {
    groups.push({
      albumTitle: SINGLES_LABEL,
      songs: singles,
    });
  }

  return groups;
}