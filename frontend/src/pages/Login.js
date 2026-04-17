/**
 * Login Page
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const response = await login(email, password);
      const role = response?.user?.role || 'user';
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'organizer') {
        navigate('/organizer');
      } else if (role === 'client') {
        navigate('/client/events');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-14">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-surface p-8 shadow-xl shadow-primary/10">
        <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
        <p className="mt-2 text-slate-400">Sign in to your account</p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-primary/80">
            Sign up
          </Link>
        </p>

        <div className="mt-6 rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-xs text-slate-400">
          <p className="mb-1 font-semibold uppercase tracking-wide text-slate-300">Demo Client</p>
          <code>client@gmail.com / password</code>
        </div>
      </div>
    </div>
  );
};

export default Login;
