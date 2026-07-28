import { useEffect, useState } from "react";
import { Car, ShieldAlert, Search, CheckCircle2, Clock3, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

export default function RecentOperations() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, tStatus, timeAgo } = useLanguage();

  const describeCase = (c) => {
    const base = { path: `/cases/${c.id}` };

    if (c.priority === "Critical" || c.priority === "High") {
      return {
        ...base,
        icon: ShieldAlert,
        title: t("highPriorityCase"),
        subtitle: `${c.case_number || c.title} — ${tStatus("status", c.status)}`,
        color: "text-red-400",
        bg: "bg-red-500/10",
      };
    }
    if (c.status === "Closed") {
      return {
        ...base,
        icon: CheckCircle2,
        title: t("caseClosedTitle"),
        subtitle: c.title,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
      };
    }
    return {
      ...base,
      icon: FileText,
      title: t("caseUpdate"),
      subtitle: `${c.title} — ${tStatus("status", c.status)}`,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    };
  };

  const describeVehicle = (v) => {
    const flagged = v.status === "Stolen" || v.status === "Flagged";
    return {
      icon: Car,
      title: flagged ? t("vehicleFlaggedTitle") : t("vehicleVerifiedTitle"),
      subtitle: `${v.plate_number} — ${tStatus("status", v.status)}`,
      color: flagged ? "text-red-400" : "text-green-400",
      bg: flagged ? "bg-red-500/10" : "bg-green-500/10",
      date: v.reported_date,
      path: `/vehicle/${v.id}`,
    };
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchOperations() {
      setLoading(true);
      const items = [];

      try {
        const casesRes = await api.get("/api/cases");
        const cases = Array.isArray(casesRes.data) ? casesRes.data : [];
        cases.forEach((c) => {
          const desc = describeCase(c);
          items.push({ ...desc, date: c.updated_at || c.date_filed });
        });
      } catch {
        // skip silently
      }

      try {
        const vehiclesRes = await api.get("/api/vehicles");
        const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
        vehicles.forEach((v) => {
          items.push(describeVehicle(v));
        });
      } catch {
        // skip silently
      }

      items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      if (!cancelled) {
        setOperations(items.slice(0, 6));
        setLoading(false);
      }
    }

    fetchOperations();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, tStatus]);

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("liveOperations")}</h2>
          <p className="text-slate-400 mt-1">{t("liveOperationsSub")}</p>
        </div>

        <div className="flex items-center gap-2 text-green-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          LIVE
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {loading && (
          <p className="text-slate-500 text-sm">{t("loadingRecentActivity")}</p>
        )}

        {!loading && operations.length === 0 && (
          <p className="text-slate-500 text-sm">{t("noRecentActivity")}</p>
        )}

        {!loading &&
          operations.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => item.path && navigate(item.path)}
                className="w-full text-left flex items-center justify-between rounded-2xl bg-slate-800 hover:bg-slate-700 hover:-translate-y-0.5 transition-all duration-200 p-5 cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`shrink-0 w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={item.color} size={26} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                    <p className="text-slate-400 text-sm truncate">{item.subtitle}</p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm shrink-0 ml-3">
                  <Clock3 size={16} />
                  {timeAgo(item.date)}
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}