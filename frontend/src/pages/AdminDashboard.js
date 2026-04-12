import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import inventoryService from '../services/inventoryService';
import crmService from '../services/crmService';
import erpService from '../services/erpService';
import orderService from '../services/orderService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [orders, setOrders] = useState([]);
  const [neftOrders, setNeftOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  const [adjustingEventId, setAdjustingEventId] = useState(null);
  const [adjustmentValue, setAdjustmentValue] = useState(0);

  const [crmUsers, setCrmUsers] = useState([]);
  const [crmSegment, setCrmSegment] = useState('');
  
  const [erpFinances, setErpFinances] = useState(null);
  const [erpExpenses, setErpExpenses] = useState([]);
  const [erpResources, setErpResources] = useState([]);

  const [marketingStats, setMarketingStats] = useState({
    totalSubscribers: 1248,
    conversionRate: 4.2,
    trafficSources: [
      { source: 'Facebook Ads', visits: 3420, conversions: 156 },
      { source: 'Twitter Organic', visits: 2150, conversions: 89 },
      { source: 'Email Campaigns', visits: 1800, conversions: 124 },
      { source: 'Direct', visits: 980, conversions: 42 },
      { source: 'Google Search', visits: 750, conversions: 31 },
    ],
  });

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');

      if (activeTab === 'dashboard') {
        const response = await adminService.getDashboardStats(token);
        setStats(response.stats);
      } else if (activeTab === 'users') {
        const response = await adminService.getAllUsers(token);
        setUsers(response.users);
      } else if (activeTab === 'analytics') {
        const response = await adminService.getEventsAnalytics(token);
        setAnalytics(response.analytics);
      } else if (activeTab === 'orders') {
        await fetchOrders();
      } else if (activeTab === 'neft') {
        const response = await adminService.getAllOrders({ paymentStatus: 'pending' }, token);
        const filteredOrders = response.orders.filter(order => order.paymentMethod === 'neft');
        setNeftOrders(filteredOrders);
      } else if (activeTab === 'inventory') {
        const response = await inventoryService.getInventoryOverview(token);
        setInventory(response.inventory);
      } else if (activeTab === 'crm') {
        const response = await crmService.getUsers({ segment: crmSegment });
        setCrmUsers(response.data);
      } else if (activeTab === 'erp') {
        const [financesRes, expensesRes, resourcesRes] = await Promise.all([
          erpService.getFinancesSummary(),
          erpService.getExpenses(),
          erpService.getResources(),
        ]);
        setErpFinances(financesRes.data);
        setErpExpenses(expensesRes.data);
        setErpResources(resourcesRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    const filters = {};
    if (orderStatusFilter) filters.status = orderStatusFilter;
    if (paymentStatusFilter) filters.paymentStatus = paymentStatusFilter;
    const response = await adminService.getAllOrders(filters, token);
    setOrders(response.orders);
  };

  const handleFilterOrders = async () => {
    try {
      setLoading(true);
      setError('');
      await fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      const response = await adminService.updateOrderStatus(orderId, newStatus, token);
      setSuccessMsg(response.message);
      await fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    }
  };

  const handleVerifyNeft = async (orderId, action) => {
    try {
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      const response = await orderService.verifyNeft(orderId, action, token);
      setSuccessMsg(response.message);
      setActiveTab('orders');
      await fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to verify NEFT payment');
    }
  };

  const handleAdjustInventory = async (eventId) => {
    try {
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      const response = await inventoryService.adjustInventory(eventId, adjustmentValue, token);
      setSuccessMsg(response.message);
      setAdjustingEventId(null);
      setAdjustmentValue(0);
      const invResponse = await inventoryService.getInventoryOverview(token);
      setInventory(invResponse.inventory);
    } catch (err) {
      setError(err.message || 'Failed to adjust inventory');
    }
  };

  const getStockLabel = (status) => {
    if (status === 'in_stock') return 'In Stock';
    if (status === 'low_stock') return 'Low Stock';
    if (status === 'sold_out') return 'Sold Out';
    return status;
  };

  const stockClass = (status) => {
    if (status === 'in_stock') return 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10';
    if (status === 'low_stock') return 'text-amber-300 border-amber-400/30 bg-amber-500/10';
    if (status === 'sold_out') return 'text-red-300 border-red-400/30 bg-red-500/10';
    return 'text-slate-300 border-white/20 bg-white/5';
  };

  const tabs = [
    ['dashboard', 'Dashboard'],
    ['orders', 'Orders'],
    ['neft', 'NEFT Verification'],
    ['inventory', 'Inventory'],
    ['users', 'Users'],
    ['analytics', 'Analytics'],
    ['marketing', 'Marketing'],
    ['crm', 'CRM'],
    ['erp', 'ERP'],
  ];

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white">Admin Dashboard</h1>
          <p className="mt-2 text-slate-400">Welcome, {user?.name}! Manage your events and sales.</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(([value, label]) => {
            const pendingCount = value === 'neft' 
              ? neftOrders.filter(o => o.neftVerificationStatus === 'pending').length 
              : 0;
            return (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === value
                    ? 'bg-primary text-white'
                    : 'border border-white/15 bg-surface text-slate-300 hover:border-primary/40'
                }`}
              >
                {label}
                {value === 'neft' && pendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-black">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
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

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-24 text-slate-400">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-dark border-t-primary"></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    ['Total Users', stats.totalUsers],
                    ['Total Events', stats.totalEvents],
                    ['Total Orders', stats.totalOrders],
                    ['Total Revenue', `₹${stats.totalRevenue?.toFixed(2) || '0.00'}`],
                    ['Tickets Sold', stats.ticketsSold],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-surface p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-2 text-2xl font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                    <div className="border-b border-white/10 px-5 py-4 text-lg font-bold text-white">
                      Recent Orders
                    </div>
                    <table className="min-w-full text-sm">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="px-5 py-3 text-left">Order #</th>
                          <th className="px-5 py-3 text-left">Customer</th>
                          <th className="px-5 py-3 text-left">Amount</th>
                          <th className="px-5 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!stats.recentOrders || stats.recentOrders.length === 0 ? (
                          <tr>
                            <td className="px-5 py-8 text-center text-slate-400" colSpan="4">
                              No orders yet
                            </td>
                          </tr>
                        ) : (
                          stats.recentOrders.map((order) => (
                            <tr key={order._id} className="border-t border-white/5 text-slate-200">
                              <td className="px-5 py-3">{order.orderNumber}</td>
                              <td className="px-5 py-3">{order.user?.name}</td>
                              <td className="px-5 py-3">₹{order.totalAmount.toFixed(2)}</td>
                              <td className="px-5 py-3">{order.orderStatus}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                    <div className="border-b border-white/10 px-5 py-4 text-lg font-bold text-white">
                      Top Events
                    </div>
                    <div className="p-4 flex flex-col gap-4">
                      {!stats.topEvents || stats.topEvents.length === 0 ? (
                        <p className="text-center text-slate-400 py-4">No events found</p>
                      ) : (
                        stats.topEvents.map((event) => (
                          <div key={event._id} className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                            <div>
                              <p className="font-bold text-white mb-1">{event.title}</p>
                              <p className="text-sm text-slate-400">
                                {event.ticketsSold} / {event.ticketsAvailable} tickets sold
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">₹{(event.price * event.ticketsSold).toFixed(2)}</p>
                              <p className="text-xs text-slate-500 uppercase">Revenue</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-surface p-4">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All order status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All payment status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                  <button
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                    onClick={handleFilterOrders}
                  >
                    Filter
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Order #</th>
                        <th className="px-4 py-3 text-left">Customer</th>
                        <th className="px-4 py-3 text-left">Qty</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Payment</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center text-slate-400" colSpan="8">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => (
                          <tr key={order._id} className="border-t border-white/5 text-slate-200">
                            <td className="px-4 py-3 font-semibold">{order.orderNumber}</td>
                            <td className="px-4 py-3">
                              <p>{order.user?.name}</p>
                              <p className="text-xs text-slate-400">{order.user?.email}</p>
                            </td>
                            <td className="px-4 py-3">{order.tickets?.length || 0}</td>
                            <td className="px-4 py-3 font-bold text-white">₹{order.totalAmount.toFixed(2)}</td>
                            <td className="px-4 py-3 font-bold text-white">₹{order.totalAmount.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col items-start gap-1">
                                <span className="uppercase text-xs">{order.paymentStatus}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 uppercase text-xs">{order.orderStatus}</td>
                            <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                {order.orderStatus === 'confirmed' && (
                                  <button
                                    className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300 hover:bg-red-400/10"
                                    onClick={() => handleUpdateOrderStatus(order._id, 'refunded')}
                                  >
                                    Refund
                                  </button>
                                )}
                                {(order.orderStatus === 'cancelled' ||
                                  order.orderStatus === 'refunded') && (
                                  <button
                                    className="rounded-md border border-emerald-400/30 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-400/10"
                                    onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                                  >
                                    Re-confirm
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'neft' && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-center">
                    <p className="text-2xl font-black text-amber-300">
                      {neftOrders.filter((o) => o.neftVerificationStatus === 'pending').length}
                    </p>
                    <p className="text-sm text-slate-400">Pending</p>
                  </div>
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center">
                    <p className="text-2xl font-black text-emerald-300">
                      {neftOrders.filter((o) => o.neftVerificationStatus === 'verified').length}
                    </p>
                    <p className="text-sm text-slate-400">Verified</p>
                  </div>
                  <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-center">
                    <p className="text-2xl font-black text-red-300">
                      {neftOrders.filter((o) => o.neftVerificationStatus === 'rejected').length}
                    </p>
                    <p className="text-sm text-slate-400">Rejected</p>
                  </div>
                </div>

                {neftOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                    <p>No NEFT orders found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                    <table className="min-w-full text-sm">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="px-4 py-3 text-left">Order #</th>
                          <th className="px-4 py-3 text-left">Customer</th>
                          <th className="px-4 py-3 text-left">Amount</th>
                          <th className="px-4 py-3 text-left">UTR / Reference No.</th>
                          <th className="px-4 py-3 text-left">Submitted</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {neftOrders.map((order) => (
                          <tr key={order._id} className="border-t border-white/5 text-slate-200">
                            <td className="px-4 py-3 font-semibold">{order.orderNumber}</td>
                            <td className="px-4 py-3">
                              <p>{order.user?.name}</p>
                              <p className="text-xs text-slate-400">{order.user?.email}</p>
                            </td>
                            <td className="px-4 py-3 font-bold text-white">₹{order.totalAmount.toFixed(2)}</td>
                            <td className="px-4 py-3 font-mono text-xs">{order.neftReferenceNumber}</td>
                            <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full border px-2 py-1 text-xs ${
                                order.neftVerificationStatus === 'pending' 
                                  ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                                  : order.neftVerificationStatus === 'verified'
                                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                  : 'border-red-400/30 bg-red-500/10 text-red-300'
                              }`}>
                                {order.neftVerificationStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {order.neftVerificationStatus === 'pending' && (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="rounded-md border border-emerald-400/30 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-400/10"
                                    onClick={() => handleVerifyNeft(order._id, 'verify')}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300 hover:bg-red-400/10"
                                    onClick={() => handleVerifyNeft(order._id, 'reject')}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-surface p-4 text-center">
                    <p className="text-2xl font-black text-red-300">
                      {inventory.filter((e) => e.stockStatus === 'sold_out').length}
                    </p>
                    <p className="text-sm text-slate-400">Sold Out</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4 text-center">
                    <p className="text-2xl font-black text-amber-300">
                      {inventory.filter((e) => e.stockStatus === 'low_stock').length}
                    </p>
                    <p className="text-sm text-slate-400">Low Stock</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4 text-center">
                    <p className="text-2xl font-black text-emerald-300">
                      {inventory.filter((e) => e.stockStatus === 'in_stock').length}
                    </p>
                    <p className="text-sm text-slate-400">In Stock</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Event</th>
                         <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">Price</th>
                        <th className="px-4 py-3 text-left">Available</th>
                         <th className="px-4 py-3 text-left">Sold</th>
                        <th className="px-4 py-3 text-left">Remaining</th>
                         <th className="px-4 py-3 text-left">Occupancy</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Adjust</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((event) => (
                        <tr key={event._id} className="border-t border-white/5 text-slate-200">
                          <td className="px-4 py-3">
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-xs text-slate-400">{new Date(event.eventDate).toLocaleDateString()}</p>
                          </td>
                          <td className="px-4 py-3 capitalize">{event.category}</td>
                          <td className="px-4 py-3 font-semibold text-white">₹{event.price}</td>
                           <td className="px-4 py-3">{event.ticketsAvailable}</td>
                           <td className="px-4 py-3">{event.ticketsSold}</td>
                          <td className="px-4 py-3 font-bold text-white">{event.remaining}</td>
                           <td className="px-4 py-3">{event.occupancy}%</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full border px-2 py-1 text-xs ${stockClass(event.stockStatus)}`}>
                              {getStockLabel(event.stockStatus)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {adjustingEventId === event._id ? (
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={adjustmentValue}
                                  onChange={(e) => setAdjustmentValue(parseInt(e.target.value, 10) || 0)}
                                  className="w-24 rounded-md border border-white/10 bg-black/40 px-2 py-1 outline-none focus:border-primary"
                                />
                                <button
                                  className="rounded-md bg-primary px-2 py-1 text-xs font-semibold hover:bg-primary/90"
                                  onClick={() => handleAdjustInventory(event._id)}
                                >
                                  Save
                                </button>
                                <button
                                  className="rounded-md border border-white/20 px-2 py-1 text-xs hover:border-white/40"
                                  onClick={() => {
                                    setAdjustingEventId(null);
                                    setAdjustmentValue(0);
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary transition-colors"
                                onClick={() => setAdjustingEventId(event._id)}
                              >
                                Adjust
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                <table className="min-w-full text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-t border-white/5 text-slate-200">
                        <td className="px-4 py-3 font-semibold">{u.name}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                           <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${u.isAdmin ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/10 text-slate-300'}`}>
                              {u.isAdmin ? 'Admin' : 'User'}
                           </span>
                        </td>
                        <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                <table className="min-w-full text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Event</th>
                      <th className="px-4 py-3 text-left">Price (₹)</th>
                      <th className="px-4 py-3 text-left">Sold / Available</th>
                      <th className="px-4 py-3 text-left">Occupancy</th>
                      <th className="px-4 py-3 text-left">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((event) => (
                      <tr key={event.id} className="border-t border-white/5 text-slate-200">
                        <td className="px-4 py-3 font-semibold">{event.title}</td>
                        <td className="px-4 py-3">₹{event.price}</td>
                        <td className="px-4 py-3">
                          {event.ticketsSold} / {event.ticketsAvailable}
                        </td>
                        <td className="px-4 py-3">
                           <div className="flex items-center gap-2">
                             <div className="w-24 h-2 bg-black/40 rounded-full overflow-hidden">
                               <div className="h-full bg-primary" style={{width: `${event.occupancy}%`}}></div>
                             </div>
                             <span>{event.occupancy}%</span>
                           </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-white">
                          ₹{event.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'marketing' && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-surface p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-2xl text-primary">group</span>
                      <p className="text-sm text-slate-400">Total Subscribers</p>
                    </div>
                    <p className="text-3xl font-black text-white">{marketingStats.totalSubscribers.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-2xl text-emerald-400">trending_up</span>
                      <p className="text-sm text-slate-400">Conversion Rate</p>
                    </div>
                    <p className="text-3xl font-black text-emerald-400">{marketingStats.conversionRate}%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-2xl text-amber-400">campaign</span>
                      <p className="text-sm text-slate-400">Active Campaigns</p>
                    </div>
                    <p className="text-3xl font-black text-amber-400">3</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Traffic by Source</h3>
                  <div className="space-y-4">
                    {marketingStats.trafficSources.map((source, index) => {
                      const maxVisits = Math.max(...marketingStats.trafficSources.map(s => s.visits));
                      const percentage = (source.visits / maxVisits) * 100;
                      return (
                        <div key={source.source} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-white">{source.source}</span>
                            <span className="text-slate-400">{source.visits.toLocaleString()} visits · {source.conversions} conversions</span>
                          </div>
                          <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-surface p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Top Performing Campaigns</h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Summer Event Pass', conversions: 156, revenue: '₹45,200' },
                        { name: 'Black Friday Early Bird', conversions: 124, revenue: '₹38,500' },
                        { name: 'Email Retargeting', conversions: 89, revenue: '₹22,100' },
                      ].map((campaign, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-black/40 border border-white/5">
                          <div>
                            <p className="font-medium text-white">{campaign.name}</p>
                            <p className="text-xs text-slate-400">{campaign.conversions} conversions</p>
                          </div>
                          <p className="font-bold text-emerald-400">{campaign.revenue}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-surface p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Newsletter Activity</h3>
                    <div className="space-y-3">
                      {[
                        { date: 'Today', newSubs: 24, unsubs: 2 },
                        { date: 'Yesterday', newSubs: 31, unsubs: 1 },
                        { date: '2 days ago', newSubs: 18, unsubs: 3 },
                        { date: '3 days ago', newSubs: 45, unsubs: 5 },
                      ].map((day, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-black/40 border border-white/5">
                          <span className="text-sm text-slate-300">{day.date}</span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-emerald-400">+{day.newSubs} new</span>
                            <span className="text-red-400">-{day.unsubs}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'crm' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-surface p-4">
                  <select
                    value={crmSegment}
                    onChange={(e) => setCrmSegment(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All Users</option>
                    <option value="vip">VIP (&gt;$500 spent)</option>
                    <option value="new_users">New Users (30 days)</option>
                    <option value="inactive">Inactive (90 days)</option>
                  </select>
                  <button
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                    onClick={async () => {
                      const token = localStorage.getItem('token');
                      const response = await crmService.getUsers({ segment: crmSegment });
                      setCrmUsers(response.data);
                    }}
                  >
                    Filter
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">Total Spent</th>
                        <th className="px-4 py-3 text-left">Loyalty Points</th>
                        <th className="px-4 py-3 text-left">Preferences</th>
                        <th className="px-4 py-3 text-left">Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crmUsers.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center text-slate-400" colSpan="6">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        crmUsers.map((u) => (
                          <tr key={u._id} className="border-t border-white/5 text-slate-200">
                            <td className="px-4 py-3 font-semibold">{u.name}</td>
                            <td className="px-4 py-3">{u.email}</td>
                            <td className="px-4 py-3 font-bold text-emerald-300">₹{u.totalSpent?.toFixed(2) || '0.00'}</td>
                            <td className="px-4 py-3 font-bold text-amber-300">{u.loyaltyPoints || 0}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {u.preferences?.slice(0, 3).map((pref, i) => (
                                  <span key={i} className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                                    {pref}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'erp' && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total Revenue</p>
                    <p className="mt-2 text-2xl font-black text-emerald-300">₹{erpFinances?.revenue?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total Expenses</p>
                    <p className="mt-2 text-2xl font-black text-red-300">₹{erpFinances?.expenses?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Net Profit</p>
                    <p className="mt-2 text-2xl font-black text-white">₹{erpFinances?.profit?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Profit Margin</p>
                    <p className="mt-2 text-2xl font-black text-primary">{erpFinances?.profitMargin || '0'}%</p>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                    <div className="border-b border-white/10 px-5 py-4 text-lg font-bold text-white">
                      Resources
                    </div>
                    <div className="p-4">
                      {erpResources.length === 0 ? (
                        <p className="text-center text-slate-400 py-4">No resources found</p>
                      ) : (
                        erpResources.map((resource) => (
                          <div key={resource._id} className="mb-3 flex items-center justify-between rounded-lg border border-white/5 bg-black/40 p-3">
                            <div>
                              <p className="font-semibold text-white">{resource.name}</p>
                              <p className="text-xs text-slate-400 capitalize">{resource.type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-300">{resource.availableCapacity} / {resource.totalCapacity} {resource.unit}</p>
                              <p className="text-xs text-slate-500">Available</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                    <div className="border-b border-white/10 px-5 py-4 text-lg font-bold text-white">
                      Recent Expenses
                    </div>
                    <div className="p-4">
                      {erpExpenses.length === 0 ? (
                        <p className="text-center text-slate-400 py-4">No expenses found</p>
                      ) : (
                        erpExpenses.slice(0, 5).map((expense) => (
                          <div key={expense._id} className="mb-3 flex items-center justify-between rounded-lg border border-white/5 bg-black/40 p-3">
                            <div>
                              <p className="font-semibold text-white">{expense.description}</p>
                              <p className="text-xs text-slate-400 capitalize">{expense.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-red-300">₹{expense.amount.toFixed(2)}</p>
                              <p className="text-xs text-slate-500">{expense.status}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
