import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import MissingSearch from "../components/missing/MissingSearch";
import MissingCard from "../components/missing/MissingCard";
import api from "../services/api";
import toast from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

function daysSince(dateString) {
  if (!dateString) return null;
  const diffMs = Date.now() - new Date(dateString).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default function Missing() {
  const { t } = useLanguage();

  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchPeople() {
      setLoading(true);
      try {
        const res = await api.get("/api/missing-persons");
        if (!cancelled) {
          setPeople(res.data);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load missing persons:", err);
        if (!cancelled) setError("Could not load missing person records.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPeople();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPeople = useMemo(() => {
    if (!search.trim()) return people;
    const q = search.trim().toLowerCase();
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.last_seen_location || "").toLowerCase().includes(q)
    );
  }, [people, search]);

  return (
    <div className="flex h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold">{t("missingPersons")}</h1>
              <p className="text-slate-400 mt-2">
                {t("missingPersonsSub")}
              </p>
            </div>

            <button
              onClick={() => toast("Report form coming soon.")}
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 transition font-semibold"
            >
              {t("reportMissing")}
            </button>
          </div>

          <MissingSearch value={search} onChange={setSearch} />

          {loading && (
            <div className="text-slate-400 text-center py-16">
              {t("loadingMissingRecords")}
            </div>
          )}

          {!loading && error && (
            <div className="text-red-400 text-center py-16">{error}</div>
          )}

          {!loading && !error && filteredPeople.length === 0 && (
            <div className="text-slate-400 text-center py-16">
              {t("noRecordsMatch")}
            </div>
          )}

          {!loading && !error && filteredPeople.length > 0 && (
            <div className="grid grid-cols-3 gap-6 mt-8">
              {filteredPeople.map((person) => (
                <MissingCard
                  key={person.id}
                  person={{
                    id: person.id,
                    name: person.name,
                    age: person.age,
                    gender: person.gender,
                    lastSeen: person.last_seen_location,
                    days: daysSince(person.last_seen_date),
                    status: person.status,
                    identifyingMarks: person.identifying_marks || "None reported",
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