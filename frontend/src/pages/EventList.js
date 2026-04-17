import React, { useMemo, useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import eventService from '../services/eventService';

const EVENTS_PER_PAGE = 6;

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [location, setLocation] = useState('');
  const [eventMode, setEventMode] = useState('');
  const [sortBy, setSortBy] = useState('date_asc');
  const [categories, setCategories] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCategories();
    fetchEvents();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category, dateRange, location, eventMode, sortBy]);

  useEffect(() => {
    const filters = [];
    if (category) filters.push({ type: 'Category', value: category });
    if (dateRange) filters.push({ type: 'Date', value: dateRange });
    if (location) filters.push({ type: 'Location', value: location });
    if (eventMode) filters.push({ type: 'Mode', value: eventMode });
    setActiveFilters(filters);
  }, [category, dateRange, location, eventMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, dateRange, location, eventMode, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await eventService.getCategories();
      setCategories(response.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {
        search,
        category,
        location,
        eventMode,
        sortBy,
      };
      const response = await eventService.getAllEvents(filters);
      setEvents(response.events);
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setDateRange('');
    setLocation('');
    setEventMode('');
    setSortBy('date_asc');
    setCurrentPage(1);
  };

  const removeFilter = (filterType) => {
    if (filterType === 'Category') setCategory('');
    if (filterType === 'Date') setDateRange('');
    if (filterType === 'Location') setLocation('');
    if (filterType === 'Mode') setEventMode('');
  };

  const dateFilteredEvents = useMemo(() => {
    if (!dateRange) return events;

    const now = new Date();
    return events.filter((event) => {
      const eventDate = new Date(event.eventDate);
      if (Number.isNaN(eventDate.getTime())) return false;

      if (dateRange === 'this-month') {
        return (
          eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
        );
      }

      if (dateRange === 'next-month') {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return (
          eventDate.getMonth() === nextMonth.getMonth() &&
          eventDate.getFullYear() === nextMonth.getFullYear()
        );
      }

      if (dateRange === 'next-3-months') {
        const threeMonthsLater = new Date(now);
        threeMonthsLater.setMonth(now.getMonth() + 3);
        return eventDate >= now && eventDate <= threeMonthsLater;
      }

      return true;
    });
  }, [events, dateRange]);

  const modeFilteredEvents = useMemo(() => {
    if (!eventMode) return dateFilteredEvents;

    return dateFilteredEvents.filter((event) => {
      const normalizedMode = String(event.eventMode || '').toLowerCase();
      const isOnlineByLocation = /online|virtual|stream/i.test(String(event.location || ''));

      if (eventMode === 'online') {
        return normalizedMode === 'online' || isOnlineByLocation;
      }

      if (eventMode === 'in-person') {
        return normalizedMode === 'in-person' || (!normalizedMode && !isOnlineByLocation);
      }

      return normalizedMode === eventMode;
    });
  }, [dateFilteredEvents, eventMode]);

  const totalPages = Math.max(1, Math.ceil(modeFilteredEvents.length / EVENTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEvents = useMemo(() => {
    const start = (safePage - 1) * EVENTS_PER_PAGE;
    return modeFilteredEvents.slice(start, start + EVENTS_PER_PAGE);
  }, [modeFilteredEvents, safePage]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [1];
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);

    if (start > 2) pages.push('left-ellipsis');
    for (let page = start; page <= end; page += 1) pages.push(page);
    if (end < totalPages - 1) pages.push('right-ellipsis');

    pages.push(totalPages);
    return pages;
  }, [safePage, totalPages]);

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-12 md:py-20">
      <div className="mb-12">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">Explore</p>
        <h1 className="mb-6 text-5xl font-black leading-none text-white md:text-7xl">
          Discover <span className="italic text-primary">Events</span>
        </h1>
        <p className="max-w-2xl text-lg text-slate-400">
          Discover in-person and online events across technology, design, and business. Filter by
          mode, city, and schedule to find the right event fast.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-white/5 bg-surface p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="relative md:col-span-3">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              search
            </span>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-primary focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-primary focus:ring-primary"
            >
              <option value="">Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-primary focus:ring-primary"
            >
              <option value="">Any Date</option>
              <option value="this-month">This Month</option>
              <option value="next-month">Next Month</option>
              <option value="next-3-months">Next 3 Months</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={eventMode}
              onChange={(e) => setEventMode(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-primary focus:ring-primary"
            >
              <option value="">All Modes</option>
              <option value="in-person">In-Person</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div className="relative md:col-span-2">
            <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
              location_on
            </span>
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-slate-600 focus:border-primary focus:ring-primary"
            />
          </div>

          <div className="md:col-span-1">
            <button className="flex h-full w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-white transition-colors hover:bg-primary/90">
              <span className="material-symbols-outlined text-sm">search</span>
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {activeFilters.length > 0 && (
            <>
              <span className="mr-2 text-sm font-medium text-slate-500">Active filters:</span>
              {activeFilters.map((filter, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"
                >
                  {filter.value}
                  <button type="button" onClick={() => removeFilter(filter.type)}>
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
              <button
                onClick={handleReset}
                className="text-xs font-bold text-slate-500 underline transition-colors hover:text-white"
              >
                Clear All
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-6 md:justify-end">
          <p className="text-sm font-medium text-slate-400">
            Showing <span className="text-white">{modeFilteredEvents.length}</span> events
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="cursor-pointer border-none bg-transparent p-0 text-sm font-bold text-white focus:ring-0"
            >
              <option value="date_asc" className="bg-surface">
                Newest First
              </option>
              <option value="price_asc" className="bg-surface">
                Price: Low-High
              </option>
              <option value="price_desc" className="bg-surface">
                Price: High-Low
              </option>
              <option value="popularity" className="bg-surface">
                Popularity
              </option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-4 py-20 text-slate-400">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-dark border-t-primary"></div>
          <p>Loading events...</p>
        </div>
      )}

      {!loading && modeFilteredEvents.length > 0 && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {paginatedEvents.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}

      {!loading && modeFilteredEvents.length === 0 && (
        <div className="rounded-2xl border border-white/5 bg-surface px-6 py-12 text-center">
          <p className="mb-4 text-slate-300">No events found. Try adjusting your filters.</p>
          <button
            onClick={handleReset}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white"
          >
            Reset Filters
          </button>
        </div>
      )}

      {!loading && modeFilteredEvents.length > 0 && (
        <div className="mt-20 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage === 1}
            className="flex size-12 items-center justify-center rounded-xl border border-white/5 bg-surface text-slate-400 transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          {pageNumbers.map((page) =>
            typeof page === 'string' ? (
              <span key={page} className="px-2 font-black text-slate-600">...</span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex size-12 items-center justify-center rounded-xl font-bold transition-all ${
                  safePage === page
                    ? 'bg-primary text-white'
                    : 'border border-white/5 bg-surface text-slate-400 hover:border-primary hover:text-primary'
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage === totalPages}
            className="flex size-12 items-center justify-center rounded-xl border border-white/5 bg-surface text-slate-400 transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}
    </main>
  );
};

export default EventList;
