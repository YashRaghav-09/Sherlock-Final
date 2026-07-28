import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import StatusCards from "../components/dashboard/StatusCards";
import LiveMap from "../components/dashboard/LiveMap";
import SherlockAI from "../components/dashboard/SherlockAI";
import RecentOperations from "../components/dashboard/RecentOperations";
import { useLanguage } from "../context/LanguageContext";

export default function Dashboard() {
  const location = useLocation();
  const [target, setTarget] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (location.state?.locate) {
      setTarget(location.state.locate);
    }
  }, [location.state]);

  return (
    <div className="flex h-screen bg-[#050816] text-white overflow-hidden">

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">

        <Navbar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 md:space-y-10">

          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              {t("commandCenter")}
            </h1>
            <p className="text-slate-400 text-sm md:text-lg mt-2">
              {t("commandCenterSub")}
            </p>
          </div>

          <div className="mb-2">
            <StatusCards />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 min-w-0">
              <LiveMap target={target} onClearTarget={() => setTarget(null)} />
            </div>

            <div className="min-w-0">
              <SherlockAI />
            </div>
          </div>

          <div>
            <RecentOperations />
          </div>

        </main>

      </div>

    </div>
  );
}