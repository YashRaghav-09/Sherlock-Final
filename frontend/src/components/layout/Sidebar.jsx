import {
  LayoutDashboard,
  FileText,
  Search,
  Car,
  Users,
  BarChart3,
  ScanLine,
  Settings,
  Shield,
  ChevronRight,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

export default function Sidebar() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const menuItems = [
    { title: t("dashboard"), icon: LayoutDashboard, path: "/dashboard" },
    { title: t("cases"), icon: FileText, path: "/cases" },
    { title: t("missingPersons"), icon: Search, path: "/missing" },
    { title: t("vehicles"), icon: Car, path: "/vehicles" },
    { title: t("criminalDatabase"), icon: Users, path: "/criminals" },
    { title: t("smartScan"), icon: ScanLine, path: "/scan" },
    { title: t("analytics"), icon: BarChart3, path: "/analytics" },
  ];

  return (
    <aside
      className="group relative h-screen bg-slate-950 border-r border-slate-800 flex flex-col shrink-0
                 w-20 hover:w-72 transition-all duration-300 ease-in-out overflow-hidden z-30"
    >
      <div className="p-4 border-b border-slate-800 flex items-center gap-4 h-24 shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shrink-0">
          <Shield size={26} className="text-white" />
        </div>

        <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap">
          <h1 className="text-xl font-bold">{t("appName")}</h1>
          <p className="text-cyan-400 text-sm">{t("appTagline")}</p>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-4 rounded-xl transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-800 text-slate-300"
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon size={22} className="shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap">
                  {item.title}
                </span>
              </div>

              <ChevronRight
                size={18}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100"
              />
            </NavLink>
          );
        })}
      </div>

      <div className="border-t border-slate-800 p-3 shrink-0">
        <div className="rounded-2xl bg-slate-900 p-3 overflow-hidden">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap">
            <h3 className="font-bold">{t("officer")}</h3>
            <p className="text-sm text-slate-400">ID : IND-45871</p>
          </div>

          <button
            onClick={() => navigate("/settings")}
            className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Settings size={18} className="shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap">
              {t("settings")}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}