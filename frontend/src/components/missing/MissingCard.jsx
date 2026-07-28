import {
  MapPin,
  Calendar,
  Fingerprint,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

export default function MissingCard({ person }) {
  const navigate = useNavigate();
  const { t, tStatus } = useLanguage();

  const STATUS_STYLES = {
    Found: "bg-green-500/20 text-green-400",
    Missing: "bg-yellow-500/20 text-yellow-400",
    Closed: "bg-slate-500/20 text-slate-400",
  };

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 hover:border-cyan-500 hover:shadow-[0_0_35px_rgba(34,211,238,0.15)] transition-all duration-300">

      {/* Avatar */}

      <div className="flex justify-center">

        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-4xl font-bold">

          {person.name.charAt(0)}

        </div>

      </div>

      {/* Name */}

      <h2 className="text-center text-2xl font-bold mt-5">

        {person.name}

      </h2>

      <p className="text-center text-slate-400">

       {person.age} {t("yearsLabel")} • {tStatus("gender", person.gender)}
      </p>

      {/* Details */}

      <div className="space-y-4 mt-8">

        <div className="flex items-center gap-3">

          <MapPin className="text-cyan-400" size={18} />

          <span>{person.lastSeen}</span>

        </div>

        <div className="flex items-center gap-3">

          <Calendar className="text-cyan-400" size={18} />

          <span>
           {t("missingSince")} : {person.days != null ? `${person.days} ${t("daysLabel")}` : t("unknownLabel")}
          </span>

        </div>

        <div className="flex items-center gap-3">

          <Fingerprint className="text-cyan-400" size={18} />

          <span className="truncate">{person.identifyingMarks}</span>

        </div>

      </div>

      {/* Status */}

      <div className="mt-8 flex justify-between items-center">

        <span
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            STATUS_STYLES[person.status] || "bg-slate-500/20 text-slate-400"
          }`}
        >
          {tStatus("status", person.status)}
        </span>

        <button
          onClick={() => navigate(`/missing/${person.id}`)}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-xl transition"
        >
          <Eye size={18} />
          {t("view")}0
        </button>

      </div>

    </div>
  );
}