import axios from 'axios';

const API_URL = '/api/marketing';

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

export const marketingService = {
  subscribe: async (payload) => {
    const response = await axios.post(`${API_URL}/subscribe`, payload);
    return response.data;
  },

  getSubscribers: async () => {
    const response = await axios.get(`${API_URL}/subscribers`);
    return response.data;
  },

  getInsights: async () => {
    const response = await api.get('/insights');
    return response.data;
  },
};

export default marketingService;
