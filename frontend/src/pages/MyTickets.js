/**
 * My Tickets Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import eventService from '../services/eventService';

const MyTickets = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [reviewModal, setReviewModal] = useState({
    open: false,
    ticket: null,
  });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [ordersResponse, recommendationsResponse] = await Promise.all([
        orderService.getUserOrders(token),
        eventService.getRecommendations(token),
      ]);

      setOrders(ordersResponse.orders || []);
      setRecommendations(recommendationsResponse.recommendations || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (ticket) => {
    if (!ticket?.event?._id) {
      setError('Unable to identify event for feedback');
      return;
    }

    setReviewModal({ open: true, ticket });
    setReviewForm({ rating: 5, comment: '' });
    setReviewMessage('');
  };

  const closeReviewModal = () => {
    setReviewModal({ open: false, ticket: null });
    setReviewMessage('');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewModal.ticket?.event?._id) {
      return;
    }

    try {
      setReviewLoading(true);
      setReviewMessage('');
      const token = localStorage.getItem('token');
      await eventService.submitFeedback(
        reviewModal.ticket.event._id,
        {
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment.trim(),
        },
        token
      );
      setReviewMessage('Thanks! Your review was submitted.');
      setTimeout(() => {
        closeReviewModal();
        fetchOrders();
      }, 700);
    } catch (err) {
      setReviewMessage(err.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-24 text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-dark border-t-primary"></div>
        <p>Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="mb-6 text-4xl font-black text-white">My Tickets</h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-surface p-10 text-center">
            <p className="mb-4 text-slate-300">You haven't purchased any tickets yet</p>
            <button
              onClick={() => navigate('/')}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="rounded-2xl border border-white/10 bg-surface p-6">
                <div className="mb-5 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white">Order #{order.orderNumber}</h3>
                    <p className="text-sm text-slate-400">
                      Purchased on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${
                      order.orderStatus === 'refunded'
                        ? 'border-red-400/30 bg-red-500/10 text-red-300'
                        : 'border-primary/30 bg-primary/10 text-primary'
                    }`}>
                      {order.orderStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 text-lg font-bold text-white">Tickets ({order.tickets.length})</h4>
                  {order.tickets.map((ticket, index) => (
                    <div
                      key={ticket._id}
                      className="mb-3 flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-4 md:flex-row md:items-center"
                    >
                      <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">
                          Ticket #{index + 1}
                        </p>
                        <p className="font-semibold text-white">{ticket.eventTitle}</p>
                        <p className="text-sm text-slate-400">
                          {new Date(ticket.eventDate).toLocaleDateString()} at {ticket.eventTime}
                        </p>
                        <p className="text-xs text-slate-400">
                          Code: <code className="text-slate-200">{ticket.ticketNumber}</code>
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 md:items-end">
                        <button className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">
                          Download PDF
                        </button>
                        <button
                          onClick={() => openReviewModal(ticket)}
                          className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
                        >
                          Leave Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Total Amount</span>
                    <span className="font-bold text-primary">₹{order.totalAmount}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span>Payment Status</span>
                    <span className="font-semibold capitalize text-white">{order.paymentStatus}</span>
                  </div>

                  {order.orderStatus === 'refunded' && order.refundedAt && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Refunded On</span>
                      <span className="font-semibold text-red-300">
                        {new Date(order.refundedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-surface p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">Recommended For You</h2>
              <button
                onClick={() => navigate('/events')}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Explore all events
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((event) => (
                <button
                  key={event._id}
                  onClick={() => navigate(`/event/${event._id}`)}
                  className="rounded-xl border border-white/10 bg-black/30 p-4 text-left transition hover:border-primary/40 hover:bg-black/40"
                >
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                    {event.category}
                  </p>
                  <p className="line-clamp-2 text-base font-bold text-white">{event.title}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {new Date(event.eventDate).toLocaleDateString()} at {event.eventTime}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-primary">${event.price}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {reviewModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-surface p-6">
            <h3 className="text-2xl font-black text-white">Leave a Review</h3>
            <p className="mt-1 text-sm text-slate-400">{reviewModal.ticket?.eventTitle}</p>

            <form onSubmit={submitReview} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Rating
                </label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} Star{value > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Comment (optional)
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  placeholder="How was your event experience?"
                />
              </div>

              {reviewMessage && (
                <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                  {reviewMessage}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white"
                >
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
