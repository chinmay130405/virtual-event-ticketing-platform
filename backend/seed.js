/**
 * Database Seeding Script
 * Populates database with demo events
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const User = require('./models/User');

dotenv.config();

const demoEvents = [
  {
    title: 'JavaScript Mastery Conference 2026',
    description: 'Learn advanced JavaScript concepts, async programming, and modern frameworks from industry experts. Includes hands-on workshops and networking sessions.',
    category: 'Technology',
    price: 99,
    ticketsAvailable: 500,
    ticketsSold: 150,
    eventDate: new Date('2026-03-15'),
    eventTime: '09:00',
    duration: '8 hours',
    bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    location: 'San Francisco Convention Center',
    speaker: 'Kyle Simpson',
    isActive: true,
  },
  {
    title: 'React & Next.js Workshop',
    description: 'Master React hooks, state management, and build production-ready applications with Next.js. Perfect for intermediate to advanced developers.',
    category: 'Technology',
    price: 79,
    ticketsAvailable: 300,
    ticketsSold: 85,
    eventDate: new Date('2026-03-20'),
    eventTime: '10:00',
    duration: '6 hours',
    bannerImage: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=800&q=80',
    location: 'New York Tech Hub',
    speaker: 'Vercel Team',
    isActive: true,
  },
  {
    title: 'Web Design Trends 2026',
    description: 'Explore the latest web design trends, UX best practices, and create stunning user interfaces. Learn from award-winning designers.',
    category: 'Business',
    price: 59,
    ticketsAvailable: 400,
    ticketsSold: 200,
    eventDate: new Date('2026-03-25'),
    eventTime: '14:00',
    duration: '5 hours',
    bannerImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    location: 'Los Angeles Creative Studio',
    speaker: 'Sarah Drasner',
    isActive: true,
  },
  {
    title: 'Full Stack Development Bootcamp',
    description: 'Complete guide to full stack development with MERN stack. Build real-world projects and deploy to production.',
    category: 'Technology',
    price: 149,
    ticketsAvailable: 200,
    ticketsSold: 120,
    eventDate: new Date('2026-04-01'),
    eventTime: '09:00',
    duration: '12 hours',
    bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    location: 'Austin Tech Campus',
    speaker: 'Brad Traversy',
    isActive: true,
  },
  {
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform mobile applications using React Native. Learn iOS and Android development in one codebase.',
    category: 'Technology',
    price: 89,
    ticketsAvailable: 250,
    ticketsSold: 95,
    eventDate: new Date('2026-04-05'),
    eventTime: '10:30',
    duration: '7 hours',
    bannerImage: 'https://images.unsplash.com/photo-1512941691920-25bda36dc643?w=800&q=80',
    location: 'Seattle Innovation Hub',
    speaker: 'Evan Bacon',
    isActive: true,
  },
  {
    title: 'DevOps & Cloud Architecture',
    description: 'Master Docker, Kubernetes, AWS, and cloud-native development. Build scalable infrastructure for modern applications.',
    category: 'Technology',
    price: 119,
    ticketsAvailable: 180,
    ticketsSold: 60,
    eventDate: new Date('2026-04-10'),
    eventTime: '13:00',
    duration: '8 hours',
    bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    location: 'Chicago Cloud Center',
    speaker: 'Wes Bos',
    isActive: true,
  },
  {
    title: 'UI/UX Design Masterclass',
    description: 'Learn user-centered design principles, wireframing, prototyping, and usability testing. Create products users love.',
    category: 'Education',
    price: 69,
    ticketsAvailable: 350,
    ticketsSold: 140,
    eventDate: new Date('2026-04-15'),
    eventTime: '11:00',
    duration: '6 hours',
    bannerImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    location: 'Miami Design Studio',
    speaker: 'Nielsen Norman',
    isActive: true,
  },
  {
    title: 'TypeScript Advanced Patterns',
    description: 'Dive deep into TypeScript generics, decorators, and advanced type systems. Write type-safe, maintainable code.',
    category: 'Technology',
    price: 79,
    ticketsAvailable: 280,
    ticketsSold: 110,
    eventDate: new Date('2026-04-20'),
    eventTime: '15:00',
    duration: '5 hours',
    bannerImage: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=800&q=80',
    location: 'Boston Dev Academy',
    speaker: 'Matt Pocock',
    isActive: true,
  },
  {
    title: 'Web Performance Optimization',
    description: 'Optimize your web applications for speed and efficiency. Learn Core Web Vitals, caching strategies, and performance monitoring.',
    category: 'Technology',
    price: 59,
    ticketsAvailable: 320,
    ticketsSold: 75,
    eventDate: new Date('2026-04-25'),
    eventTime: '10:00',
    duration: '4 hours',
    bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    location: 'Denver Tech Summit',
    speaker: 'Addy Osmani',
    isActive: true,
  },
  {
    title: 'GraphQL & API Design Summit',
    description: 'Build efficient APIs with GraphQL. Learn federation, subscriptions, and best practices for modern API architecture.',
    category: 'Technology',
    price: 89,
    ticketsAvailable: 240,
    ticketsSold: 130,
    eventDate: new Date('2026-05-01'),
    eventTime: '09:30',
    duration: '7 hours',
    bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    location: 'Portland Dev Conference',
    speaker: 'Laurie Barth',
    isActive: true,
  },
  {
    title: 'CSS Grid & Flexbox Mastery',
    description: 'Master modern CSS layout techniques. Create responsive, beautiful designs without frameworks.',
    category: 'Education',
    price: 49,
    ticketsAvailable: 500,
    ticketsSold: 220,
    eventDate: new Date('2026-05-05'),
    eventTime: '14:00',
    duration: '4 hours',
    bannerImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    location: 'Atlanta Creative Hub',
    speaker: 'Rachel Andrew',
    isActive: true,
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing events and users
    await Event.deleteMany({});
    console.log('🗑️  Cleared existing events');

    // Create or find admin user
    let adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123456', // Will be hashed by pre-hook
        phone: '1234567890',
        isAdmin: true,
      });
      console.log('✅ Created admin user');
    } else {
      console.log('✅ Using existing admin user');
    }

    // Add createdBy to all events
    const eventsWithCreatedBy = demoEvents.map(event => ({
      ...event,
      createdBy: adminUser._id,
    }));

    // Insert demo events
    const createdEvents = await Event.insertMany(eventsWithCreatedBy);
    console.log(`✅ Created ${createdEvents.length} demo events`);

    // Display created events
    console.log('\n📋 Demo Events Created:');
    createdEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (${event.category}) - $${event.price}`);
    });

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n🔐 Admin Credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123456');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
