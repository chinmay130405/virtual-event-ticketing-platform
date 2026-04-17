import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import cartService from '../services/cartService';
import SEO from '../components/SEO';

const EVENT_BANNER_FALLBACK =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80';

const CATEGORY_UI_CONTENT = {
  Technology: {
    venueImage:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&q=80',
    tags: ['Workshop', 'HandsOn', 'TechCommunity'],
    highlights: [
      {
        icon: 'code',
        title: 'Live Coding Sessions',
        description: 'Real-time implementation of concepts with guided explanations.',
      },
      {
        icon: 'devices',
        title: 'Tooling Demos',
        description: 'See practical workflows and modern tooling in action.',
      },
      {
        icon: 'groups',
        title: 'Expert Q&A',
        description: 'Ask architecture and implementation questions directly.',
      },
      {
        icon: 'school',
        title: 'Take-home Resources',
        description: 'Get templates, checklists, and follow-up practice material.',
      },
    ],
  },
  Business: {
    venueImage:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=80',
    tags: ['Leadership', 'Networking', 'Strategy'],
    highlights: [
      {
        icon: 'monitoring',
        title: 'Strategy Sessions',
        description: 'Actionable playbooks from business and product leaders.',
      },
      {
        icon: 'handshake',
        title: 'Networking Hours',
        description: 'Curated networking with founders, operators, and mentors.',
      },
      {
        icon: 'insights',
        title: 'Market Insights',
        description: 'Data-backed trends and practical growth opportunities.',
      },
      {
        icon: 'task_alt',
        title: 'Execution Templates',
        description: 'Frameworks you can apply to your team immediately.',
      },
    ],
  },
  Education: {
    venueImage:
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&q=80',
    tags: ['Learning', 'Mentorship', 'SkillBuilding'],
    highlights: [
      {
        icon: 'menu_book',
        title: 'Structured Learning Tracks',
        description: 'Step-by-step modules from fundamentals to advanced topics.',
      },
      {
        icon: 'co_present',
        title: 'Mentor-led Workshops',
        description: 'Learn directly from instructors with practical exercises.',
      },
      {
        icon: 'quiz',
        title: 'Interactive Assessments',
        description: 'Check your understanding with guided checkpoints.',
      },
      {
        icon: 'workspace_premium',
        title: 'Completion Certificate',
        description: 'Receive recognition for your learning milestones.',
      },
    ],
  },
  Entertainment: {
    venueImage:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80',
    tags: ['Entertainment', 'Performance', 'Community'],
    highlights: [
      {
        icon: 'mic',
        title: 'Main Stage Performance',
        description: 'Experience high-energy acts and curated performances.',
      },
      {
        icon: 'theater_comedy',
        title: 'Creative Showcases',
        description: 'Discover original acts and emerging talent.',
      },
      {
        icon: 'photo_camera',
        title: 'Interactive Installations',
        description: 'Immersive spaces designed for audience engagement.',
      },
      {
        icon: 'local_activity',
        title: 'Fan Experience Zones',
        description: 'Explore exclusive activities and event memorabilia.',
      },
    ],
  },
  Sports: {
    venueImage:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=80',
    tags: ['Sports', 'Performance', 'Competition'],
    highlights: [
      {
        icon: 'sports_soccer',
        title: 'Live Match Insights',
        description: 'Breakdowns and tactical perspectives from experts.',
      },
      {
        icon: 'fitness_center',
        title: 'Performance Clinics',
        description: 'Learn training methods and athlete best practices.',
      },
      {
        icon: 'emoji_events',
        title: 'Competitive Challenges',
        description: 'Participate in skill-based contests and mini-events.',
      },
      {
        icon: 'sports_score',
        title: 'Fan Engagement',
        description: 'Interactive sports zones with community activities.',
      },
    ],
  },
  Other: {
    venueImage:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&q=80',
    tags: ['Event', 'Community', 'Experience'],
    highlights: [
      {
        icon: 'event',
        title: 'Curated Sessions',
        description: 'Well-structured sessions designed for maximum value.',
      },
      {
        icon: 'forum',
        title: 'Community Interactions',
        description: 'Connect with peers and professionals from your domain.',
      },
      {
        icon: 'explore',
        title: 'Activity Zones',
        description: 'Explore interactive sections throughout the venue.',
      },
      {
        icon: 'verified',
        title: 'Trusted Experience',
        description: 'Smooth entry, organized flow, and attendee support.',
      },
    ],
  },
};

const ONLINE_EVENT_CONTENT = {
  venueImage: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=900&q=80',
  tags: ['Online', 'LiveStream', 'Interactive'],
  highlights: [
    {
      icon: 'live_tv',
      title: 'HD Live Stream',
      description: 'Join from anywhere with stable high-quality event streaming.',
    },
    {
      icon: 'chat',
      title: 'Live Chat & Q&A',
      description: 'Participate in real-time discussions and audience questions.',
    },
    {
      icon: 'schedule',
      title: 'Session Replays',
      description: 'Revisit key sessions later with on-demand replay access.',
    },
    {
      icon: 'verified_user',
      title: 'Secure Access',
      description: 'Unique ticket-based entry with secure stream authentication.',
    },
  ],
};

