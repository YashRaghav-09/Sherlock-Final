const tabs = [
  "All",
  "Active",
  "Missing",
  "Vehicles",
  "High Priority",
  "Solved",
];

export default function FilterTabs() {
  return (
    <div className="flex gap-3 flex-wrap">

      {tabs.map((tab) => (

        <button
          key={tab}
          className="px-5 py-2 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 transition"
        >
          {tab}
        </button>

      ))}

    </div>
  );
}