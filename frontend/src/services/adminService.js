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
  updateUserRole: async (id, role, token) => {
    try {
      const response = await axios.put(
        `${API_URL}/users/${id}/role`,
        { role },
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

  // Get all orders (admin)
  getAllOrders: async (filters = {}, token) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      const response = await axios.get(`/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update order status (admin)
  updateOrderStatus: async (orderId, status, token) => {
    try {
      const response = await axios.put(
        `/api/orders/${orderId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPendingOrganizers: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/organizers/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  verifyOrganizer: async (organizerId, action, reason, token) => {
    try {
      const response = await axios.put(
        `${API_URL}/organizers/${organizerId}/verify`,
        { action, reason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPendingEventSubmissions: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/events/submissions/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getRecentPaymentVerifications: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/payments/recent-verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  verifyEventSubmission: async (eventId, approvalStatus, comment, token) => {
    try {
      const response = await axios.put(
        `/api/events/${eventId}/verify`,
        { approvalStatus, comment },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default adminService;
