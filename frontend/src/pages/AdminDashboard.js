import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import inventoryService from '../services/inventoryService';
import crmService from '../services/crmService';
import erpService from '../services/erpService';
import scmService from '../services/scmService';
import marketingService from '../services/marketingService';
import orderService from '../services/orderService';
import supportService from '../services/supportService';

const EVENT_BANNER_FALLBACK =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
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
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const [crmInterestFilter, setCrmInterestFilter] = useState('');
  const [crmInsights, setCrmInsights] = useState(null);
  const [scmInsights, setScmInsights] = useState(null);
  const [scmCategoryFilter, setScmCategoryFilter] = useState('');
  const [scmStatusFilter, setScmStatusFilter] = useState('');
  const [scmDateFilter, setScmDateFilter] = useState('');
  
  const [erpFinances, setErpFinances] = useState(null);
  const [erpInsights, setErpInsights] = useState(null);
  const [marketingInsights, setMarketingInsights] = useState(null);

  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedSupportTicketId, setSelectedSupportTicketId] = useState('');
  const [selectedSupportTicket, setSelectedSupportTicket] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportReply, setSupportReply] = useState('');
  const [supportReplyLoading, setSupportReplyLoading] = useState(false);
  const [supportStatusLoading, setSupportStatusLoading] = useState(false);
  const [supportPriorityLoading, setSupportPriorityLoading] = useState(false);
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [pendingEventSubmissions, setPendingEventSubmissions] = useState([]);
  const [recentPaymentVerifications, setRecentPaymentVerifications] = useState([]);
  const [verifyReason, setVerifyReason] = useState('');
  const [eventVerifyNotes, setEventVerifyNotes] = useState({});
  const [payoutReference, setPayoutReference] = useState('');

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
        setAnalyticsSummary(response.summary || null);
      } else if (activeTab === 'orders') {
        await fetchOrders();
      } else if (activeTab === 'neft') {
        const response = await adminService.getAllOrders({ paymentStatus: 'pending' }, token);
        const filteredOrders = response.orders.filter(order => order.paymentMethod === 'neft');
        setNeftOrders(filteredOrders);
      } else if (activeTab === 'events') {
        const response = await inventoryService.getInventoryOverview(token);
        setInventory(response.inventory);
      } else if (activeTab === 'support') {
        const response = await supportService.getTickets(token);
        const tickets = response.tickets || [];
        setSupportTickets(tickets);

        if (tickets.length > 0) {
          const ticketIdToLoad = selectedSupportTicketId || tickets[0]._id;
          const ticketResponse = await supportService.getTicketById(ticketIdToLoad, token);
          setSelectedSupportTicketId(ticketIdToLoad);
          setSelectedSupportTicket(ticketResponse.ticket);
          setSupportMessages(ticketResponse.messages || []);
        } else {
          setSelectedSupportTicketId('');
          setSelectedSupportTicket(null);
          setSupportMessages([]);
        }
      } else if (activeTab === 'organizers') {
        const [organizerResponse, eventResponse, paymentResponse] = await Promise.all([
          adminService.getPendingOrganizers(token),
          adminService.getPendingEventSubmissions(token),
          adminService.getRecentPaymentVerifications(token),
        ]);
        setPendingOrganizers(organizerResponse.organizers || []);
        setPendingEventSubmissions(eventResponse.events || []);
        setRecentPaymentVerifications(paymentResponse.payments || []);
      } else if (activeTab === 'crm') {
        const [usersResponse, insightsResponse] = await Promise.all([
          crmService.getUsers({ segment: crmSegment, limit: 200 }),
          crmService.getInsights(),
        ]);
        setCrmUsers(usersResponse.data);
        setCrmInsights(insightsResponse.data || null);
      } else if (activeTab === 'scm') {
        const response = await scmService.getInsights();
        setScmInsights(response.data || null);
      } else if (activeTab === 'erp') {
        const [financesRes, insightsRes] = await Promise.all([
          erpService.getFinancesSummary(),
          erpService.getInsights(),
        ]);
        setErpFinances(financesRes.data);
        setErpInsights(insightsRes.data || null);
      } else if (activeTab === 'marketing') {
        const response = await marketingService.getInsights();
        setMarketingInsights(response.data || null);
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

  const handleFinalizePayout = async (orderId, action) => {
    try {
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      const response = await orderService.finalizeOrganizerPayout(
        orderId,
        action,
        payoutReference,
        token
      );
      setSuccessMsg(response.message);
      setPayoutReference('');
      await fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to finalize payout');
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

  const loadSupportTicketDetails = async (ticketId, token) => {
    const response = await supportService.getTicketById(ticketId, token);
    setSelectedSupportTicketId(ticketId);
    setSelectedSupportTicket(response.ticket);
    setSupportMessages(response.messages || []);
  };

  const handleSelectSupportTicket = async (ticketId) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      await loadSupportTicketDetails(ticketId, token);
    } catch (err) {
      setError(err.message || 'Failed to load support ticket');
    }
  };

  const handleAdminSupportReply = async (e) => {
    e.preventDefault();
    if (!selectedSupportTicketId || !supportReply.trim()) {
      return;
    }

    try {
      setSupportReplyLoading(true);
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      await supportService.replyToTicket(selectedSupportTicketId, supportReply.trim(), token);
      setSupportReply('');
      setSuccessMsg('Reply sent successfully.');
      await loadSupportTicketDetails(selectedSupportTicketId, token);
    } catch (err) {
      setError(err.message || 'Failed to send support reply');
    } finally {
      setSupportReplyLoading(false);
    }
  };

  const handleAdminSupportStatusChange = async (status) => {
    if (!selectedSupportTicketId) {
      return;
    }

    try {
      setSupportStatusLoading(true);
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      await supportService.updateTicketStatus(selectedSupportTicketId, status, token);
      setSuccessMsg('Ticket status updated.');
      await fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to update support ticket status');
    } finally {
      setSupportStatusLoading(false);
    }
  };

  const handleAdminSupportPriorityChange = async (priority) => {
    if (!selectedSupportTicketId) {
      return;
    }

    try {
      setSupportPriorityLoading(true);
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      await supportService.updateTicketPriority(selectedSupportTicketId, priority, token);
      setSuccessMsg('Issue priority updated.');
      await fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to update issue priority');
    } finally {
      setSupportPriorityLoading(false);
    }
  };

  const handleVerifyOrganizer = async (organizerId, action) => {
    try {
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      const response = await adminService.verifyOrganizer(
        organizerId,
        action,
        verifyReason,
        token
      );
      setSuccessMsg(response.message);
      setVerifyReason('');
      const refreshed = await adminService.getPendingOrganizers(token);
      setPendingOrganizers(refreshed.organizers || []);
      const refreshedEvents = await adminService.getPendingEventSubmissions(token);
      setPendingEventSubmissions(refreshedEvents.events || []);
    } catch (err) {
      setError(err.message || 'Failed to verify organizer');
    }
  };

  const handleEventVerifyNoteChange = (eventId, value) => {
    setEventVerifyNotes((prev) => ({
      ...prev,
      [eventId]: value,
    }));
  };

  const handleVerifyEventSubmission = async (eventId, approvalStatus) => {
    try {
      setError('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      const note = (eventVerifyNotes[eventId] || '').trim();
      const response = await adminService.verifyEventSubmission(
        eventId,
        approvalStatus,
        note,
        token
      );
      setSuccessMsg(response.message);
      setEventVerifyNotes((prev) => {
        const updated = { ...prev };
        delete updated[eventId];
        return updated;
      });
      const refreshed = await adminService.getPendingEventSubmissions(token);
      setPendingEventSubmissions(refreshed.events || []);
    } catch (err) {
      setError(err.message || 'Failed to verify event submission');
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

  const formatCurrency = (value, options = {}) => {
    const { compact = true } = options;
    const amount = Number(value || 0);

    if (compact && Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakh`;
    }

    return `₹${amount.toFixed(2)}`;
  };

  const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

  const getScmStatusLabel = (status) => {
    if (status === 'sold_out') return 'Sold Out';
    if (status === 'ongoing') return 'Ongoing';
    return 'Upcoming';
  };

  const analyticsPieData = useMemo(() => {
    const palette = ['#e9208f', '#38bdf8', '#34d399', '#f59e0b', '#a78bfa', '#f97316'];
    const topData = (analyticsSummary?.topPerforming || []).map((item, index) => ({
      label: item.title,
      revenue: Number(item.revenue || 0),
      color: palette[index % palette.length],
    }));

    const othersRevenue = Number(analyticsSummary?.others?.revenue || 0);
    if (othersRevenue > 0) {
      topData.push({
        label: `Others (${analyticsSummary?.others?.eventsCount || 0})`,
        revenue: othersRevenue,
        color: '#64748b',
      });
    }

    return topData;
  }, [analyticsSummary]);

  const analyticsPieTotal = useMemo(
    () => analyticsPieData.reduce((sum, item) => sum + item.revenue, 0),
    [analyticsPieData]
  );

  const analyticsPieGradient = useMemo(() => {
    if (!analyticsPieTotal) {
      return 'conic-gradient(#334155 0deg 360deg)';
    }

    let cumulative = 0;
    const slices = analyticsPieData.map((item) => {
      const start = cumulative;
      const slice = (item.revenue / analyticsPieTotal) * 360;
      cumulative += slice;
      return `${item.color} ${start.toFixed(2)}deg ${cumulative.toFixed(2)}deg`;
    });

    return `conic-gradient(${slices.join(', ')})`;
  }, [analyticsPieData, analyticsPieTotal]);

  const analyticsBarMaxTickets = useMemo(
    () => Math.max(...(analyticsSummary?.topPerforming || []).map((item) => item.ticketsSold || 0), 1),
    [analyticsSummary]
  );

  const scmEvents = useMemo(() => scmInsights?.events || [], [scmInsights]);

  const scmCategories = useMemo(
    () => Array.from(new Set(scmEvents.map((event) => event.category).filter(Boolean))),
    [scmEvents]
  );

  const scmFilteredEvents = useMemo(() => {
    return scmEvents
      .filter((event) => (scmCategoryFilter ? event.category === scmCategoryFilter : true))
      .filter((event) => (scmStatusFilter ? event.status === scmStatusFilter : true))
      .filter((event) => {
        if (!scmDateFilter) {
          return true;
        }
        const eventDate = event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 10) : '';
        return eventDate === scmDateFilter;
      })
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
  }, [scmEvents, scmCategoryFilter, scmStatusFilter, scmDateFilter]);

  const scmLowInventoryEvents = useMemo(
    () => scmFilteredEvents.filter((event) => event.lowInventory),
    [scmFilteredEvents]
  );

  const scmTicketChartData = useMemo(
    () => [...scmFilteredEvents].sort((a, b) => b.sold - a.sold).slice(0, 10),
    [scmFilteredEvents]
  );

  const scmTicketChartMax = useMemo(
    () => Math.max(...scmTicketChartData.map((event) => event.sold || 0), 1),
    [scmTicketChartData]
  );

  const crmInterestOptions = useMemo(
    () =>
      Array.from(
        new Set((crmUsers || []).flatMap((user) => user.preferences || []).filter(Boolean))
      ),
    [crmUsers]
  );

  const crmFilteredUsers = useMemo(() => {
    return (crmUsers || [])
      .filter((user) => {
        if (!crmSearchQuery) {
          return true;
        }
        const query = crmSearchQuery.toLowerCase();
        return (
          String(user.name || '').toLowerCase().includes(query) ||
          String(user.email || '').toLowerCase().includes(query)
        );
      })
      .filter((user) => {
        if (!crmInterestFilter) {
          return true;
        }
        return (user.preferences || []).includes(crmInterestFilter);
      });
  }, [crmUsers, crmSearchQuery, crmInterestFilter]);

  const crmSignupTrend = useMemo(() => {
    const fallback = [
      { period: 'Nov', signups: 18 },
      { period: 'Dec', signups: 24 },
      { period: 'Jan', signups: 31 },
      { period: 'Feb', signups: 27 },
      { period: 'Mar', signups: 35 },
      { period: 'Apr', signups: 42 },
    ];
    const trend = crmInsights?.retentionTrend || [];
    return trend.length > 0 ? trend : fallback;
  }, [crmInsights]);

  const crmInterests = useMemo(() => {
    const source = crmInsights?.topPreferences || [];
    if (source.length > 0) {
      return source;
    }
    return [
      { label: 'AI', count: 34 },
      { label: 'Web Dev', count: 29 },
      { label: 'Cloud', count: 22 },
      { label: 'Data', count: 18 },
      { label: 'Security', count: 15 },
    ];
  }, [crmInsights]);

  const crmInterestsPieGradient = useMemo(() => {
    const palette = ['#e9208f', '#38bdf8', '#34d399', '#f59e0b', '#a78bfa', '#f43f5e'];
    const total = crmInterests.reduce((sum, item) => sum + Number(item.count || 0), 0);
    if (!total) {
      return 'conic-gradient(#334155 0deg 360deg)';
    }

    let cumulative = 0;
    const slices = crmInterests.map((item, index) => {
      const start = cumulative;
      const angle = (Number(item.count || 0) / total) * 360;
      cumulative += angle;
      return `${palette[index % palette.length]} ${start.toFixed(2)}deg ${cumulative.toFixed(2)}deg`;
    });

    return `conic-gradient(${slices.join(', ')})`;
  }, [crmInterests]);

  const crmRecentBookings = useMemo(() => crmInsights?.recentBookings || [], [crmInsights]);
  const crmRecentRegistrations = useMemo(
    () => crmInsights?.recentlyRegisteredUsers || [],
    [crmInsights]
  );

  const scmNearDateHighInventoryEvents = useMemo(() => {
    const now = new Date();
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(now.getDate() + 15);

    return (scmInsights?.events || [])
      .filter((event) => {
        if (!event.eventDate) {
          return false;
        }
        const eventDate = new Date(event.eventDate);
        return eventDate >= now && eventDate <= fifteenDaysFromNow;
      })
      .filter((event) => Number(event.inventoryLeftPercent || 0) >= 60)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
  }, [scmInsights]);

  const erpRevenueTrend = useMemo(() => {
    const trend = (erpInsights?.cashFlowTrend || [])
      .map((item) => ({
        period: item.period,
        revenue: Number(item.grossSales || item.platformRevenue || 0),
      }))
      .filter((item) => item.period);

    if (trend.length > 0) {
      return trend;
    }

    return [
      { period: 'Nov', revenue: 145000 },
      { period: 'Dec', revenue: 176500 },
      { period: 'Jan', revenue: 164300 },
      { period: 'Feb', revenue: 189000 },
      { period: 'Mar', revenue: 211700 },
      { period: 'Apr', revenue: 236400 },
    ];
  }, [erpInsights]);

  const erpRevenueChartMax = useMemo(
    () => Math.max(...erpRevenueTrend.map((item) => item.revenue || 0), 1),
    [erpRevenueTrend]
  );

  const erpKpis = useMemo(() => {
    const summary = erpInsights?.kpis || {};
    const fallbackRevenue = Number(erpFinances?.grossSales || 0);
    const fallbackTransactions = Number(erpFinances?.totalOrders || 0);

    return {
      totalRevenue: Number(summary.totalRevenue || fallbackRevenue || 236400),
      totalTransactions: Number(summary.totalTransactions || fallbackTransactions || 318),
      refundsProcessed: Number(summary.refundsProcessed || 14),
      averageTicketPrice: Number(
        summary.avgTicketPrice ||
          erpInsights?.unitEconomics?.avgOrderValue ||
          (fallbackTransactions > 0 ? fallbackRevenue / fallbackTransactions : 743)
      ),
    };
  }, [erpFinances, erpInsights]);

  const erpEventPerformanceRows = useMemo(() => {
    const liveRows = (erpInsights?.eventPerformance || []).map((event) => ({
      eventName: event.eventName,
      ticketsSold: Number(event.ticketsSold || 0),
      revenueGenerated: Number(event.revenueGenerated || 0),
      profit: Number(event.profit || 0),
    }));

    if (liveRows.length > 0) {
      return liveRows;
    }

    return [
      {
        eventName: 'AI Product Summit 2026',
        ticketsSold: 126,
        revenueGenerated: 182700,
        profit: 54810,
      },
      {
        eventName: 'Cloud Engineering Bootcamp',
        ticketsSold: 94,
        revenueGenerated: 129250,
        profit: 38775,
      },
      {
        eventName: 'Data Science Live Workshop',
        ticketsSold: 88,
        revenueGenerated: 112640,
        profit: 33792,
      },
      {
        eventName: 'Cybersecurity Awareness Forum',
        ticketsSold: 67,
        revenueGenerated: 93800,
        profit: 28140,
      },
    ];
  }, [erpInsights]);

  const erpTransactionsRows = useMemo(() => {
    const liveRows = (erpInsights?.transactions || []).map((transaction) => ({
      transactionId: transaction.transactionId,
      user: transaction.user,
      event: transaction.event,
      amount: Number(transaction.amount || 0),
      paymentStatus: transaction.paymentStatus || 'pending',
      date: transaction.date,
    }));

    if (liveRows.length > 0) {
      return liveRows;
    }

    return [
      {
        transactionId: 'TRX-MOCK-1001',
        user: 'Aarav Sharma',
        event: 'AI Product Summit 2026',
        amount: 3499,
        paymentStatus: 'completed',
        date: new Date().toISOString(),
      },
      {
        transactionId: 'TRX-MOCK-1002',
        user: 'Meera Patel',
        event: 'Cloud Engineering Bootcamp',
        amount: 2799,
        paymentStatus: 'completed',
        date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        transactionId: 'TRX-MOCK-1003',
        user: 'Rohan Gupta',
        event: 'Data Science Live Workshop',
        amount: 3199,
        paymentStatus: 'pending',
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        transactionId: 'TRX-MOCK-1004',
        user: 'Nisha Verma',
        event: 'Cybersecurity Awareness Forum',
        amount: 2499,
        paymentStatus: 'failed',
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ];
  }, [erpInsights]);

  const marketingKpis = useMemo(() => {
    const kpis = marketingInsights?.kpis || {};

    return {
      activeCampaigns: Number(kpis.activeCampaigns || kpis.totalCampaigns || 4),
      totalConversions: Number(kpis.totalConversions || 895),
      couponUsage: Number(kpis.couponUsage || 117),
      referralSignups: Number(kpis.referralSignups || 312),
    };
  }, [marketingInsights]);

  const marketingCampaignRows = useMemo(() => {
    const rows = (marketingInsights?.campaignTable || []).map((campaign) => ({
      campaignName: campaign.campaignName,
      type: campaign.type,
      targetAudience: Number(campaign.targetAudience || 0),
      status: String(campaign.status || 'draft').toLowerCase(),
      conversions: Number(campaign.conversions || 0),
    }));

    if (rows.length > 0) {
      return rows;
    }

    return [
      {
        campaignName: 'Summer Tech Upskill Drive',
        type: 'Email',
        targetAudience: 4200,
        status: 'active',
        conversions: 328,
      },
      {
        campaignName: 'Weekend Workshop Reminder',
        type: 'Notification',
        targetAudience: 3500,
        status: 'scheduled',
        conversions: 242,
      },
      {
        campaignName: 'Referral Booster Sprint',
        type: 'Email',
        targetAudience: 2100,
        status: 'active',
        conversions: 186,
      },
      {
        campaignName: 'Abandoned Checkout Nudges',
        type: 'Notification',
        targetAudience: 1700,
        status: 'completed',
        conversions: 139,
      },
    ];
  }, [marketingInsights]);

  const marketingCoupons = useMemo(() => {
    const rows = (marketingInsights?.activeCoupons || []).map((coupon) => ({
      couponCode: coupon.couponCode,
      discountPercent: Number(coupon.discountPercent || 0),
      usageCount: Number(coupon.usageCount || 0),
      expiryDate: coupon.expiryDate,
      isActive: Boolean(coupon.isActive),
    }));

    if (rows.length > 0) {
      return rows;
    }

    return [
      { couponCode: 'NEON20', discountPercent: 20, usageCount: 24, expiryDate: '2026-12-31', isActive: true },
      { couponCode: 'KING20', discountPercent: 20, usageCount: 19, expiryDate: '2026-11-30', isActive: true },
      { couponCode: 'APDH20', discountPercent: 20, usageCount: 16, expiryDate: '2026-10-31', isActive: true },
      { couponCode: 'THUG10', discountPercent: 10, usageCount: 13, expiryDate: '2026-09-30', isActive: true },
    ];
  }, [marketingInsights]);

  const marketingConversionTrend = useMemo(() => {
    const rows = (marketingInsights?.conversionRateTrend || []).map((item) => ({
      period: item.period,
      conversionRate: Number(item.conversionRate || 0),
    }));

    if (rows.length > 0) {
      return rows;
    }

    return [
      { period: 'Nov', conversionRate: 2.8 },
      { period: 'Dec', conversionRate: 3.1 },
      { period: 'Jan', conversionRate: 3.4 },
      { period: 'Feb', conversionRate: 3.2 },
      { period: 'Mar', conversionRate: 3.7 },
      { period: 'Apr', conversionRate: 4.1 },
    ];
  }, [marketingInsights]);

  const marketingConversionMax = useMemo(
    () => Math.max(...marketingConversionTrend.map((item) => item.conversionRate || 0), 1),
    [marketingConversionTrend]
  );

  const marketingTrafficBreakdown = useMemo(() => {
    const rows = (marketingInsights?.trafficSourceBreakdown || []).map((item) => ({
      source: item.source,
      value: Number(item.value || 0),
    }));

    if (rows.length > 0) {
      return rows;
    }

    return [
      { source: 'Direct', value: 420 },
      { source: 'Referral', value: 295 },
      { source: 'Social', value: 510 },
    ];
  }, [marketingInsights]);

  const marketingTrafficTotal = useMemo(
    () => marketingTrafficBreakdown.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [marketingTrafficBreakdown]
  );

  const marketingSocialAds = useMemo(() => {
    const rows = (marketingInsights?.socialAdsPerformance || []).map((ad) => ({
      platform: ad.platform,
      spend: Number(ad.spend || 0),
      crowdReached: Number(ad.crowdReached || 0),
      clicks: Number(ad.clicks || 0),
      leads: Number(ad.leads || 0),
      conversions: Number(ad.conversions || 0),
      cac: Number(ad.cac || 0),
      cpc: Number(ad.cpc || 0),
      leadToConversionRate: Number(ad.leadToConversionRate || 0),
    }));

    if (rows.length > 0) {
      return rows;
    }

    return [
      {
        platform: 'Instagram Ads',
        spend: 125000,
        crowdReached: 198000,
        clicks: 7420,
        leads: 1430,
        conversions: 312,
        cac: 400.64,
        cpc: 16.85,
        leadToConversionRate: 21.82,
      },
      {
        platform: 'YouTube Ads',
        spend: 168000,
        crowdReached: 265000,
        clicks: 6880,
        leads: 1645,
        conversions: 358,
        cac: 469.27,
        cpc: 24.42,
        leadToConversionRate: 21.76,
      },
      {
        platform: 'LinkedIn Ads',
        spend: 98000,
        crowdReached: 121000,
        clicks: 4125,
        leads: 990,
        conversions: 225,
        cac: 435.56,
        cpc: 23.76,
        leadToConversionRate: 22.73,
      },
    ];
  }, [marketingInsights]);

  const marketingSocialPosts = useMemo(() => {
    const rows = (marketingInsights?.socialPosts || []).map((post) => ({
      platform: post.platform,
      type: post.type,
      title: post.title,
      caption: post.caption,
      postUrl: post.postUrl,
      crowdReached: Number(post.crowdReached || 0),
      conversions: Number(post.conversions || 0),
    }));

    if (rows.length > 0) {
      return rows;
    }

    return [
      {
        platform: 'Instagram',
        type: 'Reel',
        title: 'Code Faster with AI: Live Weekend Sprint',
        caption: 'Join 2-day hands-on sprint with real projects and mentor feedback. Limited seats.',
        postUrl: 'https://www.instagram.com/p/C9ReactSprint/',
        crowdReached: 86200,
        conversions: 146,
      },
      {
        platform: 'YouTube',
        type: 'Video Ad',
        title: 'From Developer to Architect in 90 Days',
        caption: 'Watch full curriculum breakdown and enrollment bonus details.',
        postUrl: 'https://www.youtube.com/watch?v=mockArchitectTrack01',
        crowdReached: 143500,
        conversions: 201,
      },
      {
        platform: 'LinkedIn',
        type: 'Sponsored Post',
        title: 'Engineering Leaders: Team Upskilling Blueprint',
        caption: 'High-impact upskilling strategy for product and platform teams.',
        postUrl: 'https://www.linkedin.com/feed/update/urn:li:activity:mockEnterpriseSkill01/',
        crowdReached: 61200,
        conversions: 104,
      },
    ];
  }, [marketingInsights]);

  const marketingUnitEconomics = useMemo(() => {
    const economics = marketingInsights?.marketingUnitEconomics || {};

    return {
      totalAdSpend: Number(economics.totalAdSpend || 391000),
      costPerAcquisition: Number(economics.costPerAcquisition || 436.38),
      costPerLead: Number(economics.costPerLead || 96.23),
      costPerClick: Number(economics.costPerClick || 20.98),
      leadToCustomerRate: Number(economics.leadToCustomerRate || 22.03),
    };
  }, [marketingInsights]);

  const tabs = [
    ['dashboard', 'Dashboard'],
    ['events', 'Events'],
    ['orders', 'Orders'],
    ['neft', 'NEFT Verification'],
    ['support', 'Support'],
    ['users', 'Users'],
    ['analytics', 'Analytics'],
    ['organizers', 'Organizer Verification'],
    ['crm', 'CRM'],
    ['scm', 'SCM'],
    ['erp', 'ERP'],
    ['marketing', 'Marketing'],
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                  {[
                    ['Total Users', stats.totalUsers],
                    ['Total Events', stats.totalEvents],
                    ['Total Orders', stats.totalOrders],
                    ['Revenue', formatCurrency(stats.totalRevenue)],
                    [
                      `Profit (${Math.round((stats.platformProfitRate || 0.3) * 100)}%)`,
                      formatCurrency(stats.totalProfit),
                    ],
                    ['Tickets Sold', stats.ticketsSold],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-surface p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-2 text-2xl font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Sales & Profit (Last 7 Days)</h2>
                    {!stats.salesTrend || stats.salesTrend.length === 0 ? (
                      <p className="text-sm text-slate-400">No sales trend data yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {stats.salesTrend.map((item) => {
                          const maxRevenue = Math.max(
                            ...stats.salesTrend.map((trendItem) => trendItem.revenue || 0),
                            1
                          );
                          const revenueWidth = Math.max(((item.revenue || 0) / maxRevenue) * 100, 2);
                          const profitWidth = Math.max(
                            (((item.profit || 0) / maxRevenue) * 100),
                            item.profit > 0 ? 1 : 0
                          );

                          return (
                            <div key={item.key} className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span className="font-semibold text-slate-200">{item.day}</span>
                                <span>
                                  {formatCurrency(item.revenue)} revenue · {formatCurrency(item.profit)} profit
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-black/40">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${revenueWidth}%` }}></div>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-black/40">
                                <div className="h-full rounded-full bg-emerald-400/90" style={{ width: `${profitWidth}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Top Performers vs Others</h2>
                    {!stats.eventPerformance?.topPerformers?.length ? (
                      <p className="text-sm text-slate-400">No event performance data available.</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.eventPerformance.topPerformers.map((event) => {
                          const maxTopRevenue = Math.max(
                            ...stats.eventPerformance.topPerformers.map((item) => item.revenue || 0),
                            1
                          );
                          const width = Math.max(((event.revenue || 0) / maxTopRevenue) * 100, 8);
                          return (
                            <div key={event._id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                              <div className="mb-1 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-white line-clamp-1">{event.title}</p>
                                <p className="text-xs font-bold text-primary">{formatCurrency(event.revenue)}</p>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-black/40">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }}></div>
                              </div>
                              <p className="mt-1 text-xs text-slate-400">
                                {event.ticketsSold} sold · {event.occupancy}% occupancy · Profit {formatCurrency(event.profit)}
                              </p>
                            </div>
                          );
                        })}

                        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                          Others ({stats.eventPerformance.othersSummary?.eventsCount || 0} events):
                          {' '}
                          {formatCurrency(stats.eventPerformance.othersSummary?.revenue)} revenue ·
                          {' '}
                          {stats.eventPerformance.othersSummary?.ticketsSold || 0} tickets ·
                          {' '}
                          {formatCurrency(stats.eventPerformance.othersSummary?.profit)} profit
                        </div>
                      </div>
                    )}
                  </div>
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
                              <p className="font-bold text-primary">{formatCurrency(event.revenue)}</p>
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
                                {order.payoutStatus === 'processing' && (
                                  <>
                                    <input
                                      type="text"
                                      value={payoutReference}
                                      onChange={(e) => setPayoutReference(e.target.value)}
                                      placeholder="Payout ref"
                                      className="w-28 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                                    />
                                    <button
                                      className="rounded-md border border-emerald-400/30 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-400/10"
                                      onClick={() => handleFinalizePayout(order._id, 'mark_paid')}
                                    >
                                      Mark Paid
                                    </button>
                                    <button
                                      className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300 hover:bg-red-400/10"
                                      onClick={() => handleFinalizePayout(order._id, 'mark_failed')}
                                    >
                                      Mark Failed
                                    </button>
                                  </>
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

            {activeTab === 'events' && (
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

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {inventory.map((event) => (
                    <div key={event._id} className="rounded-2xl border border-white/10 bg-surface p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-white">{event.title}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(event.eventDate).toLocaleDateString()} · {event.category}
                          </p>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-xs ${stockClass(event.stockStatus)}`}>
                          {getStockLabel(event.stockStatus)}
                        </span>
                      </div>

                      <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                          <p className="text-xs text-slate-400">Price</p>
                          <p className="font-semibold text-white">₹{event.price}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                          <p className="text-xs text-slate-400">Occupancy</p>
                          <p className="font-semibold text-white">{event.occupancy}%</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                          <p className="text-xs text-slate-400">Available</p>
                          <p className="font-semibold text-white">{event.ticketsAvailable}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                          <p className="text-xs text-slate-400">Sold</p>
                          <p className="font-semibold text-white">{event.ticketsSold}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                          <p className="text-xs text-slate-400">Reserved</p>
                          <p className="font-semibold text-amber-300">{event.ticketsReserved || 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-slate-300">
                          Remaining: <span className="font-bold text-white">{event.remaining}</span>
                        </p>
                        {adjustingEventId === event._id ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={adjustmentValue}
                              onChange={(e) => setAdjustmentValue(parseInt(e.target.value, 10) || 0)}
                              className="w-20 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-sm outline-none focus:border-primary"
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
                              X
                            </button>
                          </div>
                        ) : (
                          <button
                            className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                            onClick={() => setAdjustingEventId(event._id)}
                          >
                            Adjust Stock
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-surface p-5">
                  <h2 className="mb-4 text-xl font-bold text-white">All Reported Issues</h2>

                  {supportTickets.length === 0 ? (
                    <p className="text-sm text-slate-400">No issues available.</p>
                  ) : (
                    <div className="space-y-3">
                      {supportTickets.map((ticket) => (
                        <button
                          key={ticket._id}
                          onClick={() => handleSelectSupportTicket(ticket._id)}
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            selectedSupportTicketId === ticket._id
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
                            User: {ticket.user?.name || 'Unknown'}
                          </p>
                          {ticket.relatedOrder?.orderNumber && (
                            <p className="text-xs text-slate-500">
                              Ref: {ticket.relatedOrder.orderNumber} • {Array.from(new Set((ticket.relatedOrder.tickets || []).map((t) => t.eventTitle).filter(Boolean))).join(', ') || 'Event/Course'}
                            </p>
                          )}
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

                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-surface p-5">
                  <h2 className="mb-4 text-xl font-bold text-white">Issue Conversation</h2>

                  {!selectedSupportTicket ? (
                    <p className="text-sm text-slate-400">Select an issue to view conversation.</p>
                  ) : (
                    <>
                      <div className="mb-4 rounded-xl border border-white/10 bg-black/30 p-3">
                        <p className="font-semibold text-white">{selectedSupportTicket.subject}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          User: {selectedSupportTicket.user?.name || 'Unknown'} ({selectedSupportTicket.user?.email || 'N/A'})
                        </p>
                        <p className="mt-1 text-xs text-slate-400">Status: {selectedSupportTicket.status}</p>
                        <p className="mt-1 text-xs text-slate-400">Priority: {selectedSupportTicket.priority}</p>
                        {selectedSupportTicket.relatedOrder?.orderNumber && (
                          <p className="mt-1 text-xs text-slate-400">
                            Related: {selectedSupportTicket.relatedOrder.orderNumber} • {Array.from(new Set((selectedSupportTicket.relatedOrder.tickets || []).map((t) => t.eventTitle).filter(Boolean))).join(', ') || 'Event/Course'}
                          </p>
                        )}
                      </div>

                      <div className="mb-4 flex items-center gap-2">
                        <select
                          value={selectedSupportTicket.status}
                          onChange={(e) => handleAdminSupportStatusChange(e.target.value)}
                          disabled={supportStatusLoading}
                          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="closed">Closed</option>
                        </select>
                        <select
                          value={selectedSupportTicket.priority || 'medium'}
                          onChange={(e) => handleAdminSupportPriorityChange(e.target.value)}
                          disabled={supportPriorityLoading}
                          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                        {(supportStatusLoading || supportPriorityLoading) && (
                          <span className="text-xs text-slate-400">Saving...</span>
                        )}
                      </div>

                      <div className="mb-4 max-h-[320px] space-y-2 overflow-auto rounded-xl border border-white/10 bg-black/20 p-3">
                        {supportMessages.map((item) => (
                          <div
                            key={item._id}
                            className={`rounded-lg px-3 py-2 text-sm ${
                              item.isAdminReply
                                ? 'border border-primary/20 bg-primary/10 text-slate-100'
                                : 'border border-white/10 bg-black/40 text-slate-200'
                            }`}
                          >
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {item.sender?.name || 'Unknown'} {item.isAdminReply ? '(Support)' : '(User)'}
                            </p>
                            <p>{item.message}</p>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleAdminSupportReply} className="space-y-3">
                        <textarea
                          value={supportReply}
                          onChange={(e) => setSupportReply(e.target.value)}
                          rows={3}
                          maxLength={3000}
                          required
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                          placeholder="Write your support reply"
                        />
                        <button
                          type="submit"
                          disabled={supportReplyLoading}
                          className="w-full rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-bold text-primary"
                        >
                          {supportReplyLoading ? 'Sending...' : 'Send Reply'}
                        </button>
                      </form>
                    </>
                  )}
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
                           <span
                             className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                               (u.role || 'user') === 'admin'
                                 ? 'bg-primary/20 text-primary border border-primary/30'
                                 : 'bg-white/10 text-slate-300'
                             }`}
                           >
                               {u.role || 'user'}
                           </span>
                        </td>
                        <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'organizers' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-surface p-5">
                  <h2 className="mb-4 text-lg font-bold text-white">Pending Organizer Accounts</h2>
                  {pendingOrganizers.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-center text-slate-400">
                      No pending organizer verifications.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingOrganizers.map((organizer) => (
                        <div
                          key={organizer._id}
                          className="rounded-2xl border border-white/10 bg-black/20 p-5"
                        >
                          <div className="mb-4 grid gap-2 md:grid-cols-2">
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-400">Name:</span> {organizer.name}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-400">Email:</span> {organizer.email}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-400">Company:</span>{' '}
                              {organizer.companyName || '-'}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-400">GST:</span> {organizer.gstNumber || '-'}
                            </p>
                            <p className="text-sm text-slate-300 md:col-span-2">
                              <span className="text-slate-400">Address:</span>{' '}
                              {organizer.businessAddress || '-'}
                            </p>
                            <p className="text-sm text-slate-300 md:col-span-2">
                              <span className="text-slate-400">Venue Registration:</span>{' '}
                              {organizer.venueRegistration || '-'}
                            </p>
                          </div>

                          <textarea
                            value={verifyReason}
                            onChange={(e) => setVerifyReason(e.target.value)}
                            rows={2}
                            className="mb-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                            placeholder="Optional reason for approval/rejection"
                          />

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleVerifyOrganizer(organizer._id, 'approve')}
                              className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyOrganizer(organizer._id, 'reject')}
                              className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-300"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface p-5">
                  <h2 className="mb-4 text-lg font-bold text-white">Recently Verified Payments</h2>
                  {recentPaymentVerifications.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-center text-slate-400">
                      No recently verified/rejected payments.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
                      <table className="min-w-full text-sm">
                        <thead className="text-slate-400">
                          <tr>
                            <th className="px-4 py-3 text-left">Order #</th>
                            <th className="px-4 py-3 text-left">User</th>
                            <th className="px-4 py-3 text-left">Event/Course</th>
                            <th className="px-4 py-3 text-left">Amount</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPaymentVerifications.map((payment) => (
                            <tr key={payment._id} className="border-t border-white/5 text-slate-200">
                              <td className="px-4 py-3 font-semibold">{payment.orderNumber}</td>
                              <td className="px-4 py-3">
                                <p>{payment.user?.name || 'Unknown'}</p>
                                <p className="text-xs text-slate-400">{payment.user?.email || 'N/A'}</p>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-300">
                                {Array.from(new Set((payment.tickets || []).map((ticket) => ticket.eventTitle).filter(Boolean))).join(', ') || '-'}
                              </td>
                              <td className="px-4 py-3 font-bold text-white">{formatCurrency(payment.totalAmount)}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full border px-2 py-1 text-xs uppercase ${
                                  payment.neftVerificationStatus === 'verified'
                                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                    : 'border-red-400/30 bg-red-500/10 text-red-300'
                                }`}>
                                  {payment.neftVerificationStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400">
                                {new Date(payment.updatedAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface p-5">
                  <h2 className="mb-4 text-lg font-bold text-white">Pending Client Event Submissions</h2>
                  {pendingEventSubmissions.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-center text-slate-400">
                      No pending client event submissions.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingEventSubmissions.map((eventItem) => (
                        <div
                          key={eventItem._id}
                          className="rounded-2xl border border-white/10 bg-black/20 p-5"
                        >
                          <div className="mb-4 grid gap-4 md:grid-cols-[220px_1fr]">
                            <img
                              src={eventItem.bannerImage || EVENT_BANNER_FALLBACK}
                              alt={eventItem.title}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = EVENT_BANNER_FALLBACK;
                              }}
                              className="h-36 w-full rounded-xl border border-white/10 object-cover"
                            />
                            <div>
                              <p className="text-lg font-bold text-white">{eventItem.title}</p>
                              <p className="mt-1 text-sm text-slate-400">{eventItem.description}</p>
                              <div className="mt-3 grid gap-1 text-xs text-slate-300 md:grid-cols-2">
                                <p>
                                  <span className="text-slate-400">Submitted By:</span>{' '}
                                  {eventItem.createdBy?.name || 'Client'} ({eventItem.createdBy?.email || '-'})
                                </p>
                                <p>
                                  <span className="text-slate-400">Category:</span> {eventItem.category}
                                </p>
                                <p>
                                  <span className="text-slate-400">Mode:</span> {eventItem.eventMode}
                                </p>
                                <p>
                                  <span className="text-slate-400">Price:</span> ₹{eventItem.price}
                                </p>
                                <p>
                                  <span className="text-slate-400">Seats:</span>{' '}
                                  {eventItem.ticketsAvailable}
                                </p>
                                <p>
                                  <span className="text-slate-400">Date:</span>{' '}
                                  {new Date(eventItem.eventDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          <textarea
                            value={eventVerifyNotes[eventItem._id] || ''}
                            onChange={(e) => handleEventVerifyNoteChange(eventItem._id, e.target.value)}
                            rows={2}
                            className="mb-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                            placeholder="Optional note for client (approval/rejection reason)"
                          />

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleVerifyEventSubmission(eventItem._id, 'approved')}
                              className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300"
                            >
                              Approve & Publish
                            </button>
                            <button
                              onClick={() => handleVerifyEventSubmission(eventItem._id, 'rejected')}
                              className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-300"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Revenue Mix (Pie Chart)</h2>
                    {analyticsPieTotal <= 0 ? (
                      <p className="text-sm text-slate-400">No revenue data for pie chart yet.</p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
                        <div className="mx-auto h-44 w-44 rounded-full border border-white/10 p-3">
                          <div
                            className="h-full w-full rounded-full"
                            style={{ background: analyticsPieGradient }}
                            aria-label="Revenue mix pie chart"
                          ></div>
                        </div>

                        <div className="space-y-2">
                          {analyticsPieData.map((slice) => {
                            const share = analyticsPieTotal > 0 ? (slice.revenue * 100) / analyticsPieTotal : 0;
                            return (
                              <div key={slice.label} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-slate-200">
                                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }}></span>
                                    <span className="line-clamp-1">{slice.label}</span>
                                  </div>
                                  <span className="font-semibold text-primary">{share.toFixed(1)}%</span>
                                </div>
                                <p className="mt-1 text-slate-400">{formatCurrency(slice.revenue)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Top Event Sales (Bar Chart)</h2>
                    {!analyticsSummary?.topPerforming?.length ? (
                      <p className="text-sm text-slate-400">No event data for bar chart yet.</p>
                    ) : (
                      <div className="flex h-52 items-end gap-3 overflow-x-auto pb-2">
                        {analyticsSummary.topPerforming.map((event) => {
                          const height = Math.max(((event.ticketsSold || 0) * 100) / analyticsBarMaxTickets, 10);
                          return (
                            <div key={event.id} className="min-w-[92px] flex-1">
                              <div className="mb-2 text-center text-[11px] font-bold text-primary">{event.ticketsSold}</div>
                              <div className="h-40 rounded-lg border border-white/10 bg-black/40 p-1">
                                <div
                                  className="w-full rounded-md bg-gradient-to-t from-primary/80 to-fuchsia-300/80"
                                  style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                                ></div>
                              </div>
                              <p className="mt-2 line-clamp-2 text-center text-[11px] text-slate-300">{event.title}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Top Performing Events</h2>
                    {!analyticsSummary?.topPerforming?.length ? (
                      <p className="text-sm text-slate-400">No analytics data to visualize.</p>
                    ) : (
                      <div className="space-y-3">
                        {analyticsSummary.topPerforming.map((event) => {
                          const maxRevenue = Math.max(
                            ...analyticsSummary.topPerforming.map((item) => item.revenue || 0),
                            1
                          );
                          const width = Math.max(((event.revenue || 0) / maxRevenue) * 100, 8);
                          return (
                            <div key={event.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-white line-clamp-1">{event.title}</p>
                                <p className="text-xs font-bold text-primary">{formatCurrency(event.revenue)}</p>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }}></div>
                              </div>
                              <p className="mt-1 text-xs text-slate-400">
                                {event.ticketsSold} sold · {event.occupancy}% occupancy · Profit {formatCurrency(event.profit)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Others + Category Snapshot</h2>
                    <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                      Others ({analyticsSummary?.others?.eventsCount || 0} events):
                      {' '}
                      {formatCurrency(analyticsSummary?.others?.revenue)} revenue ·
                      {' '}
                      {analyticsSummary?.others?.ticketsSold || 0} tickets ·
                      {' '}
                      {formatCurrency(analyticsSummary?.others?.profit)} profit
                    </div>

                    <div className="space-y-2">
                      {(analyticsSummary?.categoryPerformance || []).map((category) => {
                        const maxCategoryRevenue = Math.max(
                          ...(analyticsSummary?.categoryPerformance || []).map((item) => item.revenue || 0),
                          1
                        );
                        const width = Math.max(((category.revenue || 0) / maxCategoryRevenue) * 100, 8);
                        return (
                          <div key={category.category} className="rounded-lg border border-white/10 bg-black/30 p-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white">{category.category}</span>
                              <span className="text-primary">{formatCurrency(category.revenue)}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
                              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${width}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Commission Revenue</p>
                    <p className="mt-2 text-2xl font-black text-primary">
                      {formatCurrency(analyticsSummary?.profitBreakdown?.commissionRevenue)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">User Platform Fee Revenue</p>
                    <p className="mt-2 text-2xl font-black text-emerald-300">
                      {formatCurrency(analyticsSummary?.profitBreakdown?.userFeeRevenue)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Fee Rate {formatPercent((analyticsSummary?.profitBreakdown?.userPlatformFeeRate || 0) * 100)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total Platform Profit</p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {formatCurrency(analyticsSummary?.profitBreakdown?.totalPlatformProfit)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface p-5">
                  <h2 className="mb-4 text-lg font-bold text-white">Coupon Usage Snapshot</h2>
                  {(analyticsSummary?.couponUsage || []).length === 0 ? (
                    <p className="text-sm text-slate-400">No coupon usage yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {(analyticsSummary?.couponUsage || []).map((coupon) => {
                        const maxOrders = Math.max(
                          ...(analyticsSummary?.couponUsage || []).map((item) => item.orders || 0),
                          1
                        );
                        const width = Math.max(((coupon.orders || 0) / maxOrders) * 100, 8);
                        return (
                          <div key={`${coupon.couponCode}-snapshot`}>
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                              <span className="font-semibold text-primary">{coupon.couponCode}</span>
                              <span>
                                {coupon.orders} orders · {coupon.usersCount} users
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-black/40">
                              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${width}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <div className="border-b border-white/10 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Coupon Usage Analytics</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Unique users per coupon and owner affiliation across completed purchases.
                    </p>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Coupon</th>
                        <th className="px-4 py-3 text-left">Owner / Affiliation</th>
                        <th className="px-4 py-3 text-left">Users</th>
                        <th className="px-4 py-3 text-left">Orders</th>
                        <th className="px-4 py-3 text-left">Total Discount</th>
                        <th className="px-4 py-3 text-left">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analyticsSummary?.couponUsage || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                            No coupon usage yet.
                          </td>
                        </tr>
                      ) : (
                        (analyticsSummary?.couponUsage || []).map((coupon) => (
                          <tr
                            key={`${coupon.couponCode}-${coupon.couponOwner}`}
                            className="border-t border-white/5 text-slate-200"
                          >
                            <td className="px-4 py-3 font-semibold text-primary">{coupon.couponCode}</td>
                            <td className="px-4 py-3">{coupon.couponOwner}</td>
                            <td className="px-4 py-3">{coupon.usersCount}</td>
                            <td className="px-4 py-3">{coupon.orders}</td>
                            <td className="px-4 py-3">{formatCurrency(coupon.totalDiscount)}</td>
                            <td className="px-4 py-3">{formatCurrency(coupon.totalRevenue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Event</th>
                        <th className="px-4 py-3 text-left">Price (₹)</th>
                        <th className="px-4 py-3 text-left">Sold / Available</th>
                        <th className="px-4 py-3 text-left">Occupancy</th>
                        <th className="px-4 py-3 text-left">Revenue</th>
                        <th className="px-4 py-3 text-left">Profit (30%)</th>
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
                                <div className="h-full bg-primary" style={{ width: `${event.occupancy}%` }}></div>
                              </div>
                              <span>{event.occupancy}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            ₹{event.revenue.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-300">
                            ₹{(event.profit || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'crm' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total Users</p>
                    <p className="mt-2 text-2xl font-black text-white">{crmInsights?.kpis?.totalUsers || 0}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Active Users (Last 30 Days)</p>
                    <p className="mt-2 text-2xl font-black text-emerald-300">{crmInsights?.kpis?.activeUsers || 0}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Repeat Customers</p>
                    <p className="mt-2 text-2xl font-black text-white">{crmInsights?.kpis?.repeatCustomers || 0}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total Bookings</p>
                    <p className="mt-2 text-2xl font-black text-primary">{crmInsights?.kpis?.totalBookings || 0}</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">User Signups (Past 6 Months) — Bar Graph</h2>
                    <div className="flex h-44 items-end gap-2">
                      {crmSignupTrend.map((item) => {
                        const maxSignups = Math.max(
                          ...crmSignupTrend.map((trend) => trend.signups || 0),
                          1
                        );
                        const height = Math.max(((item.signups || 0) / maxSignups) * 100, 8);
                        return (
                          <div key={item.period} className="flex-1">
                            <p className="mb-1 text-center text-[11px] font-semibold text-primary">{item.signups}</p>
                            <div className="h-36 rounded-md border border-white/10 bg-black/30 p-1">
                              <div
                                className="w-full rounded bg-emerald-400/80"
                                style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                              ></div>
                            </div>
                            <p className="mt-2 text-center text-[11px] text-slate-300">{item.period}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">User Interests (Pie Chart)</h2>
                    <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-center">
                      <div className="mx-auto h-40 w-40 rounded-full border border-white/10 p-3">
                        <div
                          className="h-full w-full rounded-full"
                          style={{ background: crmInterestsPieGradient }}
                          aria-label="CRM interests pie chart"
                        ></div>
                      </div>
                      <div className="space-y-2">
                        {crmInterests.map((interest) => (
                          <div
                            key={interest.label}
                            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs"
                          >
                            <span className="text-slate-200">{interest.label}</span>
                            <span className="font-semibold text-primary">{interest.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-surface p-4">
                  <input
                    type="text"
                    value={crmSearchQuery}
                    onChange={(e) => setCrmSearchQuery(e.target.value)}
                    placeholder="Search user by name or email"
                    className="min-w-[240px] flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  />

                  <select
                    value={crmInterestFilter}
                    onChange={(e) => setCrmInterestFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All Interests</option>
                    {crmInterestOptions.map((interest) => (
                      <option key={interest} value={interest}>{interest}</option>
                    ))}
                  </select>

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
                      const response = await crmService.getUsers({ segment: crmSegment, limit: 200 });
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
                        <th className="px-4 py-3 text-left">User Name</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">Events Attended</th>
                        <th className="px-4 py-3 text-left">Last Active</th>
                        <th className="px-4 py-3 text-left">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crmFilteredUsers.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center text-slate-400" colSpan="5">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        crmFilteredUsers.map((u) => (
                          <tr key={u._id} className="border-t border-white/5 text-slate-200">
                            <td className="px-4 py-3 font-semibold">{u.name}</td>
                            <td className="px-4 py-3">{u.email}</td>
                            <td className="px-4 py-3">{u.eventsAttended || 0}</td>
                            <td className="px-4 py-3 text-slate-400">
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-300">{formatCurrency(u.totalSpent)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Recent Booking Activity</h2>
                    <div className="space-y-2">
                      {crmRecentBookings.length === 0 ? (
                        <p className="text-sm text-slate-400">No booking activity available.</p>
                      ) : (
                        crmRecentBookings.map((booking) => (
                          <div key={booking.orderNumber} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                            <p className="text-sm font-semibold text-white">{booking.userName}</p>
                            <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                              {booking.events?.join(', ') || 'Event Booking'}
                            </p>
                            <p className="mt-1 text-[11px] text-primary">
                              {booking.orderNumber} · {formatCurrency(booking.totalAmount)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Recently Registered Users</h2>
                    <div className="space-y-2">
                      {crmRecentRegistrations.length === 0 ? (
                        <p className="text-sm text-slate-400">No registration feed available.</p>
                      ) : (
                        crmRecentRegistrations.map((userItem, idx) => (
                          <div key={`${userItem.email}-${idx}`} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                            <p className="text-sm font-semibold text-white">{userItem.name}</p>
                            <p className="mt-1 text-xs text-slate-400">{userItem.email}</p>
                            <p className="mt-1 text-[11px] text-emerald-300">
                              Joined {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : '-'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scm' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total Events</p>
                    <p className="mt-2 text-2xl font-black text-white">{scmInsights?.kpis?.totalEvents || 0}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total Tickets Available</p>
                    <p className="mt-2 text-2xl font-black text-slate-100">{scmInsights?.kpis?.totalTicketsAvailable || 0}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Tickets Sold</p>
                    <p className="mt-2 text-2xl font-black text-emerald-300">{scmInsights?.kpis?.ticketsSold || 0}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Sold-Out Events</p>
                    <p className="mt-2 text-2xl font-black text-amber-300">{scmInsights?.kpis?.soldOutEvents || 0}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface p-5">
                  <h2 className="mb-4 text-lg font-bold text-white">Event Inventory Filters</h2>
                  <div className="grid gap-3 md:grid-cols-3">
                    <select
                      value={scmCategoryFilter}
                      onChange={(e) => setScmCategoryFilter(e.target.value)}
                      className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                    >
                      <option value="">All Categories</option>
                      {scmCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={scmDateFilter}
                      onChange={(e) => setScmDateFilter(e.target.value)}
                      className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                    />

                    <select
                      value={scmStatusFilter}
                      onChange={(e) => setScmStatusFilter(e.target.value)}
                      className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                    >
                      <option value="">All Statuses</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="sold_out">Sold Out</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Ticket Insights Chart (Sold per Event)</h2>
                    {scmTicketChartData.length === 0 ? (
                      <p className="text-sm text-slate-400">No events available for chart.</p>
                    ) : (
                      <div className="space-y-3">
                        {scmTicketChartData.map((event) => {
                          const width = Math.max(((event.sold || 0) / scmTicketChartMax) * 100, 6);
                        return (
                          <div key={event.id}>
                            <div className="mb-1 flex justify-between text-xs text-slate-300 gap-2">
                              <span className="line-clamp-1">{event.title}</span>
                              <span>{event.sold} sold</span>
                            </div>
                            <div className="h-2 rounded-full bg-black/40">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }}></div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Real-time Low Inventory Indicators (Below 40% Left)</h2>
                    <div className="space-y-2">
                      {scmLowInventoryEvents.length === 0 ? (
                        <p className="text-sm text-slate-400">No low inventory events right now.</p>
                      ) : (
                        scmLowInventoryEvents.map((event) => (
                          <div key={event.id} className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                            <p className="text-sm font-semibold text-white line-clamp-1">{event.title}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Remaining {event.remaining} / {event.ticketsAvailable} ({formatPercent(event.inventoryLeftPercent)} left)
                            </p>
                            <div className="mt-2 h-1.5 rounded-full bg-black/40">
                              <div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.max(event.inventoryLeftPercent, 3)}%` }}></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <div className="border-b border-white/10 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Event Ticket Inventory</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Status-aware live inventory view with sold-out and low-stock event highlighting.
                    </p>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Event Name</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Venue</th>
                        <th className="px-4 py-3 text-left">Total Tickets</th>
                        <th className="px-4 py-3 text-left">Sold Tickets</th>
                        <th className="px-4 py-3 text-left">Remaining Tickets</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scmFilteredEvents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                            No events match current filters.
                          </td>
                        </tr>
                      ) : (
                        scmFilteredEvents.map((event) => (
                          <tr
                            key={event.id}
                            className={`border-t border-white/5 text-slate-200 ${
                              event.lowInventory ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <td className="px-4 py-3 font-semibold">
                              <div className="flex items-center gap-2">
                                <span>{event.title}</span>
                                {event.lowInventory && (
                                  <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                                    Low Inventory
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3">{event.location || 'Online'}</td>
                            <td className="px-4 py-3">{event.ticketsAvailable}</td>
                            <td className="px-4 py-3 text-emerald-300 font-semibold">{event.sold}</td>
                            <td className="px-4 py-3">{event.remaining}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${
                                  event.status === 'sold_out'
                                    ? 'border-red-400/30 bg-red-500/10 text-red-300'
                                    : event.status === 'ongoing'
                                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                      : 'border-sky-400/30 bg-sky-500/10 text-sky-300'
                                }`}
                              >
                                {getScmStatusLabel(event.status)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <div className="border-b border-white/10 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Events Near Date with High Tickets Left</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Upcoming in next 15 days and still 60%+ inventory available.
                    </p>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Event Name</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Venue</th>
                        <th className="px-4 py-3 text-left">Remaining Tickets</th>
                        <th className="px-4 py-3 text-left">Inventory Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scmNearDateHighInventoryEvents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                            No near-date events with high remaining inventory.
                          </td>
                        </tr>
                      ) : (
                        scmNearDateHighInventoryEvents.map((event) => (
                          <tr key={`near-date-${event.id}`} className="border-t border-white/5 text-slate-200">
                            <td className="px-4 py-3 font-semibold">{event.title}</td>
                            <td className="px-4 py-3">{new Date(event.eventDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3">{event.location || 'Online'}</td>
                            <td className="px-4 py-3">{event.remaining}</td>
                            <td className="px-4 py-3 text-amber-300">{formatPercent(event.inventoryLeftPercent)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'erp' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total Revenue</p>
                    <p className="mt-2 text-2xl font-black text-emerald-300">{formatCurrency(erpKpis.totalRevenue)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total Transactions</p>
                    <p className="mt-2 text-2xl font-black text-white">{erpKpis.totalTransactions}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Refunds Processed</p>
                    <p className="mt-2 text-2xl font-black text-amber-300">{erpKpis.refundsProcessed}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Average Ticket Price</p>
                    <p className="mt-2 text-2xl font-black text-primary">{formatCurrency(erpKpis.averageTicketPrice)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface p-5">
                  <h2 className="mb-2 text-lg font-bold text-white">Revenue Over Time (Bar Chart)</h2>
                  <p className="mb-4 text-xs text-slate-400">Monthly revenue trend with live data and mock fallback.</p>
                  <div className="flex h-56 items-end gap-2 overflow-x-auto pb-2">
                    {erpRevenueTrend.map((item) => {
                      const height = Math.max(((item.revenue || 0) * 100) / erpRevenueChartMax, 10);
                      return (
                        <div key={`erp-revenue-${item.period}`} className="min-w-[84px] flex-1">
                          <p className="mb-1 text-center text-[11px] font-semibold text-emerald-300">
                            {formatCurrency(item.revenue)}
                          </p>
                          <div className="h-40 rounded-lg border border-white/10 bg-black/40 p-1">
                            <div
                              className="w-full rounded-md bg-gradient-to-t from-emerald-500/80 to-emerald-300/80"
                              style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                            ></div>
                          </div>
                          <p className="mt-2 text-center text-[11px] text-slate-300">{item.period}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <div className="border-b border-white/10 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Event Performance</h2>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Event Name</th>
                        <th className="px-4 py-3 text-left">Tickets Sold</th>
                        <th className="px-4 py-3 text-left">Revenue Generated</th>
                        <th className="px-4 py-3 text-left">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {erpEventPerformanceRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                            No event performance data available.
                          </td>
                        </tr>
                      ) : (
                        erpEventPerformanceRows.map((event, index) => (
                          <tr key={`${event.eventName}-${index}`} className="border-t border-white/5 text-slate-200">
                            <td className="px-4 py-3 font-semibold text-white">{event.eventName}</td>
                            <td className="px-4 py-3">{event.ticketsSold}</td>
                            <td className="px-4 py-3 font-semibold text-emerald-300">{formatCurrency(event.revenueGenerated)}</td>
                            <td className="px-4 py-3">{formatCurrency(event.profit)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <div className="border-b border-white/10 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Transactions</h2>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Transaction ID</th>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-left">Event</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Payment Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {erpTransactionsRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                            No transactions available.
                          </td>
                        </tr>
                      ) : (
                        erpTransactionsRows.map((transaction) => (
                          <tr key={transaction.transactionId} className="border-t border-white/5 text-slate-200">
                            <td className="px-4 py-3 font-semibold text-primary">{transaction.transactionId}</td>
                            <td className="px-4 py-3">{transaction.user}</td>
                            <td className="px-4 py-3 text-slate-300">{transaction.event}</td>
                            <td className="px-4 py-3 font-semibold text-white">{formatCurrency(transaction.amount)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${
                                  transaction.paymentStatus === 'completed'
                                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                    : transaction.paymentStatus === 'failed'
                                      ? 'border-red-400/30 bg-red-500/10 text-red-300'
                                      : 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                                }`}
                              >
                                {transaction.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {transaction.date ? new Date(transaction.date).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'marketing' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Active Campaigns</p>
                    <p className="mt-2 text-2xl font-black text-white">{marketingKpis.activeCampaigns}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total Conversions</p>
                    <p className="mt-2 text-2xl font-black text-emerald-300">{marketingKpis.totalConversions}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Coupon Usage</p>
                    <p className="mt-2 text-2xl font-black text-white">{marketingKpis.couponUsage}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Referral Signups</p>
                    <p className="mt-2 text-2xl font-black text-primary">{marketingKpis.referralSignups}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Total Ad Spend</p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {formatCurrency(marketingUnitEconomics.totalAdSpend, { compact: false })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Cost Per Acquisition (CAC)</p>
                    <p className="mt-2 text-2xl font-black text-amber-300">
                      {formatCurrency(marketingUnitEconomics.costPerAcquisition, { compact: false })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Cost Per Lead (CPL)</p>
                    <p className="mt-2 text-2xl font-black text-sky-300">
                      {formatCurrency(marketingUnitEconomics.costPerLead, { compact: false })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Cost Per Click (CPC)</p>
                    <p className="mt-2 text-2xl font-black text-emerald-300">
                      {formatCurrency(marketingUnitEconomics.costPerClick, { compact: false })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Lead to Customer</p>
                    <p className="mt-2 text-2xl font-black text-primary">
                      {formatPercent(marketingUnitEconomics.leadToCustomerRate)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Conversion Rate Trend</h2>
                    <div className="flex h-52 items-end gap-3 overflow-x-auto pb-2">
                      {marketingConversionTrend.map((item) => {
                        const height = Math.max(
                          ((item.conversionRate || 0) * 100) / marketingConversionMax,
                          10
                        );
                        return (
                          <div key={`conversion-${item.period}`} className="min-w-[84px] flex-1">
                            <p className="mb-1 text-center text-[11px] font-semibold text-primary">
                              {item.conversionRate.toFixed(1)}%
                            </p>
                            <div className="h-36 rounded-lg border border-white/10 bg-black/40 p-1">
                              <div
                                className="w-full rounded-md bg-gradient-to-t from-primary/80 to-fuchsia-300/80"
                                style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                              ></div>
                            </div>
                            <p className="mt-2 text-center text-[11px] text-slate-300">{item.period}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-surface p-5">
                    <h2 className="mb-4 text-lg font-bold text-white">Traffic Source Breakdown</h2>
                    <div className="space-y-3">
                      {marketingTrafficBreakdown.map((source) => {
                        const percent = marketingTrafficTotal > 0
                          ? (Number(source.value || 0) * 100) / marketingTrafficTotal
                          : 0;
                        return (
                          <div key={source.source} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                            <div className="mb-1 flex justify-between text-xs text-slate-300">
                              <span>{source.source}</span>
                              <span className="text-primary">{percent.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-black/40">
                              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(percent, 8)}%` }}></div>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">{source.value} sessions</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <div className="border-b border-white/10 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Instagram, YouTube & LinkedIn Ads Performance</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Business view of spend, crowd reached, conversions generated, and channel-level CAC.
                    </p>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Platform</th>
                        <th className="px-4 py-3 text-left">Spend</th>
                        <th className="px-4 py-3 text-left">Crowd Reached</th>
                        <th className="px-4 py-3 text-left">Leads</th>
                        <th className="px-4 py-3 text-left">Conversions</th>
                        <th className="px-4 py-3 text-left">CAC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketingSocialAds.map((ad) => (
                        <tr key={ad.platform} className="border-t border-white/5 text-slate-200">
                          <td className="px-4 py-3 font-semibold text-white">{ad.platform}</td>
                          <td className="px-4 py-3">{formatCurrency(ad.spend, { compact: false })}</td>
                          <td className="px-4 py-3">{ad.crowdReached.toLocaleString()}</td>
                          <td className="px-4 py-3">{ad.leads.toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-300">{ad.conversions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-amber-300">{formatCurrency(ad.cac, { compact: false })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface p-5">
                  <h2 className="mb-4 text-lg font-bold text-white">Mock Instagram / YouTube / LinkedIn Posts</h2>
                  <p className="mb-4 text-xs text-slate-400">
                    Post-level visibility with direct links, crowd reached, and conversions brought.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {marketingSocialPosts.map((post, index) => (
                      <div key={`${post.platform}-${index}`} className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-sm font-black text-primary">{post.platform}</p>
                          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                            {post.type}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white line-clamp-2">{post.title}</p>
                        <p className="mt-2 text-xs text-slate-400 line-clamp-3">{post.caption}</p>

                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span>Crowd Reached</span>
                            <span className="font-semibold text-white">{post.crowdReached.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Conversions Brought</span>
                            <span className="font-semibold text-emerald-300">{post.conversions.toLocaleString()}</span>
                          </div>
                        </div>

                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary"
                        >
                          Open Post Link
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <div className="border-b border-white/10 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Campaign Table</h2>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Campaign Name</th>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-left">Target Audience</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Conversions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketingCampaignRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                            No campaign data available.
                          </td>
                        </tr>
                      ) : (
                        marketingCampaignRows.map((campaign, index) => (
                          <tr key={`${campaign.campaignName}-${index}`} className="border-t border-white/5 text-slate-200">
                            <td className="px-4 py-3 font-semibold text-white">{campaign.campaignName}</td>
                            <td className="px-4 py-3">{campaign.type}</td>
                            <td className="px-4 py-3">{campaign.targetAudience.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${
                                  campaign.status === 'active'
                                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                    : campaign.status === 'completed'
                                      ? 'border-sky-400/30 bg-sky-500/10 text-sky-300'
                                      : campaign.status === 'scheduled'
                                        ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                                        : 'border-white/20 bg-white/5 text-slate-300'
                                }`}
                              >
                                {campaign.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-primary">{campaign.conversions}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
                  <div className="border-b border-white/10 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Active Coupons</h2>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Coupon</th>
                        <th className="px-4 py-3 text-left">Discount</th>
                        <th className="px-4 py-3 text-left">Usage Count</th>
                        <th className="px-4 py-3 text-left">Expiry</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketingCoupons.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                            No active coupons available.
                          </td>
                        </tr>
                      ) : (
                        marketingCoupons.map((coupon) => (
                          <tr key={coupon.couponCode} className="border-t border-white/5 text-slate-200">
                            <td className="px-4 py-3 font-semibold text-primary">{coupon.couponCode}</td>
                            <td className="px-4 py-3">{coupon.discountPercent}%</td>
                            <td className="px-4 py-3">{coupon.usageCount}</td>
                            <td className="px-4 py-3">{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${
                                  coupon.isActive
                                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                    : 'border-red-400/30 bg-red-500/10 text-red-300'
                                }`}
                              >
                                {coupon.isActive ? 'Active' : 'Expired'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
