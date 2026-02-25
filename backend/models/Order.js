/**
 * Order Model
 * Schema for customer orders and tickets
 */

const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  eventTitle: String,
  eventDate: Date,
  eventTime: String,
  quantity: Number,
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tickets: [ticketSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    orderStatus: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    // Attendee details
    attendeeEmail: {
      type: String,
      required: true,
    },
    attendeeName: {
      type: String,
      required: true,
    },
    attendeePhone: String,
    // Billing address
    billingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    // Payment info (mock)
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal'],
      default: 'credit_card',
    },
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Generate ticket numbers before saving
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.tickets.forEach((ticket, index) => {
      if (!ticket.ticketNumber) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 100000);
        ticket.ticketNumber = `TKT-${timestamp}-${index}-${random}`;
      }
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
