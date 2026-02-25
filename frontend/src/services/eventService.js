/**
 * Event Service
 * API calls for events
 */

import axios from 'axios';

const API_URL = '/api/events';

const eventService = {
  // Get all events with filters
  getAllEvents: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      const response = await axios.get(`${API_URL}?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single event
  getEventById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create event (Admin)
  createEvent: async (eventData, token) => {
    try {
      const response = await axios.post(API_URL, eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update event (Admin)
  updateEvent: async (id, eventData, token) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete event (Admin)
  deleteEvent: async (id, token) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default eventService;
