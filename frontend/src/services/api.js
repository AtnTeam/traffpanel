// Auto-detect API URL based on current hostname
// In production (cetoki.com), use HTTPS domain
// In development (localhost), use localhost
const getApiBaseUrl = () => {
  // Allow override via environment variable
  let baseUrl = import.meta.env.VITE_API_URL;
  
  if (!baseUrl) {
    // Auto-detect based on current hostname
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Development mode
      baseUrl = 'http://localhost:3001';
    } else if (hostname === 'cetoki.com' || hostname.includes('cetoki.com')) {
      // Production mode - use HTTPS domain
      baseUrl = 'https://cetoki.com';
    } else {
      // Fallback: use same protocol and hostname as current page
      baseUrl = `${window.location.protocol}//${hostname}`;
    }
  }
  
  // Remove trailing slash to avoid double slashes
  return baseUrl.replace(/\/+$/, '');
};

const API_BASE_URL = getApiBaseUrl();

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

  // Ensure endpoint starts with / and combine with base URL properly
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const response = await fetch(url, {
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

