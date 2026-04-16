/**
 * Migration: add role to users from legacy data
 * Usage: node migrations/addRoles.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { normalizeRole } = require('../utils/roles');

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is required');
    }

    await mongoose.connect(process.env.MONGO_URI);

    const users = await User.find().select('_id role');
    let updatedCount = 0;

    for (const user of users) {
      const nextRole = normalizeRole(user.role);

      if (user.role !== nextRole) {
        user.role = nextRole;
        await user.save({ validateBeforeSave: false });
        updatedCount += 1;
      }
    }

    console.log(`Role migration completed. Updated ${updatedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Role migration failed:', error.message);
    process.exit(1);
  }
};

run();
