import { MapPin, Clock3, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

export default function CaseCard({
  id,
  fir,
  title,
  officer,
  location,
  time,
  priority,
  status,
}) {
  const navigate = useNavigate();
  const { t, tStatus } = useLanguage();

  const priorityColor = {
    CRITICAL: "bg-purple-600",
    HIGH: "bg-red-500",
    MEDIUM: "bg-yellow-500",
    LOW: "bg-green-500",
  };

  // priority comes in already uppercased (e.g. "HIGH") from Cases.jsx,
  // so title-case it before looking up the translation key
  const priorityTitleCase = priority
    ? priority.charAt(0) + priority.slice(1).toLowerCase()
    : "";

  return (
    <div
      onClick={() => navigate(`/cases/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/cases/${id}`)}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-cyan-500 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
    >

      <div className="flex justify-between items-start">

        <div>

          <div className="flex items-center gap-3">

            <h2 className="text-xl font-bold">{title}</h2>

            <span
              className={`text-xs px-3 py-1 rounded-full text-white ${priorityColor[priority] || "bg-slate-600"}`}
            >
              {tStatus("priority", priorityTitleCase)}
            </span>

          </div>

          <p className="text-cyan-400 mt-2">{fir}</p>

        </div>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-6 text-slate-300">

        <div className="flex items-center gap-2 min-w-0">
          <User size={18} className="shrink-0" />
          <span className="truncate">{officer}</span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={18} className="shrink-0" />
          <span className="truncate">{location}</span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <Clock3 size={18} className="shrink-0" />
          <span className="truncate">{time}</span>
        </div>

        <div className="truncate">
          {t("status")} :
          <span className="text-cyan-400 ml-2">
            {tStatus("status", status)}
          </span>
        </div>

      </div>

    </div>
  );
}