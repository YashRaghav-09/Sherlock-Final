import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPinned, Shield, AlertTriangle, Navigation, X } from "lucide-react";
import api from "../../services/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const hqIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  className: "hue-rotate-[140deg]",
});

const targetIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  className: "hue-rotate-[300deg]",
});

const HQ_POSITION = [28.6139, 77.209];

function FlyTo({ position, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom, { duration: 1.2 });
  }, [position, zoom, map]);
  return null;
}

function formatDistance(meters) {
  if (meters == null) return "";
  const km = meters / 1000;
  return km < 1 ? `${Math.round(meters)} m` : `${km.toFixed(1)} km`;
}

function formatDuration(seconds) {
  if (seconds == null) return "";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

// Midpoint of the route line, used to anchor the label
function getMidpoint(coords) {
  if (!coords || coords.length === 0) return HQ_POSITION;
  const mid = coords[Math.floor(coords.length / 2)];
  return mid;
}

export default function LiveMap({ target, onClearTarget }) {
  const [locations, setLocations] = useState([]);
  const [officersActive, setOfficersActive] = useState(null);
  const [activeIncidents, setActiveIncidents] = useState(null);
  const [nearbyCases, setNearbyCases] = useState([]);

  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    api
      .get("/api/dashboard/live-locations")
      .then((res) => {
        setLocations(res.data.locations ?? []);
        setOfficersActive(res.data.officers_active ?? null);
        setActiveIncidents(res.data.active_incidents ?? null);
      })
      .catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    api
      .get("/api/cases")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setNearbyCases(
          list.filter(
            (c) => c.latitude != null && c.longitude != null && c.status !== "Closed"
          )
        );
      })
      .catch(() => setNearbyCases([]));
  }, []);

  const fetchRoute = useCallback(async (from, to) => {
    setRouteLoading(true);
    setRoute(null);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== "Ok" || !data.routes?.length) {
        throw new Error("No route found");
      }

      const r = data.routes[0];
      const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

      setRoute({ coords, distance: r.distance, duration: r.duration });
    } catch (err) {
      console.error("Routing failed:", err);
      setRoute({ coords: [from, to], distance: null, duration: null });
    } finally {
      setRouteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (target && target.lat != null && target.lng != null) {
      fetchRoute(HQ_POSITION, [target.lat, target.lng]);
    } else {
      setRoute(null);
    }
  }, [target, fetchRoute]);

  const hasTarget = !!target && target.lat != null && target.lng != null;
  const midpoint = route ? getMidpoint(route.coords) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-800 gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPinned className="text-cyan-400 shrink-0" />
            Live Navigation
          </h2>
          <p className="text-slate-400 text-sm mt-1 truncate">
            {hasTarget ? `Route to: ${target.label}` : "Real-time Police Monitoring"}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasTarget && (
            <button
              onClick={onClearTarget}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-xs bg-slate-800 px-3 py-2 rounded-lg transition"
            >
              <X size={14} />
              Clear
            </button>
          )}

          {hasTarget ? (
            <div className="flex items-center gap-2 text-cyan-400 text-sm">
              <Navigation size={16} />
              ROUTING
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-ping"></div>
              LIVE
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={HQ_POSITION}
        zoom={12}
        style={{ height: "420px", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyTo position={hasTarget ? [target.lat, target.lng] : HQ_POSITION} />

        <Marker position={HQ_POSITION} icon={hqIcon}>
          <Popup>
            <div className="font-semibold">Police HQ / Dispatch</div>
          </Popup>
        </Marker>

        {nearbyCases.map((c) => (
          <Marker key={`case-${c.id}`} position={[c.latitude, c.longitude]}>
            <Popup>
              <div className="font-semibold">{c.title}</div>
              <div className="text-xs">{c.case_number} — {c.status}</div>
            </Popup>
          </Marker>
        ))}

        {locations.map((loc) => (
          <Marker key={`loc-${loc.id}`} position={[loc.lat, loc.lng]}>
            <Popup>
              <div className="font-semibold">{loc.label ?? loc.type}</div>
            </Popup>
          </Marker>
        ))}

        {hasTarget && (
          <>
            <Marker position={[target.lat, target.lng]} icon={targetIcon}>
              <Popup>
                <div className="font-semibold">{target.label}</div>
              </Popup>
            </Marker>

            {route && (
              <Polyline
                positions={route.coords}
                pathOptions={{ color: "#06b6d4", weight: 5, opacity: 0.85 }}
              >
                {!routeLoading && (
                  <Tooltip permanent direction="center" className="route-label-tooltip">
                    <span>
                      {route.distance != null ? formatDistance(route.distance) : "~"}
                      {"  •  "}
                      {route.duration != null ? formatDuration(route.duration) : "~"}
                    </span>
                  </Tooltip>
                )}
              </Polyline>
            )}
          </>
        )}
      </MapContainer>

      <style>{`
        .route-label-tooltip {
          background: #0891b2 !important;
          border: none !important;
          color: white !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          padding: 4px 10px !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        }
        .route-label-tooltip::before {
          display: none !important;
        }
      `}</style>

      <div className="grid grid-cols-2 border-t border-slate-800">
        <div className="p-5 flex items-center gap-3">
          <Shield className="text-cyan-400" />
          <div>
            <p className="text-sm text-slate-400">Nearby Units</p>
            <h3 className="font-bold">
              {officersActive !== null ? `${officersActive} Officers Active` : "—"}
            </h3>
          </div>
        </div>
        <div className="p-5 flex items-center gap-3">
          <AlertTriangle className="text-red-400" />
          <div>
            <p className="text-sm text-slate-400">Active Incidents</p>
            <h3 className="font-bold">
              {activeIncidents !== null ? `${activeIncidents} High Priority` : "—"}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}