import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  title: string;
  venue: string;
  city: string;
  show_date: string | null; // "YYYY-MM-DD"
  show_time: string | null; // "HH:MM"
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
        <video className="h-full w-full object-cover" src="/normal-bg.mp4" autoPlay muted loop playsInline />
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
                  <span className="text-teal-300 drop-shadow-[0_0_18px_rgba(20,184,166,0.35)]">Panel</span>
                </h1>
                <p className="mt-2 text-white/70">Add / edit / delete songs, shows, merch and lyrics.</p>
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
              {tab === "lyrics" && <LyricsPanel songs={songsForLyrics} />}
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

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
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
}/* ------------------ SONGS CRUD (Album selector + create new) ------------------ */

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
      .select("id,title,artist,release_date,price_cents,cover_url,audio_url,album_id,track_number,created_at,is_active")
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
    const ok = window.confirm("Deactivate this song? It will be hidden from the store (not deleted).");
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
                    <div className="mt-2 text-xs text-white/50">Or paste an album cover URL (optional)</div>
                    <Field label="" value={newAlbumCoverUrl} onChange={setNewAlbumCoverUrl} placeholder="https://..." />
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
}/* ------------------ OTHER PANELS (stubs) ------------------ */

function ShowsPanel() {
  return (
    <Card title="Shows" subtitle="Your shows CRUD lives here.">
      <div className="text-white/60">Shows panel not included in the snippet.</div>
    </Card>
  );
}

function MerchPanel() {
  return (
    <Card title="Merch" subtitle="Your merch CRUD lives here.">
      <div className="text-white/60">Merch panel not included in the snippet.</div>
    </Card>
  );
}

function LyricsPanel({ songs }: { songs: SongRow[] }) {
  return (
    <Card title="Lyrics" subtitle="Your lyrics CRUD lives here.">
      <div className="text-white/60">
        Lyrics panel not included in the snippet. Songs available for linking: {songs.length}
      </div>
    </Card>
  );
}