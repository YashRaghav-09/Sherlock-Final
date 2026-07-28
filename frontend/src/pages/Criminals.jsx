import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import CriminalSearch from "../components/criminals/CriminalSearch";
import CriminalCard from "../components/criminals/CriminalCard";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function Criminals() {
  const { t } = useLanguage();
  const [criminals, setCriminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchCriminals() {
      setLoading(true);
      try {
        const res = await api.get("/api/criminals");
        if (!cancelled) {
          setCriminals(res.data);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load criminal records:", err);
        if (!cancelled) setError("Could not load criminal database.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCriminals();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCriminals = useMemo(() => {
    if (!search.trim()) return criminals;
    const q = search.trim().toLowerCase();
    return criminals.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.aliases || "").toLowerCase().includes(q)
    );
  }, [criminals, search]);

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold">{t("criminalDatabase")}</h1>
            <p className="text-slate-400 mt-2">
              {t("criminalDatabaseSub")}
            </p>
          </div>

          <CriminalSearch value={search} onChange={setSearch} />

          {loading && (
            <div className="text-slate-400 text-center py-16">
              {t("loadingRecords")}
            </div>
          )}

          {!loading && error && (
            <div className="text-red-400 text-center py-16">{error}</div>
          )}

          {!loading && !error && filteredCriminals.length === 0 && (
            <div className="text-slate-400 text-center py-16">
              {t("noRecordsMatch")}
            </div>
          )}

          {!loading && !error && filteredCriminals.length > 0 && (
            <div className="grid lg:grid-cols-3 gap-6 mt-8">
              {filteredCriminals.map((criminal) => (
                <CriminalCard
                  key={criminal.id}
                  criminal={{
                    id: criminal.id,
                    name: criminal.name,
                    age: criminal.age ?? "Unknown",
                    risk: (criminal.risk_level || "Medium").toUpperCase(),
                    charges: criminal.charges
                      ? criminal.charges.split(",").length
                      : 0,
                    status: criminal.status,
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