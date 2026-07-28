import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import {
  Camera,
  Search,
  Sparkles,
  User,
  Car,
  ShieldAlert,
  Upload,
  X,
  Video,
  VideoOff,
  RotateCcw,
} from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function SmartScan() {
  const { t } = useLanguage();

  const MODES = [
    { key: "text", label: t("textSearch"), icon: Search },
    { key: "image", label: t("cameraImageScan"), icon: Camera },
  ];

  const [mode, setMode] = useState("text");

  const [query, setQuery] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const startCamera = async () => {
    setCameraError("");
    setImageFile(null);
    setImagePreview(null);
    setResult(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraError(
        "Could not access camera. Check browser permissions, or use Upload Photo instead."
      );
    }
  };

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setImageFile(file);
        setImagePreview(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  useEffect(() => {
    if (mode !== "image") stopCamera();
  }, [mode]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
  };

  const runTextScan = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/api/smart-scan/text", { query });
      setResult(res.data);
    } catch (err) {
      console.error("Smart scan failed:", err);
      setError(
        err.response?.data?.detail ||
          "Smart Scan failed. Check that your API key is set in the backend .env file."
      );
    } finally {
      setLoading(false);
    }
  };

  const runImageScan = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const res = await api.post("/api/smart-scan/image", formData);
      setResult(res.data);
    } catch (err) {
      console.error("Smart scan failed:", err);
      setError(
        err.response?.data?.detail ||
          "Smart Scan failed. Check that your API key is set in the backend .env file."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Navbar />

        <main className="p-8 space-y-8">

          <div>
            <h1 className="text-4xl font-bold">{t("smartScanTitle")}</h1>
            <p className="text-slate-400 mt-2">
              {t("smartScanSub")}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-3">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => {
                    setMode(m.key);
                    setResult(null);
                    setError("");
                  }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition ${
                    active
                      ? "bg-cyan-500 border-cyan-500"
                      : "bg-slate-900 border-slate-800 hover:border-cyan-500"
                  }`}
                >
                  <Icon size={18} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Text mode */}
          {mode === "text" && (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">
             <p className="text-slate-400 mb-4">
                {t("textSearchDesc")}
              </p>

              <div className="flex gap-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runTextScan()}
                  placeholder="e.g. 'DL-4C-8821' or 'white Swift near Karol Bagh'"
                  className="flex-1 h-14 rounded-2xl bg-slate-800 border border-slate-700 px-5 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition"
                />
                <button
                  onClick={runTextScan}
                  disabled={loading || !query.trim()}
                  className="px-8 rounded-2xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2 font-semibold transition"
                >
                  <Sparkles size={18} />
                  {loading ? t("scanning") : t("scan")}
                </button>
              </div>
            </div>
          )}

          {/* Image / Camera mode */}
          {mode === "image" && (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">
            <p className="text-slate-400 mb-4">
                {t("imageSearchDesc")}
              </p>
              <canvas ref={canvasRef} className="hidden" />

              {cameraOn && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-96 rounded-2xl border border-cyan-500/50 bg-black object-contain"
                  />

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <button
                      onClick={captureFrame}
                      title="Capture"
                      className="w-16 h-16 rounded-full bg-white border-4 border-cyan-500 hover:scale-105 transition flex items-center justify-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-cyan-500" />
                    </button>
                  </div>

                  <button
                    onClick={stopCamera}
                    className="absolute top-3 right-3 bg-slate-900/80 hover:bg-red-600 p-2 rounded-full transition"
                    title="Stop camera"
                  >
                    <VideoOff size={18} />
                  </button>
                </div>
              )}

              {!cameraOn && !imagePreview && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center gap-4 h-64 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500 cursor-pointer transition"
                  >
                    <Video size={42} className="text-cyan-400" />
                    <span className="text-slate-400 text-center px-4">
                      {t("openCameraLive")}
                    </span>
                  </button>

                  <label className="flex flex-col items-center justify-center gap-4 h-64 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500 cursor-pointer transition">
                    <Upload size={42} className="text-cyan-400" />
                    <span className="text-slate-400 text-center px-4">
                      {t("uploadPhoto")}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {cameraError && (
                <p className="mt-4 text-yellow-400 text-sm text-center">{cameraError}</p>
              )}

              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Selected for scan"
                    className="w-full max-h-96 object-contain rounded-2xl border border-slate-700"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => {
                        clearImage();
                        startCamera();
                      }}
                      title="Retake"
                      className="bg-slate-900/80 hover:bg-cyan-600 p-2 rounded-full transition"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button
                      onClick={clearImage}
                      title="Remove"
                      className="bg-slate-900/80 hover:bg-red-600 p-2 rounded-full transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )}

              {imageFile && (
                <button
                  onClick={runImageScan}
                  disabled={loading}
                  className="mt-6 w-full px-8 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-3 font-semibold transition"
                >
                  <Sparkles size={18} />
                  {loading ? t("analyzing") : t("analyzeImage")}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-5 text-red-400">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-900 border border-cyan-500/30 p-6">
                <h2 className="text-2xl font-bold text-cyan-400 mb-3">
                  {t("sherlockAI")} Summary
                </h2>
                <p className="text-slate-300 leading-8 whitespace-pre-line">
                  {result.summary}
                </p>
              </div>

              {result.matched_missing_persons?.length > 0 && (
                <ResultSection
                  title={t("missingPersons")}
                  icon={User}
                  items={result.matched_missing_persons.map((p) => ({
                    id: p.id,
                    heading: p.name,
                    sub: `${p.age ?? "?"} yrs • Last seen: ${p.last_seen_location || "Unknown"}`,
                  }))}
                />
              )}

              {result.matched_criminals?.length > 0 && (
                <ResultSection
                  title={t("criminalDatabase")}
                  icon={ShieldAlert}
                  items={result.matched_criminals.map((c) => ({
                    id: c.id,
                    heading: c.name,
                    sub: `${c.status} • ${t("riskLevel")}: ${c.risk_level}`,
                  }))}
                />
              )}

              {result.matched_vehicles?.length > 0 && (
                <ResultSection
                  title={t("vehicles")}
                  icon={Car}
                  items={result.matched_vehicles.map((v) => ({
                    id: v.id,
                    heading: v.plate_number,
                    sub: `${v.color} ${v.make} ${v.model} • ${v.status}`,
                  }))}
                />
              )}

              {result.matched_missing_persons?.length === 0 &&
                result.matched_criminals?.length === 0 &&
                result.matched_vehicles?.length === 0 && (
                  <p className="text-slate-500 text-center">
                    No matching records found in the database.
                  </p>
                )}
            </div>
          )}

        </main>

      </div>

    </div>
  );
}

function ResultSection({ title, icon: Icon, items }) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
        <Icon size={20} className="text-cyan-400" />
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-slate-800/50 rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{item.heading}</p>
              <p className="text-slate-400 text-sm">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}