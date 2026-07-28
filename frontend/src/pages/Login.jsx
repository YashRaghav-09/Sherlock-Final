import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Lock, User, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { LANGUAGES } from "../i18n/translations";

export default function Login() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const [officerId, setOfficerId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!officerId || !password) {
      toast.error("Please enter both Officer ID and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", {
        badge_id: officerId,
        password: password,
      });

      localStorage.setItem("sherlock_token", res.data.access_token);
      localStorage.setItem("sherlock_officer", JSON.stringify(res.data.officer));

      toast.success(`Welcome, ${res.data.officer.name}`);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.detail || "Login failed. Check your credentials.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] flex items-center justify-center">

      {/* Language Selector — top right, always visible */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl px-3 py-2">
        <Globe size={16} className="text-cyan-400" />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="bg-transparent text-sm text-white outline-none cursor-pointer"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="bg-slate-900 text-white">
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Background Glow */}
      <div className="absolute -top-44 -left-44 w-[500px] h-[500px] rounded-full bg-cyan-500/20 blur-[180px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-700/20 blur-[180px]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#38bdf8 1px, transparent 1px),linear-gradient(90deg,#38bdf8 1px, transparent 1px)",
          backgroundSize: "45px 45px",
        }}
      />

      <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center w-full max-w-7xl px-10">

        {/* LEFT SIDE */}

        <motion.div
          initial={{ opacity: 0, x: -70 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >

          <div className="flex items-center gap-5">

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-2xl shadow-cyan-500/40">

              <ShieldCheck size={40} className="text-white" />

            </div>

            <div>

              <h1 className="text-6xl font-black text-white">
                {t("appName")}
              </h1>

              <p className="text-cyan-400 text-xl">

                AI Police Intelligence Platform

              </p>

            </div>

          </div>

          <h2 className="mt-16 text-5xl font-bold leading-tight">

            Justice Begins
            <br />
            With Intelligence.

          </h2>

          <p className="mt-8 text-slate-400 text-lg leading-8">

            Empowering police officers using Artificial Intelligence,
            live crime monitoring, smart investigations,
            vehicle verification, missing person detection,
            and emergency response.

          </p>

        </motion.div>

        {/* LOGIN CARD */}

        <motion.div
          initial={{ opacity: 0, x: 70 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center"
        >

          <div className="w-full max-w-md rounded-3xl bg-slate-900/70 backdrop-blur-2xl border border-cyan-500/20 p-10 shadow-2xl shadow-cyan-500/20">

            <h2 className="text-3xl font-bold">
              {t("login")}
            </h2>

            <p className="text-slate-400 mt-2">

              Authorized Personnel Only

            </p>

            <form
              onSubmit={handleLogin}
              className="space-y-6 mt-10"
            >

              {/* Officer ID */}

              <div>

                <label className="text-sm text-slate-300">
                  {t("badgeId")}
                </label>

                <div className="mt-2 flex items-center bg-slate-800 rounded-xl px-4">

                  <User className="text-cyan-400" />

                  <input
                    type="text"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    placeholder="Enter Officer ID"
                    className="w-full bg-transparent p-4 outline-none text-white"
                  />

                </div>

              </div>

              {/* Password */}

              <div>

                <label className="text-sm text-slate-300">
                  {t("password")}
                </label>

                <div className="mt-2 flex items-center bg-slate-800 rounded-xl px-4">

                  <Lock className="text-cyan-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full bg-transparent p-4 outline-none text-white"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >

                    {showPassword ? (
                      <EyeOff className="text-cyan-400" />
                    ) : (
                      <Eye className="text-cyan-400" />
                    )}

                  </button>

                </div>

              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-700 py-4 font-bold hover:scale-105 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >

                {loading ? "AUTHENTICATING..." : "ACCESS SHERLOCKBOT →"}

              </button>

            </form>

            <p className="text-center text-slate-500 text-sm mt-8">

              🔒 Secure Government Network

            </p>

          </div>

        </motion.div>

      </div>

    </div>
  );
}