import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import SearchBar from "../components/cases/SearchBar";
import CaseCard from "../components/cases/CaseCard";
import api from "../services/api";
import toast from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

export default function Cases() {
  const { t, timeAgo } = useLanguage();

  const STATUS_TABS = [
    { label: t("all"), value: "all" },
    { label: t("open"), value: "Open" },
    { label: t("investigating"), value: "Under Investigation" },
    { label: t("closed"), value: "Closed" },
  ];

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchCases() {
      setLoading(true);
      try {
        const res = await api.get("/api/cases");
        if (!cancelled) {
          setCases(res.data);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load cases:", err);
        if (!cancelled) setError("Could not load cases.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCases();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCases = useMemo(() => {
    let result = cases;

    if (activeTab !== "all") {
      result = result.filter((c) => c.status === activeTab);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.case_number.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
      );
    }

    return result;
  }, [cases, activeTab, search]);

  return (
    <div className="flex h-screen bg-[#050816] text-white overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">{t("casesManagement")}</h1>
              <p className="text-slate-400 mt-2">{t("casesManagementSub")}</p>
            </div>

            <button
              onClick={() => toast("Case creation form coming soon.")}
              className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-xl font-semibold transition"
            >
              {t("newCase")}
            </button>
          </div>

          <div className="mt-8">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={t("searchCasesPlaceholder")}
            />
          </div>

          <div className="flex gap-3 mt-6">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={
                  activeTab === tab.value
                    ? "bg-cyan-500 px-5 py-2 rounded-xl"
                    : "bg-slate-900 border border-slate-800 px-5 py-2 rounded-xl hover:border-cyan-500 transition"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-5 mt-8">
            {loading && (
              <div className="text-slate-400 text-center py-10">
                {t("loadingCases")}
              </div>
            )}

            {!loading && error && (
              <div className="text-red-400 text-center py-10">{error}</div>
            )}

            {!loading && !error && filteredCases.length === 0 && (
              <div className="text-slate-400 text-center py-10">
                {t("noCasesMatch")}
              </div>
            )}

            {!loading &&
              !error &&
              filteredCases.map((item) => (
                <CaseCard
                  key={item.id}
                  id={item.id}
                  fir={item.case_number}
                  title={item.title}
                  officer={item.officer_name || t("unassigned")}
                  location={item.location}
                  time={timeAgo(item.date_filed)}
                  priority={item.priority?.toUpperCase()}
                  status={item.status}
                />
              ))}
          </div>
        </main>
      </div>
    </div>
  );
}