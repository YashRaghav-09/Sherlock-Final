import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import StatsCard from "../components/analytics/StatsCard";
import CrimeChart from "../components/analytics/CrimeChart";
import HeatMap from "../components/analytics/HeatMap";
import RecentActivity from "../components/analytics/RecentActivity";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function Analytics() {
  const { t, tStatus } = useLanguage();

  const [summary, setSummary] = useState(null);
  const [cases, setCases] = useState([]);
  const [historicalStats, setHistoricalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      try {
        const summaryRes = await api.get("/api/dashboard/summary");
        const casesRes = await api.get("/api/cases");
        if (!cancelled) {
          setSummary(summaryRes.data);
          setCases(Array.isArray(casesRes.data) ? casesRes.data : []);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
        if (!cancelled) {
          setError("Could not load analytics data. Is the backend running?");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      try {
        const historicalRes = await api.get("/api/analytics/historical-stats");
        if (!cancelled) setHistoricalStats(historicalRes.data);
      } catch {
        if (!cancelled) setHistoricalStats(null);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        key: d.toDateString(),
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        value: 0,
      });
    }
    cases.forEach((c) => {
      if (!c.date_filed) return;
      const key = new Date(c.date_filed).toDateString();
      const day = days.find((d) => d.key === key);
      if (day) day.value += 1;
    });
    return days;
  }, [cases]);

  const hotspots = useMemo(() => {
    const groups = {};
    cases.forEach((c) => {
      if (c.latitude == null || c.longitude == null) return;
      const key = c.location || "Unknown";
      if (!groups[key]) {
        groups[key] = { location: key, lat: c.latitude, lng: c.longitude, count: 0 };
      }
      groups[key].count += 1;
    });
    return Object.values(groups);
  }, [cases]);

  const recentActivities = useMemo(() => {
    return [...cases]
      .filter((c) => c.date_filed)
      .sort((a, b) => new Date(b.date_filed) - new Date(a.date_filed))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        title: c.title,
        location: c.location,
        status: tStatus("status", c.status),
        time: timeAgo(c.date_filed),
      }));
  }, [cases, tStatus]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#050816] text-white items-center justify-center">
        {t("loadingAnalytics")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#050816] text-white items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  const casesSummary = summary && summary.cases ? summary.cases : null;
  const openCount = casesSummary ? casesSummary.open || 0 : 0;
  const underInvestigationCount = casesSummary ? casesSummary.under_investigation || 0 : 0;
  const pending = openCount + underInvestigationCount;

  const delhiData = historicalStats ? historicalStats.delhi_annual_crime_data : null;
  const delhiSourceUrl = delhiData ? delhiData.source_url : "#";
  const delhiSourceName = delhiData ? delhiData.source : "";
  const delhiCategories = delhiData ? delhiData.categories : [];

  const ncrbData = historicalStats ? historicalStats.ncrb_crimes_against_women : null;
  const ncrbSourceUrl = ncrbData ? ncrbData.source_url : "#";
  const ncrbSourceName = ncrbData ? ncrbData.source : "";
  const ncrbTotal2023 = ncrbData ? ncrbData.total_cases_2023.toLocaleString() : "—";
  const ncrbTotal2022 = ncrbData ? ncrbData.total_cases_2022.toLocaleString() : "—";
  const ncrbBreakdown = ncrbData ? ncrbData.breakdown_2023 : [];

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <h1 className="text-4xl font-bold">{t("crimeAnalytics")}</h1>
          <p className="text-slate-400 mt-2">
            {t("crimeAnalyticsSub")}
          </p>

          <div className="grid lg:grid-cols-4 gap-6 mt-8">
            <StatsCard title={t("totalCases")} value={casesSummary ? casesSummary.total : "—"} color="cyan" />
            <StatsCard title={t("closed")} value={casesSummary ? casesSummary.closed : "—"} color="green" />
            <StatsCard title={t("pending")} value={pending} color="yellow" />
            <StatsCard title={t("open")} value={casesSummary ? casesSummary.open : "—"} color="red" />
          </div>

          <div className="mt-8">
            <CrimeChart data={weeklyData} />
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            <HeatMap hotspots={hotspots} />
            <RecentActivity activities={recentActivities} />
          </div>

          {historicalStats && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold">{t("officialDelhiStats")}</h2>
              <p className="text-slate-500 text-sm mt-2 max-w-3xl">
                {historicalStats.disclaimer}
              </p>

              <div className="grid lg:grid-cols-2 gap-8 mt-6">
                <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">
                  <h3 className="text-xl font-bold mb-1">{t("delhiAnnualCrimeData")}</h3>
                  <p className="text-slate-500 text-xs mb-6">
                    {t("sourceLabel")}: <a href={delhiSourceUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{delhiSourceName}</a>
                  </p>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {delhiCategories.map((row) => (
                      <div key={row.category} className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-slate-300">{row.category}</span>
                        <span className="text-sm">
                          <span className="text-slate-500">2023: </span>
                          <span className="font-semibold">{row.y2023.toLocaleString()}</span>
                          <span className="text-slate-500 mx-2">→</span>
                          <span className="text-slate-500">2024: </span>
                          <span className={row.y2024 > row.y2023 ? "font-semibold text-red-400" : "font-semibold text-green-400"}>
                            {row.y2024.toLocaleString()}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">
                  <h3 className="text-xl font-bold mb-1">{t("crimesAgainstWomen")}</h3>
                  <p className="text-slate-500 text-xs mb-6">
                    {t("sourceLabel")}: <a href={ncrbSourceUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{ncrbSourceName}</a>
                  </p>

                  <p className="text-slate-300 mb-4">
                    {t("totalCasesIn")} 2023: <span className="font-bold text-cyan-400">{ncrbTotal2023}</span> ({t("downFrom")} {ncrbTotal2022} 2022)
                  </p>

                  <div className="space-y-3">
                    {ncrbBreakdown.map((row) => (
                      <div key={row.category} className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-slate-300">{row.category}</span>
                        <span className="font-semibold">{row.cases.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}