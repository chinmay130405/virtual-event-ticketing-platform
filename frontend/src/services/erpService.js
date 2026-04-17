import axios from 'axios';

const API_URL = '/api/erp';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const erpService = {
  getResources: async (params = {}) => {
    const response = await api.get('/resources', { params });
    return response.data;
  },

  createResource: async (data) => {
    const response = await api.post('/resources', data);
    return response.data;
  },

  updateResource: async (id, data) => {
    const response = await api.put(`/resources/${id}`, data);
    return response.data;
  },

  deleteResource: async (id) => {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
  },

  getAvailableResources: async (params = {}) => {
    const response = await api.get('/resources/available', { params });
    return response.data;
  },

  getExpenses: async (params = {}) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  createExpense: async (data) => {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  updateExpense: async (id, data) => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  getEventExpenseTotal: async (eventId) => {
    const response = await api.get(`/expenses/event/${eventId}/total`);
    return response.data;
  },

  getFinancesSummary: async (params = {}) => {
    const response = await api.get('/finances/summary', { params });
    return response.data;
  },

  getEventFinances: async (eventId) => {
    const response = await api.get(`/finances/event/${eventId}`);
    return response.data;
  },

  getFinancesChart: async (params = {}) => {
    const response = await api.get('/finances/chart', { params });
    return response.data;
  },

  getInsights: async () => {
    const response = await api.get('/insights');
    return response.data;
  },
};

export default erpService;