import { Car, User, Shield, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

export default function VehicleCard({ vehicle }) {
  const navigate = useNavigate();
  const { t, tStatus } = useLanguage();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-cyan-500 hover:shadow-xl transition-all duration-300">

      <div className="flex justify-center mb-5">

        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center">

          <Car size={42} className="text-white" />

        </div>

      </div>

      <h2 className="text-2xl text-center font-bold">
        {vehicle.number}
      </h2>

      <p className="text-center text-slate-400 mt-1">
        {vehicle.model}
      </p>

      <div className="space-y-4 mt-8">

        <div className="flex items-center gap-3">
          <User className="text-cyan-400" size={18} />
          <span>{vehicle.owner}</span>
        </div>

        <div className="flex items-center justify-between">

          <span>{t("status")}</span>

          <span
            className={`px-3 py-1 rounded-full text-sm ${
              vehicle.status === "Verified"
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {tStatus("status", vehicle.status)}
          </span>

        </div>

        <div className="flex items-center justify-between">

          <span>{t("theftRecord")}</span>

          <span
            className={
              vehicle.theft === "Yes"
                ? "text-red-400 font-bold"
                : "text-green-400 font-bold"
            }
          >
            {vehicle.theft === "Yes" ? t("yes") : t("no")}
          </span>

        </div>

      </div>

      <button
        onClick={() => navigate(`/vehicle/${vehicle.id}`)}
        className="mt-8 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-700 py-3 flex items-center justify-center gap-2 hover:scale-105 transition"
      >
        <Eye size={18} />
        {t("viewDetails")}
      </button>

    </div>
  );
}