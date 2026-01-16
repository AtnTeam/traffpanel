import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      // Redirect to login will be handled by App component
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const processClicks = async (from, to) => {
  try {
    const response = await api.post('/clicks/process', { from, to });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllClicks = async () => {
  try {
    const response = await api.get('/clicks/data');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getKeitaroLogs = async (limit = 100, offset = 0) => {
  try {
    const response = await api.get('/keitaro/logs', {
      params: { limit, offset }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const verifyToken = async (token) => {
  try {
    const response = await api.get('/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

