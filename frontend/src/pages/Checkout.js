/**
 * Checkout Page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import cartService from '../services/cartService';
import orderService from '../services/orderService';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    attendeeName: user?.name || '',
    attendeeEmail: user?.email || '',
    attendeePhone: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    paymentMethod: 'credit_card',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('billing_')) {
      const field = name.replace('billing_', '');
      setFormData((prev) => ({
        ...prev,
        billingAddress: { ...prev.billingAddress, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await orderService.checkout(formData, token);
      // Clear cart
      await cartService.clearCart(token);
      navigate(`/order-confirmation/${response.order._id}`);
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>🛍️ Checkout</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-left">
            {/* Attendee Information */}
            <section className="form-section">
              <h2>Attendee Information</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="attendeeName"
                    value={formData.attendeeName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="attendeeEmail"
                    value={formData.attendeeEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="attendeePhone"
                  value={formData.attendeePhone}
                  onChange={handleInputChange}
                />
              </div>
            </section>

            {/* Billing Address */}
            <section className="form-section">
              <h2>Billing Address</h2>
              <div className="form-group">
                <label>Street Address *</label>
                <input
                  type="text"
                  name="billing_street"
                  value={formData.billingAddress.street}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="billing_city"
                    value={formData.billingAddress.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State/Province</label>
                  <input
                    type="text"
                    name="billing_state"
                    value={formData.billingAddress.state}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Postal Code *</label>
                  <input
                    type="text"
                    name="billing_postalCode"
                    value={formData.billingAddress.postalCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Country *</label>
                  <input
                    type="text"
                    name="billing_country"
                    value={formData.billingAddress.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="form-section">
              <h2>Payment Method</h2>
              <div className="payment-methods">
                {['credit_card', 'debit_card', 'paypal'].map((method) => (
                  <label key={method} className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={formData.paymentMethod === method}
                      onChange={handleInputChange}
                    />
                    <span>{method.replace('_', ' ').toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="checkout-right">
            <div className="order-summary">
              <h2>Order Summary</h2>
              <p className="summary-note">Items will be shown after cart is loaded</p>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-full"
              >
                {loading ? 'Processing...' : '✓ Complete Purchase'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
