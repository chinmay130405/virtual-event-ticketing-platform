/**
 * Event Details Page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import cartService from '../services/cartService';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventService.getEventById(id);
      setEvent(response.event);
    } catch (err) {
      setError(err.message || 'Failed to fetch event');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(true);
      setError(null);
      const token = localStorage.getItem('token');
      await cartService.addToCart(id, quantity, token);
      setSuccessMessage(`✅ Added ${quantity} ticket(s) to cart!`);
      setQuantity(1);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1) {
      setQuantity(value);
    }
  };

  if (loading) {
    return (
      <div className="event-details-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-details-page">
        <div className="container">
          <div className="error-container">
            <p>{error || 'Event not found'}</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableTickets = event.ticketsAvailable - event.ticketsSold;
  const soldOutPercentage = (event.ticketsSold / event.ticketsAvailable) * 100;

  return (
    <div className="event-details-page">
      <div className="container">
        <button onClick={() => navigate('/')} className="btn btn-outline back-btn">
          ← Back to Events
        </button>

        {error && <div className="alert alert-error">{error}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        <div className="event-details-content">
          {/* Left Column - Image and Info */}
          <div className="details-left">
            <img src={event.bannerImage} alt={event.title} className="event-banner" />

            <div className="event-info-section">
              <h2>{event.title}</h2>
              <div className="event-meta-details">
                <div className="meta-item">
                  <strong>📅 Date:</strong> {new Date(event.eventDate).toLocaleDateString()}
                </div>
                <div className="meta-item">
                  <strong>🕐 Time:</strong> {event.eventTime}
                </div>
                <div className="meta-item">
                  <strong>⏱️ Duration:</strong> {event.duration}
                </div>
                <div className="meta-item">
                  <strong>📍 Location:</strong> {event.location}
                </div>
                {event.speaker && (
                  <div className="meta-item">
                    <strong>🎤 Speaker:</strong> {event.speaker}
                  </div>
                )}
                <div className="meta-item">
                  <strong>🏷️ Category:</strong> {event.category}
                </div>
              </div>

              <div className="event-description-section">
                <h3>About This Event</h3>
                <p>{event.description}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Pricing and Add to Cart */}
          <div className="details-right">
            <div className="pricing-card">
              <div className="price-section">
                <span className="price-label">Price per Ticket</span>
                <span className="price-value">${event.price}</span>
              </div>

              <div className="availability-section">
                <div className="availability-info">
                  <span className="available-count">
                    {availableTickets > 0
                      ? `✅ ${availableTickets} Tickets Available`
                      : '❌ Sold Out'}
                  </span>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${soldOutPercentage}%` }}
                  ></div>
                </div>

                <div className="progress-text">
                  {event.ticketsSold} / {event.ticketsAvailable} tickets sold
                </div>
              </div>

              {availableTickets > 0 && (
                <>
                  <div className="quantity-section">
                    <label>Number of Tickets:</label>
                    <div className="quantity-input">
                      <button
                        onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                        className="quantity-btn"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={handleQuantityChange}
                        min="1"
                        max={availableTickets}
                      />
                      <button
                        onClick={() =>
                          quantity < availableTickets && setQuantity(quantity + 1)
                        }
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="total-section">
                    <span>Total Price:</span>
                    <span className="total-price">${event.price * quantity}</span>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="btn btn-primary btn-large"
                  >
                    {addingToCart ? 'Adding to Cart...' : '🛒 Add to Cart'}
                  </button>
                </>
              )}

              {availableTickets <= 0 && (
                <button disabled className="btn btn-danger btn-large">
                  Out of Stock
                </button>
              )}
            </div>

            {/* Organizer Info */}
            <div className="organizer-card">
              <h4>Organized by</h4>
              <p>{event.createdBy?.name || 'Event Organizer'}</p>
              <p className="organizer-email">{event.createdBy?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
