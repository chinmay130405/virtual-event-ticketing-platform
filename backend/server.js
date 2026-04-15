/**
 * Virtual Event Ticketing Platform - Backend Server
 * Main application entry point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { genericLimiter } = require('./middleware/rateLimiter');
const User = require('./models/User');
const { normalizeRole } = require('./utils/roles');

const bootstrapAdminAccount = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not configured in .env');
    return;
  }

  try {
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        phone: '1234567890',
        role: 'admin',
        isAdmin: true,
      });
      console.log(`✅ Admin account created: ${adminEmail}`);
    } else if (!adminUser.isAdmin || normalizeRole(adminUser.role, adminUser.isAdmin) !== 'admin') {
      adminUser.isAdmin = true;
      adminUser.role = 'admin';
      await adminUser.save();
      console.log(`✅ Admin privileges enabled for: ${adminEmail}`);
    } else {
      console.log(`✅ Admin account verified: ${adminEmail}`);
    }
  } catch (error) {
    console.error('❌ Error bootstrapping admin account:', error.message);
  }
};

const startServer = async () => {
  await connectDB();
  await bootstrapAdminAccount();

  const app = express();

  app.use(helmet());

  app.use(cors());

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(mongoSanitize());

  app.use(xss());

  app.use(hpp());

  app.use(genericLimiter);

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/events', require('./routes/events'));
  app.use('/api/cart', require('./routes/cart'));
  app.use('/api/payments', require('./routes/paymentRoutes'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/organizer', require('./routes/organizer'));
  app.use('/api/inventory', require('./routes/inventory'));
  app.use('/api/support', require('./routes/support'));
  app.use('/api/crm', require('./routes/crm'));
  app.use('/api/erp', require('./routes/erp'));
  app.use('/api/marketing', require('./routes/marketing'));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date(),
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║   Virtual Event Ticketing Platform - Backend         ║
  ║   🚀 Server running on http://localhost:${PORT}        ║
  ║   🔌 Connected to MongoDB                            ║
  ╚═══════════════════════════════════════════════════════╝
    `);
  });

  module.exports = app;
};

startServer();
