/**
 * Order Service
 * API calls for orders and checkout
 */

import axios from 'axios';

const API_URL = '/api/orders';

const orderService = {
  // Checkout
  checkout: async (checkoutData, token) => {
    try {
      const response = await axios.post(`${API_URL}/checkout`, checkoutData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user's orders
  getUserOrders: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get order details
  getOrderById: async (id, token) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cancel order
  cancelOrder: async (id, token) => {
    try {
      const response = await axios.put(`${API_URL}/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Download ticket PDF
  downloadTicket: async (orderId, ticketId, token) => {
    try {
      const response = await axios.get(
        `${API_URL}/${orderId}/tickets/${ticketId}/download`,
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

export default orderService;
