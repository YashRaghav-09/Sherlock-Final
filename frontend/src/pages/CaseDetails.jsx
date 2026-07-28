import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  Shield,
  FileText,
  Bot,
  Navigation,
} from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

function timeAgo(dateString) {
  if (!dateString) return "—";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const priorityStyles = {
  Critical: "bg-red-500/20 border-red-500/30 text-red-400",
  High: "bg-red-500/20 border-red-500/30 text-red-400",
  Medium: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  Low: "bg-green-500/20 border-green-500/30 text-green-400",
};

export default function CaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchCase() {
      setLoading(true);
      try {
        const res = await api.get(`/api/cases/${id}`);
        if (!cancelled) {
          setCaseData(res.data);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load case:", err);
        if (!cancelled) setError(t("caseNotFound"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCase();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const runAiAnalysis = async () => {
    if (!caseData) return;
    setAiLoading(true);
    try {
      const res = await api.post("/api/smart-scan/text", {
        query: `${caseData.title} ${caseData.case_number}`,
      });
      setAiSummary(res.data.summary);
    } catch (err) {
      console.error("AI analysis failed:", err);
      setAiSummary(
        "Sherlock AI could not be reached. Check that your API key is configured in the backend .env file."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleLocate = () => {
    if (caseData?.latitude == null || caseData?.longitude == null) return;
    navigate("/dashboard", {
      state: {
        locate: {
          lat: caseData.latitude,
          lng: caseData.longitude,
          label: caseData.title,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#050816] text-white items-center justify-center">
        {t("loadingCase")}
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex min-h-screen bg-[#050816] text-white items-center justify-center flex-col gap-4">
        <p className="text-red-400">{error || t("caseNotFound")}</p>
        <button
          onClick={() => navigate("/cases")}
          className="text-cyan-400 hover:text-cyan-300"
        >
          {t("backToCases")}
        </button>
      </div>
    );
  }

  const hasLocation = caseData.latitude != null && caseData.longitude != null;
  const badgeStyle = priorityStyles[caseData.priority] || priorityStyles.Medium;

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Navbar />

        <main className="p-8 space-y-6">

          <div className="flex justify-between items-center flex-wrap gap-4">

            <div>
              <button
                onClick={() => navigate("/cases")}
                className="flex items-center gap-2 text-slate-400 hover:text-cyan-400"
              >
                <ArrowLeft size={18} />
                {t("backToCases")}
              </button>

              <h1 className="text-4xl font-bold mt-4">
                {caseData.case_number || `Case #${caseData.id}`}
              </h1>

              <p className="text-slate-400 mt-2">{caseData.title}</p>
            </div>

            <span className={`border px-5 py-2 rounded-full font-semibold ${badgeStyle}`}>
              {(caseData.priority || "Medium").toUpperCase()} {t("priority")}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <User className="text-cyan-400" />
              <p className="text-slate-400 mt-3">{t("status")}</p>
              <h3 className="text-xl font-bold mt-1">{caseData.status}</h3>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <Shield className="text-green-400" />
              <p className="text-slate-400 mt-3">{t("assignedOfficer")}</p>
              <h3 className="text-xl font-bold mt-1">
                {caseData.officer_name || t("unassigned")}
              </h3>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <Calendar className="text-yellow-400" />
              <p className="text-slate-400 mt-3">{t("lastUpdate")}</p>
              <h3 className="text-xl font-bold mt-1">
                {timeAgo(caseData.updated_at || caseData.date_filed)}
              </h3>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <MapPin className="text-red-400" />
              <p className="text-slate-400 mt-3">{t("location")}</p>
              <h3 className="text-xl font-bold mt-1 truncate">
                {caseData.location || "Not specified"}
              </h3>

              {hasLocation && (
                <button
                  onClick={handleLocate}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
                >
                  <Navigation size={14} />
                  {t("locateOnMap")}
                </button>
              )}

              {!hasLocation && (
                <p className="mt-3 text-xs text-slate-500">
                  {t("noCoordinates")}
                </p>
              )}
            </div>

          </div>

          <div className="grid lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="text-cyan-400" size={22} />
                {t("caseDescription")}
              </h2>

              <p className="text-slate-300 mt-4 leading-7 whitespace-pre-line">
                {caseData.description || t("noDescription")}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">{t("dateFiled")}</p>
                  <p className="font-semibold mt-1">
                    {caseData.date_filed
                      ? new Date(caseData.date_filed).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">{t("lastUpdated")}</p>
                  <p className="font-semibold mt-1">
                    {caseData.updated_at
                      ? new Date(caseData.updated_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <div className="flex justify-center">
                <div className="w-28 h-28 rounded-full bg-cyan-500/20 animate-pulse flex items-center justify-center">
                  <Bot size={50} className="text-cyan-400" />
                </div>
              </div>

              <h2 className="text-center mt-6 text-2xl font-bold">{t("sherlockAI")}</h2>

              {!aiSummary && !aiLoading && (
                <p className="text-center text-slate-400 mt-2">
                  {t("readyToAnalyze")}
                </p>
              )}

              {aiSummary && (
                <p className="text-slate-300 text-sm mt-4 leading-6 whitespace-pre-line">
                  {aiSummary}
                </p>
              )}

              <button
                onClick={runAiAnalysis}
                disabled={aiLoading}
                className="w-full mt-8 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-xl py-3 font-semibold"
              >
                {aiLoading ? t("analyzing") : t("analyzeCase")}
              </button>
            </div>

          </div>

        </main>

      </div>

    </div>
  );
}