import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { today, formatDate } from '../utils/dates';

export default function Family() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberSummaries, setMemberSummaries] = useState({});
  const [viewDate, setViewDate] = useState(today());

  useEffect(() => { loadFamilies(); }, []);

  async function loadFamilies() {
    setLoading(true);
    try {
      const data = await api.getFamilies();
      setFamilies(data.families);
      if (data.families.length > 0 && !selectedFamily) {
        selectFamily(data.families[0]);
      }
    } catch {}
    setLoading(false);
  }

  async function selectFamily(family) {
    setSelectedFamily(family);
    try {
      const data = await api.getFamilyMembers(family.id);
      setMembers(data.members);
      loadMemberSummaries(family.id, data.members);
    } catch {}
  }

  async function loadMemberSummaries(familyId, membersList) {
    const summaries = {};
    for (const member of membersList) {
      try {
        const data = await api.getMemberSummary(familyId, member.id, viewDate);
        summaries[member.id] = data;
      } catch {}
    }
    setMemberSummaries(summaries);
  }

  useEffect(() => {
    if (selectedFamily && members.length > 0) {
      loadMemberSummaries(selectedFamily.id, members);
    }
  }, [viewDate]);

  async function handleCreate() {
    if (!newName) return;
    setError('');
    try {
      await api.createFamily({ name: newName });
      setNewName('');
      loadFamilies();
    } catch (err) { setError(err.message); }
  }

  async function handleJoin() {
    if (!joinCode) return;
    setError('');
    try {
      await api.joinFamily(joinCode);
      setJoinCode('');
      loadFamilies();
    } catch (err) { setError(err.message); }
  }

  async function handleLeave(familyId) {
    try {
      await api.leaveFamily(familyId);
      setSelectedFamily(null);
      setMembers([]);
      loadFamilies();
    } catch (err) { setError(err.message); }
  }

  function MacroMini({ value, goal, label, color }) {
    const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
    return (
      <div className="text-center">
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mx-auto">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs font-semibold mt-0.5">{Math.round(value)}/{goal}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Family Sharing</h1>

      {/* Create / Join */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card !p-4 space-y-3">
          <h3 className="font-semibold">Create a Family</h3>
          <div className="flex gap-2">
            <input placeholder="Family name" value={newName} onChange={e => setNewName(e.target.value)} className="input" />
            <button onClick={handleCreate} className="btn-primary whitespace-nowrap">Create</button>
          </div>
        </div>
        <div className="card !p-4 space-y-3">
          <h3 className="font-semibold">Join a Family</h3>
          <div className="flex gap-2">
            <input placeholder="Invite code" value={joinCode} onChange={e => setJoinCode(e.target.value)} className="input" />
            <button onClick={handleJoin} className="btn-primary whitespace-nowrap">Join</button>
          </div>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : families.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">You're not in any family groups yet. Create or join one above!</p>
        </div>
      ) : (
        <>
          {/* Family tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {families.map(f => (
              <button
                key={f.id}
                onClick={() => selectFamily(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedFamily?.id === f.id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          {selectedFamily && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{selectedFamily.name}</h2>
                  <p className="text-sm text-gray-500">
                    Invite code: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono text-primary-600">{selectedFamily.invite_code}</code>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="input !w-auto" />
                  <button onClick={() => handleLeave(selectedFamily.id)} className="btn-danger text-sm">Leave</button>
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {members.map(member => {
                  const s = memberSummaries[member.id];
                  const summary = s?.summary || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fats: 0 };
                  const goals = s?.user || { calorie_goal: 2000, protein_goal: 150, carbs_goal: 250, fats_goal: 65 };
                  return (
                    <div key={member.id} className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-medium">{member.name}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            member.role === 'admin' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>{member.role}</span>
                        </div>
                        <div className="text-sm font-semibold">{Math.round(summary.total_calories)} kcal</div>
                      </div>
                      <div className="flex justify-around">
                        <MacroMini value={summary.total_calories} goal={goals.calorie_goal} label="Cal" color="bg-primary-500" />
                        <MacroMini value={summary.total_protein} goal={goals.protein_goal} label="Protein" color="bg-emerald-500" />
                        <MacroMini value={summary.total_carbs} goal={goals.carbs_goal} label="Carbs" color="bg-amber-500" />
                        <MacroMini value={summary.total_fats} goal={goals.fats_goal} label="Fats" color="bg-red-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
