import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import eventService from '../services/eventService';
import SEO from '../components/SEO';

const TECH_TRACKS = [
  { label: 'Frontend Engineering', icon: 'web' },
  { label: 'Backend & APIs', icon: 'dns' },
  { label: 'Cloud & DevOps', icon: 'cloud' },
  { label: 'AI & Automation', icon: 'auto_awesome' },
  { label: 'Security Engineering', icon: 'shield_lock' },
  { label: 'Data & Performance', icon: 'monitoring' },
];

const Homepage = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await eventService.getAllEvents({ sortBy: 'date_asc' });
        setFeaturedEvents(eventsRes.events?.slice(0, 3) || []);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      }
    };
    fetchData();
  }, []);

  const featuredEvent = featuredEvents[0];

  return (
    <div>
      <SEO 
        title="Home"
        description="Discover and book virtual events happening around you. Join exclusive virtual gatherings from the comfort of your home."
      />
      <section className="relative flex min-h-[870px] items-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/10 via-black to-black">
          <div className="absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[120px]"></div>
          <div className="absolute -left-20 bottom-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[100px]"></div>
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6">
          <div className="max-w-3xl">
            <h1 className="mb-6 text-5xl font-black leading-[1.1] md:text-7xl">
              Experience Events <span className="italic text-primary">Like Never Before</span>
            </h1>
            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
              Join the most exclusive virtual gatherings from the comfort of your home.
              High-definition streaming meets interactive social experiences and global connections.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/events"
                className="flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-white transition-all hover:bg-primary/90"
              >
                Explore Events <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link
                to="/contact"
                className="rounded-full border border-white/20 px-8 py-4 text-base font-bold text-white transition-all hover:border-white/40 hover:bg-white/5"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background-dark py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-12">
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Browse by Category
            </span>
            <h2 className="text-4xl font-bold">Find Your Vibe</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {TECH_TRACKS.map((track) => (
              <Link
                to="/events"
                key={track.label}
                className="group flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-surface p-8 transition-all hover:-translate-y-1 hover:border-primary/50"
              >
                <span className="material-symbols-outlined text-3xl text-primary transition-transform group-hover:scale-110">
                  {track.icon}
                </span>
                <span className="text-sm font-bold text-slate-300">{track.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface">
            <div className="flex flex-col lg:flex-row">
              <div className="relative min-h-[400px] lg:w-1/2">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <img
                  src={
                    featuredEvent?.bannerImage ||
                    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'
                  }
                  alt={featuredEvent?.title || 'Featured Event'}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-center p-8 md:p-16 lg:w-1/2">
                <div className="mb-6 inline-block w-fit rounded bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                  Featured Event
                </div>
                <h3 className="mb-4 text-4xl font-bold md:text-5xl">
                  {featuredEvent?.title || 'Neon Nights Live 2024'}
                </h3>
                <div className="mb-8 flex flex-wrap gap-6 text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary">calendar_month</span>
                    <span className="text-sm">
                      {featuredEvent?.eventDate
                        ? new Date(featuredEvent.eventDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Nov 24, 2024'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                    <span className="text-sm">{featuredEvent?.location || 'Global Streaming'}</span>
                  </div>
                </div>

                <p className="mb-10 text-lg leading-relaxed text-slate-400">
                  {featuredEvent?.description ||
                    "Join the world's premier electronic music festival from your living room. Experience 4K visuals, spatial audio, and live fan interactions with headliners from across the globe."}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      Tickets From
                    </p>
                    <p className="text-2xl font-black text-primary">${featuredEvent?.price || '49.00'}</p>
                  </div>

                  <Link
                    to={featuredEvent?._id ? `/event/${featuredEvent._id}` : '/events'}
                    className="rounded-full bg-primary px-10 py-4 font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90"
                  >
                    Get Tickets
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black py-24" id="how-it-works">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-16 text-center">
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-primary">
              How It Works
            </span>
            <h2 className="text-4xl font-bold">Simple Steps to Your Next Event</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="group relative rounded-2xl border border-white/5 bg-surface p-10 transition-all hover:-translate-y-2 hover:border-primary/20">
              <div className="mb-6 flex items-center justify-between">
                <span className="material-symbols-outlined text-5xl text-primary/40">search</span>
                <span className="text-6xl font-black italic text-white/5">01</span>
              </div>
              <h4 className="mb-4 text-xl font-bold text-white">Browse Events</h4>
              <p className="leading-relaxed text-slate-400">
                Discover a world of music, tech, and entertainment from our curated global list of premium virtual events.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-white/5 bg-surface p-10 transition-all hover:-translate-y-2 hover:border-primary/20">
              <div className="mb-6 flex items-center justify-between">
                <span className="material-symbols-outlined text-5xl text-primary/40">shopping_cart</span>
                <span className="text-6xl font-black italic text-white/5">02</span>
              </div>
              <h4 className="mb-4 text-xl font-bold text-white">Select Tickets</h4>
              <p className="leading-relaxed text-slate-400">
                Choose your experience tier, from standard view to VIP interactive backstages. Easy, secure checkout.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-white/5 bg-surface p-10 transition-all hover:-translate-y-2 hover:border-primary/20">
              <div className="mb-6 flex items-center justify-between">
                <span className="material-symbols-outlined text-5xl text-primary/40">rocket_launch</span>
                <span className="text-6xl font-black italic text-white/5">03</span>
              </div>
              <h4 className="mb-4 text-xl font-bold text-white">Enjoy the Show</h4>
              <p className="leading-relaxed text-slate-400">
                Access the stream through any device. Connect with other fans and immerse yourself in the experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-surface p-12 text-center shadow-xl shadow-primary/10 md:p-20">
            <div className="absolute left-1/2 top-0 h-1 w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
            <h2 className="relative z-10 mb-8 text-4xl font-black text-white md:text-5xl">
              Ready to Experience Something Amazing?
            </h2>
            <div className="relative z-10 flex justify-center">
              <Link
                to="/events"
                className="flex items-center gap-3 rounded-full bg-primary px-12 py-5 text-lg font-bold text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90"
              >
                Browse All Events <span className="material-symbols-outlined">explore</span>
              </Link>
            </div>
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/5 blur-[80px]"></div>
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/5 blur-[80px]"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
