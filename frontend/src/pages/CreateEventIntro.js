import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const benefits = [
  {
    icon: 'public',
    title: 'Reach a wider audience',
    description: 'Publish technical events for learners and professionals across India.',
  },
  {
    icon: 'insights',
    title: 'Track event performance',
    description: 'Monitor registrations, seat availability, and attendee engagement.',
  },
  {
    icon: 'verified',
    title: 'Quality-first verification',
    description: 'Every submission is reviewed by admin before going live to maintain quality.',
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Sign in as client',
    description: 'Use your client account to access the event submission dashboard.',
  },
  {
    step: '02',
    title: 'Submit complete event details',
    description: 'Provide title, category, schedule, pricing, mode, image, and venue information.',
  },
  {
    step: '03',
    title: 'Admin verification',
    description: 'Admin reviews your submission and approves or rejects with comments.',
  },
  {
    step: '04',
    title: 'Go live after approval',
    description: 'Approved events are automatically visible in the public Events listing.',
  },
];

const CreateEventIntro = () => {
  const { isAuthenticated, isClient } = useAuth();

  if (isAuthenticated && isClient) {
    return <Navigate to="/client/events" replace />;
  }

  return (
    <div className="px-6 py-14">
      <SEO
        title="Create Your Event"
        description="Create and submit your event for admin verification before publishing."
      />
      <div className="mx-auto max-w-[1100px]">
        <section className="mb-14 rounded-3xl border border-white/10 bg-surface p-10 md:p-14">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-primary">
            Host with EventVibe
          </p>
          <h1 className="mb-5 text-4xl font-black text-white md:text-6xl">Create Your Event</h1>
          <p className="max-w-3xl text-lg text-slate-400">
            Build your event listing, submit it for admin verification, and publish it to our
            technology-focused audience once approved.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/login"
              className="rounded-full bg-primary px-8 py-3 font-bold text-white transition-all hover:bg-primary/90"
            >
              Sign In to Create Event
            </Link>
            <Link
              to="/events"
              className="rounded-full border border-white/20 px-8 py-3 font-bold text-slate-200 transition-all hover:border-primary/60 hover:text-white"
            >
              Browse Existing Events
            </Link>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-bold text-white">Benefits for Clients</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {benefits.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-card-dark p-6">
                <span className="material-symbols-outlined mb-3 text-3xl text-primary">
                  {item.icon}
                </span>
                <h3 className="mb-2 text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-bold text-white">Process</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {processSteps.map((item) => (
              <div key={item.step} className="rounded-2xl border border-white/10 bg-card-dark p-6">
                <p className="mb-2 text-xs font-black tracking-[0.2em] text-primary">STEP {item.step}</p>
                <h3 className="mb-2 text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CreateEventIntro;
