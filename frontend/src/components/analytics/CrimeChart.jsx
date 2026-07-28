export default function CrimeChart({ data }) {
  // data: [{ label: "Mon", value: 4 }, ...]
  const values = data.map((d) => d.value);
  const max = Math.max(1, ...values);
  const scale = 220 / max; // tallest bar maxes out around 220px

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">

      <h2 className="text-2xl font-bold mb-10">

        Cases Filed - Last 7 Days

      </h2>

      <div className="flex items-end justify-between h-80">

        {data.map((item, index) => (

          <div
            key={index}
            className="flex flex-col items-center gap-3"
          >

            <span className="text-slate-300 font-semibold">{item.value}</span>

            <div
              style={{
                height: `${Math.max(4, item.value * scale)}px`,
              }}
              className="w-12 rounded-t-xl bg-gradient-to-t from-cyan-600 to-blue-500 hover:scale-105 transition"
            />

            <span className="text-slate-400">
              {item.label}
            </span>

          </div>

        ))}

      </div>

    </div>
  );
}