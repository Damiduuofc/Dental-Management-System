import PDFDocument from 'pdfkit';

/**
 * Generates an appointment confirmation receipt PDF in memory.
 * Returns a Promise that resolves to a Buffer.
 */
export const generateAppointmentReceiptPdf = (patientName, appointment) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fillColor('#0ea5e9').fontSize(24).text('DentCare Dental Clinic', { align: 'center' });
      doc.moveDown(1);

      doc.fillColor('#475569').fontSize(12).text(`Receipt Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.text(`Receipt Reference: DENT-${appointment._id.toString().substring(18).toUpperCase()}`, { align: 'right' });
      doc.moveDown(1.5);

      // Section Title
      doc.fillColor('#0f172a').fontSize(16).text('APPOINTMENT BOOKING RECEIPT', { align: 'center', underline: true });
      doc.moveDown(2);

      // Receipt details
      const startX = 100;
      let currentY = doc.y;

      const drawRow = (label, value) => {
        doc.fillColor('#64748b').fontSize(11).text(label, startX, currentY);
        doc.fillColor('#0f172a').fontSize(11).text(value, startX + 150, currentY);
        currentY += 24;
      };

      drawRow('Patient Name:', patientName);
      drawRow('Treatment:', appointment.treatment);
      drawRow('Doctor:', `Dr. ${appointment.dentist?.fullName || 'N/A'}`);
      drawRow('Appointment Date:', new Date(appointment.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
      drawRow('Time Slot:', appointment.time);
      drawRow('Status:', appointment.status);
      
      if (appointment.notes) {
        drawRow('Notes:', appointment.notes);
      }

      // Footer notes
      doc.moveDown(4);
      doc.fillColor('#64748b').fontSize(10).text('Please arrive 15 minutes prior to your scheduled time.', { align: 'center' });
      doc.text('For cancellations or rescheduling, please contact us at least 24 hours in advance.', { align: 'center' });
      
      doc.moveDown(2);
      doc.text('Thank you for choosing DentCare Clinic!', { align: 'center', fontStyle: 'italic' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
