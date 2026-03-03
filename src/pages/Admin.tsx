import { useEffect, useState, type ReactNode } from "react";
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
  price_cents: number; // store cents
  cover_url: string | null;
  audio_url: string | null;

  // albums
  album_id?: string | null;
  track_number?: number | null;

  // ✅ soft delete flag
  is_active?: boolean;

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
  title: string | null;
  venue: string | null;
  city: string | null;
  show_date: string | null; // date
  show_time: string | null; // time
  is_past: boolean | null;
  ticket_url: string | null;
  created_at: string;
};

type ProductRow = {
  id: string;
  name: string | null;
  category: string | null;
  price_cents: number;
  image_url: string | null;
  note: string | null;
  is_preorder: boolean | null;
  created_at: string;
};

/**
 * ✅ FIX: Use this type (so TS doesn't complain it's unused)
 * and make it match what LyricsPanel actually uses.
 */
type LyricRow = {
  id: string;
  song_id: string;

  // UI uses "content" internally (mapped from DB column "lyrics")
  content: string;

  // selected from DB in lyrics query
  title?: string | null;
  album?: string | null;
  year?: string | null;

  created_at: string;
  updated_at?: string | null;
};

const formatZar = (cents: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(Math.round((cents || 0) / 100));

/** Safer UUID for older devices/browsers */
const uuid = () => {
  try {
    // modern browsers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = globalThis.crypto;
    if (c?.randomUUID) return c.randomUUID();
  } catch {
    // ignore
  }
  // fallback
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
};

const toCents = (zar: string) => {
  const n = Number.parseFloat((zar || "0").toString());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
};

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
        .select(
          "id,title,artist,release_date,price_cents,cover_url,audio_url,album_id,track_number,created_at,is_active"
        )
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
                      .select(
                        "id,title,artist,release_date,price_cents,cover_url,audio_url,album_id,track_number,created_at,is_active"
                      )
                      .order("created_at", { ascending: false });

                    setSongsForLyrics((data as SongRow[]) ?? []);
                  }}
                />
              )}

              {tab === "shows" && <ShowsPanel />}
              {tab === "merch" && <MerchPanel />}
              {tab === "lyrics" && (
                <LyricsPanel
                  songs={songsForLyrics}
                  onLyricsChanged={async () => {
                    // keep song list fresh in case you renamed songs, etc.
                    const { data } = await supabase
                      .from("songs")
                      .select(
                        "id,title,artist,release_date,price_cents,cover_url,audio_url,album_id,track_number,created_at,is_active"
                      )
                      .order("created_at", { ascending: false });

                    setSongsForLyrics((data as SongRow[]) ?? []);
                  }}
                />
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}/* ------------------ UI Bits ------------------ */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
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

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
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
  children: ReactNode;
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
      {label ? <label className="block text-xs text-white/60 mb-2">{label}</label> : null}
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

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 12,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      {label ? <label className="block text-xs text-white/60 mb-2">{label}</label> : null}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 placeholder:text-white/40 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15 resize-y"
      />
    </div>
  );
}

/* ------------------ SONGS CRUD (Album selector + create new) ------------------ */

