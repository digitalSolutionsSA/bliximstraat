import { useEffect, useMemo, useState } from "react";
import PageContainer from "../layout/PageContainer";
import { supabase } from "../../lib/supabase"; // adjust if your path differs

type SongUI = {
  id: string;
  title: string;
  artist: string;
  dateLabel: string;
};

type ShowUI = {
  id: string;
  title: string;
  venue: string;
  city: string;
  dateLabel: string;
  ticketUrl?: string | null;
};

/** Try multiple possible date fields for shows, since schemas evolve when humans are involved. */
function pickFirstDate(v: any): Date | null {
  const raw = v?.show_date ?? v?.created_at ?? null;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}



function relativeLabel(from: Date): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThatDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  const diffMs = startOfToday.getTime() - startOfThatDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;

  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;

  // fallback: show a simple date for older stuff
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(from);
}

function formatShowLabel(d: Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(d);
}

export default function HomeHighlights() {
  const [latestSongs, setLatestSongs] = useState<SongUI[]>([]);
  const [upcomingShows, setUpcomingShows] = useState<ShowUI[]>([]);
  const [loading, setLoading] = useState(true);

  // optional: for debugging, but not required
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // --- Latest songs: newest first ---
        // If you ONLY want singles (not album tracks), uncomment the .is("album_id", null)
        const songsRes = await supabase
          .from("songs")
          .select("id,title,artist,created_at,release_date,album_id")
          // .is("album_id", null) // <- uncomment if you want singles only
          .order("created_at", { ascending: false })
          .limit(4);

        if (songsRes.error) throw songsRes.error;

        const songs: SongUI[] = (songsRes.data ?? []).map((s: any) => {
          const d =
            (s.release_date && new Date(s.release_date)) ||
            (s.created_at && new Date(s.created_at)) ||
            new Date();
          return {
            id: String(s.id),
            title: String(s.title ?? "Untitled"),
            artist: String(s.artist ?? "Unknown"),
            dateLabel: relativeLabel(d),
          };
        });

        // --- Upcoming shows: soonest first, only future-ish ---
        // We fetch a bit more, then filter/sort client-side because show schemas vary.
          const showsRes = await supabase
          .from("shows")
          .select("id,title,venue,city,show_date,ticket_url,created_at")
          .order("show_date", { ascending: true })
          .limit(25);



        if (showsRes.error) throw showsRes.error;

        const now = new Date();
        const showsRaw = showsRes.data ?? [];

        const showsSorted = showsRaw
          .map((sh: any) => {
            const d = pickFirstDate(sh);
            return { sh, d };
          })
          .filter(({ d }) => d && d.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime())
          .sort((a, b) => (a.d!.getTime() - b.d!.getTime()))
          .slice(0, 3)
          .map(({ sh, d }) => ({
            id: String(sh.id),
            title: String(sh.title ?? "Untitled show"),
            venue: String(sh.venue ?? "TBA"),
            city: String(sh.city ?? ""),
            dateLabel: formatShowLabel(d!),
            ticketUrl: sh.ticket_url ?? null,
          }));

        if (!cancelled) {
          setLatestSongs(songs);
          setUpcomingShows(showsSorted);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load highlights");
          setLatestSongs([]);
          setUpcomingShows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const songsToRender = useMemo(() => latestSongs, [latestSongs]);
  const showsToRender = useMemo(() => upcomingShows, [upcomingShows]);

  return (
    <section className="bg-white text-black">
      <PageContainer className="py-12 sm:py-14 md:py-16">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Latest drops & upcoming shows
          </h2>
          <p className="text-black/60 max-w-2xl">
            New music, upcoming gigs, and the stuff you actually came here for.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Latest Songs */}
          <div>
            <div className="flex items-end justify-between">
              <h3 className="text-xl font-bold">Latest Songs</h3>
              <a
                href="/music"
                className="text-sm font-semibold text-black/70 hover:text-black underline underline-offset-4"
              >
                View all
              </a>
            </div>

            {loading ? (
              <div className="mt-4 text-sm text-black/60">Loading songs…</div>
            ) : songsToRender.length === 0 ? (
              <div className="mt-4 text-sm text-black/60">
                No songs yet. Go upload some in Admin, rockstar.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {songsToRender.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="text-xs font-semibold text-black/50">
                      {s.dateLabel}
                    </div>
                    <div className="mt-2 text-lg font-extrabold leading-tight">
                      {s.title}
                    </div>
                    <div className="mt-1 text-sm text-black/65">{s.artist}</div>

                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <a
                        href={`/music#song-${s.id}`}
                        className="w-full sm:w-auto text-center rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-black/90 transition"
                      >
                        Play
                      </a>
                      <a
                        href={`/music#song-${s.id}`}
                        className="w-full sm:w-auto text-center rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 transition"
                      >
                        Details
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Shows */}
          <div>
            <div className="flex items-end justify-between">
              <h3 className="text-xl font-bold">Upcoming Shows</h3>
              <a
                href="/shows"
                className="text-sm font-semibold text-black/70 hover:text-black underline underline-offset-4"
              >
                View all
              </a>
            </div>

            {loading ? (
              <div className="mt-4 text-sm text-black/60">Loading shows…</div>
            ) : showsToRender.length === 0 ? (
              <div className="mt-4 text-sm text-black/60">
                No upcoming shows found. Either you’re taking a break or your table date fields are chaos.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {showsToRender.map((sh) => (
                  <div
                    key={sh.id}
                    className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start gap-4"
                  >
                    <div className="w-full sm:w-auto sm:min-w-[96px] rounded-xl bg-black text-white px-3 py-2 text-center">
                      <div className="text-xs uppercase tracking-widest text-white/70">
                        Date
                      </div>
                      <div className="mt-1 font-extrabold">{sh.dateLabel}</div>
                    </div>

                    <div className="flex-1 w-full">
                      <div className="text-lg font-extrabold leading-tight">
                        {sh.title}
                      </div>
                      <div className="mt-1 text-sm text-black/70">
                        {sh.venue}
                        {sh.city ? ` • ${sh.city}` : ""}
                      </div>

                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        {sh.ticketUrl ? (
                          <a
                            href={sh.ticketUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:w-auto text-center rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-black/90 transition"
                          >
                            Tickets
                          </a>
                        ) : (
                          <a
                            href={`/shows#show-${sh.id}`}
                            className="w-full sm:w-auto text-center rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-black/90 transition"
                          >
                            Tickets
                          </a>
                        )}

                        <a
                          href={`/shows#show-${sh.id}`}
                          className="w-full sm:w-auto text-center rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 transition"
                        >
                          Details
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-2 text-sm text-black/60">
                  Want your event featured?{" "}
                  <a
                    className="font-semibold underline underline-offset-4"
                    href="/bookings"
                  >
                    Book a slot
                  </a>
                  .
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 text-xs text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 border-t border-black/10 pt-10">
          <div className="text-sm text-black/60">
            Next up: releases grid, featured artist, merch highlights.
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
