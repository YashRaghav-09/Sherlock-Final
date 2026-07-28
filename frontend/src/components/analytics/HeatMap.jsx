import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Flame } from "lucide-react";

export default function HeatMap({ hotspots }) {
  // hotspots: [{ location, lat, lng, count }]
  const maxCount = Math.max(1, ...hotspots.map((h) => h.count));

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Flame className="text-orange-400" size={24} />
        Case Hotspots
      </h2>

      {hotspots.length === 0 ? (
        <p className="text-slate-500">No case location data yet.</p>
      ) : (
        <MapContainer
          center={[28.6139, 77.2090]}
          zoom={11}
          style={{ height: "340px", width: "100%", borderRadius: "1rem" }}
        >
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {hotspots.map((spot) => {
            const intensity = spot.count / maxCount;
            const radius = 10 + intensity * 30;
            const color =
              intensity > 0.66 ? "#ef4444" : intensity > 0.33 ? "#f59e0b" : "#22d3ee";

            return (
              <CircleMarker
                key={spot.location}
                center={[spot.lat, spot.lng]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.35,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{spot.location}</strong>
                  <br />
                  {spot.count} case{spot.count !== 1 ? "s" : ""}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}