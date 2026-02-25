/**
 * PDF Ticket Generation Utility
 * Mock PDF generation for tickets
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate ticket PDF
 * @param {object} ticketData - Ticket data
 * @returns {Promise<string>} Path to generated PDF
 */
const generateTicketPDF = async (ticketData) => {
  return new Promise((resolve, reject) => {
    try {
      // Create tickets directory if it doesn't exist
      const ticketsDir = path.join(__dirname, '../tickets');
      if (!fs.existsSync(ticketsDir)) {
        fs.mkdirSync(ticketsDir);
      }

      // Create PDF
      const doc = new PDFDocument();
      const filename = `ticket-${ticketData.ticketNumber}.pdf`;
      const filepath = path.join(ticketsDir, filename);
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc
        .fontSize(25)
        .font('Helvetica-Bold')
        .text('EVENT TICKET', 50, 50);

      // Ticket number
      doc
        .fontSize(11)
        .font('Helvetica')
        .text(`Ticket #: ${ticketData.ticketNumber}`, 50, 100);

      // Event details
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Event Details', 50, 150);

      doc
        .fontSize(11)
        .font('Helvetica')
        .text(`Event: ${ticketData.eventTitle}`, 50, 180)
        .text(`Date: ${new Date(ticketData.eventDate).toLocaleDateString()}`, 50, 200)
        .text(`Time: ${ticketData.eventTime}`, 50, 220)
        .text(`Quantity: ${ticketData.quantity}`, 50, 240);

      // Attendee info
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Attendee Information', 50, 290);

      doc
        .fontSize(11)
        .font('Helvetica')
        .text(`Name: ${ticketData.attendeeName}`, 50, 320)
        .text(`Email: ${ticketData.attendeeEmail}`, 50, 340);

      // Footer
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Valid for one person only. Non-transferable.', 50, 500);

      doc.text('Thank you for your purchase!', 50, 520);

      doc.end();

      stream.on('finish', () => {
        console.log(`✅ PDF generated: ${filename}`);
        resolve(filepath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateTicketPDF };
