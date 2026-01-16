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

export const getRequestLogs = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.offset) queryParams.append('offset', params.offset);
  if (params.method) queryParams.append('method', params.method);
  if (params.statusCode) queryParams.append('statusCode', params.statusCode);
  if (params.path) queryParams.append('path', params.path);
  
  const queryString = queryParams.toString();
  const endpoint = `/api/logs${queryString ? `?${queryString}` : ''}`;
  return apiRequest(endpoint);
};

export const getRequestLogById = async (id) => {
  return apiRequest(`/api/logs/${id}`);
};

export const cleanupOldLogs = async (daysToKeep = 30) => {
  return apiRequest('/api/logs/cleanup', {
    method: 'DELETE',
    body: JSON.stringify({ daysToKeep }),
  });
};