function SongsPanel({ onSongsChanged }: { onSongsChanged: () => Promise<void> }) {
  const [items, setItems] = useState<SongRow[]>([]);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  // SONG form
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("Bliximstraat");
  const [releaseDate, setReleaseDate] = useState("");
  const [priceZar, setPriceZar] = useState("0");

  // optional manual URLs
  const [coverUrl, setCoverUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  // upload files
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // ✅ Album assignment
  type AlbumMode = "none" | "existing" | "new";
  const [albumMode, setAlbumMode] = useState<AlbumMode>("none");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [trackNumber, setTrackNumber] = useState<string>("");

  // ✅ New album fields (inline)
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumArtist, setNewAlbumArtist] = useState("Bliximstraat");
  const [newAlbumReleaseDate, setNewAlbumReleaseDate] = useState("");
  const [newAlbumCoverFile, setNewAlbumCoverFile] = useState<File | null>(null);
  const [newAlbumCoverUrl, setNewAlbumCoverUrl] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setArtist("Bliximstraat");
    setReleaseDate("");
    setPriceZar("0");
    setCoverUrl("");
    setAudioUrl("");
    setCoverFile(null);
    setAudioFile(null);

    setAlbumMode("none");
    setSelectedAlbumId("");
    setTrackNumber("");

    setNewAlbumTitle("");
    setNewAlbumArtist("Bliximstraat");
    setNewAlbumReleaseDate("");
    setNewAlbumCoverFile(null);
    setNewAlbumCoverUrl("");
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("songs")
      .select(
        "id,title,artist,release_date,price_cents,cover_url,audio_url,album_id,track_number,created_at,is_active"
      )
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

  const onEdit = (row: SongRow) => {
    setEditingId(row.id);
    setTitle(row.title);
    setArtist(row.artist);
    setReleaseDate(row.release_date ?? "");
    setPriceZar(String(Math.round((row.price_cents ?? 0) / 100)));
    setCoverUrl(row.cover_url ?? "");
    setAudioUrl(row.audio_url ?? "");
    setCoverFile(null);
    setAudioFile(null);
    setError(null);

    if (row.album_id) {
      setAlbumMode("existing");
      setSelectedAlbumId(row.album_id);
      setTrackNumber(row.track_number ? String(row.track_number) : "");
    } else {
      setAlbumMode("none");
      setSelectedAlbumId("");
      setTrackNumber("");
    }

    // clear new album fields on edit
    setNewAlbumTitle("");
    setNewAlbumArtist("Bliximstraat");
    setNewAlbumReleaseDate("");
    setNewAlbumCoverFile(null);
    setNewAlbumCoverUrl("");
  };

  // ✅ Soft delete actions
  const deactivate = async (id: string) => {
    const ok = window.confirm(
      "Deactivate this song? It will be hidden from the store (not deleted)."
    );
    if (!ok) return;

    const { error } = await supabase.from("songs").update({ is_active: false }).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }

    await load();
    await onSongsChanged();
  };

  const activate = async (id: string) => {
    const ok = window.confirm("Reactivate this song? It will show in the store again.");
    if (!ok) return;

    const { error } = await supabase.from("songs").update({ is_active: true }).eq("id", id);
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
    const path = `${bucket}/${uuid()}.${safeExt}`;

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
      cacheControl: "3600",
    });

    if (error) throw new Error(error.message ?? "Storage upload failed");

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const createAlbumIfNeeded = async (): Promise<string | null> => {
    if (albumMode === "none") return null;

    if (albumMode === "existing") {
      const clean = selectedAlbumId.trim();
      if (!clean) throw new Error("Please select an album.");
      return clean;
    }

    // albumMode === "new"
    if (!newAlbumTitle.trim()) throw new Error("Album title is required.");
    if (!newAlbumArtist.trim()) throw new Error("Album artist is required.");

    let nextAlbumCoverUrl = newAlbumCoverUrl.trim() || null;
    if (newAlbumCoverFile) nextAlbumCoverUrl = await uploadToBucket("covers", newAlbumCoverFile);

    const { data: albumInsert, error: albumErr } = await supabase
      .from("albums")
      .insert({
        title: newAlbumTitle.trim(),
        artist: newAlbumArtist.trim(),
        release_date: newAlbumReleaseDate ? newAlbumReleaseDate : null,
        cover_url: nextAlbumCoverUrl,
      })
      .select("id")
      .single();

    if (albumErr) throw new Error(albumErr.message);

    const albumId = albumInsert?.id as string;
    if (!albumId) throw new Error("Album creation failed (no id returned).");

    // refresh list + switch to existing
    await loadAlbums();
    setSelectedAlbumId(albumId);
    setAlbumMode("existing");

    return albumId;
  };

  const saveSong = async () => {
    if (!title.trim()) throw new Error("Title is required.");

    const priceCents = toCents(priceZar);

    let nextCoverUrl = coverUrl.trim() || null;
    let nextAudioUrl = audioUrl.trim() || null;

    if (coverFile) nextCoverUrl = await uploadToBucket("covers", coverFile);
    if (audioFile) nextAudioUrl = await uploadToBucket("audio", audioFile);

    const albumId = await createAlbumIfNeeded();

    let nextTrackNumber: number | null = null;
    if (albumId) {
      const tn = Number.parseInt(trackNumber || "", 10);
      if (Number.isFinite(tn) && tn > 0) nextTrackNumber = tn;
    }

    const payload = {
      title: title.trim(),
      artist: artist.trim() || "Bliximstraat",
      release_date: releaseDate ? releaseDate : null,
      price_cents: priceCents,
      cover_url: nextCoverUrl,
      audio_url: nextAudioUrl,
      album_id: albumId,
      track_number: albumId ? nextTrackNumber : null,
      is_active: true,
    };

    if (editingId) {
      const { error } = await supabase.from("songs").update(payload).eq("id", editingId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("songs").insert(payload);
      if (error) throw new Error(error.message);
    }
  };

  const onSave = async () => {
    setError(null);
    setSaving(true);

    try {
      await saveSong();
      await load();
      await onSongsChanged();
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7">
        <Card title="Songs" subtitle="Singles + album tracks. Assign album when adding a song.">
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
              {items.map((s) => {
                const active = s.is_active !== false;

                return (
                  <div
                    key={s.id}
                    className={[
                      "rounded-2xl border border-white/10 bg-black/30 p-4 flex items-start justify-between gap-4",
                      active ? "" : "opacity-60",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate flex items-center gap-2">
                        <span className="truncate">
                          {s.track_number ? `${s.track_number}. ` : ""}
                          {s.title}
                        </span>

                        {!active && (
                          <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-200">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-white/60">
                        {s.artist}
                        {s.release_date ? ` • ${s.release_date}` : ""} • {formatZar(s.price_cents)}
                      </div>

                      {(s.cover_url || s.audio_url) && (
                        <div className="mt-2 text-xs text-white/45 space-y-1">
                          {s.cover_url ? <div className="truncate">Cover: {s.cover_url}</div> : null}
                          {s.audio_url ? <div className="truncate">Audio: {s.audio_url}</div> : null}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <SmallButton onClick={() => onEdit(s)}>Edit</SmallButton>

                      {active ? (
                        <SmallButton variant="danger" onClick={() => void deactivate(s.id)}>
                          Deactivate
                        </SmallButton>
                      ) : (
                        <SmallButton variant="solid" onClick={() => void activate(s.id)}>
                          Reactivate
                        </SmallButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="lg:col-span-5">
        <Card
          title={editingId ? "Edit Song" : "Add Song"}
          subtitle="Add a song and optionally assign it to an album (existing or new)."
        >
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Field label="Title" value={title} onChange={setTitle} placeholder="Neon Streets" />
            <Field label="Artist" value={artist} onChange={setArtist} placeholder="Bliximstraat" />
            <Field label="Release date" value={releaseDate} onChange={setReleaseDate} type="date" />
            <Field label="Price (ZAR)" value={priceZar} onChange={setPriceZar} type="number" />

            {/* ✅ Album selector / create new */}
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
              <div className="text-sm font-semibold text-white/80">Album</div>

              <div className="flex flex-wrap gap-2">
                <SmallButton
                  variant={albumMode === "none" ? "solid" : "ghost"}
                  disabled={saving}
                  onClick={() => {
                    setAlbumMode("none");
                    setSelectedAlbumId("");
                    setTrackNumber("");
                    setNewAlbumTitle("");
                    setNewAlbumCoverFile(null);
                    setNewAlbumCoverUrl("");
                  }}
                >
                  No album (Single)
                </SmallButton>

                <SmallButton
                  variant={albumMode === "existing" ? "solid" : "ghost"}
                  disabled={saving}
                  onClick={() => {
                    setAlbumMode("existing");
                    setNewAlbumTitle("");
                    setNewAlbumCoverFile(null);
                    setNewAlbumCoverUrl("");
                  }}
                >
                  Select existing
                </SmallButton>

                <SmallButton
                  variant={albumMode === "new" ? "solid" : "ghost"}
                  disabled={saving}
                  onClick={() => {
                    setAlbumMode("new");
                    setSelectedAlbumId("");
                    setTrackNumber("");
                    setNewAlbumArtist(artist || "Bliximstraat");
                    setNewAlbumReleaseDate(releaseDate || "");
                  }}
                >
                  Create new
                </SmallButton>
              </div>

              {albumMode === "existing" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-2">Choose album</label>
                    <select
                      value={selectedAlbumId}
                      onChange={(e) => setSelectedAlbumId(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                    >
                      <option value="">Select…</option>
                      {albums.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} {a.release_date ? `(${a.release_date.slice(0, 4)})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Field
                    label="Track number (optional)"
                    value={trackNumber}
                    onChange={setTrackNumber}
                    type="number"
                    placeholder="1"
                  />
                </div>
              )}

              {albumMode === "new" && (
                <div className="space-y-3">
                  <Field
                    label="New album title"
                    value={newAlbumTitle}
                    onChange={setNewAlbumTitle}
                    placeholder="Signals & Static"
                  />
                  <Field
                    label="New album artist"
                    value={newAlbumArtist}
                    onChange={setNewAlbumArtist}
                    placeholder="Bliximstraat"
                  />
                  <Field
                    label="New album release date"
                    value={newAlbumReleaseDate}
                    onChange={setNewAlbumReleaseDate}
                    type="date"
                  />

                  <div>
                    <label className="block text-xs text-white/60 mb-2">Album cover (file)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewAlbumCoverFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-black/30 file:px-3 file:py-1.5 file:text-white/80 hover:file:bg-black/40"
                    />
                    <div className="mt-2 text-xs text-white/50">
                      Or paste an album cover URL (optional)
                    </div>
                    <Field
                      label=""
                      value={newAlbumCoverUrl}
                      onChange={setNewAlbumCoverUrl}
                      placeholder="https://..."
                    />
                  </div>

                  <Field
                    label="Track number (optional)"
                    value={trackNumber}
                    onChange={setTrackNumber}
                    type="number"
                    placeholder="1"
                  />

                  <div className="text-xs text-white/50">
                    This will create the album first, then save the song into it.
                  </div>
                </div>
              )}
            </div>

            {/* Song cover */}
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
              <div className="text-sm font-semibold text-white/80">Song cover</div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-black/30 file:px-3 file:py-1.5 file:text-white/80 hover:file:bg-black/40"
              />

              <div className="text-xs text-white/50">Or paste a cover URL (optional)</div>
              <Field label="" value={coverUrl} onChange={setCoverUrl} placeholder="https://..." />
            </div>

            {/* Audio */}
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
              <div className="text-sm font-semibold text-white/80">Audio</div>

              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-black/30 file:px-3 file:py-1.5 file:text-white/80 hover:file:bg-black/40"
              />

              <div className="text-xs text-white/50">Or paste an audio URL (optional)</div>
              <Field label="" value={audioUrl} onChange={setAudioUrl} placeholder="https://..." />
            </div>

            <div className="flex items-center justify-between pt-1">
              {editingId ? (
                <div className="text-xs text-white/55">Editing song: {editingId}</div>
              ) : (
                <div className="text-xs text-white/55">Creating a new song</div>
              )}

              <div className="flex gap-2">
                {editingId && (
                  <SmallButton
                    onClick={() => {
                      resetForm();
                      setError(null);
                    }}
                    disabled={saving}
                  >
                    Cancel edit
                  </SmallButton>
                )}

                <SmallButton variant="solid" onClick={() => void onSave()} disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add song"}
                </SmallButton>
              </div>
            </div>

            <div className="pt-2">
              <SmallButton
                onClick={() => {
                  resetForm();
                  setError(null);
                }}
                disabled={saving}
              >
                Reset form
              </SmallButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}/* ------------------ LYRICS PANEL (FIXED FOR YOUR DB) ------------------ */

function LyricsPanel({
  songs,
  onLyricsChanged,
}: {
  songs: SongRow[];
  onLyricsChanged: () => Promise<void>;
}) {
  const LYRICS_TABLE = "lyrics";
  const LYRICS_COLUMN = "lyrics"; // ✅ your table uses "lyrics", not "content"

  /**
   * ✅ FIX: Use LyricRow[] so TS sees LyricRow is actually used.
   * No UI/layout change.
   */
  const [items, setItems] = useState<LyricRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [songId, setSongId] = useState<string>("");
  const [content, setContent] = useState<string>("");

  const songTitle = (id: string) => songs.find((s) => s.id === id)?.title ?? "Unknown song";

  const deriveMetaFromSong = (sid: string) => {
    const s = songs.find((x) => x.id === sid);

    const title = s?.title ?? null;

    // You don't have album title in SongRow, only album_id.
    // We'll keep your lyrics table consistent:
    const album = s?.album_id ? "Album" : "Single";

    // year from release_date if possible, else current year
    let year = "";
    if (s?.release_date) year = String(s.release_date).slice(0, 4);
    if (!year) year = String(new Date().getFullYear());

    return { title, album, year };
  };

  const resetForm = () => {
    setEditingId(null);
    setSongId("");
    setContent("");
  };

  const load = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from(LYRICS_TABLE)
      .select("id,song_id,title,album,year,lyrics,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const mapped: LyricRow[] =
      ((data as any[]) ?? []).map((r) => ({
        id: String(r.id),
        song_id: String(r.song_id),
        // map DB "lyrics" into UI "content" so the rest of your component stays untouched
        content: String(r[LYRICS_COLUMN] ?? ""),
        title: r.title ?? null,
        album: r.album ?? null,
        year: r.year ?? null,
        created_at: String(r.created_at),
        updated_at: r.updated_at ? String(r.updated_at) : null,
      })) ?? [];

    setItems(mapped);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onEdit = (row: Pick<LyricRow, "id" | "song_id" | "content">) => {
    setEditingId(row.id);
    setSongId(row.song_id);
    setContent(row.content ?? "");
    setError(null);
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Delete these lyrics? This cannot be undone.");
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase.from(LYRICS_TABLE).delete().eq("id", id);
      if (error) throw new Error(error.message);
      await load();
      await onLyricsChanged();
      if (editingId === id) resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete lyrics.");
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const cleanSongId = songId.trim();
      if (!cleanSongId) throw new Error("Please select a song.");
      if (!content.trim()) throw new Error("Lyrics content is required.");

      const meta = deriveMetaFromSong(cleanSongId);

      const payload: Record<string, any> = {
        song_id: cleanSongId,
        // ✅ write into the real DB column:
        [LYRICS_COLUMN]: content,
        // ✅ keep these columns populated (your table has them):
        title: meta.title,
        album: meta.album,
        year: meta.year,
      };

      if (editingId) {
        const { error } = await supabase.from(LYRICS_TABLE).update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from(LYRICS_TABLE).insert(payload);
        if (error) throw new Error(error.message);
      }

      await load();
      await onLyricsChanged();
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save lyrics.");
    } finally {
      setSaving(false);
    }
  };

  const quickLoadForSong = (sid: string) => {
    const existing = items.find((x) => x.song_id === sid);
    if (existing) {
      onEdit(existing);
    } else {
      setEditingId(null);
      setSongId(sid);
      setContent("");
      setError(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7">
        <Card title="Lyrics" subtitle="Link lyrics to a song. Edit, replace, delete. No drama.">
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
                    <div className="font-semibold truncate">{songTitle(l.song_id)}</div>
                    <div className="text-xs text-white/60 truncate">
                      {l.album ? `${l.album}` : "—"}
                      {l.year ? ` • ${l.year}` : ""}
                    </div>

                    <div className="mt-2 text-xs text-white/45 line-clamp-3 whitespace-pre-wrap">
                      {l.content}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <SmallButton onClick={() => onEdit(l)}>Edit</SmallButton>
                    <SmallButton
                      variant="danger"
                      onClick={() => void onDelete(l.id)}
                      disabled={saving}
                    >
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
          title={editingId ? "Edit Lyrics" : "Add Lyrics"}
          subtitle="Pick a song, paste lyrics, save. Revolutionary."
        >
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
              <div className="text-sm font-semibold text-white/80">Song</div>

              <div>
                <label className="block text-xs text-white/60 mb-2">Choose song</label>
                <select
                  value={songId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setSongId(sid);
                    if (sid) quickLoadForSong(sid);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 outline-none focus:border-teal-400/40 focus:ring-2 focus:ring-teal-400/15"
                >
                  <option value="">Select…</option>
                  {songs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {(s.track_number ? `${s.track_number}. ` : "") + s.title}
                    </option>
                  ))}
                </select>

                <div className="mt-2 text-xs text-white/55">
                  Tip: selecting a song will auto-load existing lyrics (if any) so you can replace them.
                </div>
              </div>
            </div>

            <TextArea
              label="Lyrics (plain text)"
              value={content}
              onChange={setContent}
              placeholder={"Verse 1\n...\n\nChorus\n..."}
              rows={14}
            />

            <div className="flex items-center justify-between pt-1">
              {editingId ? (
                <div className="text-xs text-white/55">Editing lyrics: {editingId}</div>
              ) : (
                <div className="text-xs text-white/55">Creating new lyrics</div>
              )}

              <div className="flex gap-2">
                {editingId && (
                  <SmallButton
                    onClick={() => {
                      resetForm();
                      setError(null);
                    }}
                    disabled={saving}
                  >
                    Cancel edit
                  </SmallButton>
                )}

                <SmallButton variant="solid" onClick={() => void onSave()} disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add lyrics"}
                </SmallButton>
              </div>
            </div>

            <div className="pt-2">
              <SmallButton
                onClick={() => {
                  resetForm();
                  setError(null);
                }}
                disabled={saving}
              >
                Reset form
              </SmallButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}/* ------------------ OTHER PANELS ------------------ */

function ShowsPanel() {
  // If your table isn't called "shows", change this:
  const SHOWS_TABLE = "shows";

  const [items, setItems] = useState<ShowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [showDate, setShowDate] = useState("");
  const [showTime, setShowTime] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [isPast, setIsPast] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setVenue("");
    setCity("");
    setShowDate("");
    setShowTime("");
    setTicketUrl("");
    setIsPast(false);
  };

  const load = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from(SHOWS_TABLE)
      .select("id,title,venue,city,show_date,show_time,is_past,ticket_url,created_at")
      .order("show_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setItems((data as ShowRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onEdit = (row: ShowRow) => {
    setEditingId(row.id);
    setTitle(row.title ?? "");
    setVenue(row.venue ?? "");
    setCity(row.city ?? "");
    setShowDate(row.show_date ?? "");
    setShowTime(row.show_time ?? "");
    setTicketUrl(row.ticket_url ?? "");
    setIsPast(Boolean(row.is_past));
    setError(null);
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Delete this show? This cannot be undone.");
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase.from(SHOWS_TABLE).delete().eq("id", id);
      if (error) throw new Error(error.message);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete show.");
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);

    try {
      if (!title.trim()) throw new Error("Title is required.");

      const payload = {
        title: title.trim(),
        venue: venue.trim(),
        city: city.trim(),
        show_date: showDate ? showDate : null,
        show_time: showTime ? showTime : null,
        is_past: Boolean(isPast),
        ticket_url: ticketUrl.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase.from(SHOWS_TABLE).update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from(SHOWS_TABLE).insert(payload);
        if (error) throw new Error(error.message);
      }

      await load();
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save show.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7">
        <Card title="Shows" subtitle="Add / edit / delete upcoming shows.">
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
                    <div className="font-semibold truncate flex items-center gap-2">
                      <span className="truncate">{s.title}</span>
                      {s.is_past ? (
                        <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/70">
                          Past
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs text-white/60">
                      {[s.venue, s.city].filter(Boolean).join(" • ")}
                      {s.show_date ? ` • ${s.show_date}` : ""}
                      {s.show_time ? ` • ${s.show_time}` : ""}
                    </div>

                    {s.ticket_url ? (
                      <div className="mt-2 text-xs text-white/45 truncate">Tickets: {s.ticket_url}</div>
                    ) : null}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <SmallButton onClick={() => onEdit(s)}>Edit</SmallButton>
                    <SmallButton variant="danger" onClick={() => void onDelete(s.id)} disabled={saving}>
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
        <Card title={editingId ? "Edit Show" : "Add Show"} subtitle="Keep it simple, keep it accurate.">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Field label="Title" value={title} onChange={setTitle} placeholder="Live at ___" />
            <Field label="Venue" value={venue} onChange={setVenue} placeholder="The Venue" />
            <Field label="City" value={city} onChange={setCity} placeholder="Pretoria" />
            <Field label="Show date" value={showDate} onChange={setShowDate} type="date" />
            <Field label="Show time" value={showTime} onChange={setShowTime} type="time" />
            <Field label="Ticket URL" value={ticketUrl} onChange={setTicketUrl} placeholder="https://..." />

            <ToggleRow label="Mark as past" checked={isPast} onChange={setIsPast} disabled={saving} />

            <div className="flex items-center justify-between pt-1">
              {editingId ? (
                <div className="text-xs text-white/55">Editing show: {editingId}</div>
              ) : (
                <div className="text-xs text-white/55">Creating a new show</div>
              )}

              <div className="flex gap-2">
                {editingId && (
                  <SmallButton
                    onClick={() => {
                      resetForm();
                      setError(null);
                    }}
                    disabled={saving}
                  >
                    Cancel edit
                  </SmallButton>
                )}

                <SmallButton variant="solid" onClick={() => void onSave()} disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add show"}
                </SmallButton>
              </div>
            </div>

            <div className="pt-2">
              <SmallButton
                onClick={() => {
                  resetForm();
                  setError(null);
                }}
                disabled={saving}
              >
                Reset form
              </SmallButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MerchPanel() {
  // If your table isn't called "products", change this:
  // Common alternatives: "merch", "merch_products"
  const PRODUCTS_TABLE = "products";

  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Merch");
  const [priceZar, setPriceZar] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [note, setNote] = useState("");
  const [isPreorder, setIsPreorder] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCategory("Merch");
    setPriceZar("0");
    setImageUrl("");
    setNote("");
    setIsPreorder(false);
  };

  const load = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select("id,name,category,price_cents,image_url,note,is_preorder,created_at")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setItems((data as ProductRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onEdit = (row: ProductRow) => {
    setEditingId(row.id);
    setName(row.name ?? "");
    setCategory(row.category ?? "Merch");
    setPriceZar(String(Math.round((row.price_cents ?? 0) / 100)));
    setImageUrl(row.image_url ?? "");
    setNote(row.note ?? "");
    setIsPreorder(Boolean(row.is_preorder));
    setError(null);
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Delete this merch item? This cannot be undone.");
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase.from(PRODUCTS_TABLE).delete().eq("id", id);
      if (error) throw new Error(error.message);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete merch item.");
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);

    try {
      if (!name.trim()) throw new Error("Name is required.");

      const payload = {
        name: name.trim(),
        category: category.trim() || "Merch",
        price_cents: toCents(priceZar),
        image_url: imageUrl.trim() || null,
        note: note.trim() || null,
        is_preorder: Boolean(isPreorder),
      };

      if (editingId) {
        const { error } = await supabase.from(PRODUCTS_TABLE).update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from(PRODUCTS_TABLE).insert(payload);
        if (error) throw new Error(error.message);
      }

      await load();
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save merch item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7">
        <Card title="Merch" subtitle="Manage your merch/products.">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-white/60">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-white/60">No merch yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate flex items-center gap-2">
                      <span className="truncate">{p.name}</span>
                      {p.is_preorder ? (
                        <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/70">
                          Preorder
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs text-white/60">
                      {(p.category || "Merch") + " • " + formatZar(p.price_cents)}
                    </div>

                    {p.image_url ? (
                      <div className="mt-2 text-xs text-white/45 truncate">Image: {p.image_url}</div>
                    ) : null}
                    {p.note ? (
                      <div className="mt-1 text-xs text-white/45 truncate">Note: {p.note}</div>
                    ) : null}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <SmallButton onClick={() => onEdit(p)}>Edit</SmallButton>
                    <SmallButton variant="danger" onClick={() => void onDelete(p.id)} disabled={saving}>
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
        <Card title={editingId ? "Edit Merch" : "Add Merch"} subtitle="Add a product, keep the pricing clean.">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Field label="Name" value={name} onChange={setName} placeholder="T-Shirt (Black)" />
            <Field label="Category" value={category} onChange={setCategory} placeholder="Merch" />
            <Field label="Price (ZAR)" value={priceZar} onChange={setPriceZar} type="number" />
            <Field label="Image URL" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />
            <Field label="Note" value={note} onChange={setNote} placeholder="Optional" />

            <ToggleRow label="Preorder" checked={isPreorder} onChange={setIsPreorder} disabled={saving} />

            <div className="flex items-center justify-between pt-1">
              {editingId ? (
                <div className="text-xs text-white/55">Editing merch: {editingId}</div>
              ) : (
                <div className="text-xs text-white/55">Creating a new merch item</div>
              )}

              <div className="flex gap-2">
                {editingId && (
                  <SmallButton
                    onClick={() => {
                      resetForm();
                      setError(null);
                    }}
                    disabled={saving}
                  >
                    Cancel edit
                  </SmallButton>
                )}

                <SmallButton variant="solid" onClick={() => void onSave()} disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add merch"}
                </SmallButton>
              </div>
            </div>

            <div className="pt-2">
              <SmallButton
                onClick={() => {
                  resetForm();
                  setError(null);
                }}
                disabled={saving}
              >
                Reset form
              </SmallButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------ Small helper ------------------ */

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <span className="text-sm text-white/80 font-semibold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 accent-teal-400"
      />
    </label>
  );
}