export default function RecentActivity({ activities }) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8">
      <h2 className="text-2xl font-bold mb-8">
        Recent Case Activity
      </h2>

      {activities.length === 0 && (
        <p className="text-slate-500">No recent case activity.</p>
      )}

      <div className="space-y-5">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="border-b border-slate-800 pb-4 last:border-0"
          >
            <h3 className="font-semibold">
              {activity.title}
            </h3>

            <p className="text-slate-400 text-sm">
              {activity.location} • {activity.status}
            </p>

            <span className="text-cyan-400 text-sm">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}