import axios from 'axios';

const API_URL = '/api/organizer';

const organizerService = {
  getEvents: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getEarnings: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/earnings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPayouts: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/payouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  requestPayout: async (orderIds, payoutMethod, token) => {
    try {
      const response = await axios.post(
        '/api/orders/payouts/request',
        { orderIds, payoutMethod },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateBankDetails: async (bankDetails, token) => {
    try {
      const response = await axios.put('/api/auth/organizer/bank-details', bankDetails, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default organizerService;
