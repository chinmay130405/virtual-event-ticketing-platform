/**
 * Database Seeding Script
 * Populates database with demo events
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const Order = require('./models/Order');
const User = require('./models/User');

dotenv.config();

const CODING_BANNERS = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80',
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80',
  'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80',
  'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=1200&q=80',
  'https://images.unsplash.com/photo-1526378722484-cc5c510f60d2?w=1200&q=80',
  'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=1200&q=80',
  'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?w=1200&q=80',
  'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80',
  'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=1200&q=80',
  'https://images.unsplash.com/photo-1522252234503-e356532cafd5?w=1200&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80',
  'https://images.unsplash.com/photo-1542831371-d531d36971e6?w=1200&q=80',
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&q=80',
  'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1200&q=80',
  'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1200&q=80',
  'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=1200&q=80',
  'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=1200&q=80',
  'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=1200&q=80',
  'https://images.unsplash.com/photo-1523800503107-5bc3ba2a6f81?w=1200&q=80',
  'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&q=80',
  'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=1200&q=80',
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200&q=80',
  'https://images.unsplash.com/photo-1519337265831-281ec6cc8514?w=1200&q=80',
];

const codingBanner = (lock) => CODING_BANNERS[(Number(lock) - 1) % CODING_BANNERS.length];
const PLATFORM_FEE_RATE = 0.3;
const HIGH_SALES_EVENT_COUNT = 15;
const HIGH_SALES_BANDS = [0.52, 0.55, 0.58, 0.6, 0.63];
const LOW_SALES_BANDS = [0.2, 0.22, 0.25, 0.28, 0.3];

const demoEvents = [
  {
    title: 'JavaScript Mastery Conference 2026',
    description: 'Learn advanced JavaScript concepts, async programming, and modern frameworks from industry experts. Includes hands-on workshops and networking sessions.',
    category: 'Technology',
    price: 349,
    ticketsAvailable: 380,
    ticketsSold: 0,
    eventDate: new Date('2026-03-15'),
    eventTime: '09:00',
    duration: '8 hours',
    bannerImage: codingBanner(1, 'javascript'),
    location: 'Bengaluru International Convention Centre, Bengaluru',
  eventMode: 'in-person',
    venueDescription: 'Located in the city\'s tech corridor, this venue offers enterprise-grade Wi-Fi, dual-stage projection, and breakout labs for live coding drills.',
    speaker: 'Kyle Simpson',
    organizerName: 'Aarav Sharma',
    isActive: true,
  },
  {
    title: 'React & Next.js Workshop',
    description: 'Master React hooks, state management, and build production-ready applications with Next.js. Perfect for intermediate to advanced developers.',
    category: 'Technology',
    price: 329,
    ticketsAvailable: 360,
    ticketsSold: 0,
    eventDate: new Date('2026-03-20'),
    eventTime: '10:00',
    duration: '6 hours',
    bannerImage: codingBanner(2, 'react'),
    location: 'Hyderabad Tech Park Auditorium, Hyderabad',
  eventMode: 'in-person',
    venueDescription: 'Set in HITEC City, this auditorium includes collaboration pods, interactive demo booths, and acoustics tuned for workshop-style sessions.',
    speaker: 'Vercel Team',
    organizerName: 'Ishita Kapoor',
    isActive: true,
  },
  {
    title: 'Web Design Trends 2026',
    description: 'Explore the latest web design trends, UX best practices, and create stunning user interfaces. Learn from award-winning designers.',
    category: 'Business',
    price: 319,
    ticketsAvailable: 340,
    ticketsSold: 0,
    eventDate: new Date('2026-03-25'),
    eventTime: '14:00',
    duration: '5 hours',
    bannerImage: codingBanner(3, 'uiux'),
    location: 'Kala Ghoda Creative Centre, Mumbai',
  eventMode: 'in-person',
    venueDescription: 'In the heart of Mumbai\'s art district, the venue features studio-lit halls, design critique corners, and curated networking spaces for creative professionals.',
    speaker: 'Sarah Drasner',
    organizerName: 'Neel Mehta',
    isActive: true,
  },
  {
    title: 'Full Stack Development Bootcamp',
    description: 'Complete guide to full stack development with MERN stack. Build real-world projects and deploy to production.',
    category: 'Technology',
    price: 399,
    ticketsAvailable: 320,
    ticketsSold: 0,
    eventDate: new Date('2026-04-01'),
    eventTime: '09:00',
    duration: '12 hours',
    bannerImage: codingBanner(4, 'fullstack'),
    location: 'IIT Madras Research Park, Chennai',
  eventMode: 'in-person',
    venueDescription: 'This research campus venue provides startup demo bays, cloud lab infrastructure, and mentor networking zones for full-stack practitioners.',
    speaker: 'Brad Traversy',
    organizerName: 'Ritika Bansal',
    isActive: true,
  },
  {
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform mobile applications using React Native. Learn iOS and Android development in one codebase.',
    category: 'Technology',
    price: 339,
    ticketsAvailable: 350,
    ticketsSold: 0,
    eventDate: new Date('2026-04-05'),
    eventTime: '10:30',
    duration: '7 hours',
    bannerImage: codingBanner(5, 'mobile-app'),
    location: 'Pune Innovation Hub, Pune',
  eventMode: 'in-person',
    venueDescription: 'Known for developer meetups, this hub offers device testing stations, mobile app demo pods, and mentor desks for architecture reviews.',
    speaker: 'Evan Bacon',
    organizerName: 'Kunal Verma',
    isActive: true,
  },
  {
    title: 'DevOps & Cloud Architecture',
    description: 'Master Docker, Kubernetes, AWS, and cloud-native development. Build scalable infrastructure for modern applications.',
    category: 'Technology',
    price: 389,
    ticketsAvailable: 330,
    ticketsSold: 0,
    eventDate: new Date('2026-04-10'),
    eventTime: '13:00',
    duration: '8 hours',
    bannerImage: codingBanner(6, 'devops'),
    location: 'Cyber City Convention Arena, Gurugram',
  eventMode: 'in-person',
    venueDescription: 'Built for large-scale cloud events, this arena has multi-screen command centers, live ops support desks, and high-capacity networking lounges.',
    speaker: 'Wes Bos',
    organizerName: 'Ananya Rao',
    isActive: true,
  },
  {
    title: 'UI/UX Design Masterclass',
    description: 'Learn user-centered design principles, wireframing, prototyping, and usability testing. Create products users love.',
    category: 'Education',
    price: 309,
    ticketsAvailable: 370,
    ticketsSold: 0,
    eventDate: new Date('2026-04-15'),
    eventTime: '11:00',
    duration: '6 hours',
    bannerImage: codingBanner(7, 'design-system'),
    location: 'Ahmedabad Design Collective, Ahmedabad',
  eventMode: 'in-person',
    venueDescription: 'This design-first venue includes prototyping corners, usability-testing booths, and collaborative critique tables for UX learning.',
    speaker: 'Nielsen Norman',
    organizerName: 'Dev Malhotra',
    isActive: true,
  },
  {
    title: 'TypeScript Advanced Patterns',
    description: 'Dive deep into TypeScript generics, decorators, and advanced type systems. Write type-safe, maintainable code.',
    category: 'Technology',
    price: 359,
    ticketsAvailable: 345,
    ticketsSold: 0,
    eventDate: new Date('2026-04-20'),
    eventTime: '15:00',
    duration: '5 hours',
    bannerImage: codingBanner(8, 'typescript'),
    location: 'Noida Developer Campus, Noida',
  eventMode: 'in-person',
    venueDescription: 'A developer-focused campus with advanced presentation theaters, pair-programming rooms, and mentorship cabins for deep TypeScript sessions.',
    speaker: 'Matt Pocock',
    organizerName: 'Sneha Iyer',
    isActive: true,
  },
  {
    title: 'Web Performance Optimization',
    description: 'Optimize your web applications for speed and efficiency. Learn Core Web Vitals, caching strategies, and performance monitoring.',
    category: 'Technology',
    price: 319,
    ticketsAvailable: 400,
    ticketsSold: 0,
    eventDate: new Date('2026-04-25'),
    eventTime: '10:00',
    duration: '4 hours',
    bannerImage: codingBanner(9, 'web-performance'),
    location: 'Kochi Digital Summit Hall, Kochi',
  eventMode: 'in-person',
    venueDescription: 'This waterfront summit hall offers low-latency streaming infra, real-time analytics displays, and performance testing zones for web teams.',
    speaker: 'Addy Osmani',
    organizerName: 'Vihaan Nair',
    isActive: true,
  },
  {
    title: 'GraphQL & API Design Summit',
    description: 'Build efficient APIs with GraphQL. Learn federation, subscriptions, and best practices for modern API architecture.',
    category: 'Technology',
    price: 369,
    ticketsAvailable: 335,
    ticketsSold: 0,
    eventDate: new Date('2026-05-01'),
    eventTime: '09:30',
    duration: '7 hours',
    bannerImage: codingBanner(10, 'api-backend'),
    location: 'Jaipur Tech Convention Hall, Jaipur',
  eventMode: 'in-person',
    venueDescription: 'A heritage-inspired convention hall with modern API showcase setups, partner kiosks, and panel stages designed for architecture deep-dives.',
    speaker: 'Laurie Barth',
    organizerName: 'Prisha Kulkarni',
    isActive: true,
  },
  {
    title: 'CSS Grid & Flexbox Mastery',
    description: 'Master modern CSS layout techniques. Create responsive, beautiful designs without frameworks.',
    category: 'Education',
    price: 305,
    ticketsAvailable: 390,
    ticketsSold: 0,
    eventDate: new Date('2026-05-05'),
    eventTime: '14:00',
    duration: '4 hours',
    bannerImage: codingBanner(11, 'css-frontend'),
    location: 'Indore Creative Forum, Indore',
    eventMode: 'in-person',
    venueDescription: 'A classroom-style creative forum featuring responsive layout labs, instructor-led walkthrough screens, and hands-on CSS challenge pods.',
    speaker: 'Rachel Andrew',
    organizerName: 'Arjun Sethi',
    isActive: true,
  },
  {
    title: 'AI Product Engineering Online Summit',
    description: 'A fully online summit focused on building AI-powered products, model integration, and production-ready deployment workflows.',
    category: 'Technology',
    price: 349,
    ticketsAvailable: 360,
    ticketsSold: 0,
    eventDate: new Date('2026-05-10'),
    eventTime: '11:00',
    duration: '6 hours',
    bannerImage: codingBanner(12, 'ai-webinar'),
    location: 'Online - Pan India',
    eventMode: 'online',
    venueDescription: 'Hosted on a secure virtual platform with interactive breakout rooms, speaker AMA sessions, and replay access for all registered attendees.',
    speaker: 'Shruti Khanna',
    organizerName: 'Rohan Tiwari',
    isActive: true,
  },
  {
    title: 'Remote Startup Growth Workshop',
    description: 'Learn practical startup growth frameworks, acquisition channels, and retention tactics in a live remote workshop format.',
    category: 'Business',
    price: 329,
    ticketsAvailable: 340,
    ticketsSold: 0,
    eventDate: new Date('2026-05-14'),
    eventTime: '17:30',
    duration: '4 hours',
    bannerImage: codingBanner(13, 'startup-tech'),
    location: 'Online - Live Stream',
    eventMode: 'online',
    venueDescription: 'Delivered virtually with strategy breakouts, downloadable playbooks, and moderated Q&A to support implementation after the event.',
    speaker: 'Nikita Arora',
    organizerName: 'Karan Joshi',
    isActive: true,
  },
  {
    title: 'Design Systems Live Online Bootcamp',
    description: 'A remote bootcamp on creating scalable design systems with reusable components, accessibility standards, and team workflows.',
    category: 'Education',
    price: 319,
    ticketsAvailable: 380,
    ticketsSold: 0,
    eventDate: new Date('2026-05-18'),
    eventTime: '16:00',
    duration: '5 hours',
    bannerImage: codingBanner(14, 'design-bootcamp'),
    location: 'Online - Interactive Session',
    eventMode: 'online',
    venueDescription: 'This online cohort includes live design critiques, collaborative whiteboard exercises, and post-session recording access for revision.',
    speaker: 'Megha Nanda',
    organizerName: 'Aditi Menon',
    isActive: true,
  },
  {
    title: 'Node.js API Security Workshop',
    description: 'Hands-on workshop on securing Node.js APIs with authentication, rate limiting, and robust validation techniques.',
    category: 'Technology',
    price: 339,
    ticketsAvailable: 340,
    ticketsSold: 0,
    eventDate: new Date('2026-05-22'),
    eventTime: '10:00',
    duration: '5 hours',
    bannerImage: codingBanner(15, 'nodejs-api'),
    location: 'Bengaluru Dev Center, Bengaluru',
    eventMode: 'in-person',
    venueDescription: 'A developer-first venue with lab machines, secure sandbox environments, and guided security testing stations.',
    speaker: 'Amit Kulshrestha',
    organizerName: 'Sanya Bedi',
    isActive: true,
  },
  {
    title: 'Advanced Git & CI/CD Masterclass',
    description: 'Master branching workflows, release strategies, and CI/CD pipelines for modern engineering teams.',
    category: 'Technology',
    price: 325,
    ticketsAvailable: 330,
    ticketsSold: 0,
    eventDate: new Date('2026-05-24'),
    eventTime: '14:30',
    duration: '4.5 hours',
    bannerImage: codingBanner(16, 'git-cicd'),
    location: 'Noida Engineering Hall, Noida',
    eventMode: 'in-person',
    venueDescription: 'Includes live pipeline demos, deployment rehearsal environments, and peer code review tables.',
    speaker: 'Harsh Gupta',
    organizerName: 'Naina Verma',
    isActive: true,
  },
  {
    title: 'Docker & Kubernetes in Practice',
    description: 'Deploy containerized apps, manage clusters, and implement observability workflows in this practical session.',
    category: 'Technology',
    price: 379,
    ticketsAvailable: 360,
    ticketsSold: 0,
    eventDate: new Date('2026-05-26'),
    eventTime: '09:30',
    duration: '6 hours',
    bannerImage: codingBanner(17, 'docker-kubernetes'),
    location: 'Hyderabad Cloud Lab, Hyderabad',
    eventMode: 'in-person',
    venueDescription: 'Features container labs, cluster simulation stations, and reliability engineering clinics.',
    speaker: 'Rahul Nambiar',
    organizerName: 'Simran Gill',
    isActive: true,
  },
  {
    title: 'Python for Data Engineering Online',
    description: 'Build resilient ETL pipelines and data workflows using Python, orchestration tools, and production patterns.',
    category: 'Technology',
    price: 319,
    ticketsAvailable: 390,
    ticketsSold: 0,
    eventDate: new Date('2026-05-28'),
    eventTime: '18:00',
    duration: '5 hours',
    bannerImage: codingBanner(18, 'python-data-engineering'),
    location: 'Online - Live Cohort',
    eventMode: 'online',
    venueDescription: 'Online classroom with shared notebooks, guided coding labs, and mentor office hours.',
    speaker: 'Pooja Anand',
    organizerName: 'Vikram Sood',
    isActive: true,
  },
  {
    title: 'System Design Case Study Sprint',
    description: 'Learn to break down large-scale architecture problems through real-world case studies and mock interviews.',
    category: 'Technology',
    price: 359,
    ticketsAvailable: 350,
    ticketsSold: 0,
    eventDate: new Date('2026-05-30'),
    eventTime: '11:30',
    duration: '6 hours',
    bannerImage: codingBanner(19, 'system-design'),
    location: 'Pune Architecture Studio, Pune',
    eventMode: 'in-person',
    venueDescription: 'Interactive architecture war-room format with whiteboards, case simulation tables, and reviewer panels.',
    speaker: 'Karthik Srinivasan',
    organizerName: 'Anvi Desai',
    isActive: true,
  },
  {
    title: 'Java Backend Performance Tuning',
    description: 'Profile JVM applications, optimize throughput, and reduce latency in backend-heavy systems.',
    category: 'Technology',
    price: 349,
    ticketsAvailable: 330,
    ticketsSold: 0,
    eventDate: new Date('2026-06-02'),
    eventTime: '13:30',
    duration: '5 hours',
    bannerImage: codingBanner(20, 'java-backend'),
    location: 'Chennai Backend Arena, Chennai',
    eventMode: 'in-person',
    venueDescription: 'Profiling terminals, benchmark sandboxes, and low-latency coding drills with mentors.',
    speaker: 'Vivek Menon',
    organizerName: 'Rhea Chopra',
    isActive: true,
  },
  {
    title: 'Frontend Architecture with React 19',
    description: 'Design scalable frontend systems using component boundaries, modern state models, and performance budgets.',
    category: 'Technology',
    price: 335,
    ticketsAvailable: 360,
    ticketsSold: 0,
    eventDate: new Date('2026-06-04'),
    eventTime: '10:30',
    duration: '5 hours',
    bannerImage: codingBanner(21, 'react-frontend'),
    location: 'Mumbai Frontend Studio, Mumbai',
    eventMode: 'in-person',
    venueDescription: 'Studio-style setup with live refactor segments and architecture review rounds.',
    speaker: 'Nidhi Rao',
    organizerName: 'Kabir Arora',
    isActive: true,
  },
  {
    title: 'Cloud Cost Optimization for Engineers',
    description: 'Reduce cloud spend while preserving reliability through architectural and operational improvements.',
    category: 'Technology',
    price: 329,
    ticketsAvailable: 370,
    ticketsSold: 0,
    eventDate: new Date('2026-06-06'),
    eventTime: '16:00',
    duration: '4 hours',
    bannerImage: codingBanner(22, 'cloud-optimization'),
    location: 'Online - Pan India',
    eventMode: 'online',
    venueDescription: 'Live online optimization labs with cost dashboards, scenario modelling, and architecture teardown sessions.',
    speaker: 'Ritvik Jain',
    organizerName: 'Mira Thomas',
    isActive: true,
  },
  {
    title: 'SQL Query Optimization Intensive',
    description: 'Improve query performance with indexing strategies, execution plan analysis, and schema tuning.',
    category: 'Technology',
    price: 315,
    ticketsAvailable: 380,
    ticketsSold: 0,
    eventDate: new Date('2026-06-08'),
    eventTime: '12:00',
    duration: '4.5 hours',
    bannerImage: codingBanner(23, 'sql-database'),
    location: 'Ahmedabad Data Lab, Ahmedabad',
    eventMode: 'in-person',
    venueDescription: 'Database tuning workstations and guided optimization workshops with real workloads.',
    speaker: 'Deepa Iyer',
    organizerName: 'Rohit Sen',
    isActive: true,
  },
  {
    title: 'SRE Incident Response War Games',
    description: 'Practice alert handling, postmortems, and reliability playbooks through simulated production incidents.',
    category: 'Technology',
    price: 389,
    ticketsAvailable: 320,
    ticketsSold: 0,
    eventDate: new Date('2026-06-10'),
    eventTime: '09:00',
    duration: '7 hours',
    bannerImage: codingBanner(24, 'site-reliability'),
    location: 'Gurugram Reliability Command Center, Gurugram',
    eventMode: 'in-person',
    venueDescription: 'Command-center environment with incident simulators, observability dashboards, and response scorecards.',
    speaker: 'Arpit Sethi',
    organizerName: 'Ira Kapoor',
    isActive: true,
  },
  {
    title: 'Practical AI Agents with JavaScript',
    description: 'Build production-ready AI agents using JavaScript, tool orchestration, and safety guardrails.',
    category: 'Technology',
    price: 369,
    ticketsAvailable: 345,
    ticketsSold: 0,
    eventDate: new Date('2026-06-12'),
    eventTime: '17:00',
    duration: '5.5 hours',
    bannerImage: codingBanner(25, 'ai-javascript'),
    location: 'Online - Interactive Workshop',
    eventMode: 'online',
    venueDescription: 'Live code-along workshop with sandbox tools, mentor checkpoints, and hands-on agent demos.',
    speaker: 'Aditya Bhat',
    organizerName: 'Tanya Roy',
    isActive: true,
  },
  {
    title: 'Cybersecurity for Full-Stack Teams',
    description: 'Secure frontend and backend surfaces with practical threat modelling and vulnerability mitigation.',
    category: 'Technology',
    price: 359,
    ticketsAvailable: 350,
    ticketsSold: 0,
    eventDate: new Date('2026-06-14'),
    eventTime: '11:00',
    duration: '6 hours',
    bannerImage: codingBanner(26, 'cybersecurity'),
    location: 'Delhi Security Innovation Hub, New Delhi',
    eventMode: 'in-person',
    venueDescription: 'Includes secure coding labs, attack simulation pods, and application hardening workshops.',
    speaker: 'Shalini Prasad',
    organizerName: 'Aryan Kohli',
    isActive: true,
  },
  {
    title: 'Open Source Contributor Camp',
    description: 'Learn contribution workflows, issue triage, code review practices, and maintainership fundamentals.',
    category: 'Technology',
    price: 309,
    ticketsAvailable: 400,
    ticketsSold: 0,
    eventDate: new Date('2026-06-16'),
    eventTime: '15:00',
    duration: '4 hours',
    bannerImage: codingBanner(27, 'open-source'),
    location: 'Kolkata Developer Community Hall, Kolkata',
    eventMode: 'in-person',
    venueDescription: 'Community-driven format with maintainers, guided contribution queues, and project onboarding corners.',
    speaker: 'Manas Chatterjee',
    organizerName: 'Ishaan Malik',
    isActive: true,
  },
  {
    title: 'Data Structures Interview Marathon',
    description: 'Sharpen interview problem-solving with structured drills in arrays, graphs, trees, and dynamic programming.',
    category: 'Technology',
    price: 319,
    ticketsAvailable: 390,
    ticketsSold: 0,
    eventDate: new Date('2026-06-18'),
    eventTime: '10:00',
    duration: '6 hours',
    bannerImage: codingBanner(28, 'data-structures'),
    location: 'Online - Live Problem Solving',
    eventMode: 'online',
    venueDescription: 'Timed coding rounds, live editorial walkthroughs, and performance review sessions with interview mentors.',
    speaker: 'Pranav Nair',
    organizerName: 'Suhani Batra',
    isActive: true,
  },
  {
    title: 'Microservices Observability Workshop',
    description: 'Implement tracing, logs, and metrics to debug distributed services and improve reliability outcomes.',
    category: 'Technology',
    price: 349,
    ticketsAvailable: 340,
    ticketsSold: 0,
    eventDate: new Date('2026-06-20'),
    eventTime: '14:00',
    duration: '5 hours',
    bannerImage: codingBanner(29, 'observability'),
    location: 'Bengaluru Platform Engineering Lab, Bengaluru',
    eventMode: 'in-person',
    venueDescription: 'Distributed tracing labs, dashboard authoring stations, and guided troubleshooting scenarios.',
    speaker: 'Neeraj Pillai',
    organizerName: 'Rashi Gupta',
    isActive: true,
  },
  {
    title: 'Practical Rust for Backend Systems',
    description: 'Explore memory-safe backend development with Rust, including APIs, concurrency, and performance tuning.',
    category: 'Technology',
    price: 379,
    ticketsAvailable: 330,
    ticketsSold: 0,
    eventDate: new Date('2026-06-22'),
    eventTime: '09:30',
    duration: '6 hours',
    bannerImage: codingBanner(30, 'rust-programming'),
    location: 'Hyderabad Systems Engineering Hub, Hyderabad',
    eventMode: 'in-person',
    venueDescription: 'Backend lab with performance profiling rigs, API implementation tracks, and concurrency challenge rounds.',
    speaker: 'Rudra Vyas',
    organizerName: 'Aarohi Singh',
    isActive: true,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    await Event.deleteMany({});
  await Order.deleteMany({});
    console.log('🗑️  Cleared existing events');
  console.log('🗑️  Cleared existing orders');

    const adminUser = await User.findOne({ role: 'admin' });
    const createdBy = adminUser ? adminUser._id : new mongoose.Types.ObjectId('000000000000000000000001');

    let clientUser = await User.findOne({ email: 'client@gmail.com' }).select('+password');
    if (!clientUser) {
      clientUser = await User.create({
        name: 'Client User',
        email: 'client@gmail.com',
        password: 'password',
        role: 'client',
      });
      console.log('✅ Created demo client account (client@gmail.com)');
    } else {
      clientUser.role = 'client';
      clientUser.password = 'password';
      await clientUser.save();
      console.log('✅ Updated demo client account credentials (client@gmail.com)');
    }

    const eventsWithCreatedBy = demoEvents.map(event => ({
      ...event,
      createdBy,
      approvalStatus: 'approved',
      approvalComment: 'Seeded approved event',
      verifiedAt: new Date(),
      verifiedBy: createdBy,
      status: 'published',
      isActive: true,
    }));

    // Insert demo events
    const createdEvents = await Event.insertMany(eventsWithCreatedBy);
    console.log(`✅ Created ${createdEvents.length} demo events`);

    const buyerProfiles = [
      { name: 'Priya Nair', email: 'priya.user@gmail.com' },
      { name: 'Rahul Bhatia', email: 'rahul.user@gmail.com' },
      { name: 'Aisha Khan', email: 'aisha.user@gmail.com' },
      { name: 'Devansh Arora', email: 'devansh.user@gmail.com' },
      { name: 'Neha Sharma', email: 'neha.user@gmail.com' },
      { name: 'Vivek Suri', email: 'vivek.user@gmail.com' },
    ];

    const buyers = [];
    for (const profile of buyerProfiles) {
      let buyer = await User.findOne({ email: profile.email }).select('+password');
      if (!buyer) {
        buyer = await User.create({
          name: profile.name,
          email: profile.email,
          password: 'password',
          role: 'user',
        });
      } else {
        buyer.role = 'user';
        buyer.password = 'password';
        await buyer.save();
      }

      buyers.push(buyer);
    }

    const now = Date.now();
    const mockOrders = [];
  let seededOrderSequence = 1;
  let seededTicketSequence = 1;

    const buildOrderRecord = ({
      event,
      buyer,
      quantity,
      paymentMethod,
      neftVerificationStatus,
      paymentStatus,
      orderStatus,
      createdAt,
      updatedAt,
      note,
      reference,
    }) => {
      const orderSequence = seededOrderSequence++;
      const ticketSequence = seededTicketSequence++;
      const totalAmount = Number((event.price * quantity).toFixed(2));
      const commissionAmount = Number((totalAmount * PLATFORM_FEE_RATE).toFixed(2));
      const organizerPayoutAmount = Number((totalAmount - commissionAmount).toFixed(2));

      return {
        user: buyer._id,
        tickets: [
          {
            ticketNumber: `TKT-SEED-${Date.now()}-${ticketSequence}`,
            event: event._id,
            eventTitle: event.title,
            eventDate: event.eventDate,
            eventTime: event.eventTime,
            quantity,
            unitPrice: event.price,
          },
        ],
        orderNumber: `ORD-SEED-${Date.now()}-${orderSequence}`,
        totalAmount,
        commissionRate: PLATFORM_FEE_RATE,
        commissionAmount,
        organizerPayoutAmount,
        payoutStatus: orderStatus === 'confirmed' ? 'pending' : 'not_applicable',
        payoutMethod: paymentMethod === 'neft' ? 'neft' : 'razorpay',
        paymentStatus,
        orderStatus,
        attendeeEmail: buyer.email,
        attendeeName: buyer.name,
        paymentMethod,
        neftReferenceNumber: paymentMethod === 'neft' ? reference || `UTR${Date.now()}` : '',
        neftVerificationStatus,
        ticketsInventoryState: orderStatus === 'confirmed' ? 'sold' : 'reserved',
        organizerSettlement: {
          organizer: event.createdBy,
          event: event._id,
        },
        notes: note,
        createdAt,
        updatedAt,
      };
    };

    createdEvents.forEach((event, index) => {
      const buyer = buyers[index % buyers.length];
      const isHighSalesEvent = index < HIGH_SALES_EVENT_COUNT;
      const targetOccupancy = isHighSalesEvent
        ? HIGH_SALES_BANDS[index % HIGH_SALES_BANDS.length]
        : LOW_SALES_BANDS[index % LOW_SALES_BANDS.length];
      const soldQuantity = Math.max(1, Math.floor(event.ticketsAvailable * targetOccupancy));
      const createdAt = new Date(now - (index + 2) * 86400000);

      mockOrders.push(
        buildOrderRecord({
          event,
          buyer,
          quantity: soldQuantity,
          paymentMethod: 'razorpay',
          neftVerificationStatus: 'pending',
          paymentStatus: 'completed',
          orderStatus: 'confirmed',
          createdAt,
          updatedAt: createdAt,
          note: `Seeded ${Math.round(targetOccupancy * 100)}% ticket sell-through`,
          reference: '',
        })
      );

      if (index < 6) {
        const neftBuyer = buyers[(index + 2) % buyers.length];
        const neftStatuses = ['verified', 'rejected', 'verified', 'rejected', 'verified', 'pending'];
        const neftVerificationStatus = neftStatuses[index];
        const neftPaymentStatus =
          neftVerificationStatus === 'verified'
            ? 'completed'
            : neftVerificationStatus === 'rejected'
              ? 'failed'
              : 'pending';
        const neftOrderStatus = neftPaymentStatus === 'completed' ? 'confirmed' : 'pending';
        const neftCreatedAt = new Date(now - (index + 1) * 21600000);
        const neftUpdatedAt = new Date(now - (index + 1) * 3600000);

        mockOrders.push(
          buildOrderRecord({
            event,
            buyer: neftBuyer,
            quantity: 3 + index,
            paymentMethod: 'neft',
            neftVerificationStatus,
            paymentStatus: neftPaymentStatus,
            orderStatus: neftOrderStatus,
            createdAt: neftCreatedAt,
            updatedAt: neftUpdatedAt,
            note: 'Seeded NEFT verification sample order',
            reference: `NEFT${100000 + index}`,
          })
        );
      }
    });

    await Order.insertMany(mockOrders);
    console.log(`✅ Created ${mockOrders.length} mock orders`);

    // Display created events
    console.log('\n📋 Demo Events Created:');
    createdEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (${event.category}) - ₹${event.price}`);
    });

    const confirmedOrders = mockOrders.filter((order) => order.orderStatus === 'confirmed');
    const grossSales = confirmedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const platformProfit = grossSales * PLATFORM_FEE_RATE;
    console.log(`\n💰 Seeded Gross Sales: ₹${grossSales.toFixed(2)}`);
    console.log(`💹 Seeded Platform Profit (30%): ₹${platformProfit.toFixed(2)}`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📝 Note: Admin account should be configured via server startup or .env');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
