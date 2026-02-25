/**
 * Email Service Utility
 * Mock email service for ticket confirmations
 */

const sendTicketConfirmation = async (email, orderData) => {
  try {
    // In production, use nodemailer or email service
    // For now, we'll just log it
    console.log('📧 Email would be sent to:', email);
    console.log('📧 Subject: Your Event Ticket Confirmation');
    console.log('📧 Order Details:', orderData);

    // Mock email template
    const emailContent = `
      Dear ${orderData.attendeeName},

      Thank you for your purchase! Here are your event tickets:

      Order Number: ${orderData.orderNumber}
      Total Amount: $${orderData.totalAmount}
      Date: ${new Date().toLocaleDateString()}

      Tickets:
      ${orderData.tickets
        .map(
          (ticket) => `
        - Ticket #${ticket.ticketNumber}
          Event: ${ticket.eventTitle}
          Date: ${new Date(ticket.eventDate).toLocaleDateString()}
          Time: ${ticket.eventTime}
      `
        )
        .join('\n')}

      You can view your tickets anytime on your dashboard.

      Thank you for attending our events!
      Best regards,
      Virtual Event Ticketing Team
    `;

    console.log('📧 Email Body:', emailContent);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

module.exports = { sendTicketConfirmation };
