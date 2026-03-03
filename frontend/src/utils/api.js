const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export const api = {
  // Auth
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Foods
  searchFoods: (q) => request(`/foods/search?q=${encodeURIComponent(q)}`),
  getFoods: () => request('/foods'),
  createFood: (body) => request('/foods', { method: 'POST', body: JSON.stringify(body) }),
  deleteFood: (id) => request(`/foods/${id}`, { method: 'DELETE' }),

  // Meals
  getMeals: (params) => request(`/meals?${new URLSearchParams(params)}`),
  getDailySummary: (date) => request(`/meals/daily-summary?date=${date}`),
  getWeeklySummary: (start, end) => request(`/meals/weekly-summary?start_date=${start}&end_date=${end}`),
  createMeal: (body) => request('/meals', { method: 'POST', body: JSON.stringify(body) }),
  updateMeal: (id, body) => request(`/meals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteMeal: (id) => request(`/meals/${id}`, { method: 'DELETE' }),

  // Scanning
  scanBarcode: (barcode) => request('/foods/scan-barcode', { method: 'POST', body: JSON.stringify({ barcode }) }),
  scanLabel: (image) => request('/foods/scan-label', { method: 'POST', body: JSON.stringify({ image }) }),
  photoLog: (image) => request('/meals/photo-log', { method: 'POST', body: JSON.stringify({ image }) }),

  // Families
  getFamilies: () => request('/families'),
  createFamily: (body) => request('/families', { method: 'POST', body: JSON.stringify(body) }),
  joinFamily: (code) => request('/families/join', { method: 'POST', body: JSON.stringify({ invite_code: code }) }),
  getFamilyMembers: (id) => request(`/families/${id}/members`),
  getMemberSummary: (familyId, userId, date) => request(`/families/${familyId}/members/${userId}/summary?date=${date}`),
  leaveFamily: (id) => request(`/families/${id}/leave`, { method: 'DELETE' }),
};
