import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { today } from '../utils/dates';
import FoodSearch from '../components/FoodSearch';

export default function LogMeal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedFood, setSelectedFood] = useState(null);
  const [mealType, setMealType] = useState(searchParams.get('type') || 'lunch');
  const [servings, setServings] = useState(1);
  const [date, setDate] = useState(searchParams.get('date') || today());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', serving_size: '100', serving_unit: 'g' });

  const handleLog = async () => {
    if (!selectedFood) { setError('Please select a food'); return; }
    setSaving(true);
    setError('');
    try {
      await api.createMeal({ food_id: selectedFood.id, meal_type: mealType, servings, date });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleCreateCustom = async () => {
    if (!custom.name || !custom.calories) { setError('Name and calories are required'); return; }
    setError('');
    try {
      const data = await api.createFood({
        name: custom.name,
        calories: Number(custom.calories),
        protein: Number(custom.protein) || 0,
        carbs: Number(custom.carbs) || 0,
        fats: Number(custom.fats) || 0,
        serving_size: Number(custom.serving_size) || 100,
        serving_unit: custom.serving_unit || 'g',
      });
      setSelectedFood(data.food);
      setShowCustom(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const calculated = selectedFood ? {
    calories: (selectedFood.calories * servings).toFixed(1),
    protein: (selectedFood.protein * servings).toFixed(1),
    carbs: (selectedFood.carbs * servings).toFixed(1),
    fats: (selectedFood.fats * servings).toFixed(1),
  } : null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Log a Meal</h1>

      <div className="card space-y-5">
        {/* Search food */}
        <div>
          <label className="label">Search Food</label>
          <FoodSearch onSelect={setSelectedFood} />
          <button onClick={() => setShowCustom(!showCustom)} className="mt-2 text-sm text-primary-600 font-medium hover:underline">
            {showCustom ? 'Cancel' : '+ Add custom food'}
          </button>
        </div>

        {/* Custom food form */}
        {showCustom && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm">New Custom Food</h3>
            <input placeholder="Food name" value={custom.name} onChange={e => setCustom({ ...custom, name: e.target.value })} className="input" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Calories</label>
                <input type="number" value={custom.calories} onChange={e => setCustom({ ...custom, calories: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Protein (g)</label>
                <input type="number" value={custom.protein} onChange={e => setCustom({ ...custom, protein: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Carbs (g)</label>
                <input type="number" value={custom.carbs} onChange={e => setCustom({ ...custom, carbs: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Fats (g)</label>
                <input type="number" value={custom.fats} onChange={e => setCustom({ ...custom, fats: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Serving size</label>
                <input type="number" value={custom.serving_size} onChange={e => setCustom({ ...custom, serving_size: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Unit</label>
                <select value={custom.serving_unit} onChange={e => setCustom({ ...custom, serving_unit: e.target.value })} className="input">
                  <option>g</option><option>ml</option><option>oz</option><option>cup</option><option>scoop</option><option>piece</option>
                </select>
              </div>
            </div>
            <button onClick={handleCreateCustom} className="btn-primary w-full">Create Food</button>
          </div>
        )}

        {/* Selected food preview */}
        {selectedFood && (
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
            <div className="font-semibold">{selectedFood.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Per {selectedFood.serving_size}{selectedFood.serving_unit}: {selectedFood.calories} kcal | P: {selectedFood.protein}g | C: {selectedFood.carbs}g | F: {selectedFood.fats}g
            </div>
          </div>
        )}

        {/* Meal type */}
        <div>
          <label className="label">Meal Type</label>
          <div className="grid grid-cols-4 gap-2">
            {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`py-2 px-3 rounded-xl text-sm font-medium capitalize transition-colors ${
                  mealType === type ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Servings */}
        <div>
          <label className="label">Servings</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setServings(Math.max(0.25, servings - 0.25))} className="btn-secondary !py-2 !px-3">-</button>
            <input
              type="number"
              value={servings}
              onChange={e => setServings(Math.max(0.25, Number(e.target.value)))}
              className="input text-center w-24"
              step="0.25"
              min="0.25"
            />
            <button onClick={() => setServings(servings + 0.25)} className="btn-secondary !py-2 !px-3">+</button>
          </div>
        </div>

        {/* Calculated macros */}
        {calculated && (
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3">
              <div className="text-lg font-bold text-primary-600">{calculated.calories}</div>
              <div className="text-xs text-gray-500">kcal</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
              <div className="text-lg font-bold text-emerald-600">{calculated.protein}g</div>
              <div className="text-xs text-gray-500">Protein</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
              <div className="text-lg font-bold text-amber-600">{calculated.carbs}g</div>
              <div className="text-xs text-gray-500">Carbs</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <div className="text-lg font-bold text-red-500">{calculated.fats}g</div>
              <div className="text-xs text-gray-500">Fats</div>
            </div>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="label">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button onClick={handleLog} disabled={!selectedFood || saving} className="btn-primary w-full">
          {saving ? 'Logging...' : 'Log Meal'}
        </button>
      </div>
    </div>
  );
}
