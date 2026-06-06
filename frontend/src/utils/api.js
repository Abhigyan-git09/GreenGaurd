// utils/api.js — Centralized API client for EcoSkeptic backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('ecoskeptic_token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    localStorage.setItem('ecoskeptic_token', data.token);
    return data;
  },

  async register(email, password, fullName, role = 'auditor') {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role })
    });
    const data = await handleResponse(res);
    localStorage.setItem('ecoskeptic_token', data.token);
    return data;
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async resetPassword(token, newPassword) {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  // Incidents
  async getIncidents() {
    const res = await fetch(`${API_URL}/api/incidents`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async verifyIncident(id) {
    const res = await fetch(`${API_URL}/api/incidents/${id}/verify`, {
      method: 'POST',
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async rejectIncident(id) {
    const res = await fetch(`${API_URL}/api/incidents/${id}/reject`, {
      method: 'POST',
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async deleteIncident(id) {
    const res = await fetch(`${API_URL}/api/incidents/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  // Scanner
  async scanText({ text, strictness, company_name, category }) {
    const res = await fetch(`${API_URL}/api/scan`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ text, strictness, company_name, category })
    });
    return handleResponse(res);
  },

  async scanVision(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    // Note: Do not set Content-Type header when sending FormData.
    // The browser will automatically set it to multipart/form-data with the correct boundary.
    const headers = authHeaders();
    delete headers['Content-Type'];

    const res = await fetch(`${API_URL}/api/scan/vision`, {
      method: 'POST',
      headers,
      body: formData
    });
    return handleResponse(res);
  },

  async scanEsg({ text }) {
    const res = await fetch(`${API_URL}/api/scan/esg`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ text })
    });
    return handleResponse(res);
  },

  async searchProduct(query) {
    const res = await fetch(`${API_URL}/api/scan/search/${encodeURIComponent(query)}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  // Corporate Network Graph
  async getCorporateNetwork() {
    const res = await fetch(`${API_URL}/api/database/network`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async searchOpenCorporates(query) {
    const res = await fetch(`${API_URL}/api/database/opencorporates/search/${encodeURIComponent(query)}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  // Utility
  logout() {
    localStorage.removeItem('ecoskeptic_token');
  },

  getToken,

  getWsUrl() {
    return import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';
  }
};

export default api;
