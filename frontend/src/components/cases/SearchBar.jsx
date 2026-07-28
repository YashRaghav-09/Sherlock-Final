import { Search, Filter, SlidersHorizontal } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-4">

      {/* Search Box */}

      <div className="relative flex-1">

        <Search
          size={20}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder || "Search..."}
          className="w-full h-14 rounded-2xl bg-slate-900 border border-slate-800 pl-14 pr-5 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition"
        />

      </div>

      {/* Filter Button */}

      <button className="h-14 px-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500 transition flex items-center gap-3">

        <Filter size={18} />

        Filter

      </button>

      {/* Sort Button */}

      <button className="h-14 px-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500 transition flex items-center gap-3">

        <SlidersHorizontal size={18} />

        Sort

      </button>

    </div>
  );
}