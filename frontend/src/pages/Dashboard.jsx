import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { today, formatDate, addDays } from '../utils/dates';
import ProgressBar from '../components/ProgressBar';
import MacroRing from '../components/MacroRing';

const mealTypeLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };
const mealTypeIcons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍿' };

export default function Dashboard() {
  const { user } = useAuth();
  const [date, setDate] = useState(today());
  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState({ total_calories: 0, total_protein: 0, total_carbs: 0, total_fats: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [date]);

  async function loadData() {
    setLoading(true);
    try {
      const [mealsData, summaryData] = await Promise.all([
        api.getMeals({ date }),
        api.getDailySummary(date),
      ]);
      setMeals(mealsData.meals);
      setSummary(summaryData.summary);
    } catch {}
    setLoading(false);
  }

  async function handleDelete(mealId) {
    try {
      await api.deleteMeal(mealId);
      loadData();
    } catch {}
  }

  const grouped = {};
  for (const type of ['breakfast', 'lunch', 'dinner', 'snack']) {
    grouped[type] = meals.filter(m => m.meal_type === type);
  }

  const isToday = date === today();

  return (
    <div className="space-y-6">
      {/* Date nav */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isToday ? "Today's Nutrition" : formatDate(date)}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(addDays(date, -1))} className="btn-secondary !py-2 !px-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => setDate(today())} className="btn-secondary !py-2 text-sm" disabled={isToday}>Today</button>
          <button onClick={() => setDate(addDays(date, 1))} className="btn-secondary !py-2 !px-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Macro overview */}
          <div className="card">
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-6">
              <MacroRing current={summary.total_calories} goal={user?.calorie_goal || 2000} label="Calories" color="#6366f1" size={110} />
              <MacroRing current={summary.total_protein} goal={user?.protein_goal || 150} label="Protein" color="#10b981" size={90} />
              <MacroRing current={summary.total_carbs} goal={user?.carbs_goal || 250} label="Carbs" color="#f59e0b" size={90} />
              <MacroRing current={summary.total_fats} goal={user?.fats_goal || 65} label="Fats" color="#ef4444" size={90} />
            </div>
            <div className="space-y-3">
              <ProgressBar current={summary.total_calories} goal={user?.calorie_goal || 2000} label="Calories" color="bg-primary-500" unit="kcal" />
              <ProgressBar current={summary.total_protein} goal={user?.protein_goal || 150} label="Protein" color="bg-emerald-500" />
              <ProgressBar current={summary.total_carbs} goal={user?.carbs_goal || 250} label="Carbs" color="bg-amber-500" />
              <ProgressBar current={summary.total_fats} goal={user?.fats_goal || 65} label="Fats" color="bg-red-500" />
            </div>
          </div>

          {/* Meals by type */}
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="card !p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>{mealTypeIcons[type]}</span> {mealTypeLabels[type]}
                  </h3>
                  <Link to={`/log?type=${type}&date=${date}`} className="text-primary-600 text-sm font-medium hover:underline">+ Add</Link>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No items logged</p>
                ) : (
                  <div className="space-y-2">
                    {items.map(meal => (
                      <div key={meal.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{meal.food_name}</div>
                          <div className="text-xs text-gray-500">{meal.servings} serving{meal.servings !== 1 ? 's' : ''} &middot; {meal.total_calories} kcal</div>
                        </div>
                        <button onClick={() => handleDelete(meal.id)} className="text-gray-400 hover:text-red-500 p-1 ml-2 flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
