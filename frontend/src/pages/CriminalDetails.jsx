import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import {
  User,
  ShieldAlert,
  FileText,
  Calendar,
  MapPin,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function CriminalDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [criminal, setCriminal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchCriminal() {
      setLoading(true);
      try {
        const res = await api.get(`/api/criminals/${id}`);
        if (!cancelled) {
          setCriminal(res.data);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load criminal record:", err);
        if (!cancelled) setError("Record not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCriminal();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const runAiAnalysis = async () => {
    if (!criminal) return;
    setAiLoading(true);
    try {
      const res = await api.post("/api/smart-scan/text", {
        query: criminal.name,
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
        Loading record...
      </div>
    );
  }

  if (error || !criminal) {
    return (
      <div className="flex min-h-screen bg-[#050816] text-white items-center justify-center flex-col gap-4">
        <p className="text-red-400">{error || "Record not found."}</p>
        <button
          onClick={() => navigate("/criminals")}
          className="text-cyan-400 hover:text-cyan-300"
        >
          Back to Criminal Database
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">

          <button
            onClick={() => navigate("/criminals")}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6"
          >
            <ArrowLeft size={20}/>
            Back
          </button>

          <div className="rounded-3xl bg-gradient-to-r from-red-600 to-red-800 p-8">

            <div className="flex items-center gap-6">

              <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center">

                <User size={55}/>

              </div>

              <div>

                <h1 className="text-5xl font-bold">

                  {criminal.name}

                </h1>

                <p className="text-red-100 mt-2">

                  {criminal.status}
                  {criminal.aliases ? ` • alias "${criminal.aliases}"` : ""}

                </p>

              </div>

            </div>

          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-8">

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">

              <h2 className="text-2xl font-bold mb-6">

                Personal Information

              </h2>

              <div className="space-y-4">

                <p><span className="text-slate-400">Age :</span> {criminal.age ?? "Unknown"}</p>

                <p><span className="text-slate-400">Gender :</span> {criminal.gender || "Unknown"}</p>

                <p><span className="text-slate-400">Last Known Location :</span> {criminal.last_known_location || "Unknown"}</p>

              </div>

            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">

              <h2 className="text-2xl font-bold mb-6">

                Criminal Record

              </h2>

              <div className="space-y-4">

                <div className="flex gap-3">

                  <ShieldAlert className="text-red-400"/>

                  {criminal.risk_level} Risk

                </div>

                <div className="flex gap-3">

                  <FileText className="text-cyan-400"/>

                  {criminal.charges || "No charges on file"}

                </div>

                <div className="flex gap-3">

                  <Calendar className="text-yellow-400"/>

                  Record added {new Date(criminal.created_at).toLocaleDateString()}

                </div>

                <div className="flex gap-3">

                  <MapPin className="text-green-400"/>

                  Last Seen : {criminal.last_known_location || "Unknown"}

                </div>

              </div>

            </div>

          </div>

          <div className="bg-slate-900 rounded-3xl border border-red-500/30 p-6 mt-8">

            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-red-400">
                Sherlock AI Analysis
              </h2>
              <button
                onClick={runAiAnalysis}
                disabled={aiLoading}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 px-4 py-2 rounded-xl transition text-sm"
              >
                <Sparkles size={16} />
                {aiLoading ? "Analyzing..." : "Run Analysis"}
              </button>
            </div>

            {!aiSummary && !aiLoading && (
              <p className="mt-4 text-slate-400 text-sm">
                Click "Run Analysis" for an AI-generated summary based on real
                records in this database.
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