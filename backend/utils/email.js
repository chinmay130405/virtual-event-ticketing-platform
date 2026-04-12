/**
 * Email Service Utility
 * Mock email service for ticket confirmations
 */

const sendTicketConfirmation = async (email, orderData) => {
  try {
    console.log('📧 Email would be sent to:', email);
    console.log('📧 Subject: Your Event Ticket Confirmation');
    console.log('📧 Order Details:', orderData);

    const emailContent = `
      Dear ${orderData.attendeeName},

      Thank you for your purchase! Here are your event tickets:

      Order Number: ${orderData.orderNumber}
      Total Amount: ₹${orderData.totalAmount}
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

const sendRefundConfirmation = async (email, orderData) => {
  try {
    console.log('📧 Refund email would be sent to:', email);
    console.log('📧 Subject: Your Refund Confirmation');
    console.log('📧 Refund Order Details:', orderData);

    const emailContent = `
      Dear Customer,

      Your refund has been processed successfully.

      Order Number: ${orderData.orderNumber}
      Refunded Amount: ₹${orderData.totalAmount}
      Refund Date: ${new Date(orderData.refundedAt).toLocaleDateString()}

      The refunded amount will be credited back to your original payment method within 5-7 business days.

      If you have any questions, please contact our support team.

      Best regards,
      Virtual Event Ticketing Team
    `;

    console.log('📧 Refund Email Body:', emailContent);
    return true;
  } catch (error) {
    console.error('Refund email error:', error);
    return false;
  }
};

module.exports = { sendTicketConfirmation, sendRefundConfirmation };
