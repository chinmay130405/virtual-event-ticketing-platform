import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import organizerService from '../services/organizerService';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isOrganizer } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [events, setEvents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    grossSales: 0,
    commissionDeducted: 0,
    netEarnings: 0,
    pendingPayout: 0,
    paidOut: 0,
  });
  const [payouts, setPayouts] = useState([]);

  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isOrganizer) {
      navigate('/');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        const [eventsRes, earningsRes, payoutsRes] = await Promise.all([
          organizerService.getEvents(token),
          organizerService.getEarnings(token),
          organizerService.getPayouts(token),
        ]);

        setEvents(eventsRes.events || []);
        setOrders(earningsRes.orders || []);
        setSummary(earningsRes.summary || {});
        setPayouts(payoutsRes.payouts || []);
      } catch (err) {
        setError(err.message || 'Failed to load organizer dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, isOrganizer, navigate]);

  const pendingOrderIds = useMemo(() => {
    return orders.filter((o) => o.payoutStatus === 'pending').map((o) => o._id);
  }, [orders]);

  const handleBankChange = (event) => {
    const { name, value } = event.target;
    setBankDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveBankDetails = async (event) => {
    event.preventDefault();

    try {
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      await organizerService.updateBankDetails(bankDetails, token);
      setSuccessMsg('Bank details updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update bank details');
    }
  };

  const handleRequestPayout = async () => {
    if (!pendingOrderIds.length) {
      return;
    }

    try {
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      await organizerService.requestPayout(pendingOrderIds, 'bank_transfer', token);
      setSuccessMsg('Payout request submitted successfully');

      const [earningsRes, payoutsRes] = await Promise.all([
        organizerService.getEarnings(token),
        organizerService.getPayouts(token),
      ]);
      setOrders(earningsRes.orders || []);
      setSummary(earningsRes.summary || {});
      setPayouts(payoutsRes.payouts || []);
    } catch (err) {
      setError(err.message || 'Failed to request payout');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center px-5 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-dark border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-[1200px] space-y-8">
        <div>
          <h1 className="text-4xl font-black text-white">Organizer Dashboard</h1>
          <p className="mt-2 text-slate-400">
            Manage your events, track earnings, and request payouts.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMsg}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Gross Sales</p>
            <p className="mt-2 text-2xl font-black text-white">Rs {summary.grossSales || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Commission</p>
            <p className="mt-2 text-2xl font-black text-rose-300">Rs {summary.commissionDeducted || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Net Earnings</p>
            <p className="mt-2 text-2xl font-black text-emerald-300">Rs {summary.netEarnings || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Pending Payout</p>
            <p className="mt-2 text-2xl font-black text-amber-300">Rs {summary.pendingPayout || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Paid Out</p>
            <p className="mt-2 text-2xl font-black text-primary">Rs {summary.paidOut || 0}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">My Events</h2>
              <span className="text-xs uppercase tracking-wider text-slate-400">
                {events.length} total
              </span>
            </div>

            {events.length === 0 ? (
              <p className="text-sm text-slate-400">No events yet. Create your first event from Events page.</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                  >
                    <p className="font-semibold text-white">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(event.eventDate).toLocaleDateString()} | Rs {event.price}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Payouts</h2>
              <button
                onClick={handleRequestPayout}
                disabled={!pendingOrderIds.length}
                className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                Request Payout
              </button>
            </div>

            {payouts.length === 0 ? (
              <p className="text-sm text-slate-400">No payout records yet.</p>
            ) : (
              <div className="space-y-3">
                {payouts.slice(0, 8).map((payout) => (
                  <div
                    key={payout._id}
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-white">{payout.orderNumber}</p>
                      <span className="text-xs uppercase tracking-wider text-slate-400">
                        {payout.payoutStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Rs {payout.organizerPayoutAmount} | {payout.payoutMethod}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-5">
          <h2 className="mb-4 text-xl font-bold text-white">Payout Bank Details</h2>

          <form onSubmit={handleSaveBankDetails} className="grid gap-4 md:grid-cols-2">
            <input
              name="accountHolderName"
              value={bankDetails.accountHolderName}
              onChange={handleBankChange}
              placeholder="Account holder name"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              required
            />
            <input
              name="bankName"
              value={bankDetails.bankName}
              onChange={handleBankChange}
              placeholder="Bank name"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              required
            />
            <input
              name="accountNumber"
              value={bankDetails.accountNumber}
              onChange={handleBankChange}
              placeholder="Account number"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              required
            />
            <input
              name="ifscCode"
              value={bankDetails.ifscCode}
              onChange={handleBankChange}
              placeholder="IFSC code"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 uppercase text-white"
              required
            />

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white"
              >
                Save Bank Details
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
