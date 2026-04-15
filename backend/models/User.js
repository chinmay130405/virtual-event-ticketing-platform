/**
 * User Model
 * Schema for user data with authentication fields
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'organizer', 'admin'],
      default: 'user',
    },
    commissionRate: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 1,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    preferences: {
      type: [String],
      default: [],
    },
    companyName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    gstNumber: {
      type: String,
      default: '',
      uppercase: true,
      trim: true,
    },
    venueRegistration: {
      type: String,
      default: '',
      trim: true,
    },
    businessAddress: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Business address cannot exceed 500 characters'],
    },
    verificationStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    verificationReason: {
      type: String,
      default: '',
      maxlength: [500, 'Verification reason cannot exceed 500 characters'],
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        default: '',
        trim: true,
      },
      accountNumber: {
        type: String,
        default: '',
        trim: true,
      },
      ifscCode: {
        type: String,
        default: '',
        uppercase: true,
        trim: true,
      },
      bankName: {
        type: String,
        default: '',
        trim: true,
      },
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    referralSource: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
