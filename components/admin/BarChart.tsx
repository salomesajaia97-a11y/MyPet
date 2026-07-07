// Dependency-free horizontal bar chart for the admin dashboard. Single teal
// hue (sequential magnitude), value labels, accessible list semantics.
export function BarChart({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <span className="text-xs text-gray-400">სულ {total.toLocaleString()}</span>
      </div>
      <ul className="space-y-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-xs text-gray-600 truncate">{d.label}</span>
            <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden">
              <div
                className="h-full bg-[#0E4A5C] rounded-md transition-all"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-semibold text-gray-900 tabular-nums">
              {d.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
