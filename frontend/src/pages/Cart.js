/**
 * Shopping Cart Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import cartService from '../services/cartService';

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
      <div className="flex flex-col items-center gap-4 px-6 py-24 text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-dark border-t-primary"></div>
        <p>Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="mb-6 text-4xl font-black text-white">Shopping Cart</h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!cart || cart.items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-surface p-10 text-center">
            <p className="mb-4 text-slate-300">Your cart is empty</p>
            <Link to="/" className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {cart.items.map((item) => {
                if (!item.event) return null; // Skip invalid or deleted events
                
                return (
                <div
                  key={item.event._id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-surface p-5 md:flex-row md:items-center"
                >
                  <img
                    src={item.event.bannerImage || 'https://via.placeholder.com/150'}
                    alt={item.event.title || 'Event'}
                    className="h-28 w-full rounded-xl object-cover md:w-40"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{item.event.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {new Date(item.event.eventDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-300">₹{item.price} per ticket</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdateQuantity(item.event._id, item.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-lg text-white"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.event._id, item.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-lg text-white"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">₹{item.price * item.quantity}</p>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.event._id)}
                    className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              );
              })}
            </div>

            <div className="h-fit rounded-2xl border border-white/10 bg-surface p-6 lg:sticky lg:top-28">
              <h2 className="mb-4 text-2xl font-bold text-white">Order Summary</h2>
              <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
                <span>Subtotal ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} tickets)</span>
                <span>₹{cart.totalPrice.toFixed(2)}</span>
              </div>
              <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
                <span>Taxes</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="mb-6 flex items-center justify-between border-t border-white/10 pt-4 text-lg font-bold text-white">
                <span>Total</span>
                <span>₹{cart.totalPrice.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="mb-3 w-full rounded-full bg-primary px-6 py-3 font-bold text-white"
              >
                Proceed to Checkout
              </button>
              <Link
                to="/"
                className="block w-full rounded-full border border-white/20 px-6 py-3 text-center font-bold text-white"
              >
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
