/**
 * Event Card Component
 */

import React from 'react';
import { Link } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event }) => {
  const availableTickets = event.ticketsAvailable - event.ticketsSold;

  return (
    <div className="event-card">
      <div className="event-image">
        <img src={event.bannerImage} alt={event.title} />
        <div className="event-badge">
          {availableTickets > 0 ? (
            <span className="badge-available">{availableTickets} available</span>
          ) : (
            <span className="badge-sold-out">Sold Out</span>
          )}
        </div>
      </div>

      <div className="event-content">
        <div className="event-category">{event.category}</div>
        <h3 className="event-title">{event.title}</h3>
        <p className="event-description">{event.description.substring(0, 100)}...</p>

        <div className="event-meta">
          <div className="meta-item">
            📅 {new Date(event.eventDate).toLocaleDateString()}
          </div>
          <div className="meta-item">
            🕐 {event.eventTime}
          </div>
        </div>

        {event.speaker && (
          <div className="event-speaker">
            <span>🎤 {event.speaker}</span>
          </div>
        )}

        <div className="event-footer">
          <span className="event-price">${event.price}</span>
          <Link to={`/event/${event._id}`} className="btn btn-primary">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
