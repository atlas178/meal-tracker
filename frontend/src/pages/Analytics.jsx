import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { getWeekRange, formatDate } from '../utils/dates';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const range = getWeekRange(weekOffset);

  useEffect(() => {
    loadData();
  }, [weekOffset]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.getWeeklySummary(range.start, range.end);
      setData(res.days.map(d => ({
        ...d,
        date: formatDate(d.date),
        rawDate: d.date,
      })));
    } catch {}
    setLoading(false);
  }

  const avg = data.length > 0 ? {
    calories: Math.round(data.reduce((s, d) => s + d.total_calories, 0) / data.length),
    protein: Math.round(data.reduce((s, d) => s + d.total_protein, 0) / data.length),
    carbs: Math.round(data.reduce((s, d) => s + d.total_carbs, 0) / data.length),
    fats: Math.round(data.reduce((s, d) => s + d.total_fats, 0) / data.length),
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weekly Analytics</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="btn-secondary !py-2 !px-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-medium px-2">{formatDate(range.start)} - {formatDate(range.end)}</span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="btn-secondary !py-2 !px-3" disabled={weekOffset >= 0}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : data.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No data for this week. Start logging meals!</p>
        </div>
      ) : (
        <>
          {/* Averages */}
          {avg && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card !p-4 text-center">
                <div className="text-2xl font-bold text-primary-600">{avg.calories}</div>
                <div className="text-xs text-gray-500 mt-1">Avg Calories</div>
                <div className="text-xs text-gray-400">Goal: {user?.calorie_goal}</div>
              </div>
              <div className="card !p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{avg.protein}g</div>
                <div className="text-xs text-gray-500 mt-1">Avg Protein</div>
                <div className="text-xs text-gray-400">Goal: {user?.protein_goal}g</div>
              </div>
              <div className="card !p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{avg.carbs}g</div>
                <div className="text-xs text-gray-500 mt-1">Avg Carbs</div>
                <div className="text-xs text-gray-400">Goal: {user?.carbs_goal}g</div>
              </div>
              <div className="card !p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{avg.fats}g</div>
                <div className="text-xs text-gray-500 mt-1">Avg Fats</div>
                <div className="text-xs text-gray-400">Goal: {user?.fats_goal}g</div>
              </div>
            </div>
          )}

          {/* Calorie chart */}
          <div className="card">
            <h2 className="font-semibold mb-4">Daily Calories</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#f3f4f6' }} />
                <Bar dataKey="total_calories" name="Calories" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Macros chart */}
          <div className="card">
            <h2 className="font-semibold mb-4">Daily Macros (g)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#f3f4f6' }} />
                <Legend />
                <Bar dataKey="total_protein" name="Protein" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_carbs" name="Carbs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_fats" name="Fats" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
