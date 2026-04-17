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
  unitPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
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
    subtotalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    couponOwner: {
      type: String,
      default: '',
      trim: true,
    },
    couponDiscountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 20,
    },
    couponDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userPlatformFeeRate: {
      type: Number,
      default: 0.02,
      min: 0,
      max: 1,
    },
    userPlatformFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commissionRate: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 1,
    },
    commissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    organizerPayoutAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    payoutStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'processing', 'paid', 'failed'],
      default: 'not_applicable',
    },
    payoutMethod: {
      type: String,
      enum: ['none', 'razorpay', 'bank_transfer', 'neft'],
      default: 'none',
    },
    payoutRequestedAt: {
      type: Date,
      default: null,
    },
    payoutProcessedAt: {
      type: Date,
      default: null,
    },
    payoutReference: {
      type: String,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    orderStatus: {
      type: String,
      enum: ['confirmed', 'cancelled', 'refunded', 'pending'],
      default: 'confirmed',
    },
    refundedAt: {
      type: Date,
      default: null,
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
    // Payment info
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'razorpay', 'neft'],
      default: 'razorpay',
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    neftReferenceNumber: {
      type: String,
      default: '',
    },
    neftVerificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    ticketsInventoryState: {
      type: String,
      enum: ['sold', 'reserved', 'released'],
      default: 'sold',
    },
    notes: String,
    organizerSettlement: {
      organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null,
      },
    },
    referralSource: {
      type: String,
      default: null,
    },
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
