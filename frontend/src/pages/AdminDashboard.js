/**
 * Admin Dashboard Page
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
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
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>⚙️ Admin Dashboard</h1>
          <p>Welcome, {user?.name}! Manage your events and sales.</p>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
              <div className="dashboard-content">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <p className="stat-label">Total Users</p>
                      <p className="stat-value">{stats.totalUsers}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">🎫</div>
                    <div className="stat-info">
                      <p className="stat-label">Total Events</p>
                      <p className="stat-value">{stats.totalEvents}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                      <p className="stat-label">Total Orders</p>
                      <p className="stat-value">{stats.totalOrders}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                      <p className="stat-label">Total Revenue</p>
                      <p className="stat-value">${stats.totalRevenue?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">🎟️</div>
                    <div className="stat-info">
                      <p className="stat-label">Tickets Sold</p>
                      <p className="stat-value">{stats.ticketsSold}</p>
                    </div>
                  </div>
                </div>

                <div className="recent-orders">
                  <h2>Recent Orders</h2>
                  <div className="orders-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders?.map((order) => (
                          <tr key={order._id}>
                            <td>{order.orderNumber}</td>
                            <td>{order.user?.name}</td>
                            <td>${order.totalAmount.toFixed(2)}</td>
                            <td>
                              <span className={`status-badge status-${order.orderStatus}`}>
                                {order.orderStatus}
                              </span>
                            </td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="top-events">
                  <h2>Top Events</h2>
                  <div className="events-list">
                    {stats.topEvents?.map((event) => (
                      <div key={event._id} className="event-row">
                        <div className="event-info">
                          <p className="event-name">{event.title}</p>
                          <p className="event-meta">
                            {event.ticketsSold} / {event.ticketsAvailable} sold
                          </p>
                        </div>
                        <p className="event-revenue">
                          ${(event.price * event.ticketsSold).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="users-content">
                <h2>Users Management</h2>
                <div className="users-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`role-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                              {user.isAdmin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button className="btn-small">View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="analytics-content">
                <h2>Events Analytics</h2>
                <div className="analytics-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Price</th>
                        <th>Sold / Available</th>
                        <th>Occupancy</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.map((event) => (
                        <tr key={event.id}>
                          <td>{event.title}</td>
                          <td>${event.price}</td>
                          <td>
                            {event.ticketsSold} / {event.ticketsAvailable}
                          </td>
                          <td>
                            <div className="progress-mini">
                              <div
                                className="progress-fill"
                                style={{ width: `${event.occupancy}%` }}
                              ></div>
                            </div>
                            {event.occupancy}%
                          </td>
                          <td className="revenue">${event.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
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
