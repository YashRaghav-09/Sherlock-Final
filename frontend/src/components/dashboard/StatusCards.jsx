import { useEffect, useState } from "react";
import { FileText, Search, Car, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

export default function StatusCards() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    api.get("/api/dashboard/summary").then((res) => setData(res.data)).catch(() => {});
  }, []);

  const cases = data?.cases;
  const missing = data?.missing_persons;
  const vehicles = data?.vehicles;
  const criminals = data?.criminals;

  const cards = [
    {
      title: t("activeCases"),
      value: cases?.total ?? "—",
      change: cases ? `${cases.open} ${t("open")}` : "",
      color: "from-cyan-500 to-blue-600",
      icon: FileText,
      path: "/cases",
    },
    {
      title: t("missingPersons"),
      value: missing?.active ?? "—",
      change: missing ? `${missing.found} ${t("found")}` : "",
      color: "from-yellow-500 to-orange-500",
      icon: Search,
      path: "/missing",
    },
    {
      title: t("flaggedVehicles"),
      value: vehicles ? vehicles.stolen + vehicles.flagged : "—",
      change: vehicles ? `${vehicles.stolen} ${t("stolen")}` : "",
      color: "from-green-500 to-emerald-600",
      icon: Car,
      path: "/vehicles",
    },
    {
      title: t("wantedCriminals"),
      value: criminals?.wanted ?? "—",
      change: criminals ? `${criminals.in_custody} ${t("inCustody")}` : "",
      color: "from-red-500 to-pink-600",
      icon: ShieldAlert,
      path: "/criminals",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            onClick={() => navigate(card.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(card.path)}
            className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex items-center gap-3 cursor-pointer hover:border-cyan-500 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
              <Icon size={20} className="text-white" />
            </div>

            <div className="min-w-0">
              <p className="text-slate-400 text-xs truncate">{card.title}</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-bold">{card.value}</h2>
                <p className="text-cyan-400 text-xs truncate">{card.change}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}