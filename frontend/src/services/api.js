import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_BASE_URL = 'http://localhost:3000/auth';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (email, password, role = 'STAFF') =>
    axios.post(`${AUTH_BASE_URL}/register`, { email, password, role }),
  login: (email, password) =>
    axios.post(`${AUTH_BASE_URL}/login`, { email, password }),
  getCurrentUser: () =>
    axios.get(`${AUTH_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }),
};

// Products API
export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
};

// Warehouses API
export const warehousesAPI = {
  getAll: () => api.get('/warehouses'),
  create: (data) => api.post('/warehouses', data),
};

// Documents API
export const documentsAPI = {
  getAll: (type, status) => 
    api.get('/documents', { params: { type, status } }),
  create: (data) => api.post('/documents', data),
  updateStatus: (id, status) => 
    api.put(`/documents/${id}/status`, { status }),
};

// Ledger API
export const ledgerAPI = {
  getAll: (productId, warehouseId, direction) =>
    api.get('/ledger', { params: { productId, warehouseId, direction } }),
};

export default api;