const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw error;
  }

  return response.json();
};

export const login = async (username, password) => {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

export const verifyToken = async () => {
  return apiRequest('/api/auth/verify');
};

export const processClicks = async (from, to) => {
  return apiRequest('/api/clicks/process', {
    method: 'POST',
    body: JSON.stringify({ from, to }),
  });
};

export const getAllClicks = async () => {
  return apiRequest('/api/clicks/data');
};

