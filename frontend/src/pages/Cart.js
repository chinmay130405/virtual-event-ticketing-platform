/**
 * Shopping Cart Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import cartService from '../services/cartService';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await cartService.getCart(token);
      setCart(response.cart);
    } catch (err) {
      setError(err.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (eventId, quantity) => {
    try {
      if (quantity < 1) return;
      const token = localStorage.getItem('token');
      const response = await cartService.updateCartItem(eventId, quantity, token);
      setCart(response.cart);
    } catch (err) {
      setError(err.message || 'Failed to update cart');
    }
  };

  const handleRemoveItem = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await cartService.removeFromCart(eventId, token);
      setCart(response.cart);
    } catch (err) {
      setError(err.message || 'Failed to remove item');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>🛒 Shopping Cart</h1>

        {error && <div className="alert alert-error">{error}</div>}

        {!cart || cart.items.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <Link to="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item.event._id} className="cart-item">
                  <img src={item.event.bannerImage} alt={item.event.title} />
                  <div className="item-details">
                    <h3>{item.event.title}</h3>
                    <p className="item-date">
                      📅 {new Date(item.event.eventDate).toLocaleDateString()}
                    </p>
                    <p className="item-price">${item.price} per ticket</p>
                  </div>
                  <div className="item-quantity">
                    <button
                      onClick={() => handleUpdateQuantity(item.event._id, item.quantity - 1)}
                      className="qty-btn"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.event._id, item.quantity + 1)}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>
                  <div className="item-total">
                    <p className="total-price">${item.price * item.quantity}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.event._id)}
                    className="btn btn-danger remove-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>
              <div className="summary-item">
                <span>Subtotal ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} tickets)</span>
                <span>${cart.totalPrice.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span>Taxes</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>${cart.totalPrice.toFixed(2)}</span>
              </div>
              <button onClick={handleCheckout} className="btn btn-primary btn-full">
                Proceed to Checkout
              </button>
              <Link to="/" className="btn btn-outline btn-full">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
