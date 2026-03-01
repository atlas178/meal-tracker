import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { formatDate, today, addDays } from '../utils/dates';

export default function History() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(addDays(today(), -30));
  const [endDate, setEndDate] = useState(today());
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, [startDate, endDate]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.getMeals({ start_date: startDate, end_date: endDate });
      setMeals(data.meals);
    } catch {}
    setLoading(false);
  }

  async function handleDelete(id) {
    try {
      await api.deleteMeal(id);
      setMeals(meals.filter(m => m.id !== id));
    } catch {}
  }

  const filtered = search
    ? meals.filter(m => m.food_name.toLowerCase().includes(search.toLowerCase()))
    : meals;

  const groupedByDate = {};
  for (const meal of filtered) {
    if (!groupedByDate[meal.date]) groupedByDate[meal.date] = [];
    groupedByDate[meal.date].push(meal);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meal History</h1>

      <div className="card !p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search foods..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex gap-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : Object.keys(groupedByDate).length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No meals found for this period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([date, dateMeals]) => {
            const dayTotal = dateMeals.reduce((s, m) => s + m.total_calories, 0);
            return (
              <div key={date} className="card !p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{formatDate(date)}</h3>
                  <span className="text-sm text-gray-500">{Math.round(dayTotal)} kcal total</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {dateMeals.map(meal => (
                    <div key={meal.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            meal.meal_type === 'breakfast' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            meal.meal_type === 'lunch' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            meal.meal_type === 'dinner' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>{meal.meal_type}</span>
                          <span className="font-medium text-sm truncate">{meal.food_name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 ml-[calc(0.5rem+3.5rem)]">
                          {meal.servings}x &middot; {meal.total_calories} kcal | P: {meal.total_protein}g | C: {meal.total_carbs}g | F: {meal.total_fats}g
                        </div>
                      </div>
                      <button onClick={() => handleDelete(meal.id)} className="text-gray-400 hover:text-red-500 p-1 ml-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
