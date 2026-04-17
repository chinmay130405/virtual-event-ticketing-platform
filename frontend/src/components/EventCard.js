/**
 * Event Card Component — Dark Theme
 */

import React from 'react';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80';
  const soldTickets = event.ticketsSold || 0;
  const reservedTickets = event.ticketsReserved || 0;
  const availableTickets = event.ticketsAvailable - soldTickets - reservedTickets;
  const displayPrice = event.effectivePrice ?? event.price;
  const hasDiscount = Number(event.discountPercent || 0) > 0;
  const organizerName =
    event.organizerName || event.createdBy?.name || event.speaker || 'Event Host';
  const isOnlineEvent =
    event.eventMode === 'online' || /online|virtual|stream/i.test(String(event.location || ''));
  const eventDate = new Date(event.eventDate).toLocaleDateString();
  const soldOut = availableTickets <= 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-surface transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(233,32,143,0.15)]">
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <img
          src={event.bannerImage || fallbackImage}
          alt={event.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackImage;
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute right-4 top-4 z-20">
          {soldOut ? (
            <span className="rounded-full bg-slate-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              Sold Out
            </span>
          ) : (
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              {availableTickets <= 10 ? 'Last Few' : 'Available'}
            </span>
          )}
        </div>
        {event.isHighlightActive && (
          <div className="absolute left-4 top-4 z-20 rounded-full border border-amber-300/50 bg-amber-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-200">
            Highlighted
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-primary">{event.category}</p>
        <h3 className="mb-2 text-xl font-bold text-white transition-colors group-hover:text-primary">
          {event.title}
        </h3>
        <p className="mb-4 text-sm text-slate-400">{event.description?.substring(0, 100)}...</p>

        <div className="mb-1 flex items-center gap-2 text-sm text-slate-400">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <span>
            {eventDate} {event.eventTime ? `• ${event.eventTime}` : ''}
          </span>
        </div>
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
          <span className="material-symbols-outlined text-sm">location_on</span>
          <span>{isOnlineEvent ? 'Online Event' : (event.location || 'In-Person Event')}</span>
        </div>

        <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
          <span className="material-symbols-outlined text-sm">event_seat</span>
          <span>Available Seats: {Math.max(availableTickets, 0)}</span>
        </div>

        <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
          <span className="material-symbols-outlined text-sm">badge</span>
          <span>Organized by {organizerName}</span>
        </div>

        {event.speaker && (
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <span>🎤 {event.speaker}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div>
            {hasDiscount && !soldOut && (
              <p className="text-xs text-slate-500 line-through">₹{event.price}</p>
            )}
            <p className={`text-lg font-black ${soldOut ? 'text-slate-500' : 'text-primary'}`}>
              {soldOut ? 'Sold Out' : `₹${displayPrice}`}
            </p>
          </div>
          <Link
            to={`/event/${event._id}`}
            className="inline-flex items-center gap-1 text-sm font-bold text-slate-300 transition-colors hover:text-primary"
          >
            Details
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
