const API_BASE = '/api';

async function fetchJson(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errData = await res.json();
        errorMsg = errData.detail || errData.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Call failed: ${endpoint}`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboard: () => fetchJson('/dashboard'),

  // Inventory
  getInventory: (status, search) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return fetchJson(`/inventory?${params.toString()}`);
  },
  getLowStock: () => fetchJson('/inventory/low-stock'),
  getExpiring: () => fetchJson('/inventory/expiring'),
  getExpired: () => fetchJson('/inventory/expired'),

  // Medicines
  getMedicines: (search) => fetchJson(`/medicines${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getMedicine: (id) => fetchJson(`/medicines/${id}`),
  createMedicine: (data) => fetchJson('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicine: (id, data) => fetchJson(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedicine: (id) => fetchJson(`/medicines/${id}`, { method: 'DELETE' }),

  // Batches
  getBatches: (medId) => fetchJson(`/batches${medId ? `?medicine_id=${medId}` : ''}`),
  createBatch: (data) => fetchJson('/batches', { method: 'POST', body: JSON.stringify(data) }),
  updateBatch: (id, data) => fetchJson(`/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBatch: (id) => fetchJson(`/batches/${id}`, { method: 'DELETE' }),

  // RFID
  getRfidTags: () => fetchJson('/rfid'),
  getRfidTag: (uid) => fetchJson(`/rfid/${encodeURIComponent(uid)}`),
  getLatestRfidTap: () => fetchJson('/rfid/latest-tap'),
  registerRfidTag: (data) => fetchJson('/rfid/register', { method: 'POST', body: JSON.stringify(data) }),
  scanRfid: (uid) => fetchJson('/rfid/scan', { method: 'POST', body: JSON.stringify({ uid }) }),
  markTagPrinted: (id) => fetchJson(`/rfid/print-label/${id}`, { method: 'POST' }),

  // Sensors & Climate
  getSensorLatest: () => fetchJson('/sensor/latest'),
  getSensorHistory: (limit = 40) => fetchJson(`/sensor/history?limit=${limit}`),
  postSensorReading: (data) => fetchJson('/sensor', { method: 'POST', body: JSON.stringify(data) }),

  // Alerts
  getAlerts: (category, severity, resolved) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (severity) params.append('severity', severity);
    if (resolved !== undefined && resolved !== null) params.append('resolved', resolved);
    return fetchJson(`/alerts?${params.toString()}`);
  },
  resolveAlert: (id) => fetchJson(`/alerts/${id}/resolve`, { method: 'POST' }),
  resolveAllAlerts: () => fetchJson('/alerts/resolve-all', { method: 'POST' }),

  // Transactions
  getTransactions: (type, limit = 100) => {
    const params = new URLSearchParams();
    if (type) params.append('tx_type', type);
    params.append('limit', limit);
    return fetchJson(`/transactions?${params.toString()}`);
  },
  createTransaction: (data) => fetchJson('/transactions', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: () => fetchJson('/suppliers'),
  createSupplier: (data) => fetchJson('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  deleteSupplier: (id) => fetchJson(`/suppliers/${id}`, { method: 'DELETE' }),

  // Email & Invoices
  triggerEmailImport: () => fetchJson('/email/import', { method: 'POST' }),
  getEmailImports: () => fetchJson('/email/imports'),
  getInvoices: () => fetchJson('/invoices'),
  getInvoice: (id) => fetchJson(`/invoices/${id}`),
  uploadInvoice: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/invoices/import`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload invoice file');
    return await res.json();
  },
  confirmInvoice: (id, data) => fetchJson(`/invoices/${id}/confirm`, { method: 'POST', body: JSON.stringify(data) }),

  // ThingSpeak
  getThingspeakStatus: () => fetchJson('/thingspeak/status'),
  syncThingspeak: () => fetchJson('/thingspeak/sync-now', { method: 'POST' }),

  // Machine Learning Demand Prediction
  getDemandPredictions: () => fetchJson('/ml/demand-prediction'),

  // Simulation endpoints for UI testing
  simulateRfidTap: (uid) => fetchJson('/simulate/rfid-tap', { method: 'POST', body: JSON.stringify({ uid }) }),
  simulateSensorPush: (temperature, humidity) => fetchJson('/simulate/sensor-push', { method: 'POST', body: JSON.stringify({ temperature, humidity }) }),
  resetDemoData: () => fetchJson('/simulate/reset-demo-data', { method: 'POST' }),
};
