import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import {
  Car,
  User,
  ShieldAlert,
  BadgeCheck,
  Calendar,
  CheckCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function VehicleResult() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, tStatus } = useLanguage();

  const [vehicle, setVehicle] = useState(null);
  const [linkedCase, setLinkedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchVehicle() {
      setLoading(true);
      try {
        const res = await api.get(`/api/vehicles/${id}`);
        if (cancelled) return;
        setVehicle(res.data);
        setError("");

        if (res.data.case_id) {
          try {
            const caseRes = await api.get(`/api/cases/${res.data.case_id}`);
            if (!cancelled) setLinkedCase(caseRes.data);
          } catch {
            // linked case may have been deleted; not critical, ignore
          }
        }
      } catch (err) {
        console.error("Failed to load vehicle:", err);
        if (!cancelled) setError(t("vehicleNotFound"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchVehicle();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const runAiAnalysis = async () => {
    if (!vehicle) return;
    setAiLoading(true);
    try {
      const res = await api.post("/api/smart-scan/text", {
        query: vehicle.plate_number,
      });
      setAiSummary(res.data.summary);
    } catch (err) {
      console.error("AI analysis failed:", err);
      setAiSummary(
        "Sherlock AI could not be reached. Check that your Gemini API key is configured in the backend .env file."
      );
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#050816] text-white items-center justify-center">
        {t("loadingVehicleRecord")}
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex min-h-screen bg-[#050816] text-white items-center justify-center flex-col gap-4">
        <p className="text-red-400">{error || t("vehicleNotFound")}</p>
        <button
          onClick={() => navigate("/vehicles")}
          className="text-cyan-400 hover:text-cyan-300"
        >
          {t("backToVehicles")}
        </button>
      </div>
    );
  }

  const isFlaggedStatus = vehicle.status === "Stolen" || vehicle.status === "Flagged";

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <button
            onClick={() => navigate("/vehicles")}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6"
          >
            <ArrowLeft size={20} />
            {t("backToVehicles")}
          </button>

          <div className="rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 p-8">
            <p className="text-white/70">{t("vehicleNumber")}</p>
            <h1 className="text-5xl font-black tracking-widest mt-2">
              {vehicle.plate_number}
            </h1>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="text-cyan-400" />
                <h2 className="text-2xl font-bold">{t("ownerDetails")}</h2>
              </div>

              <div className="space-y-4">
                <p><span className="text-slate-400">{t("nameLabel")} :</span> {vehicle.owner_name || t("notOnRecord")}</p>
                <p className="text-slate-500 text-sm italic">
                  {t("ownerPrivacyNote")}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Car className="text-cyan-400" />
                <h2 className="text-2xl font-bold">{t("vehicleDetails")}</h2>
              </div>

              <div className="space-y-4">
                <p><span className="text-slate-400">{t("makeLabel")} :</span> {vehicle.make || t("unknownLabel")}</p>
                <p><span className="text-slate-400">{t("modelLabel")} :</span> {vehicle.model || t("unknownLabel")}</p>
                <p><span className="text-slate-400">{t("colourLabel")} :</span> {vehicle.color || t("unknownLabel")}</p>
                <p>
                  <span className="text-slate-400">{t("reportedLabel")} :</span>{" "}
                  {new Date(vehicle.reported_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 mt-8">
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
              {isFlaggedStatus ? (
                <ShieldAlert className="text-red-400" />
              ) : (
                <CheckCircle className="text-green-400" />
              )}
              <h3 className="mt-4 font-bold">{t("status")}</h3>
              <p className={isFlaggedStatus ? "text-red-400" : "text-green-400"}>
                {tStatus("status", vehicle.status)}
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
              <BadgeCheck className="text-cyan-400" />
              <h3 className="mt-4 font-bold">{t("linkedCase")}</h3>
              <p className="text-cyan-400">
                {linkedCase ? linkedCase.case_number : t("noneLabel")}
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
              <Calendar className="text-yellow-400" />
              <h3 className="mt-4 font-bold">{t("notesLabel")}</h3>
              <p className="text-slate-300 text-sm">{vehicle.notes || t("noNotesOnFile")}</p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-cyan-500/30 bg-slate-900 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-cyan-400">
                {t("sherlockAiAnalysis")}
              </h2>
              <button
                onClick={runAiAnalysis}
                disabled={aiLoading}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 px-4 py-2 rounded-xl transition text-sm"
              >
                <Sparkles size={16} />
                {aiLoading ? t("analyzing") : t("runAnalysis")}
              </button>
            </div>

            {!aiSummary && !aiLoading && (
              <p className="mt-4 text-slate-400 text-sm">
                {t("clickRunAnalysis")}
              </p>
            )}

            {aiSummary && (
              <p className="mt-4 leading-8 text-slate-300 whitespace-pre-line">
                {aiSummary}
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}