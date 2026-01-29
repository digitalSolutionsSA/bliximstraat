type Song = {
  title: string;
  artist: string;
  date: string;
};

type Show = {
  title: string;
  venue: string;
  date: string;
  city: string;
};

const latestSongs: Song[] = [
  { title: "Midnight Run", artist: "Bliximstraat", date: "Today" },
  { title: "Streetlight Static", artist: "Nite Echo", date: "2 days ago" },
  { title: "Concrete Choir", artist: "VHS Saints", date: "1 week ago" },
  { title: "Neon Dust", artist: "Tape Ghosts", date: "2 weeks ago" },
];

const upcomingShows: Show[] = [
  { title: "Live at The Warehouse", venue: "The Warehouse", city: "Johannesburg", date: "Fri 14 Feb" },
  { title: "Street Session", venue: "Rooftop Stage", city: "Pretoria", date: "Sat 22 Feb" },
  { title: "Late Night Set", venue: "Underground Bar", city: "Vanderbijlpark", date: "Sat 01 Mar" },
];

export default function HomeHighlights() {
  return (
    <section className="bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-16">
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

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {latestSongs.map((s) => (
                <div
                  key={`${s.title}-${s.artist}`}
                  className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="text-xs font-semibold text-black/50">{s.date}</div>
                  <div className="mt-2 text-lg font-extrabold leading-tight">{s.title}</div>
                  <div className="mt-1 text-sm text-black/65">{s.artist}</div>

                  <div className="mt-4 flex gap-2">
                    <button className="rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-black/90 transition">
                      Play
                    </button>
                    <button className="rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 transition">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
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

            <div className="mt-4 space-y-3">
              {upcomingShows.map((sh) => (
                <div
                  key={`${sh.title}-${sh.date}`}
                  className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm hover:shadow-md transition flex items-start gap-4"
                >
                  <div className="min-w-[96px] rounded-xl bg-black text-white px-3 py-2 text-center">
                    <div className="text-xs uppercase tracking-widest text-white/70">Date</div>
                    <div className="mt-1 font-extrabold">{sh.date}</div>
                  </div>

                  <div className="flex-1">
                    <div className="text-lg font-extrabold leading-tight">{sh.title}</div>
                    <div className="mt-1 text-sm text-black/70">
                      {sh.venue} • {sh.city}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button className="rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-black/90 transition">
                        Tickets
                      </button>
                      <button className="rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 transition">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2 text-sm text-black/60">
                Want your event featured?{" "}
                <a className="font-semibold underline underline-offset-4" href="/bookings">
                  Book a slot
                </a>
                .
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-black/10 pt-10">
          <div className="text-sm text-black/60">
            Next up: releases grid, featured artist, merch highlights.
          </div>
        </div>
      </div>
    </section>
  );
}
