/**
 * Navigation Header Component
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to="/" className="logo">
            🎫 EventTickets
          </Link>

          <div className="nav-links">
            <Link to="/" className="nav-link">
              Browse Events
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/cart" className="nav-link">
                  🛒 Cart
                </Link>
                <Link to="/my-tickets" className="nav-link">
                  🎟️ My Tickets
                </Link>
              </>
            )}

            {user?.isAdmin && (
              <Link to="/admin" className="nav-link admin-link">
                ⚙️ Admin Dashboard
              </Link>
            )}
          </div>

          <div className="nav-right">
            {isAuthenticated ? (
              <>
                <span className="user-name">👤 {user?.name}</span>
                <Link to="/profile" className="nav-link">
                  Profile
                </Link>
                <button onClick={handleLogout} className="btn btn-danger">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
