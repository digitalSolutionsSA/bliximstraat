import { useEffect, useMemo, useState, type ComponentType } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Netlify is Linux + strict TS.
 * If your react-leaflet / leaflet typings are mismatched, TS can claim
 * props like center/zoom/radius/direction don't exist.
 *
 * These casts make the build robust without changing runtime behavior.
 */
const RLMapContainer = MapContainer as unknown as ComponentType<any>;
const RLTileLayer = TileLayer as unknown as ComponentType<any>;
const RLCircleMarker = CircleMarker as unknown as ComponentType<any>;
const RLTooltip = Tooltip as unknown as ComponentType<any>;

/**
 * Local minimal LatLngExpression type so we don't depend on leaflet's .d.ts
 * (avoids TS7016 "Could not find a declaration file for module 'leaflet'").
 */
type LatLngTuple = [number, number];
type LatLngLiteral = { lat: number; lng: number };
type LatLngExpression = LatLngTuple | LatLngLiteral;

type Row = {
  province: string;
};

const PROVINCE_COORDS: Record<string, LatLngExpression> = {
  "Western Cape": [-33.9249, 18.4241],
  "Northern Cape": [-29.0467, 21.8569],
  "Eastern Cape": [-33.0153, 27.9116],
  "Free State": [-29.0852, 26.1596],
  Gauteng: [-26.2041, 28.0473],
  "KwaZulu-Natal": [-29.8587, 31.0218],
  Limpopo: [-23.9045, 29.4689],
  Mpumalanga: [-25.4658, 30.9853],
  "North West": [-25.67, 27.2428],
};

// tiny helper for “1 person / 2 people”
function peopleLabel(n: number) {
  if (n === 1) return "1 request";
  return `${n} requests`;
}

export default function TourDemandMap() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/.netlify/functions/booking-signals-public");
        const json = await res.json();
        if (!alive) return;
        setRows(Array.isArray(json?.rows) ? json.rows : []);
      } catch {
        if (!alive) return;
        setRows([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const total = rows.length;

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const p = (r.province || "").trim();
      if (!p) continue;
      m.set(p, (m.get(p) || 0) + 1);
    }
    return m;
  }, [rows]);

  const markers = useMemo(() => {
    return Array.from(counts.entries())
      .map(([province, count]) => {
        const coords = PROVINCE_COORDS[province];
        if (!coords) return null;
        return { province, count, coords };
      })
      .filter(Boolean) as {
      province: string;
      count: number;
      coords: LatLngExpression;
    }[];
  }, [counts]);

  const topProvinces = useMemo(() => {
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [counts]);

  // Center a bit more “SA focused” so you don’t get tons of ocean
  const center: LatLngExpression = [-29.5, 25.0];

  return (
    <section className="mt-16 mb-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
              Tour Demand
            </h2>
            <p className="text-white/60 mt-1">
              {loading
                ? "Loading demand signals..."
                : total === 0
                  ? "No requests yet. Be the first to pin your city."
                  : "Live requests by province."}
            </p>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
              <span className="text-white/60 mr-2">Total</span>
              <span className="font-semibold">
                {loading ? "…" : peopleLabel(total)}
              </span>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
              <span className="text-white/60 mr-2">Provinces</span>
              <span className="font-semibold">{loading ? "…" : counts.size}</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 bg-black/30 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {/* Top strip */}
          <div className="px-5 py-4 border-b border-white/10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-white/80 text-sm">
              Venues can quickly see where people are asking for a show.
            </div>

            {/* Top provinces (mini list) */}
            <div className="flex flex-wrap gap-2">
              {(loading ? [] : topProvinces).map(([prov, n]) => (
                <div
                  key={prov}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white"
                  title={prov}
                >
                  <span className="text-white/70">{prov}</span>
                  <span className="mx-2 text-white/30">•</span>
                  <span className="font-semibold">{n}</span>
                </div>
              ))}
              {!loading && topProvinces.length === 0 && (
                <div className="text-xs text-white/50">No data yet</div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="relative">
            {/* subtle overlay to “blend” with your dark site */}
            <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-b from-black/10 via-transparent to-black/20" />

            {/* Responsive height */}
            <div className="h-[360px] md:h-[440px]">
              <RLMapContainer
                center={center}
                zoom={5}
                minZoom={4}
                maxZoom={9}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
              >
                {/* Cleaner tile style than default OSM */}
                <RLTileLayer
                  attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {markers.map((m) => {
                  // size scales with demand
                  const radius = Math.min(26, 7 + Math.sqrt(m.count) * 3);

                  return (
                    <RLCircleMarker
                      key={m.province}
                      center={m.coords}
                      radius={radius}
                      pathOptions={{
                        color: "#ff2d2d",
                        fillColor: "#ff2d2d",
                        fillOpacity: 0.55,
                        weight: 2,
                      }}
                    >
                      <RLTooltip direction="top" offset={[0, -6]} opacity={1}>
                        <div style={{ fontWeight: 800 }}>{m.province}</div>
                        <div style={{ opacity: 0.9 }}>
                          {peopleLabel(m.count)}
                        </div>
                      </RLTooltip>
                    </RLCircleMarker>
                  );
                })}
              </RLMapContainer>
            </div>

            {/* Empty state overlay */}
            {!loading && total === 0 && (
              <div className="absolute inset-0 z-[500] flex items-center justify-center px-6">
                <div className="max-w-md rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-5 text-center">
                  <div className="text-white font-semibold">No pins yet</div>
                  <div className="text-white/70 text-sm mt-1">
                    People can use the map-pin WhatsApp button to submit their
                    town and request a performance.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-5 py-3 border-t border-white/10 text-xs text-white/50">
            Pins are shown by province area (not exact address). Keeps it
            simple, safe, and useful for bookings.
          </div>
        </div>
      </div>
    </section>
  );
}