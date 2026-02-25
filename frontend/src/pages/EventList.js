/**
 * Home / Events List Page
 */

import React, { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import eventService from '../services/eventService';
import './EventList.css';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchEvents();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category, minPrice, maxPrice, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await eventService.getCategories();
      setCategories(response.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {
        search,
        category,
        minPrice,
        maxPrice,
        sortBy,
      };
      const response = await eventService.getAllEvents(filters);
      setEvents(response.events);
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('');
  };

  return (
    <div className="event-list-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <h1>🎉 Browse Virtual Events</h1>
          <p>Discover and book your favorite virtual events</p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="filter-input"
              min="0"
            />
          </div>

          <div className="filter-group">
            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="filter-input"
              min="0"
            />
          </div>

          <div className="filter-group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="">Sort By</option>
              <option value="date_asc">Date (Earliest)</option>
              <option value="date_desc">Date (Latest)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
            </select>
          </div>

          <button onClick={handleReset} className="btn btn-outline">
            Reset
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading events...</p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && events.length > 0 && (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}

        {/* No Events */}
        {!loading && events.length === 0 && (
          <div className="no-events">
            <p>😔 No events found. Try adjusting your filters.</p>
            <button onClick={handleReset} className="btn btn-primary">
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;
