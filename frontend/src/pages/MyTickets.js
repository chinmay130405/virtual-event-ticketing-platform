/**
 * My Tickets Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import './MyTickets.css';

const MyTickets = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await orderService.getUserOrders(token);
      setOrders(response.orders);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-tickets-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-tickets-page">
      <div className="container">
        <h1>🎟️ My Tickets</h1>

        {error && <div className="alert alert-error">{error}</div>}

        {orders.length === 0 ? (
          <div className="no-tickets">
            <p>You haven't purchased any tickets yet</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Browse Events
            </button>
          </div>
        ) : (
          <div className="tickets-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>Order #{order.orderNumber}</h3>
                    <p className="order-date">
                      📅 Purchased on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge status-${order.orderStatus}`}>
                      {order.orderStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="tickets-section">
                  <h4>Tickets ({order.tickets.length})</h4>
                  {order.tickets.map((ticket, index) => (
                    <div key={ticket._id} className="ticket-item">
                      <div className="ticket-info">
                        <div className="ticket-number">Ticket #{index + 1}</div>
                        <div className="ticket-details">
                          <p>
                            <strong>{ticket.eventTitle}</strong>
                          </p>
                          <p>
                            📅{' '}
                            {new Date(ticket.eventDate).toLocaleDateString()} at{' '}
                            {ticket.eventTime}
                          </p>
                          <p className="ticket-code">
                            Code: <code>{ticket.ticketNumber}</code>
                          </p>
                        </div>
                      </div>
                      <button className="btn btn-outline download-btn">
                        📥 Download PDF
                      </button>
                    </div>
                  ))}
                </div>

                <div className="order-summary">
                  <div className="summary-item">
                    <span>Total Amount</span>
                    <span className="amount">${order.totalAmount}</span>
                  </div>
                  <div className="summary-item">
                    <span>Payment Status</span>
                    <span className={`status-${order.paymentStatus}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