const getEventDisplayContent = (event) => {
  const isOnlineEvent =
    event?.eventMode === 'online' || /online|virtual|stream/i.test(String(event?.location || ''));

  if (isOnlineEvent) {
    const titleTags = String(event?.title || '')
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 1)
      .map((word) => word.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(Boolean);

    const tags = [...ONLINE_EVENT_CONTENT.tags, ...titleTags]
      .map((tag) => String(tag).replace(/\s+/g, ''))
      .filter(Boolean)
      .filter((tag, index, arr) => arr.indexOf(tag) === index)
      .slice(0, 3);

    return {
      venueImage: ONLINE_EVENT_CONTENT.venueImage,
      highlights: ONLINE_EVENT_CONTENT.highlights,
      tags,
    };
  }

  const category = event?.category || 'Other';
  const fallbackContent = CATEGORY_UI_CONTENT.Other;
  const categoryContent = CATEGORY_UI_CONTENT[category] || fallbackContent;

  const titleTags = String(event?.title || '')
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 2)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean);

  const tags = [category, ...titleTags, ...(categoryContent.tags || [])]
    .map((tag) => String(tag).replace(/\s+/g, ''))
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .slice(0, 3);

  return {
    venueImage: categoryContent.venueImage,
    highlights: categoryContent.highlights,
    tags,
  };
};

const getVenueContext = (event) => {
  const isOnlineEvent =
    event?.eventMode === 'online' || /online|virtual|stream/i.test(String(event?.location || ''));

  if (isOnlineEvent) {
    return {
      summary:
        'This event is fully online. You will receive secure streaming access, live interaction features, and replay availability for registered attendees.',
      cta: 'View Streaming Access Guide',
      sectionTitle: 'About Online Access',
    };
  }

  const explicitVenueDescription = event?.venueDescription?.trim();
  if (explicitVenueDescription) {
    return {
      summary: explicitVenueDescription,
      cta: 'View Venue Access & Parking',
      sectionTitle: 'About the Venue',
    };
  }

  const category = event?.category || 'Other';
  const location = event?.location || 'India';

  if (category === 'Technology') {
    return {
      summary: `Hosted at ${location}, this tech-focused venue offers high-speed connectivity, modern AV systems, and dedicated demo zones for live coding and product showcases.`,
      cta: 'View Venue Access & Parking',
      sectionTitle: 'About the Venue',
    };
  }

  if (category === 'Business') {
    return {
      summary: `At ${location}, attendees can expect premium conference seating, networking lounges, and business-ready meeting spaces for collaborative sessions.`,
      cta: 'View Business Lounge & Access',
      sectionTitle: 'About the Venue',
    };
  }

  if (category === 'Education') {
    return {
      summary: `The learning-friendly setup at ${location} includes workshop areas, guided learning stations, and comfortable seating for long-form sessions.`,
      cta: 'View Campus Layout & Access',
      sectionTitle: 'About the Venue',
    };
  }

  if (category === 'Entertainment' || category === 'Sports') {
    return {
      summary: `${location} is equipped with immersive staging, dynamic lighting, and audience-friendly zones crafted for high-energy experiences.`,
      cta: 'View Entry Gates & Facilities',
      sectionTitle: 'About the Venue',
    };
  }

  return {
    summary: `${location} provides a comfortable event setup with seamless entry, reliable amenities, and an engaging atmosphere for attendees.`,
    cta: 'View Venue Details',
    sectionTitle: 'About the Venue',
  };
};

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

  const ticketPrice = event.effectivePrice || event.price || 49.99;
  const originalPrice = event.price || ticketPrice;
  const hasDiscount = Number(event.discountPercent || 0) > 0;
  const totalPrice = ticketPrice * quantity;
  const soldTickets = event.ticketsSold || 0;
  const reservedTickets = event.ticketsReserved || 0;
  const availableTickets = event.ticketsAvailable - soldTickets - reservedTickets;
  const organizerName =
    event.organizerName || event.createdBy?.name || event.speaker || 'Event Host';
  const venueContext = getVenueContext(event);
  const displayContent = getEventDisplayContent(event);
  const isOnlineEvent =
    event.eventMode === 'online' || /online|virtual|stream/i.test(String(event.location || ''));

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
          src={event.bannerImage || EVENT_BANNER_FALLBACK}
          alt={event.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = EVENT_BANNER_FALLBACK;
          }}
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
                  <p className="text-sm text-slate-500">{event.eventTime || '8:00 PM IST'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <p className="font-bold text-white">
                    {isOnlineEvent ? 'Online' : (event.location || 'Venue TBA')}
                  </p>
                  <p className="text-sm text-slate-500">
                    {isOnlineEvent ? 'Online Event' : 'In-Person Event'}
                  </p>
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
                <p className="font-bold text-white">{organizerName}</p>
              </div>
              <button className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10">
                Follow
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-card-dark px-4 py-3">
              <span className="material-symbols-outlined text-primary">event_seat</span>
              <p className="text-sm text-slate-300">
                Available Seats: <span className="font-bold text-white">{Math.max(availableTickets, 0)}</span>
              </p>
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
            <h3 className="mb-6 text-xl font-bold text-white">{venueContext.sectionTitle}</h3>
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="h-40 overflow-hidden rounded-xl md:w-1/3">
                <img
                  className="h-full w-full object-cover"
                  src={displayContent.venueImage}
                  alt="Venue"
                />
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-slate-300">
                  {venueContext.summary}
                </p>
                <button className="flex items-center gap-2 text-sm font-bold uppercase text-primary">
                  {venueContext.cta}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {displayContent.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary"
              >
                #{tag}
              </span>
            ))}
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
                    {hasDiscount && (
                      <p className="text-xs text-slate-500 line-through">₹{originalPrice}</p>
                    )}
                    <p className="text-sm font-bold text-primary">₹{ticketPrice}</p>
                    <p className="text-xs text-slate-500">
                      Platform fee (30%): ₹{(ticketPrice * 0.3).toFixed(2)} per ticket
                    </p>
                    <p className="text-xs text-slate-500">{Math.max(availableTickets, 0)} seats left</p>
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
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
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
          {displayContent.highlights.map((highlight) => (
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
