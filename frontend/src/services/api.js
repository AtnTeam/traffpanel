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

export const getKeitaroLogs = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.offset) queryParams.append('offset', params.offset);
  if (params.source) queryParams.append('source', params.source);
  if (params.found !== undefined) queryParams.append('found', params.found);
  
  const queryString = queryParams.toString();
  const endpoint = `/api/keitaro-logs${queryString ? `?${queryString}` : ''}`;
  return apiRequest(endpoint);
};

export const getKeitaroLogById = async (id) => {
  return apiRequest(`/api/keitaro-logs/${id}`);
};

