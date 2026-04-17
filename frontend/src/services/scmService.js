import axios from 'axios';

const API_URL = '/api/scm';

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

export const scmService = {
  getInsights: async () => {
    const response = await api.get('/insights');
    return response.data;
  },
};

export default scmService;
