/**
 * Support Service
 * API calls for support tickets and replies
 */

import axios from 'axios';

const API_URL = '/api/support';

const supportService = {
  createTicket: async (payload, token) => {
    try {
      const response = await axios.post(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getTickets: async (token) => {
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getTicketById: async (ticketId, token) => {
    try {
      const response = await axios.get(`${API_URL}/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  replyToTicket: async (ticketId, message, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/${ticketId}/reply`,
        { message },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateTicketStatus: async (ticketId, status, token) => {
    try {
      const response = await axios.patch(
        `${API_URL}/${ticketId}/status`,
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

  updateTicketPriority: async (ticketId, priority, token) => {
    try {
      const response = await axios.patch(
        `${API_URL}/${ticketId}/priority`,
        { priority },
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

export default supportService;
