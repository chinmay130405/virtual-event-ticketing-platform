/**
 * Event Model
 * Schema for virtual events/products
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide event title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide event description'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: ['Technology', 'Business', 'Entertainment', 'Sports', 'Education', 'Other'],
      default: 'Other',
    },
    tags: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: [true, 'Please provide ticket price'],
      min: [0, 'Price cannot be negative'],
    },
    discountPercent: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [80, 'Discount cannot exceed 80%'],
      default: 0,
    },
    ticketsAvailable: {
      type: Number,
      required: [true, 'Please provide number of tickets'],
      min: [0, 'Tickets cannot be negative'],
    },
    ticketsSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    ticketsReserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    eventDate: {
      type: Date,
      required: [true, 'Please provide event date'],
    },
    eventTime: {
      type: String,
      required: [true, 'Please provide event time (HH:MM)'],
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'],
    },
    duration: {
      type: String,
      default: '2 hours', // Duration in hours
    },
    bannerImage: {
      type: String,
      default: 'https://via.placeholder.com/800x400?text=Virtual+Event',
    },
    location: {
      type: String,
      default: 'Online',
    },
    eventMode: {
      type: String,
      enum: ['online', 'in-person', 'hybrid'],
      default: 'in-person',
    },
    speaker: {
      type: String,
      default: '',
    },
    venueDescription: {
      type: String,
      trim: true,
      maxlength: [1000, 'Venue description cannot exceed 1000 characters'],
      default: '',
    },
    organizerName: {
      type: String,
      trim: true,
      default: '',
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    highlightWeeks: {
      type: Number,
      min: [0, 'Highlight weeks cannot be negative'],
      max: [52, 'Highlight weeks cannot exceed 52'],
      default: 0,
    },
    highlightUntil: {
      type: Date,
      default: null,
    },
    highlightFeePaid: {
      type: Number,
      min: [0, 'Highlight fee cannot be negative'],
      default: 0,
    },
    platformFeeRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.3,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'completed', 'cancelled'],
      default: 'draft',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    approvalComment: {
      type: String,
      trim: true,
      maxlength: [500, 'Approval comment cannot exceed 500 characters'],
      default: '',
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
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
      default: 0,
    },
    resourcesRequired: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for search functionality
eventSchema.index({ title: 'text', description: 'text', category: 1, tags: 1 });

module.exports = mongoose.model('Event', eventSchema);
