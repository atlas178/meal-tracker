import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    calorie_goal: user?.calorie_goal || 2000,
    protein_goal: user?.protein_goal || 150,
    carbs_goal: user?.carbs_goal || 250,
    fats_goal: user?.fats_goal || 65,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const data = await api.updateProfile(form);
      updateUser(data.user);
      setMessage('Profile updated!');
    } catch (err) {
      setMessage(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile & Goals</h1>

      <div className="card space-y-5">
        <div>
          <label className="label">Name</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" value={user?.email || ''} disabled className="input opacity-60" />
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />
        <h2 className="font-semibold">Daily Macro Goals</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Calories (kcal)</label>
            <input type="number" value={form.calorie_goal} onChange={e => setForm({ ...form, calorie_goal: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="label">Protein (g)</label>
            <input type="number" value={form.protein_goal} onChange={e => setForm({ ...form, protein_goal: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="label">Carbs (g)</label>
            <input type="number" value={form.carbs_goal} onChange={e => setForm({ ...form, carbs_goal: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="label">Fats (g)</label>
            <input type="number" value={form.fats_goal} onChange={e => setForm({ ...form, fats_goal: Number(e.target.value) })} className="input" />
          </div>
        </div>

        {message && (
          <div className={`text-sm p-3 rounded-xl ${message.includes('updated') ? 'bg-green-50 dark:bg-green-900/30 text-green-600' : 'bg-red-50 dark:bg-red-900/30 text-red-600'}`}>
            {message}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
