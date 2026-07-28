import { Search } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function VehicleSearch({ value, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="relative">

      <Search
        size={20}
        className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={t("searchVehicleNumber")}
        className="w-full h-14 rounded-2xl bg-slate-900 border border-slate-800 pl-14 pr-5 outline-none text-white focus:border-cyan-500 transition"
      />

    </div>
  );
}