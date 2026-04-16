/**
 * Navigation Header Component — Dark Theme
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const isAdminUser = user?.role === 'admin';
  const isOrganizerUser = user?.role === 'organizer';
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="glass-nav sticky top-0 z-50 w-full border-b border-white/10">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <span className="material-symbols-outlined text-xl text-white">confirmation_number</span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">EventVibe</h2>
        </Link>

        <button
          className="md:hidden rounded-lg border border-white/10 p-2 text-slate-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-xl">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

        <div className="hidden items-center gap-10 md:flex">
          {isAdminUser ? (
            <Link
              to="/admin"
              className="text-sm font-medium uppercase tracking-wider text-primary transition-colors hover:text-primary/80"
            >
              Admin Dashboard
            </Link>
          ) : isOrganizerUser ? (
            <Link
              to="/organizer"
              className="text-sm font-medium uppercase tracking-wider text-primary transition-colors hover:text-primary/80"
            >
              Organizer Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/events"
                className="text-sm font-medium uppercase tracking-wider text-slate-300 transition-colors hover:text-primary"
              >
                Events
              </Link>
              <Link
                to="/contact"
                className="text-sm font-medium uppercase tracking-wider text-slate-300 transition-colors hover:text-primary"
              >
                Contact
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/cart"
                    className="text-sm font-medium uppercase tracking-wider text-slate-300 transition-colors hover:text-primary"
                  >
                    Cart
                  </Link>
                  <Link
                    to="/my-tickets"
                    className="text-sm font-medium uppercase tracking-wider text-slate-300 transition-colors hover:text-primary"
                  >
                    My Tickets
                  </Link>
                  <Link
                    to="/support"
                    className="text-sm font-medium uppercase tracking-wider text-slate-300 transition-colors hover:text-primary"
                  >
                    Support
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated ? (
            <>
              <span className="max-w-40 truncate text-sm text-slate-300">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-bold text-white transition-all hover:border-white/40 hover:bg-white/5"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium uppercase tracking-wider text-slate-300 transition-colors hover:text-primary"
              >
                Login
              </Link>
              <Link
                to="/events"
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Get Tickets
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-black/95 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {isAdminUser ? (
              <Link
                to="/admin"
                className="text-sm font-medium uppercase tracking-wider text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            ) : isOrganizerUser ? (
              <Link
                to="/organizer"
                className="text-sm font-medium uppercase tracking-wider text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Organizer Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/events"
                  className="text-sm font-medium uppercase tracking-wider text-slate-300 transition-colors hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Events
                </Link>
                <Link
                  to="/contact"
                  className="text-sm font-medium uppercase tracking-wider text-slate-300 transition-colors hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/cart"
                      className="text-sm font-medium uppercase tracking-wider text-slate-300 transition-colors hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Cart
                    </Link>
                    <Link
                      to="/my-tickets"
                      className="text-sm font-medium uppercase tracking-wider text-slate-300 transition-colors hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Tickets
                    </Link>
                    <Link
                      to="/support"
                      className="text-sm font-medium uppercase tracking-wider text-slate-300 transition-colors hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Support
                    </Link>
                  </>
                )}
              </>
            )}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="mt-2 rounded-full border border-white/20 px-5 py-2 text-sm font-bold text-white"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/events"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Tickets
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
