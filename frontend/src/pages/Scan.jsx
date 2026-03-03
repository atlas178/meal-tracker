import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { today } from '../utils/dates';

const tabs = [
  { id: 'barcode', label: 'Barcode', icon: 'M3 4h2v16H3V4zm4 0h1v16H7V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zm3 0h1v16h-1V4zm2 0h2v16h-2V4z' },
  { id: 'label', label: 'Label', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'photo', label: 'Photo', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function Scan() {
  const [activeTab, setActiveTab] = useState('barcode');

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Scan Food</h1>
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'barcode' && <BarcodeTab />}
      {activeTab === 'label' && <LabelTab />}
      {activeTab === 'photo' && <PhotoTab />}
    </div>
  );
}

// ─── Barcode Scanner Tab ───
function BarcodeTab() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [servings, setServings] = useState(1);
  const [saving, setSaving] = useState(false);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) { /* ignore */ }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const startScanner = async () => {
    setError('');
    setProduct(null);
    setScanning(true);

    const { Html5Qrcode } = await import('html5-qrcode');
    const scanner = new Html5Qrcode('barcode-reader');
    html5QrCodeRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (code) => {
          await stopScanner();
          lookupBarcode(code);
        },
        () => {}
      );
    } catch (err) {
      setError('Camera access denied. Try entering the barcode manually.');
      setScanning(false);
    }
  };

  const lookupBarcode = async (code) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.scanBarcode(code);
      setProduct(data.product);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const foodData = await api.createFood({
        name: product.name,
        brand: product.brand,
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fats: product.fats,
        serving_size: product.serving_size,
        serving_unit: product.serving_unit,
      });
      await api.createMeal({
        food_id: foodData.food.id,
        meal_type: mealType,
        servings,
        date: today(),
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div id="barcode-reader" ref={scannerRef} className="rounded-xl overflow-hidden" />

      {!scanning && !product && (
        <div className="space-y-3">
          <button onClick={startScanner} className="btn-primary w-full flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V5a2 2 0 012-2h4M21 9V5a2 2 0 00-2-2h-4M3 15v4a2 2 0 002 2h4M21 15v4a2 2 0 01-2 2h-4" />
            </svg>
            Start Camera Scanner
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Or enter barcode manually"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              className="input flex-1"
              onKeyDown={e => e.key === 'Enter' && manualCode && lookupBarcode(manualCode)}
            />
            <button
              onClick={() => manualCode && lookupBarcode(manualCode)}
              disabled={!manualCode || loading}
              className="btn-primary"
            >
              Look up
            </button>
          </div>
        </div>
      )}

      {scanning && (
        <button onClick={stopScanner} className="btn-secondary w-full">Stop Scanner</button>
      )}

      {loading && <div className="text-center py-8 text-gray-400">Looking up product...</div>}

      {error && <div className="text-red-500 text-sm bg-red-500/10 rounded-xl p-3">{error}</div>}

      {product && (
        <div className="card space-y-4">
          <div className="flex gap-3">
            {product.image_url && <img src={product.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />}
            <div>
              <div className="font-semibold">{product.name}</div>
              {product.brand && <div className="text-sm text-gray-500">{product.brand}</div>}
              <div className="text-xs text-gray-400 mt-1">per {product.serving_size}{product.serving_unit}</div>
            </div>
          </div>
          <NutritionGrid calories={product.calories} protein={product.protein} carbs={product.carbs} fats={product.fats} />
          <MealOptions mealType={mealType} setMealType={setMealType} servings={servings} setServings={setServings} />
          <div className="flex gap-2">
            <button onClick={() => { setProduct(null); setError(''); }} className="btn-secondary flex-1">Scan Another</button>
            <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding...' : 'Add to Log'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Nutrition Label OCR Tab ───
function LabelTab() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nutrition, setNutrition] = useState(null);
  const [error, setError] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [servings, setServings] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setNutrition(null);
    setEditData(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setImageData(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageData) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.scanLabel(imageData);
      setNutrition(data.nutrition);
      setEditData({ ...data.nutrition });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!editData) return;
    setSaving(true);
    try {
      const foodData = await api.createFood({
        name: editData.name || 'Scanned Food',
        calories: Number(editData.calories),
        protein: Number(editData.protein),
        carbs: Number(editData.carbs),
        fats: Number(editData.fats),
        serving_size: Number(editData.serving_size),
        serving_unit: editData.serving_unit,
      });
      await api.createMeal({
        food_id: foodData.food.id,
        meal_type: mealType,
        servings,
        date: today(),
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
      >
        {preview ? (
          <img src={preview} alt="Label" className="max-h-48 mx-auto rounded-lg" />
        ) : (
          <div className="space-y-2">
            <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <div className="text-sm text-gray-500">Tap to take photo of nutrition label</div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} className="hidden" />

      {preview && !nutrition && (
        <button onClick={analyze} disabled={loading} className="btn-primary w-full">
          {loading ? 'Analyzing...' : 'Extract Nutrition Info'}
        </button>
      )}

      {error && <div className="text-red-500 text-sm bg-red-500/10 rounded-xl p-3">{error}</div>}

      {editData && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Extracted Nutrition</h3>
          <input
            placeholder="Food name"
            value={editData.name}
            onChange={e => setEditData({ ...editData, name: e.target.value })}
            className="input"
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              ['calories', 'Calories'],
              ['protein', 'Protein (g)'],
              ['carbs', 'Carbs (g)'],
              ['fats', 'Fats (g)'],
              ['serving_size', 'Serving Size'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  type="number"
                  value={editData[key]}
                  onChange={e => setEditData({ ...editData, [key]: e.target.value })}
                  className="input"
                />
              </div>
            ))}
            <div>
              <label className="label">Unit</label>
              <select value={editData.serving_unit} onChange={e => setEditData({ ...editData, serving_unit: e.target.value })} className="input">
                <option>g</option><option>ml</option><option>oz</option><option>cup</option><option>scoop</option><option>piece</option>
              </select>
            </div>
          </div>
          <MealOptions mealType={mealType} setMealType={setMealType} servings={servings} setServings={setServings} />
          <div className="flex gap-2">
            <button onClick={() => { setPreview(null); setImageData(null); setNutrition(null); setEditData(null); }} className="btn-secondary flex-1">Retake</button>
            <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding...' : 'Add to Log'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Photo Meal Logging Tab ───
function PhotoTab() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [foods, setFoods] = useState([]);
  const [error, setError] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setFoods([]);
    setSelected(new Set());
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setImageData(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageData) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.photoLog(imageData);
      setFoods(data.foods);
      setSelected(new Set(data.foods.map((_, i) => i)));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const toggleFood = (idx) => {
    const next = new Set(selected);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setSelected(next);
  };

  const updateFood = (idx, field, value) => {
    const updated = [...foods];
    updated[idx] = { ...updated[idx], [field]: value };
    setFoods(updated);
  };

  const handleAddAll = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    setError('');
    try {
      for (const idx of selected) {
        const f = foods[idx];
        const foodData = await api.createFood({
          name: f.name,
          calories: Number(f.calories),
          protein: Number(f.protein),
          carbs: Number(f.carbs),
          fats: Number(f.fats),
          serving_size: Number(f.serving_size),
          serving_unit: f.serving_unit,
        });
        await api.createMeal({
          food_id: foodData.food.id,
          meal_type: mealType,
          servings: 1,
          date: today(),
        });
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
      >
        {preview ? (
          <img src={preview} alt="Meal" className="max-h-48 mx-auto rounded-lg" />
        ) : (
          <div className="space-y-2">
            <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <div className="text-sm text-gray-500">Tap to take photo of your meal</div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} className="hidden" />

      {preview && foods.length === 0 && (
        <button onClick={analyze} disabled={loading} className="btn-primary w-full">
          {loading ? 'Identifying foods...' : 'Identify Foods'}
        </button>
      )}

      {error && <div className="text-red-500 text-sm bg-red-500/10 rounded-xl p-3">{error}</div>}

      {foods.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Identified Foods</h3>
          {foods.map((food, idx) => (
            <div
              key={idx}
              className={`card !p-4 cursor-pointer transition-all ${
                selected.has(idx) ? 'ring-2 ring-primary-500' : 'opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <button onClick={() => toggleFood(idx)} className="mt-1 flex-shrink-0">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selected.has(idx) ? 'bg-primary-600 border-primary-600' : 'border-gray-400'
                  }`}>
                    {selected.has(idx) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
                <div className="flex-1 min-w-0">
                  <input
                    value={food.name}
                    onChange={e => updateFood(idx, 'name', e.target.value)}
                    className="font-medium bg-transparent border-none outline-none w-full text-gray-900 dark:text-gray-100"
                  />
                  <div className="text-xs text-gray-400 mt-0.5">
                    {food.serving_size}{food.serving_unit}
                    {food.confidence && <span className={`ml-2 ${food.confidence === 'high' ? 'text-emerald-500' : food.confidence === 'low' ? 'text-red-400' : 'text-amber-500'}`}>{food.confidence} confidence</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[
                      ['calories', 'kcal', 'text-primary-500'],
                      ['protein', 'P', 'text-emerald-500'],
                      ['carbs', 'C', 'text-amber-500'],
                      ['fats', 'F', 'text-red-400'],
                    ].map(([key, label, color]) => (
                      <div key={key} className="text-center">
                        <input
                          type="number"
                          value={food[key]}
                          onChange={e => updateFood(idx, key, e.target.value)}
                          className={`w-full text-center text-sm font-bold bg-transparent border-none outline-none ${color}`}
                        />
                        <div className="text-[10px] text-gray-500">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div>
            <label className="label">Meal Type</label>
            <div className="grid grid-cols-4 gap-2">
              {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium capitalize transition-colors ${
                    mealType === type ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setPreview(null); setImageData(null); setFoods([]); }} className="btn-secondary flex-1">Retake</button>
            <button onClick={handleAddAll} disabled={saving || selected.size === 0} className="btn-primary flex-1">
              {saving ? 'Adding...' : `Add ${selected.size} Item${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ───
function NutritionGrid({ calories, protein, carbs, fats }) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-2.5">
        <div className="text-lg font-bold text-primary-600">{calories}</div>
        <div className="text-[10px] text-gray-500">kcal</div>
      </div>
      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2.5">
        <div className="text-lg font-bold text-emerald-600">{protein}g</div>
        <div className="text-[10px] text-gray-500">Protein</div>
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5">
        <div className="text-lg font-bold text-amber-600">{carbs}g</div>
        <div className="text-[10px] text-gray-500">Carbs</div>
      </div>
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2.5">
        <div className="text-lg font-bold text-red-500">{fats}g</div>
        <div className="text-[10px] text-gray-500">Fats</div>
      </div>
    </div>
  );
}

function MealOptions({ mealType, setMealType, servings, setServings }) {
  return (
    <>
      <div>
        <label className="label">Meal Type</label>
        <div className="grid grid-cols-4 gap-2">
          {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className={`py-2 px-3 rounded-xl text-sm font-medium capitalize transition-colors ${
                mealType === type ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Servings</label>
        <div className="flex items-center gap-3">
          <button onClick={() => setServings(Math.max(0.25, servings - 0.25))} className="btn-secondary !py-2 !px-3">-</button>
          <input type="number" value={servings} onChange={e => setServings(Math.max(0.25, Number(e.target.value)))} className="input text-center w-20" step="0.25" min="0.25" />
          <button onClick={() => setServings(servings + 0.25)} className="btn-secondary !py-2 !px-3">+</button>
        </div>
      </div>
    </>
  );
}
