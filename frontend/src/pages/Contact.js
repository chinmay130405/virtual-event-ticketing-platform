import React, { useState } from 'react';

const FAQ_DATA = [
  {
    question: 'How do I request a refund?',
    answer:
      "Refunds can be requested through your account dashboard under 'Order History'. Simply select the event and click 'Request Refund'. Note that refund policies vary by event organizer.",
  },
  {
    question: 'Can I transfer my ticket?',
    answer:
      'Tickets can be transferred through your account. Go to My Tickets, select the event, and use the transfer option to send tickets to another user.',
  },
  {
    question: 'Event cancellation policy',
    answer:
      'If an event is cancelled by the organizer, you will receive a full refund automatically within 5-7 business days.',
  },
  {
    question: 'How to access virtual events?',
    answer:
      'After purchasing, go to My Tickets and click on the event to access the stream link. You can join from any device with internet access.',
  },
  {
    question: 'Payment security & safety',
    answer:
      'We use industry-standard 256-bit SSL encryption for all transactions. Your payment information is never stored on our servers.',
  },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    orderNumber: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', orderNumber: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div>
      <main className="mx-auto max-w-[1200px] px-6">
        <section className="py-20 text-center">
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Support
          </span>
          <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
            Get In <span className="text-primary">Touch</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Have a question? We're here to help you navigate your next virtual experience.
          </p>
        </section>

        <section className="mb-24 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col items-center rounded-lg border border-white/5 bg-card-dark p-8 text-center transition-all hover:border-primary/30 hover:shadow-[0_0_20px_rgba(233,32,143,0.15)]">
            <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined text-3xl text-primary">mail</span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Email Us</h3>
            <p className="mb-1 font-medium text-primary">support@eventvibe.com</p>
            <p className="text-sm text-slate-500">Within 24 hours</p>
          </div>

          <div className="flex flex-col items-center rounded-lg border border-white/5 bg-card-dark p-8 text-center transition-all hover:border-primary/30 hover:shadow-[0_0_20px_rgba(233,32,143,0.15)]">
            <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined text-3xl text-primary">chat_bubble</span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Live Chat</h3>
            <p className="mb-4 text-slate-400">Available 24/7</p>
            <button className="rounded-full bg-primary px-8 py-2 text-sm font-bold text-white transition-transform hover:scale-105">
              Start Chat
            </button>
          </div>

          <div className="flex flex-col items-center rounded-lg border border-white/5 bg-card-dark p-8 text-center transition-all hover:border-primary/30 hover:shadow-[0_0_20px_rgba(233,32,143,0.15)]">
            <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined text-3xl text-primary">call</span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Call Us</h3>
            <p className="mb-1 font-medium text-primary">+91 80 4567 8901</p>
            <p className="text-sm text-slate-500">Mon-Fri, 9AM-6PM IST</p>
          </div>
        </section>

        <section className="mb-24 grid grid-cols-1 items-start gap-12 lg:grid-cols-[55%_40%] lg:gap-[5%]">
          <div className="rounded-lg border border-white/5 bg-card-dark p-8 md:p-10">
            <h2 className="mb-8 text-2xl font-bold text-white">Send Us a Message</h2>

            {submitted && (
              <div className="mb-6 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Your message has been sent! We'll get back to you soon.
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Full Name</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50"
                    placeholder="John Doe"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Email Address</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50"
                    placeholder="john@example.com"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Subject</label>
                  <select
                    className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="">General Inquiry</option>
                    <option value="order">Order Issue</option>
                    <option value="refund">Refund Request</option>
                    <option value="technical">Technical Support</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Order Number (Optional)</label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50"
                    placeholder="#EV-12345"
                    type="text"
                    name="orderNumber"
                    value={formData.orderNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Message</label>
                <textarea
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50"
                  placeholder="How can we help you?"
                  rows="4"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <button
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition-colors hover:text-white"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xl">attach_file</span>
                  Attach Files
                </button>
                <button className="w-full rounded-full bg-primary px-10 py-3 font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(233,32,143,0.4)] sm:w-auto">
                  Send Message
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="mb-4 text-2xl font-bold text-white">Frequently Asked Questions</h2>
            {FAQ_DATA.map((faq, index) => {
              const isExpanded = expandedFaq === index;
              return (
                <div
                  key={faq.question}
                  className={`overflow-hidden rounded-lg border bg-card-dark transition-all ${
                    isExpanded ? 'border-primary/30' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <button
                    className="flex w-full items-center justify-between p-5 text-left"
                    onClick={() => setExpandedFaq(isExpanded ? -1 : index)}
                  >
                    <span className="font-semibold text-white">{faq.question}</span>
                    <span
                      className={`material-symbols-outlined text-primary ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      expand_more
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{faq.answer}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-24">
          <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-white/5 bg-card-dark lg:grid-cols-2">
            <div className="flex flex-col justify-center p-10">
              <h2 className="mb-4 text-3xl font-bold text-white">Our Office</h2>
              <p className="mb-8 max-w-sm text-slate-400">
                Prefer meeting in person? Our support team is available at our Bengaluru
                headquarters for scheduled consultations.
              </p>
              <div className="mb-10 flex items-start gap-4">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <div>
                  <p className="font-semibold text-white">12 MG Road</p>
                  <p className="text-slate-500">Bengaluru, Karnataka 560001</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <a className="text-slate-400 transition-colors hover:text-primary" href="https://example.com" aria-label="Instagram">
                  <span className="material-symbols-outlined">language</span>
                </a>
                <a className="text-slate-400 transition-colors hover:text-primary" href="https://example.com" aria-label="Twitter">
                  <span className="material-symbols-outlined">share</span>
                </a>
                <a className="text-slate-400 transition-colors hover:text-primary" href="https://example.com" aria-label="Facebook">
                  <span className="material-symbols-outlined">campaign</span>
                </a>
              </div>
            </div>

            <div className="group relative h-[400px] bg-slate-800 lg:h-auto">
              <div className="absolute inset-0 z-10 bg-primary/10 transition-colors group-hover:bg-transparent"></div>
              <img
                className="h-full w-full object-cover opacity-60 grayscale"
                src="https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800"
                alt="Map"
              />
              <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <span className="material-symbols-outlined text-5xl text-primary drop-shadow-[0_0_15px_rgba(233,32,143,0.8)]">
                  location_on
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-24">
          <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-12 text-center">
            <div className="absolute -right-24 -top-24 size-64 rounded-full bg-primary/10 blur-[100px]"></div>
            <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-primary/10 blur-[100px]"></div>
            <h2 className="mb-4 text-3xl font-bold text-white">Still Need Help?</h2>
            <p className="mx-auto mb-8 max-w-lg text-slate-400">
              Search our comprehensive help center for detailed guides, tutorials, and common
              troubleshooting tips.
            </p>
            <button className="rounded-full bg-primary px-10 py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-105">
              Browse Help Center
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;
