import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import {
  User,
  Shield,
  Bell,
  Bot,
  Camera,
  Fingerprint,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  Lock,
  KeyRound,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">

          <div className="mb-10">
            <h1 className="text-5xl font-black">
              {t("systemSettings")}
            </h1>
            <p className="text-slate-400 mt-3">
              {t("systemSettingsSub")}
            </p>
          </div>

          {/* Officer Profile */}
          <div className="rounded-3xl bg-slate-900 border border-cyan-500/20 p-8 shadow-[0_0_35px_rgba(0,255,255,.08)]">
            <div className="flex items-center gap-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-5xl font-bold">
                S
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-bold">
                  Officer Shubh
                </h2>

                <p className="text-cyan-400 mt-1">
                  {t("department")}
                </p>

                <div className="grid grid-cols-2 gap-5 mt-8">
                  <div className="flex gap-3">
                    <BadgeCheck className="text-cyan-400"/>
                    Badge : IND-45871
                  </div>

                  <div className="flex gap-3">
                    <MapPin className="text-cyan-400"/>
                    New Delhi HQ
                  </div>

                  <div className="flex gap-3">
                    <Mail className="text-cyan-400"/>
                    officer@sherlockbot.ai
                  </div>

                  <div className="flex gap-3">
                    <Phone className="text-cyan-400"/>
                    +91 9876543210
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-7">
              <div className="flex items-center gap-3 mb-7">
                <Shield className="text-green-400"/>
                <h2 className="text-2xl font-bold">
                  {t("security")}
                </h2>
              </div>

              <div className="space-y-6">
                <label className="flex justify-between">
                  {t("twoFactorAuth")}
                  <input type="checkbox" defaultChecked/>
                </label>

                <label className="flex justify-between">
                  {t("faceLogin")}
                  <input type="checkbox" defaultChecked/>
                </label>

                <label className="flex justify-between">
                  {t("fingerprintLogin")}
                  <input type="checkbox"/>
                </label>

                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-700 flex justify-center gap-3">
                  <KeyRound/>
                  {t("changePassword")}
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-7">
              <div className="flex items-center gap-3 mb-7">
                <Bell className="text-yellow-400"/>
                <h2 className="text-2xl font-bold">
                  {t("notificationsSettings")}
                </h2>
              </div>

              <div className="space-y-5">
                <label className="flex justify-between">
                  {t("crimeAlerts")}
                  <input type="checkbox" defaultChecked/>
                </label>

                <label className="flex justify-between">
                  {t("missingPersonAlerts")}
                  <input type="checkbox" defaultChecked/>
                </label>

                <label className="flex justify-between">
                  {t("vehicleTheftAlerts")}
                  <input type="checkbox" defaultChecked/>
                </label>

                <label className="flex justify-between">
                  {t("emailReports")}
                  <input type="checkbox"/>
                </label>
              </div>
            </div>
          </div>

          {/* Sherlock AI */}
          <div className="rounded-3xl bg-slate-900 border border-cyan-500/20 p-8 mt-8">
            <div className="flex items-center gap-3">
              <Bot className="text-cyan-400"/>
              <h2 className="text-3xl font-bold">
                {t("sherlockAiEngine")}
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mt-8">
              <div>
                <label className="flex justify-between mb-5">
                  {t("aiAssistant")}
                  <input type="checkbox" defaultChecked/>
                </label>

                <label className="flex justify-between mb-5">
                  {t("faceRecognition")}
                  <input type="checkbox" defaultChecked/>
                </label>

                <label className="flex justify-between mb-5">
                  {t("numberPlateRecognition")}
                  <input type="checkbox" defaultChecked/>
                </label>

                <label className="flex justify-between">
                  {t("autoFirAnalysis")}
                  <input type="checkbox" defaultChecked/>
                </label>
              </div>

              <div>
                <p className="text-slate-400">
                  {t("aiConfidence")}
                </p>

                <div className="w-full h-4 rounded-full bg-slate-800 mt-4">
                  <div className="w-[98%] h-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-700"/>
                </div>

                <h2 className="text-5xl font-bold mt-5 text-cyan-400">
                  98%
                </h2>

                <div className="mt-8 flex gap-4">
                  <Camera className="text-cyan-400"/>
                  <Fingerprint className="text-cyan-400"/>
                  <Lock className="text-cyan-400"/>
                </div>
              </div>
            </div>
          </div>

        </main>

      </div>

    </div>
  );
}