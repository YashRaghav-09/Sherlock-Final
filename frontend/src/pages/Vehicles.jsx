import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import VehicleSearch from "../components/vehicles/VehicleSearch";
import VehicleCard from "../components/vehicles/VehicleCard";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function Vehicles() {
  const { t } = useLanguage();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchVehicles() {
      setLoading(true);
      try {
        const res = await api.get("/api/vehicles");
        if (!cancelled) {
          setVehicles(res.data);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load vehicles:", err);
        if (!cancelled) setError("Could not load vehicle records.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchVehicles();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredVehicles = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.trim().toLowerCase().replace(/[\s-]/g, "");
    return vehicles.filter((v) =>
      v.plate_number.toLowerCase().replace(/[\s-]/g, "").includes(q)
    );
  }, [vehicles, search]);

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold">{t("vehicleVerification")}</h1>
            <p className="text-slate-400 mt-2">
              {t("vehicleVerificationSub")}
            </p>
          </div>

          <VehicleSearch value={search} onChange={setSearch} />

          {loading && (
            <div className="text-slate-400 text-center py-16">
              {t("loadingVehicleRecords")}
            </div>
          )}

          {!loading && error && (
            <div className="text-red-400 text-center py-16">{error}</div>
          )}

          {!loading && !error && filteredVehicles.length === 0 && (
            <div className="text-slate-400 text-center py-16">
              {t("noVehiclesMatch")}
            </div>
          )}

          {!loading && !error && filteredVehicles.length > 0 && (
            <div className="grid lg:grid-cols-3 gap-6 mt-8">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={{
                    id: vehicle.id,
                    number: vehicle.plate_number,
                    owner: vehicle.owner_name || "Unknown",
                    model: `${vehicle.make} ${vehicle.model}`.trim() || "Unknown",
                    status: vehicle.status === "Stolen" || vehicle.status === "Flagged"
                      ? "Blacklisted"
                      : "Verified",
                    theft: vehicle.status === "Stolen" ? "Yes" : "No",
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}