import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Tab = "songs" | "shows" | "merch" | "lyrics";

/* ------------------ DB TYPES ------------------ */

type SongRow = {
  id: string;
  title: string;
  artist: string;
  release_date: string | null; // date
  price_cents: number; // store cents (we'll input rands and convert)
  cover_url: string | null;
  audio_url: string | null;

  // ✅ NEW (for albums)
  album_id?: string | null;
  track_number?: number | null;

  created_at: string;
};

type AlbumRow = {
  id: string;
  title: string;
  artist: string;
  release_date: string | null;
  cover_url: string | null;
  created_at: string;
};

type ShowRow = {
  id: string;
  title: string;
  venue: string;
  city: string;
  start_at: string | null; // timestamptz
  is_past: boolean;
  ticket_url: string | null;
  created_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price_cents: number;
  image_url: string | null;
  note: string | null;
  is_preorder: boolean;
  created_at: string;
};

type LyricRow = {
  id: string;
  song_id: string | null;
  title: string;
  album: string | null;
  year: string | null;
  lyrics: string;
  created_at: string;
};

const formatZar = (cents: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));

export default function Admin() {
  const { user, loading: authLoading } = useAuth();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [tab, setTab] = useState<Tab>("songs");

  // shared dataset for lyrics dropdown
  const [songsForLyrics, setSongsForLyrics] = useState<SongRow[]>([]);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }

    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!error && data) setIsAdmin(true);
      setChecking(false);
    };

    checkAdmin();
  }, [user]);

  useEffect(() => {
    // keep songs list around for lyrics linking
    const load = async () => {
      const { data } = await supabase
        .from("songs")
        .select("id,title,artist,release_date,price_cents,cover_url,audio_url,album_id,track_number,created_at")
        .order("created_at", { ascending: false });
      setSongsForLyrics((data as SongRow[]) ?? []);
    };
    load();
  }, []);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Checking permissions…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Please sign in to access admin.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        You are not allowed here.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <video
          className="h-full w-full object-cover"
          src="/normal-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1">
          <div className="h-20" />

          <div className="mx-auto max-w-6xl px-6 py-10">
            <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  Admin{" "}
                  <span className="text-teal-300 drop-shadow-[0_0_18px_rgba(20,184,166,0.35)]">
                    Panel
                  </span>
                </h1>
                <p className="mt-2 text-white/70">
                  Add / edit / delete songs, shows, merch and lyrics.
                </p>
              </div>
            </header>

            {/* Tabs */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl p-2 flex flex-wrap gap-2">
              <TabButton active={tab === "songs"} onClick={() => setTab("songs")}>
                Songs
              </TabButton>
              <TabButton active={tab === "shows"} onClick={() => setTab("shows")}>
                Shows
              </TabButton>
              <TabButton active={tab === "merch"} onClick={() => setTab("merch")}>
                Merch
              </TabButton>
              <TabButton active={tab === "lyrics"} onClick={() => setTab("lyrics")}>
                Lyrics
              </TabButton>
            </div>

            {/* Panels */}
            <div className="mt-6">
              {tab === "songs" && (
                <SongsPanel
                  onSongsChanged={async () => {
                    const { data } = await supabase
                      .from("songs")
                      .select("id,title,artist,release_date,price_cents,cover_url,audio_url,album_id,track_number,created_at")
                      .order("created_at", { ascending: false });
                    setSongsForLyrics((data as SongRow[]) ?? []);
                  }}
                />
              )}

              {tab === "shows" && <ShowsPanel />}

              {tab === "merch" && <MerchPanel />}

              {tab === "lyrics" && <LyricsPanel songs={songsForLyrics} />}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

/* ------------------ UI Bits ------------------ */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-xl text-sm font-extrabold uppercase tracking-tight transition border",
        active
          ? "bg-white/10 border-white/20 text-white"
          : "bg-black/20 border-white/10 text-white/70 hover:text-white hover:border-white/20",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] overflow-hidden">
      <div className="px-6 py-5 border-b border-white/10">
        <h2 className="text-2xl font-black tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function SmallButton({
  children,
  onClick,
  variant = "ghost",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "danger" | "solid";
  disabled?: boolean;
}) {
  const cls =
    variant === "solid"
      ? "bg-white/10 hover:bg-white/15 border-white/15 text-white"
      : variant === "danger"
      ? "bg-red-500/10 hover:bg-red-500/15 border-red-500/30 text-red-200"
      : "bg-black/30 hover:bg-black/35 border-white/10 text-white/80";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${cls}`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/60 mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 placeholder:text-white/40 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
      />
    </div>
  );
}

/* ------------------ SONGS CRUD (UPDATED) ------------------ */

type ReleaseType = "single" | "album";

type TrackDraft = {
  id: string;
  title: string;
  priceZar: string;
  audioFile: File | null;
};

function SongsPanel({ onSongsChanged }: { onSongsChanged: () => Promise<void> }) {
  const [items, setItems] = useState<SongRow[]>([]);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  // ✅ NEW: release type
  const [releaseType, setReleaseType] = useState<ReleaseType>("single");

  // SINGLE form (existing)
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("Bliximstraat");
  const [releaseDate, setReleaseDate] = useState("");
  const [priceZar, setPriceZar] = useState("0");

  const [coverUrl, setCoverUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // ALBUM creation form (new)
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumArtist, setAlbumArtist] = useState("Bliximstraat");
  const [albumReleaseDate, setAlbumReleaseDate] = useState("");
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);

  const [bulkTrackPrice, setBulkTrackPrice] = useState("0");
  const [tracks, setTracks] = useState<TrackDraft[]>([
    { id: crypto.randomUUID(), title: "", priceZar: "0", audioFile: null },
  ]);

  const resetSingleForm = () => {
    setEditingId(null);
    setTitle("");
    setArtist("Bliximstraat");
    setReleaseDate("");
    setPriceZar("0");
    setCoverUrl("");
    setAudioUrl("");
    setCoverFile(null);
    setAudioFile(null);
  };

  const resetAlbumForm = () => {
    setAlbumTitle("");
    setAlbumArtist("Bliximstraat");
    setAlbumReleaseDate("");
    setAlbumCoverFile(null);
    setBulkTrackPrice("0");
    setTracks([{ id: crypto.randomUUID(), title: "", priceZar: "0", audioFile: null }]);
  };

  const resetAll = () => {
    setError(null);
    setReleaseType("single");
    resetSingleForm();
    resetAlbumForm();
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("songs")
      .select("id,title,artist,release_date,price_cents,cover_url,audio_url,album_id,track_number,created_at")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setItems((data as SongRow[]) ?? []);
    setLoading(false);
  };

  const loadAlbums = async () => {
    const { data, error } = await supabase
      .from("albums")
      .select("id,title,artist,release_date,cover_url,created_at")
      .order("created_at", { ascending: false });

    if (!error) setAlbums((data as AlbumRow[]) ?? []);
  };

  useEffect(() => {
    (async () => {
      await load();
      await loadAlbums();
    })();
  }, []);

  const albumTitleById = useMemo(() => {
    const map = new Map<string, string>();
    albums.forEach((a) => map.set(a.id, a.title));
    return map;
  }, [albums]);

  const onEdit = (row: SongRow) => {
    // Editing is for single songs / tracks individually (not "album creation")
    setReleaseType("single");
    setEditingId(row.id);
    setTitle(row.title);
    setArtist(row.artist);
    setReleaseDate(row.release_date ?? "");
    setPriceZar(String(Math.round(row.price_cents / 100)));
    setCoverUrl(row.cover_url ?? "");
    setAudioUrl(row.audio_url ?? "");
    setCoverFile(null);
    setAudioFile(null);
    setError(null);
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Delete this song? This cannot be undone.");
    if (!ok) return;

    const { error } = await supabase.from("songs").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
    await onSongsChanged();
  };

  const uploadToBucket = async (bucket: "covers" | "audio", file: File) => {
    if (bucket === "covers" && !file.type.startsWith("image/")) {
      throw new Error("Cover must be an image file.");
    }
    if (bucket === "audio" && !file.type.startsWith("audio/")) {
      throw new Error("Audio must be an audio file.");
    }

    const ext = file.name.split(".").pop() || "bin";
    const safeExt = ext.toLowerCase();
    const path = `${crypto.randomUUID()}.${safeExt}`;

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

    if (error) {
      console.error("Storage upload error:", error);
      throw new Error(error.message ?? "Storage upload failed");
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const addTrack = () => {
    setTracks((t) => [...t, { id: crypto.randomUUID(), title: "", priceZar: "0", audioFile: null }]);
  };

  const removeTrack = (id: string) => {
    setTracks((t) => (t.length <= 1 ? t : t.filter((x) => x.id !== id)));
  };

  const updateTrack = (id: string, patch: Partial<TrackDraft>) => {
    setTracks((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const applyBulkPrice = () => {
    setTracks((t) => t.map((x) => ({ ...x, priceZar: bulkTrackPrice || "0" })));
  };

  const saveSingle = async () => {
    const priceCents = Math.max(0, Number(priceZar || "0")) * 100;

    if (!title.trim()) {
      throw new Error("Title is required.");
    }

    let nextCoverUrl = coverUrl.trim() || null;
    let nextAudioUrl = audioUrl.trim() || null;

    if (coverFile) nextCoverUrl = await uploadToBucket("covers", coverFile);
    if (audioFile) nextAudioUrl = await uploadToBucket("audio", audioFile);

    const payload = {
      title: title.trim(),
      artist: artist.trim() || "Bliximstraat",
      release_date: releaseDate ? releaseDate : null,
      price_cents: priceCents,
      cover_url: nextCoverUrl,
      audio_url: nextAudioUrl,

      // single
      album_id: null,
      track_number: null,
    };

    if (editingId) {
      const { error } = await supabase.from("songs").update(payload).eq("id", editingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("songs").insert(payload);
      if (error) throw error;
    }
  };

  const saveAlbum = async () => {
    if (!albumTitle.trim()) throw new Error("Album title is required.");
    if (!albumCoverFile) throw new Error("Album cover is required.");
    if (!albumArtist.trim()) throw new Error("Album artist is required.");

    const cleanTracks = tracks.map((t, idx) => ({
      ...t,
      title: t.title.trim(),
      track_number: idx + 1,
      price_cents: Math.max(0, Number(t.priceZar || "0")) * 100,
    }));

    if (cleanTracks.some((t) => !t.title)) throw new Error("Every track needs a title.");
    if (cleanTracks.some((t) => !t.audioFile)) throw new Error("Every track needs an audio file.");

    // Upload album cover
    const albumCoverUrl = await uploadToBucket("covers", albumCoverFile);

    // Insert album row and get id back
    const { data: albumInsert, error: albumErr } = await supabase
      .from("albums")
      .insert({
        title: albumTitle.trim(),
        artist: albumArtist.trim(),
        release_date: albumReleaseDate ? albumReleaseDate : null,
        cover_url: albumCoverUrl,
      })
      .select("id")
      .single();

    if (albumErr) throw albumErr;
    const albumId = albumInsert.id as string;

    // Insert tracks
    for (const t of cleanTracks) {
      const nextAudioUrl = await uploadToBucket("audio", t.audioFile!);

      const { error: songErr } = await supabase.from("songs").insert({
        title: t.title,
        artist: albumArtist.trim(),
        release_date: albumReleaseDate ? albumReleaseDate : null,
        price_cents: t.price_cents,

        // Album linking:
        album_id: albumId,
        track_number: t.track_number,

        // Album cover is stored on albums, but keeping cover_url null for tracks is fine.
        cover_url: null,
        audio_url: nextAudioUrl,
      });

      if (songErr) throw songErr;
    }
  };

  const onSave = async () => {
    setError(null);
    setSaving(true);

    try {
      if (releaseType === "single") {
        await saveSingle();
      } else {
        // album creation should not run while editing an existing song
        if (editingId) throw new Error("Cancel editing before creating an album.");
        await saveAlbum();
      }

      await load();
      await loadAlbums();
      await onSongsChanged();
      resetAll();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7">
        <Card title="Songs" subtitle="Singles + album tracks. Albums are grouped using album_id.">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-white/60">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-white/60">No songs yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {s.track_number ? `${s.track_number}. ` : ""}
                      {s.title}
                    </div>
                    <div className="text-xs text-white/60">
                      {s.artist}
                      {s.album_id ? ` • Album: ${albumTitleById.get(s.album_id) ?? "Unknown"}` : " • Single"}
                      {s.release_date ? ` • ${s.release_date}` : ""} • {formatZar(s.price_cents)}
                    </div>

                    {(s.cover_url || s.audio_url) && (
                      <div className="mt-2 text-xs text-white/50 truncate">
                        {s.cover_url ? `Cover: ${s.cover_url} ` : ""}
                        {s.audio_url ? `Audio: ${s.audio_url}` : ""}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <SmallButton onClick={() => onEdit(s)}>Edit</SmallButton>
                    <SmallButton variant="danger" onClick={() => onDelete(s.id)}>
                      Delete
                    </SmallButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="lg:col-span-5">
        <Card
          title={
            releaseType === "album"
              ? "Create Album"
              : editingId
              ? "Edit Song"
              : "Add Song"
          }
          subtitle="Uploads to Supabase Storage and writes rows to your DB (admin-only)."
        >
          <div className="space-y-4">
            {/* Release type selector */}
            <div>
              <label className="block text-xs text-white/60 mb-2">Release type</label>
              <select
                value={releaseType}
                onChange={(e) => {
                  const next = e.target.value as ReleaseType;
                  setReleaseType(next);
                  setError(null);
                  if (next === "album") {
                    // prevent mixing edit mode with album creation
                    setEditingId(null);
                    resetSingleForm();
                  }
                }}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                disabled={saving}
              >
                <option value="single">Single</option>
                <option value="album">Album</option>
              </select>
              {editingId && releaseType === "album" && (
                <div className="mt-2 text-xs text-white/60">
                  Cancel editing before creating an album.
                </div>
              )}
            </div>

            {/* SINGLE FORM */}
            {releaseType === "single" && (
              <>
                <Field label="Title" value={title} onChange={setTitle} placeholder="Neon Streets" />
                <Field label="Artist" value={artist} onChange={setArtist} placeholder="Bliximstraat" />
                <Field label="Release date" value={releaseDate} onChange={setReleaseDate} type="date" />
                <Field label="Price (ZAR)" value={priceZar} onChange={setPriceZar} type="number" placeholder="0" />

                <div>
                  <label className="block text-xs text-white/60 mb-2">Cover image (upload from PC)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                  />
                  {coverUrl && (
                    <div className="mt-2 text-xs text-white/50 truncate">
                      Current cover URL: {coverUrl}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-2">Audio file (upload from PC)</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                  />
                  {audioUrl && (
                    <div className="mt-2 text-xs text-white/50 truncate">
                      Current audio URL: {audioUrl}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ALBUM FORM */}
            {releaseType === "album" && (
              <>
                <Field label="Album title" value={albumTitle} onChange={setAlbumTitle} placeholder="Signals & Static" />
                <Field label="Album artist" value={albumArtist} onChange={setAlbumArtist} placeholder="Bliximstraat" />
                <Field
                  label="Album release date"
                  value={albumReleaseDate}
                  onChange={setAlbumReleaseDate}
                  type="date"
                />

                <div>
                  <label className="block text-xs text-white/60 mb-2">Album cover (ONE cover for the whole album)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAlbumCoverFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                  <div className="flex flex-wrap items-end gap-2 justify-between">
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-xs text-white/60 mb-2">Set all track prices (ZAR)</label>
                      <input
                        value={bulkTrackPrice}
                        onChange={(e) => setBulkTrackPrice(e.target.value)}
                        type="number"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                      />
                    </div>
                    <SmallButton onClick={applyBulkPrice} disabled={saving}>
                      Apply to tracks
                    </SmallButton>
                    <SmallButton onClick={addTrack} disabled={saving}>
                      + Add track
                    </SmallButton>
                  </div>

                  <div className="space-y-3">
                    {tracks.map((t, idx) => (
                      <div key={t.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                        <div className="text-xs text-white/60 mb-2">Track #{idx + 1}</div>

                        <div className="space-y-3">
                          <Field
                            label="Track title"
                            value={t.title}
                            onChange={(v) => updateTrack(t.id, { title: v })}
                            placeholder={`Track ${idx + 1}`}
                          />

                          <Field
                            label="Track price (ZAR)"
                            value={t.priceZar}
                            onChange={(v) => updateTrack(t.id, { priceZar: v })}
                            type="number"
                          />

                          <div>
                            <label className="block text-xs text-white/60 mb-2">Track audio file</label>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => updateTrack(t.id, { audioFile: e.target.files?.[0] ?? null })}
                              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                            />
                          </div>

                          <div className="flex justify-end">
                            <SmallButton
                              variant="danger"
                              onClick={() => removeTrack(t.id)}
                              disabled={saving || tracks.length <= 1}
                            >
                              Remove track
                            </SmallButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end pt-2">
              {(editingId || releaseType === "album") && (
                <SmallButton onClick={resetAll} disabled={saving}>
                  Cancel
                </SmallButton>
              )}
              <SmallButton variant="solid" onClick={onSave} disabled={saving}>
                {saving
                  ? "Saving…"
                  : releaseType === "album"
                  ? "Create album + upload tracks"
                  : editingId
                  ? "Save changes"
                  : "Add song"}
              </SmallButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------ SHOWS CRUD ------------------ */

function ShowsPanel() {
  const [items, setItems] = useState<ShowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [startAt, setStartAt] = useState(""); // datetime-local
  const [ticketUrl, setTicketUrl] = useState("");
  const [isPast, setIsPast] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setVenue("");
    setCity("");
    setStartAt("");
    setTicketUrl("");
    setIsPast(false);
  };

  // Helpers to convert datetime-local -> show_date + show_time
  const toShowDate = (dtLocal: string) => {
    // dtLocal looks like "2026-02-14T18:00"
    // show_date column is type DATE, expects "YYYY-MM-DD"
    if (!dtLocal) return null;
    return dtLocal.slice(0, 10);
  };

  const toShowTime = (dtLocal: string) => {
    // store "HH:MM" (text) if provided
    if (!dtLocal) return null;
    return dtLocal.length >= 16 ? dtLocal.slice(11, 16) : null;
  };

  const formatForList = (show_date?: string | null, show_time?: string | null) => {
    if (!show_date) return "";
    // show_date is "YYYY-MM-DD" (no timezone drama)
    const [y, m, d] = show_date.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d, 0, 0, 0, 0);

    const datePart = dateObj.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return show_time ? `${datePart}, ${show_time}` : datePart;
  };

  const load = async () => {
    setLoading(true);
    setError(null);

    // ✅ Updated select to match your table columns
    const { data, error } = await supabase
      .from("shows")
      .select("id,title,venue,city,show_date,show_time,is_past,ticket_url,created_at")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setItems((data as ShowRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onEdit = (row: ShowRow) => {
    setEditingId(row.id);
    setTitle(row.title);
    setVenue(row.venue);
    setCity(row.city);

    // ✅ Convert existing show_date + show_time back into a datetime-local string
    // datetime-local expects "YYYY-MM-DDTHH:MM"
    const dtLocal =
      row.show_date
        ? `${row.show_date}T${(row.show_time ?? "19:00").slice(0, 5)}`
        : "";

    setStartAt(dtLocal);
    setTicketUrl(row.ticket_url ?? "");
    setIsPast(row.is_past);
    setError(null);
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Delete this show?");
    if (!ok) return;

    const { error } = await supabase.from("shows").delete().eq("id", id);
    if (error) setError(error.message);
    await load();
  };

  const onSave = async () => {
    setError(null);
    setSaving(true);

    const { data: authData, error: authErr } = await supabase.auth.getUser();

    if (authErr) {
      setSaving(false);
      throw authErr;
    }

    if (!authData.user) {
      setSaving(false);
      throw new Error("Not authenticated.");
    }

    if (!title.trim() || !venue.trim() || !city.trim()) {
      setError("Title, venue and city are required.");
      setSaving(false);
      return;
    }

    // ✅ Enforce date because your DB column is NOT NULL
    if (!startAt) {
      setError("Date & time is required.");
      setSaving(false);
      return;
    }

    const payload = {
      title: title.trim(),
      venue: venue.trim(),
      city: city.trim(),

      // ✅ NEW: match your table schema
      show_date: toShowDate(startAt), // "YYYY-MM-DD" (NOT NULL)
      show_time: toShowTime(startAt), // "HH:MM" (text)

      ticket_url: ticketUrl.trim() || null,
      is_past: isPast,
    };

    if (editingId) {
      const { error } = await supabase.from("shows").update(payload).eq("id", editingId);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from("shows").insert(payload);
      if (error) setError(error.message);
    }

    await load();
    resetForm();
    setSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7">
        <Card title="Shows" subtitle="Upcoming gigs, past chaos, ticket links.">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-white/60">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-white/60">No shows yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{s.title}</div>
                    <div className="text-xs text-white/60">
                      {s.venue} • {s.city}
                      {s.show_date ? ` • ${formatForList(s.show_date, s.show_time)}` : ""}
                      {s.is_past ? " • Past" : ""}
                    </div>
                    {s.ticket_url && (
                      <div className="mt-2 text-xs text-white/50 truncate">
                        Tickets: {s.ticket_url}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <SmallButton onClick={() => onEdit(s)}>Edit</SmallButton>
                    <SmallButton variant="danger" onClick={() => onDelete(s.id)}>
                      Delete
                    </SmallButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="lg:col-span-5">
        <Card title={editingId ? "Edit Show" : "Add Show"} subtitle="Admin-only. Saved to Supabase.">
          <div className="space-y-4">
            <Field label="Title" value={title} onChange={setTitle} placeholder="Live at The Warehouse" />
            <Field label="Venue" value={venue} onChange={setVenue} placeholder="The Warehouse" />
            <Field label="City" value={city} onChange={setCity} placeholder="Johannesburg" />
            <Field label="Date & time" value={startAt} onChange={setStartAt} type="datetime-local" />
            <Field label="Ticket URL" value={ticketUrl} onChange={setTicketUrl} placeholder="https://..." />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={isPast}
                  onChange={(e) => setIsPast(e.target.checked)}
                />
                Mark as past
              </label>

              <div className="flex gap-2">
                {editingId && <SmallButton onClick={resetForm}>Cancel</SmallButton>}
                <SmallButton variant="solid" onClick={onSave} disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add show"}
                </SmallButton>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------ MERCH CRUD ------------------ */

function MerchPanel() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("T-Shirts");
  const [priceZar, setPriceZar] = useState("299");
  const [imageUrl, setImageUrl] = useState("");
  const [note, setNote] = useState("");
  const [isPreorder, setIsPreorder] = useState(false);

  // NEW: file upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const safeExt = (filename: string) => {
    const parts = filename.split(".");
    const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "jpg";
    return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  };

  const uploadMerchImage = async (file: File) => {
    // basic guard rails so your bucket doesn't become a 4K wallpaper dump
    const MAX = 6 * 1024 * 1024; // 6MB
    if (file.size > MAX) throw new Error("Image is too large (max 6MB).");

    const ext = safeExt(file.name);
    const path = `products/${crypto.randomUUID()}.${ext}`;

    setUploadingImage(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from("merch") // <-- bucket name
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("merch").getPublicUrl(path);
      if (!data?.publicUrl) throw new Error("Could not generate public URL.");

      return data.publicUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCategory("T-Shirts");
    setPriceZar("299");
    setImageUrl("");
    setNote("");
    setIsPreorder(false);

    // NEW
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id,name,category,price_cents,image_url,note,is_preorder,created_at")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setItems((data as ProductRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // cleanup preview url on unmount
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickImage = (file: File | null) => {
    setError(null);

    // clear previous preview
    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImageFile(file);

    if (!file) {
      setImagePreview("");
      return;
    }

    const preview = URL.createObjectURL(file);
    setImagePreview(preview);

    // If they pick a file, we can optionally clear URL to avoid confusion
    // Comment this out if you want both to coexist.
    setImageUrl("");
  };

  const onEdit = (row: ProductRow) => {
    // clear previous preview
    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setEditingId(row.id);
    setName(row.name);
    setCategory(row.category);
    setPriceZar(String(Math.round(row.price_cents / 100)));
    setImageUrl(row.image_url ?? "");
    setNote(row.note ?? "");
    setIsPreorder(row.is_preorder);
    setError(null);

    // NEW: reset local file state on edit
    setImageFile(null);
    setImagePreview("");
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) setError(error.message);
    await load();
  };

  const onSave = async () => {
    setError(null);
    setSaving(true);

    try {
      if (!name.trim() || !category.trim()) {
        throw new Error("Name and category are required.");
      }

      // Determine final image URL:
      // 1) Use pasted URL if present
      // 2) Else upload selected file (if any)
      // 3) Else null
      let finalImageUrl = imageUrl.trim();

      if (!finalImageUrl && imageFile) {
        finalImageUrl = await uploadMerchImage(imageFile);
      }

      const payload = {
        name: name.trim(),
        category: category.trim(),
        price_cents: Math.max(0, Number(priceZar || "0")) * 100,
        image_url: finalImageUrl || null,
        note: note.trim() || null,
        is_preorder: isPreorder,
      };

      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw new Error(error.message);
      }

      await load();
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Something broke while saving.");
    } finally {
      setSaving(false);
    }
  };

  const saveDisabled = saving || uploadingImage;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7">
        <Card title="Merch" subtitle="Products you sell. Humans love objects for some reason.">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-white/60">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-white/60">No merch products yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-white/60">
                      {p.category} • {formatZar(p.price_cents)} {p.is_preorder ? "• Preorder" : ""}
                    </div>

                    {(p.note || p.image_url) && (
                      <div className="mt-2 text-xs text-white/50 truncate">
                        {p.note ? `Note: ${p.note} ` : ""}
                        {p.image_url ? `Image: ${p.image_url}` : ""}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <SmallButton onClick={() => onEdit(p)}>Edit</SmallButton>
                    <SmallButton variant="danger" onClick={() => onDelete(p.id)}>
                      Delete
                    </SmallButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="lg:col-span-5">
        <Card title={editingId ? "Edit Product" : "Add Product"} subtitle="Admin-only.">
          <div className="space-y-4">
            <Field label="Name" value={name} onChange={setName} placeholder="Bliximstraat Logo Tee" />
            <Field label="Category" value={category} onChange={setCategory} placeholder="T-Shirts" />
            <Field label="Price (ZAR)" value={priceZar} onChange={setPriceZar} type="number" />

            {/* REPLACED: Image URL field -> Upload + optional URL */}
            <div className="space-y-2">
              <div className="text-sm text-white/75">Product image</div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-black/30 file:px-3 file:py-1.5 file:text-white/80 hover:file:bg-black/40"
              />

              {imagePreview && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                  <div className="mt-2 flex justify-end">
                    <SmallButton
                      onClick={() => onPickImage(null)}
                      variant="danger"
                    >
                      Remove image
                    </SmallButton>
                  </div>
                </div>
              )}

              <div className="text-xs text-white/50">
                Or paste an Image URL (optional)
              </div>

              <Field label="" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />
            </div>

            <Field label="Note" value={note} onChange={setNote} placeholder="Sizes: S–XXL" />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={isPreorder}
                  onChange={(e) => setIsPreorder(e.target.checked)}
                />
                Preorder
              </label>

              <div className="flex gap-2">
                {editingId && <SmallButton onClick={resetForm} disabled={saveDisabled}>Cancel</SmallButton>}
                <SmallButton variant="solid" onClick={onSave} disabled={saveDisabled}>
                  {uploadingImage
                    ? "Uploading…"
                    : saving
                    ? "Saving…"
                    : editingId
                    ? "Save changes"
                    : "Add product"}
                </SmallButton>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


/* ------------------ LYRICS CRUD ------------------ */

function LyricsPanel({ songs }: { songs: SongRow[] }) {
  const [items, setItems] = useState<LyricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [songId, setSongId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [album, setAlbum] = useState("");
  const [year, setYear] = useState("");
  const [lyrics, setLyrics] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setSongId("");
    setTitle("");
    setAlbum("");
    setYear("");
    setLyrics("");
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lyrics")
      .select("id,song_id,title,album,year,lyrics,created_at")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setItems((data as LyricRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const songTitleById = useMemo(() => {
    const map = new Map<string, string>();
    songs.forEach((s) => map.set(s.id, s.title));
    return map;
  }, [songs]);

  const onEdit = (row: LyricRow) => {
    setEditingId(row.id);
    setSongId(row.song_id ?? "");
    setTitle(row.title);
    setAlbum(row.album ?? "");
    setYear(row.year ?? "");
    setLyrics(row.lyrics);
    setError(null);
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Delete these lyrics?");
    if (!ok) return;

    const { error } = await supabase.from("lyrics").delete().eq("id", id);
    if (error) setError(error.message);
    await load();
  };

  const onSave = async () => {
    setError(null);
    setSaving(true);

    if (!title.trim() || !lyrics.trim()) {
      setError("Title and lyrics text are required.");
      setSaving(false);
      return;
    }

    const payload = {
      song_id: songId || null,
      title: title.trim(),
      album: album.trim() || null,
      year: year.trim() || null,
      lyrics: lyrics,
    };

    if (editingId) {
      const { error } = await supabase.from("lyrics").update(payload).eq("id", editingId);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from("lyrics").insert(payload);
      if (error) setError(error.message);
    }

    await load();
    resetForm();
    setSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7">
        <Card title="Lyrics" subtitle="Store official lyrics here. No TikTok misquotes.">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-white/60">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-white/60">No lyrics yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((l) => (
                <div
                  key={l.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{l.title}</div>
                    <div className="text-xs text-white/60">
                      {l.album ? `${l.album} • ` : ""}
                      {l.year ? `${l.year} • ` : ""}
                      {l.song_id ? `Linked: ${songTitleById.get(l.song_id) ?? "Song"}` : "Unlinked"}
                    </div>
                    <div className="mt-2 text-xs text-white/50 line-clamp-2 whitespace-pre-wrap">
                      {l.lyrics}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <SmallButton onClick={() => onEdit(l)}>Edit</SmallButton>
                    <SmallButton variant="danger" onClick={() => onDelete(l.id)}>
                      Delete
                    </SmallButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="lg:col-span-5">
        <Card title={editingId ? "Edit Lyrics" : "Add Lyrics"} subtitle="Admin-only.">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/60 mb-2">Link to song (optional)</label>
              <select
                value={songId}
                onChange={(e) => setSongId(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
              >
                <option value="">No link</option>
                {songs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <Field label="Title" value={title} onChange={setTitle} placeholder="Neon Streets" />
            <Field label="Album" value={album} onChange={setAlbum} placeholder="Single" />
            <Field label="Year" value={year} onChange={setYear} placeholder="2026" />

            <div>
              <label className="block text-xs text-white/60 mb-2">Lyrics</label>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                rows={10}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 placeholder:text-white/40 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15 resize-none"
                placeholder="Paste lyrics here…"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              {editingId && <SmallButton onClick={resetForm}>Cancel</SmallButton>}
              <SmallButton variant="solid" onClick={onSave} disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Add lyrics"}
              </SmallButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
