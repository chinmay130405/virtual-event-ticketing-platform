/**
 * Order Confirmation Page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import orderService from '../services/orderService';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await orderService.getOrderById(orderId, token);
      setOrder(response.order);
    } catch (err) {
      setError(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-page">
        <div className="container">
          <div className="error-box">
            <p>{error || 'Order not found'}</p>
            <Link to="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="container">
        <div className="confirmation-content">
          <div className="success-icon">✓</div>
          <h1>Order Confirmed! 🎉</h1>
          <p className="success-message">
            Thank you for your purchase! Your tickets have been confirmed.
          </p>

          <div className="confirmation-card">
            <div className="order-details">
              <div className="detail-item">
                <span className="label">Order Number</span>
                <span className="value">{order.orderNumber}</span>
              </div>
              <div className="detail-item">
                <span className="label">Confirmation Email</span>
                <span className="value">{order.attendeeEmail}</span>
              </div>
              <div className="detail-item">
                <span className="label">Total Amount</span>
                <span className="value price">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Payment Status</span>
                <span className={`value status-${order.paymentStatus}`}>
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="tickets-info">
              <h3>Your Tickets ({order.tickets.length})</h3>
              {order.tickets.map((ticket, index) => (
                <div key={ticket._id} className="ticket-preview">
                  <div className="ticket-number">
                    <strong>Ticket #{index + 1}</strong>
                  </div>
                  <div className="ticket-preview-details">
                    <p>
                      <strong>{ticket.eventTitle}</strong>
                    </p>
                    <p>
                      📅 {new Date(ticket.eventDate).toLocaleDateString()} at{' '}
                      {ticket.eventTime}
                    </p>
                    <p>Ticket Code: {ticket.ticketNumber}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="next-steps">
              <h3>What's Next?</h3>
              <ol>
                <li>Check your email for a confirmation message with ticket details</li>
                <li>Download your tickets from your account</li>
                <li>Join the event at the scheduled time</li>
                <li>Enjoy the event!</li>
              </ol>
            </div>
          </div>

          <div className="action-buttons">
            <Link to="/my-tickets" className="btn btn-primary">
              View My Tickets
            </Link>
            <Link to="/" className="btn btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
