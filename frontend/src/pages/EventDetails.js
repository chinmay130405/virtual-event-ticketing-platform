import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import cartService from '../services/cartService';
import SEO from '../components/SEO';

const highlights = [
  {
    icon: 'headset',
    title: 'Live DJ Sets',
    description: 'Top-tier international lineup performing live.',
  },
  {
    icon: 'wine_bar',
    title: 'VIP Lounge',
    description: 'Exclusive lounge with premium bar service.',
  },
  {
    icon: 'restaurant',
    title: 'Food & Drinks',
    description: 'Curated selection of gourmet event food.',
  },
  {
    icon: 'shopping_bag',
    title: 'Merch Booth',
    description: 'Limited edition festival gear available.',
  },
];

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await eventService.getEventById(id);
        setEvent(response.event);
      } catch (err) {
        setError(err.message || 'Failed to fetch event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(true);
      setError(null);
      const token = localStorage.getItem('token');
      await cartService.addToCart(id, quantity, token);
      setSuccessMessage(`Added ${quantity} ticket(s) to cart!`);
      setQuantity(1);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1) {
      setQuantity(newQty);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-24 text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-dark border-t-primary"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="px-6 py-20">
        <div className="mx-auto max-w-[700px] rounded-2xl border border-white/10 bg-surface p-8 text-center">
          <p className="mb-4 text-slate-300">{error || 'Event not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const ticketPrice = event.price || 49.99;
  const totalPrice = ticketPrice * quantity;
  const soldTickets = event.ticketsSold || 0;
  const reservedTickets = event.ticketsReserved || 0;
  const availableTickets = event.ticketsAvailable - soldTickets - reservedTickets;

  return (
    <div>
      <SEO 
        title={event?.title}
        description={event?.description?.substring(0, 160)}
        image={event?.bannerImage}
      />
      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
          <Link to="/" className="text-slate-500 hover:text-primary">
            Home
          </Link>
          <span className="text-slate-700">/</span>
          <Link to="/events" className="text-slate-500 hover:text-primary">
            Events
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-primary">{event.title}</span>
        </div>
      </div>

      <div className="relative h-[450px] w-full overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        <div className="absolute inset-0 z-10 bg-primary/10 mix-blend-color"></div>
        <img
          className="h-full w-full object-cover"
          src={event.bannerImage || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200'}
          alt={event.title}
        />
        <div className="absolute bottom-0 left-0 z-20 w-full pb-12">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="mb-4 inline-flex gap-2">
              <span className="rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                Coming Soon
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                Selling Fast
              </span>
            </div>
            <h2 className="mb-6 text-5xl font-black leading-none text-white drop-shadow-2xl md:text-7xl">
              {event.title}
            </h2>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-4 py-12 lg:grid-cols-3">
        <div className="flex flex-col gap-10 lg:col-span-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start gap-8">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <div>
                  <p className="font-bold text-white">
                    {new Date(event.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-slate-500">{event.eventTime || '8:00 PM EST'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <p className="font-bold text-white">{event.location || 'Global Streaming'}</p>
                  <p className="text-sm text-slate-500">Virtual Event</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-card-dark p-4">
              <div className="size-12 overflow-hidden rounded-full border-2 border-primary/20">
                <img
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"
                  alt="Organizer"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-tighter text-slate-500">
                  Organized by
                </p>
                <p className="font-bold text-white">{event.createdBy?.name || 'EventVibe Team'}</p>
              </div>
              <button className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10">
                Follow
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h3 className="flex items-center gap-3 text-2xl font-bold text-white">
              About The Event
              <span className="h-px flex-1 bg-white/10"></span>
            </h3>
            <div className="flex flex-col gap-4 text-lg leading-relaxed text-slate-400">
              <p>{event.description}</p>
              <p>
                Join thousands of fans for a high-energy experience that blends performance,
                visuals, and unforgettable atmosphere.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-card-dark p-8">
            <h3 className="mb-6 text-xl font-bold text-white">About the Venue</h3>
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="h-40 overflow-hidden rounded-xl md:w-1/3">
                <img
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400"
                  alt="Venue"
                />
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-slate-300">
                  Premium venue production and immersive effects designed for an unforgettable
                  event experience.
                </p>
                <button className="flex items-center gap-2 text-sm font-bold uppercase text-primary">
                  View Map &amp; Parking
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              #{event.category}
            </span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              #Live
            </span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              #Nightlife
            </span>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-28 overflow-hidden rounded-2xl border border-white/10 bg-card-dark shadow-2xl shadow-primary/5">
            <div className="border-b border-white/5 p-6">
              <h4 className="text-xl font-black uppercase text-white">Select Tickets</h4>
            </div>
            <div className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white">General Admission</p>
                    <p className="text-sm font-bold text-primary">${ticketPrice}</p>
                  </div>
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
                    Available
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/40 p-2">
                  <button
                    className="flex size-8 items-center justify-center rounded bg-white/5 text-slate-400 hover:text-white"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="font-bold text-white">{quantity}</span>
                  <button
                    className="flex size-8 items-center justify-center rounded bg-white/5 text-slate-400 hover:text-white"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= availableTickets}
                  >
                    +
                  </button>
                </div>
              </div>

              {availableTickets > 0 ? (
                <div className="space-y-4 border-t border-white/5 pt-6">
                  <div className="flex items-center justify-between text-white">
                    <span className="text-sm font-medium text-slate-400">Total Amount</span>
                    <span className="text-2xl font-black">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="w-full rounded-xl bg-primary py-4 font-black uppercase tracking-widest text-white shadow-lg shadow-primary/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {addingToCart ? 'Adding...' : 'Buy Tickets Now'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 border-t border-white/5 pt-6">
                  <button disabled className="w-full rounded-xl bg-red-500/50 py-4 font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-60">
                    Out of Stock
                  </button>
                </div>
              )}

                {successMessage && (
                  <p className="text-center text-sm font-medium text-emerald-300">{successMessage}</p>
                )}
                {error && <p className="text-center text-sm text-red-300">{error}</p>}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    Secure Checkout
                  </div>
                  <p className="text-[10px] font-medium text-slate-600">
                    Instant digital delivery to your wallet
                  </p>
                </div>
              </div>
            </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1200px] px-4 py-16">
        <h3 className="mb-10 flex items-center gap-3 text-2xl font-black uppercase tracking-tighter text-white">
          <span className="text-primary">{'//'}</span> Event Highlights
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map((highlight) => (
            <div
              key={highlight.title}
              className="group rounded-2xl border border-white/5 bg-card-dark p-8 transition-colors hover:border-primary/30"
            >
              <span className="material-symbols-outlined mb-4 text-4xl text-primary transition-transform group-hover:scale-110">
                {highlight.icon}
              </span>
              <h5 className="mb-2 font-bold text-white">{highlight.title}</h5>
              <p className="text-sm text-slate-500">{highlight.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card-dark/30 py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-primary">
                You Might Also Like
              </p>
              <h3 className="text-3xl font-black uppercase text-white">Similar Experiences</h3>
            </div>
            <Link to="/events" className="text-sm font-bold text-white underline underline-offset-8">
              View All Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventDetails;
