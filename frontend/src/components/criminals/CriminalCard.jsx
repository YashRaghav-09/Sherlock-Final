import { User, ShieldAlert, FileText, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

export default function CriminalCard({ criminal }) {
  const navigate = useNavigate();
  const { t, tStatus } = useLanguage();

  const riskTitleCase = criminal.risk
    ? criminal.risk.charAt(0) + criminal.risk.slice(1).toLowerCase()
    : "";

  return (

    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 hover:border-red-500 hover:shadow-xl transition">

      <div className="flex justify-center">

        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">

          <User size={42} />

        </div>

      </div>

      <h2 className="text-2xl font-bold text-center mt-5">

        {criminal.name}

      </h2>

      <p className="text-center text-slate-400">

        {t("ageLabel")} : {criminal.age}

      </p>

      <div className="space-y-4 mt-8">

        <div className="flex justify-between">

          <span>{t("riskLevel")}</span>

          <span
            className={`font-bold ${
              criminal.risk === "HIGH"
                ? "text-red-400"
                : criminal.risk === "MEDIUM"
                ? "text-yellow-400"
                : "text-green-400"
            }`}
          >
            {tStatus("risk", riskTitleCase)}
          </span>

        </div>

        <div className="flex items-center gap-3">

          <FileText className="text-cyan-400" size={18} />

          {criminal.charges} {t("chargesFiled")}

        </div>

        <div className="flex items-center gap-3">

          <ShieldAlert className="text-red-400" size={18} />

          {tStatus("status", criminal.status)}

        </div>

      </div>

      <button
        onClick={() => navigate(`/criminal/${criminal.id}`)}
        className="mt-8 w-full rounded-xl bg-gradient-to-r from-red-500 to-red-700 py-3 flex justify-center items-center gap-2 hover:scale-105 transition"
      >

        <Eye size={18} />

        {t("viewProfile")}

      </button>

    </div>

  );
}