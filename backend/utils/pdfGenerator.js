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

export const generateBillingReceiptPdf = (patientName, bill) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fillColor('#0d9488').fontSize(24).text('DentCare Dental Clinic', { align: 'center' });
      doc.moveDown(1);

      doc.fillColor('#475569').fontSize(12).text(`Billing Date: ${new Date(bill.date || bill.createdAt || new Date()).toLocaleDateString()}`, { align: 'right' });
      doc.text(`Receipt Reference: INV-${bill._id.toString().substring(18).toUpperCase()}`, { align: 'right' });
      doc.moveDown(1.5);

      // Section Title
      doc.fillColor('#0f172a').fontSize(16).text('OFFICIAL PAYMENT RECEIPT', { align: 'center', underline: true });
      doc.moveDown(2);

      // Receipt details
      const startX = 100;
      let currentY = doc.y;

      const drawRow = (label, value) => {
        doc.fillColor('#64748b').fontSize(11).text(label, startX, currentY);
        doc.fillColor('#0f172a').fontSize(11).text(value, startX + 170, currentY);
        currentY += 24;
      };

      drawRow('Patient Name:', patientName);
      
      if (bill.items && bill.items.length > 0) {
        currentY += 10;
        doc.fillColor('#0f172a').fontSize(12).text('Itemized Details:', startX, currentY, { underline: true });
        currentY += 24;

        // Draw headers
        doc.fillColor('#64748b').fontSize(10).text('Service/Treatment', startX, currentY);
        doc.text('Cost', startX + 250, currentY, { align: 'right', width: 100 });
        currentY += 18;

        // Draw divider
        doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(startX, currentY).lineTo(startX + 350, currentY).stroke();
        currentY += 8;

        bill.items.forEach(item => {
          doc.fillColor('#334155').fontSize(10).text(item.name, startX, currentY);
          doc.text(`Rs. ${Number(item.cost).toLocaleString()}`, startX + 250, currentY, { align: 'right', width: 100 });
          currentY += 18;
        });

        currentY += 10;
        // Draw total divider
        doc.strokeColor('#cbd5e1').lineWidth(1.5).moveTo(startX, currentY).lineTo(startX + 350, currentY).stroke();
        currentY += 8;

        doc.fillColor('#0f172a').fontSize(11).text('Total Invoice Amount:', startX, currentY);
        doc.text(`Rs. ${Number(bill.amount).toLocaleString()}`, startX + 250, currentY, { align: 'right', width: 100 });
        currentY += 30;

        drawRow('Payment Method:', bill.paymentMethod || 'N/A');
        drawRow('Payment Status:', bill.status);
      } else {
        drawRow('Treatment / Service:', bill.treatment);
        drawRow('Payment Amount:', `Rs. ${Number(bill.amount).toLocaleString()}`);
        drawRow('Payment Method:', bill.paymentMethod || 'N/A');
        drawRow('Payment Status:', bill.status);
      }

      // Footer notes
      doc.moveDown(4);
      doc.fillColor('#64748b').fontSize(10).text('This is a computer-generated official receipt.', { align: 'center' });
      doc.text('No signature is required. For inquiries, contact billing@dentcare.com.', { align: 'center' });
      
      doc.moveDown(2);
      doc.text('Thank you for your payment!', { align: 'center', fontStyle: 'italic' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
