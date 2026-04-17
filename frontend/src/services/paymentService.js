/**
 * Payment Service
 * API calls for payment integration (Razorpay)
 */

import axios from 'axios';

const API_URL = '/api/payments';

const paymentService = {
  // Create a new Razorpay order
  createOrder: async (token, payload = {}) => {
    try {
      const response = await axios.post(`${API_URL}/create-order`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verify Razorpay payment signature
  verifyPayment: async (paymentData, token) => {
    try {
      const response = await axios.post(`${API_URL}/verify`, paymentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default paymentService;
