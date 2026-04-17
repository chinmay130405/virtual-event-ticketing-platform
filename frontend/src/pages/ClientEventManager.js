import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import authService from '../services/authService';
import SEO from '../components/SEO';

const PLATFORM_FEE_RATE = 0.3;
const HIGHLIGHT_COST_PER_WEEK = 10000;

const initialFormData = {
  title: '',
  description: '',
  category: 'Technology',
  price: 300,
  ticketsAvailable: 300,
  eventDate: '',
  eventTime: '10:00',
  duration: '4 hours',
  bannerImage: '',
  location: '',
  eventMode: 'in-person',
  speaker: '',
  organizerName: '',
  venueDescription: '',
  discountPercent: 0,
  highlightWeeks: 0,
  tags: '',
};

const ClientEventManager = () => {
  const { isAuthenticated, isClient, user } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingEventId, setEditingEventId] = useState('');

  const token = useMemo(() => authService.getToken(), []);

  const fetchSubmissions = async () => {
    try {
      setFetching(true);
      setError('');
      const response = await eventService.getMySubmissions(token);
      setSubmissions(response.events || []);
    } catch (err) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isClient) {
      fetchSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isClient]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isClient) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        ...formData,
        location:
          formData.eventMode === 'online'
            ? 'Online'
            : formData.location,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        price: Number(formData.price),
        ticketsAvailable: Number(formData.ticketsAvailable),
        discountPercent: Number(formData.discountPercent) || 0,
        highlightWeeks: Number(formData.highlightWeeks) || 0,
      };

      if (editingEventId) {
        await eventService.updateEvent(editingEventId, payload, token);
        setSuccess('Event updated successfully.');
      } else {
        await eventService.createEvent(payload, token);
        setSuccess('Event submitted successfully. It is now pending admin verification.');
      }
      setFormData(initialFormData);
      setEditingEventId('');
      await fetchSubmissions();
    } catch (err) {
      setError(err.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (eventItem) => {
    setError('');
    setSuccess('');
    setEditingEventId(eventItem._id);
    setFormData({
      title: eventItem.title || '',
      description: eventItem.description || '',
      category: eventItem.category || 'Technology',
      price: eventItem.price || 300,
      ticketsAvailable: eventItem.ticketsAvailable || 300,
      eventDate: eventItem.eventDate ? String(eventItem.eventDate).slice(0, 10) : '',
      eventTime: eventItem.eventTime || '10:00',
      duration: eventItem.duration || '4 hours',
      bannerImage: eventItem.bannerImage || '',
      location: eventItem.location === 'Online' ? '' : (eventItem.location || ''),
      eventMode: eventItem.eventMode || 'in-person',
      speaker: eventItem.speaker || '',
      organizerName: eventItem.organizerName || '',
      venueDescription: eventItem.venueDescription || '',
      discountPercent: Number(eventItem.discountPercent) || 0,
      highlightWeeks: Number(eventItem.highlightWeeks) || 0,
      tags: Array.isArray(eventItem.tags) ? eventItem.tags.join(', ') : '',
    });
  };

  const cancelEdit = () => {
    setEditingEventId('');
    setFormData(initialFormData);
  };

  const basePrice = Number(formData.price) || 0;
  const discountPercent = Math.min(80, Math.max(0, Number(formData.discountPercent) || 0));
  const discountedPrice = Number((basePrice * (1 - discountPercent / 100)).toFixed(2));
  const platformFeePerTicket = Number((discountedPrice * PLATFORM_FEE_RATE).toFixed(2));
  const creatorEarningPerTicket = Number((discountedPrice - platformFeePerTicket).toFixed(2));
  const highlightWeeks = Math.max(0, Number(formData.highlightWeeks) || 0);
  const highlightCost = highlightWeeks * HIGHLIGHT_COST_PER_WEEK;

  const handleDelete = async (eventId) => {
    try {
      setError('');
      setSuccess('');
      await eventService.deleteEvent(eventId, token);
      setSuccess('Submission deleted successfully.');
      await fetchSubmissions();
    } catch (err) {
      setError(err.message || 'Failed to delete submission');
    }
  };

  return (
    <div className="px-6 py-14">
      <SEO
        title="Client Event Manager"
        description="Submit and track your event listings pending admin verification."
      />

      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 rounded-2xl border border-white/10 bg-surface p-6">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Client Panel</p>
          <h1 className="mt-2 text-3xl font-black text-white">Create & Manage Your Events</h1>
          <p className="mt-2 text-slate-400">
            Logged in as <span className="font-bold text-white">{user?.email}</span>. All submitted
            events require admin approval before appearing on the public events page.
          </p>
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-slate-200">
            Platform fee notice: <span className="font-bold text-primary">30%</span> of each ticket
            sale goes to admin as platform fees. You receive the remaining 70%.
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-white/10 bg-card-dark p-6">
            <h2 className="mb-5 text-xl font-bold text-white">
              {editingEventId ? 'Edit Event' : 'Submit New Event'}
            </h2>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Event title"
                className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                required
              />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Event description"
                className="min-h-[100px] rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                required
              />

              <div className="grid gap-4 md:grid-cols-2">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                >
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  name="eventMode"
                  value={formData.eventMode}
                  onChange={handleChange}
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                >
                  <option value="in-person">In-Person</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="number"
                  min="300"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Ticket price"
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                  required
                />
                <input
                  type="number"
                  min="1"
                  name="ticketsAvailable"
                  value={formData.ticketsAvailable}
                  onChange={handleChange}
                  placeholder="Seats available"
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                  required
                />
                <input
                  type="number"
                  min="0"
                  max="80"
                  name="discountPercent"
                  value={formData.discountPercent}
                  onChange={handleChange}
                  placeholder="Discount %"
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="number"
                  min="0"
                  max="12"
                  name="highlightWeeks"
                  value={formData.highlightWeeks}
                  onChange={handleChange}
                  placeholder="Highlight weeks"
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                />
                <div className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-300">
                  Highlight fee: <span className="font-bold text-primary">₹{highlightCost}</span>
                  <p className="mt-1 text-xs text-slate-500">₹10,000 per week</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                  required
                />
                <input
                  type="time"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleChange}
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                  required
                />
              </div>

              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="Duration (e.g. 4 hours)"
                className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                required
              />

              <input
                type="url"
                name="bannerImage"
                value={formData.bannerImage}
                onChange={handleChange}
                placeholder="Banner image URL"
                className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                required
              />

              {formData.eventMode !== 'online' && (
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Venue location"
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                  required
                />
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  name="speaker"
                  value={formData.speaker}
                  onChange={handleChange}
                  placeholder="Speaker name"
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                />
                <input
                  type="text"
                  name="organizerName"
                  value={formData.organizerName}
                  onChange={handleChange}
                  placeholder="Organizer name"
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
                />
              </div>

              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Tags (comma separated)"
                className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
              />

              <textarea
                name="venueDescription"
                value={formData.venueDescription}
                onChange={handleChange}
                placeholder={
                  formData.eventMode === 'online'
                    ? 'Describe online access details (platform, replay, interaction)'
                    : 'Describe venue details, facilities, and context'
                }
                className="min-h-[100px] rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white"
              />

              <div className="grid gap-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Ticket Price After Discount</p>
                  <p className="font-bold text-emerald-300">₹{discountedPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Admin Platform Fee (30%)</p>
                  <p className="font-bold text-amber-300">₹{platformFeePerTicket.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Your Earning / Ticket</p>
                  <p className="font-bold text-primary">₹{creatorEarningPerTicket.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-primary px-6 py-3 font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading
                    ? 'Saving...'
                    : editingEventId
                    ? 'Save Event Changes'
                    : 'Submit for Admin Verification'}
                </button>
                {editingEventId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-full border border-white/20 px-6 py-3 font-bold text-slate-200"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-card-dark p-6">
            <h2 className="mb-4 text-xl font-bold text-white">My Submissions</h2>
            {fetching ? (
              <p className="text-sm text-slate-400">Loading your submissions...</p>
            ) : submissions.length === 0 ? (
              <p className="text-sm text-slate-400">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((item) => (
                  <div key={item._id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(item.eventDate).toLocaleDateString()} • {item.eventMode}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                        {item.approvalStatus || 'approved'}
                      </span>
                      <span className="text-xs text-slate-500">
                        ₹{item.effectivePrice || item.price}
                        {(item.discountPercent || 0) > 0 ? ` (${item.discountPercent}% off)` : ''}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Admin fee/ticket: ₹{item.platformFeePerTicket || ((item.effectivePrice || item.price) * 0.3).toFixed(2)}
                    </p>
                    {item.isHighlighted && item.highlightUntil ? (
                      <p className="mt-1 text-xs text-amber-300">
                        Highlight active until {new Date(item.highlightUntil).toLocaleDateString()} (fee: ₹{item.highlightFeePaid || 0})
                      </p>
                    ) : null}
                    {item.approvalComment ? (
                      <p className="mt-2 text-xs text-slate-400">{item.approvalComment}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-slate-200"
                      >
                        Edit Event
                      </button>
                      {(item.approvalStatus === 'pending' || item.approvalStatus === 'rejected') && (
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                        >
                          Delete Submission
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ClientEventManager;
