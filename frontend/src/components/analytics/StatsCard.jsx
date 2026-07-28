export default function StatsCard({
  title,
  value,
  color,
}) {

  const colors = {
    cyan: "text-cyan-400 border-cyan-500",
    green: "text-green-400 border-green-500",
    yellow: "text-yellow-400 border-yellow-500",
    red: "text-red-400 border-red-500",
  };

  return (
    <div
      className={`rounded-3xl bg-slate-900 border p-6 ${colors[color]}`}
    >

      <p className="text-slate-400">

        {title}

      </p>

      <h1 className="text-5xl font-bold mt-4">

        {value}

      </h1>

    </div>
  );
}