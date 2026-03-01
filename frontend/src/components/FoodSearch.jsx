import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

export default function FoodSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchFoods(query);
        setResults(data.foods);
        setOpen(true);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  }, [query]);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Search foods (e.g. chicken, rice...)"
        className="input"
      />
      {loading && <div className="absolute right-3 top-3 text-gray-400 text-sm">Searching...</div>}
      {open && results.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {results.map(food => (
            <button
              key={food.id}
              onClick={() => { onSelect(food); setQuery(''); setOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <div className="font-medium text-sm">{food.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | F: {food.fats}g
                <span className="text-gray-400 ml-1">per {food.serving_size}{food.serving_unit}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
