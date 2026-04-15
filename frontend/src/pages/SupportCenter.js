/**
 * Support Center Page
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supportService from '../services/supportService';
import orderService from '../services/orderService';

const SupportCenter = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const currentUserName = user?.name || 'You';
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    relatedOrderId: '',
  });
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchInitialData();
  }, [isAuthenticated, navigate]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const [ticketsResponse, ordersResponse] = await Promise.all([
        supportService.getTickets(token),
        orderService.getUserOrders(token),
      ]);

      setTickets(ticketsResponse.tickets || []);
      setOrders(ordersResponse.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to load support center data');
    } finally {
      setLoading(false);
    }
  };

  const refreshTickets = async (ticketIdToLoad = selectedTicketId) => {
    const token = localStorage.getItem('token');
    const ticketsResponse = await supportService.getTickets(token);
    setTickets(ticketsResponse.tickets || []);

    if (ticketIdToLoad) {
      const ticketResponse = await supportService.getTicketById(ticketIdToLoad, token);
      setSelectedTicket(ticketResponse.ticket);
      setMessages(ticketResponse.messages || []);
      setSelectedTicketId(ticketIdToLoad);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      await supportService.createTicket(ticketForm, token);

      setTicketForm({
        subject: '',
        description: '',
        priority: 'medium',
        relatedOrderId: '',
      });
      setSuccessMsg('Support ticket created successfully.');
      await refreshTickets();
    } catch (err) {
      setError(err.message || 'Failed to create support ticket');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSelectTicket = async (ticketId) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await supportService.getTicketById(ticketId, token);
      setSelectedTicketId(ticketId);
      setSelectedTicket(response.ticket);
      setMessages(response.messages || []);
      setReplyMessage('');
    } catch (err) {
      setError(err.message || 'Failed to load ticket details');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();

    if (!selectedTicketId || !replyMessage.trim()) {
      return;
    }

    try {
      setReplyLoading(true);
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      await supportService.replyToTicket(selectedTicketId, replyMessage.trim(), token);
      setReplyMessage('');
      setSuccessMsg('Reply sent successfully.');
      await refreshTickets(selectedTicketId);
    } catch (err) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selectedTicketId || !isAdmin) {
      return;
    }

    try {
      setStatusLoading(true);
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      await supportService.updateTicketStatus(selectedTicketId, status, token);
      setSuccessMsg('Ticket status updated.');
      await refreshTickets(selectedTicketId);
    } catch (err) {
      setError(err.message || 'Failed to update ticket status');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-24 text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-dark border-t-primary"></div>
        <p>Loading support center...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6">
          <h1 className="text-4xl font-black text-white">Support Center</h1>
          <p className="mt-2 text-slate-400">
            Create support tickets, track updates, and chat with the support team.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMsg}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-surface p-5">
            <h2 className="mb-4 text-xl font-bold text-white">New Ticket</h2>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Subject
                </label>
                <input
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm((prev) => ({ ...prev, subject: e.target.value }))}
                  maxLength={200}
                  required
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  placeholder="Booking issue, payment issue..."
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Priority
                </label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm((prev) => ({ ...prev, priority: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Related Order (optional)
                </label>
                <select
                  value={ticketForm.relatedOrderId}
                  onChange={(e) =>
                    setTicketForm((prev) => ({ ...prev, relatedOrderId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                >
                  <option value="">No related order</option>
                  {orders.map((order) => (
                    <option key={order._id} value={order._id}>
                      {order.orderNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Description
                </label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) =>
                    setTicketForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={5}
                  maxLength={3000}
                  required
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                  placeholder="Please describe the issue in detail"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
              >
                {formLoading ? 'Creating...' : 'Create Ticket'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-surface p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Your Tickets</h2>

            {tickets.length === 0 ? (
              <p className="text-sm text-slate-400">No support tickets yet.</p>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <button
                    key={ticket._id}
                    onClick={() => handleSelectTicket(ticket._id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedTicketId === ticket._id
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-white/10 bg-black/30 hover:border-white/20'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-white">{ticket.subject}</p>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Status: <span className="font-semibold text-primary">{ticket.status}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Updated {new Date(ticket.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-surface p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Ticket Conversation</h2>

            {!selectedTicket ? (
              <p className="text-sm text-slate-400">Select a ticket to view conversation.</p>
            ) : (
              <>
                <div className="mb-4 rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="font-semibold text-white">{selectedTicket.subject}</p>
                  <p className="mt-1 text-xs text-slate-400">Status: {selectedTicket.status}</p>
                  {selectedTicket.relatedOrder?.orderNumber && (
                    <p className="mt-1 text-xs text-slate-400">
                      Order: {selectedTicket.relatedOrder.orderNumber}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div className="mb-4 flex items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={statusLoading}
                      className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                    {statusLoading && <span className="text-xs text-slate-400">Saving...</span>}
                  </div>
                )}

                <div className="mb-4 max-h-[280px] space-y-2 overflow-auto rounded-xl border border-white/10 bg-black/20 p-3">
                  {messages.map((item) => (
                    <div
                      key={item._id}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        item.isAdminReply
                          ? 'border border-primary/20 bg-primary/10 text-slate-100'
                          : 'border border-white/10 bg-black/40 text-slate-200'
                      }`}
                    >
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {item.sender?.name || 'Unknown'}{' '}
                        {item.isAdminReply
                          ? '(Support)'
                          : item.sender?.name === currentUserName
                            ? '(You)'
                            : '(User)'}
                      </p>
                      <p>{item.message}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleReply} className="space-y-3">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
                    maxLength={3000}
                    required
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                    placeholder="Write your reply"
                  />
                  <button
                    type="submit"
                    disabled={replyLoading}
                    className="w-full rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-bold text-primary"
                  >
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportCenter;
