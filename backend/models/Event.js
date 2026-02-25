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
    price: {
      type: Number,
      required: [true, 'Please provide ticket price'],
      min: [0, 'Price cannot be negative'],
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
    speaker: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for search functionality
eventSchema.index({ title: 'text', description: 'text', category: 1 });

module.exports = mongoose.model('Event', eventSchema);
