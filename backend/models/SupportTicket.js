/**
 * Support Ticket Model
 * Stores customer support issues
 */

const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    status: {
      type: String,
      enum: ['open', 'pending', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
