/**
 * Admin Service
 * API calls for admin operations
 */

import axios from 'axios';

const API_URL = '/api/admin';

const adminService = {
  // Get all users
  getAllUsers: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user details
  getUserDetails: async (id, token) => {
    try {
      const response = await axios.get(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user role
  updateUserRole: async (id, isAdmin, token) => {
    try {
      const response = await axios.put(
        `${API_URL}/users/${id}/role`,
        { isAdmin },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete user
  deleteUser: async (id, token) => {
    try {
      const response = await axios.delete(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get dashboard stats
  getDashboardStats: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get events analytics
  getEventsAnalytics: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/events/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get sales report
  getSalesReport: async (filters = {}, token) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      const response = await axios.get(`${API_URL}/reports/sales?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default adminService;
