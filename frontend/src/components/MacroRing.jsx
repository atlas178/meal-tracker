export default function MacroRing({ current, goal, label, color, size = 100 }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={8} className="text-gray-200 dark:text-gray-700" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="text-center -mt-[calc(50%+8px)] mb-4">
        <div className="text-lg font-bold">{Math.round(current)}</div>
        <div className="text-xs text-gray-500">/ {goal}</div>
      </div>
      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}
