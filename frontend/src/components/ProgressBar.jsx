export default function ProgressBar({ current, goal, label, color = 'bg-primary-500', unit = 'g' }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const over = current > goal;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`font-semibold ${over ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
          {Math.round(current)} / {goal}{unit === 'kcal' ? '' : unit}
          {unit === 'kcal' ? ' kcal' : ''}
        </span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
