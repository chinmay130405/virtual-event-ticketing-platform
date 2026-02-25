/**
 * Cart Service
 * API calls for shopping cart
 */

import axios from 'axios';

const API_URL = '/api/cart';

const cartService = {
  // Get user's cart
  getCart: async (token) => {
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add item to cart
  addToCart: async (eventId, quantity, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/add`,
        { eventId, quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update cart item
  updateCartItem: async (eventId, quantity, token) => {
    try {
      const response = await axios.put(
        `${API_URL}/update/${eventId}`,
        { quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove from cart
  removeFromCart: async (eventId, token) => {
    try {
      const response = await axios.delete(`${API_URL}/remove/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Clear cart
  clearCart: async (token) => {
    try {
      const response = await axios.delete(`${API_URL}/clear`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default cartService;
