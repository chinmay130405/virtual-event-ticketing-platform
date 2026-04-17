import axios from 'axios';

const API_URL = '/api/crm';

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

export const crmService = {
  getMyCRMProfile: async () => {
    const response = await api.get('/me/crm');
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await api.put(`/users/me/preferences`, { preferences });
    return response.data;
  },

  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  },

  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  updateReview: async (reviewId, reviewData) => {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  getEventReviews: async (eventId) => {
    const response = await api.get(`/reviews/event/${eventId}`);
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUserCRM: async (userId) => {
    const response = await api.get(`/users/${userId}/crm`);
    return response.data;
  },

  getCampaigns: async () => {
    const response = await api.get('/campaigns');
    return response.data;
  },

  getInsights: async () => {
    const response = await api.get('/insights');
    return response.data;
  },

  createCampaign: async (data) => {
    const response = await api.post('/campaigns', data);
    return response.data;
  },
};

export default crmService;