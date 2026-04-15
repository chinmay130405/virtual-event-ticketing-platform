/**
 * Register Page
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    companyName: '',
    gstNumber: '',
    businessAddress: '',
    venueRegistration: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-14">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-surface p-8 shadow-xl shadow-primary/10">
        <h2 className="text-3xl font-bold text-white">Create Account</h2>
        <p className="mt-2 text-slate-400">Join us to book events</p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Account Type</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40"
            >
              <option value="user">Attendee</option>
              <option value="organizer">Organizer</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          {formData.role === 'organizer' && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Acme Events Pvt Ltd"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 uppercase text-white outline-none transition-all placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Business Address</label>
                <textarea
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Full registered business address"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Venue Registration (Optional)
                </label>
                <input
                  type="text"
                  name="venueRegistration"
                  value={formData.venueRegistration}
                  onChange={handleChange}
                  placeholder="Venue/company registration id"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              minLength="6"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              minLength="6"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
