export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function getHeaders() {
  const token = localStorage.getItem('token');
  const businessId = localStorage.getItem('selectedBusinessId');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  if (businessId) {
    headers['X-Business-Id'] = businessId;
  }
  
  return headers;
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'Terjadi kesalahan');
  }
  return data;
}

export const api = {
  // Auth
  login: (username, password) =>
    fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ username, password }) }).then(handleResponse),
  
  getMe: () =>
    fetch(`${API_BASE}/auth/me`, { headers: getHeaders() }).then(handleResponse),

  // Businesses
  getBusinesses: () =>
    fetch(`${API_BASE}/businesses`, { headers: getHeaders() }).then(handleResponse),
  
  createBusiness: (data) =>
    fetch(`${API_BASE}/businesses`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  updateBusiness: (id, data) =>
    fetch(`${API_BASE}/businesses/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  deleteBusiness: (id) =>
    fetch(`${API_BASE}/businesses/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    
  getBusinessUsers: (id) =>
    fetch(`${API_BASE}/businesses/${id}/users`, { headers: getHeaders() }).then(handleResponse),

  getAllUsers: () =>
    fetch(`${API_BASE}/businesses/users/all`, { headers: getHeaders() }).then(handleResponse),

  assignUserToBusiness: (id, userId, accessibleMenus = null) =>
    fetch(`${API_BASE}/businesses/${id}/assign`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ userId, accessibleMenus }) }).then(handleResponse),

  updateUserAccess: (businessId, userId, accessibleMenus) =>
    fetch(`${API_BASE}/businesses/${businessId}/access/${userId}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ accessibleMenus }) }).then(handleResponse),

  unassignUserFromBusiness: (id, userId) =>
    fetch(`${API_BASE}/businesses/${id}/unassign/${userId}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Dashboard
  getKPI: (startDate, endDate) =>
    fetch(`${API_BASE}/dashboard/kpi?startDate=${startDate}&endDate=${endDate}`, { headers: getHeaders() }).then(handleResponse),
  
  getSalesTrend: (days = 14) =>
    fetch(`${API_BASE}/dashboard/sales-trend?days=${days}`, { headers: getHeaders() }).then(handleResponse),
  
  getExpenseComposition: (startDate, endDate) =>
    fetch(`${API_BASE}/dashboard/expense-composition?startDate=${startDate || ''}&endDate=${endDate || ''}`, { headers: getHeaders() }).then(handleResponse),
  
  getAlerts: () =>
    fetch(`${API_BASE}/dashboard/alerts`, { headers: getHeaders() }).then(handleResponse),

  // Cash
  getCashTransactions: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return fetch(`${API_BASE}/cash?${params}`, { headers: getHeaders() }).then(handleResponse);
  },

  createCashTransaction: (data) =>
    fetch(`${API_BASE}/cash`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  getCashSummary: (startDate, endDate) =>
    fetch(`${API_BASE}/cash/summary?startDate=${startDate || ''}&endDate=${endDate || ''}`, { headers: getHeaders() }).then(handleResponse),

  exportCash: (filters = {}) => {
    const params = new URLSearchParams(filters);
    const headers = getHeaders();
    return fetch(`${API_BASE}/cash/export?${params}`, { headers });
  },

  // Ingredients
  getIngredients: () =>
    fetch(`${API_BASE}/ingredients`, { headers: getHeaders() }).then(handleResponse),
  
  createIngredient: (data) =>
    fetch(`${API_BASE}/ingredients`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  updateIngredient: (id, data) =>
    fetch(`${API_BASE}/ingredients/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  deleteIngredient: (id) =>
    fetch(`${API_BASE}/ingredients/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  
  restockIngredient: (id, quantity) =>
    fetch(`${API_BASE}/ingredients/${id}/restock`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ quantity }) }).then(handleResponse),

  // Menu / Recipes
  getMenuItems: () =>
    fetch(`${API_BASE}/menu`, { headers: getHeaders() }).then(handleResponse),
  
  createMenuItem: (data) =>
    fetch(`${API_BASE}/menu`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  updateMenuItem: (id, data) =>
    fetch(`${API_BASE}/menu/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  setRecipe: (menuId, items) =>
    fetch(`${API_BASE}/menu/${menuId}/recipe`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ items }) }).then(handleResponse),

  // Add-ons
  getMenuAddons: (menuId) =>
    fetch(`${API_BASE}/menu/${menuId}/addons`, { headers: getHeaders() }).then(handleResponse),
  
  createAddonGroup: (menuId, data) =>
    fetch(`${API_BASE}/menu/${menuId}/addons`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  updateAddonGroup: (menuId, groupId, data) =>
    fetch(`${API_BASE}/menu/${menuId}/addons/${groupId}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  deleteAddonGroup: (menuId, groupId) =>
    fetch(`${API_BASE}/menu/${menuId}/addons/${groupId}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  createAddonOption: (groupId, data) =>
    fetch(`${API_BASE}/menu/addons/${groupId}/options`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),

  updateAddonOption: (groupId, optionId, data) =>
    fetch(`${API_BASE}/menu/addons/${groupId}/options/${optionId}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),

  deleteAddonOption: (groupId, optionId) =>
    fetch(`${API_BASE}/menu/addons/${groupId}/options/${optionId}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  setAddonRecipe: (optionId, items) =>
    fetch(`${API_BASE}/menu/addons/option/${optionId}/recipe`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ items }) }).then(handleResponse),

  // Global Modifiers
  getModifiers: () =>
    fetch(`${API_BASE}/modifiers`, { headers: getHeaders() }).then(handleResponse),

  createModifier: (data) =>
    fetch(`${API_BASE}/modifiers`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),

  updateModifier: (id, data) =>
    fetch(`${API_BASE}/modifiers/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),

  deleteModifier: (id) =>
    fetch(`${API_BASE}/modifiers/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // POS
  processSale: (data) =>
    fetch(`${API_BASE}/pos/sale`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  getRecentSales: (limit = 50) =>
    fetch(`${API_BASE}/pos/sales?limit=${limit}`, { headers: getHeaders() }).then(handleResponse),

  // Reports
  getPnL: (startDate, endDate) =>
    fetch(`${API_BASE}/reports/pnl?startDate=${startDate}&endDate=${endDate}`, { headers: getHeaders() }).then(handleResponse),
};

export default api;
