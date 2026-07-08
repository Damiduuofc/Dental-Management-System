import nodemailer from 'nodemailer';

/**
 * Sends a 6-digit OTP code to the patient's email.
 * Falls back to logging to server console if no SMTP credentials are provided.
 */
export const sendOtpEmail = async (email, otp) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailService = process.env.EMAIL_SERVICE || 'gmail';

  if (!emailUser || !emailPass) {
    console.log('\n=========================================');
    console.log(`🔑 [DEVELOPMENT OTP] Code for patient ${email}:`);
    console.log(`👉 OTP: ${otp} 👈`);
    console.log(`Validity: Expires in 10 minutes`);
    console.log('=========================================\n');
    return { success: true, message: 'OTP logged to server console (development mode).' };
  }

  try {
    // Strip all standard and non-breaking spaces (NBSP) from the password
    const cleanPass = emailPass.replace(/[\s\u00a0]/g, '');

    let transportConfig = {
      auth: {
        user: emailUser,
        pass: cleanPass,
      },
    };

    if (process.env.EMAIL_HOST && process.env.EMAIL_HOST.toLowerCase().includes('gmail')) {
      // Use built-in Gmail service configuration for best reliability
      transportConfig.service = 'gmail';
    } else {
      // Use custom SMTP server config (e.g., Mailtrap)
      transportConfig.host = process.env.EMAIL_HOST;
      transportConfig.port = parseInt(process.env.EMAIL_PORT || '587');
      transportConfig.secure = process.env.EMAIL_PORT === '465';
      transportConfig.tls = {
        rejectUnauthorized: false,
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
      from: `"DentCare Clinic" <${emailUser}>`,
      to: email,
      subject: 'DentCare - Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #10a5dc; text-align: center;">DentCare Clinic</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Use the following verification code to proceed with resetting your password. This code is valid for 10 minutes:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${otp}</span>
          </div>
          <p>If you did not request this, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
          <p style="font-size: 12px; color: #64748b; text-align: center;">This is an automated message from DentCare Dental Clinic.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent to ${email}: ${info.messageId}`);
    return { success: true, message: 'OTP sent to email.' };
  } catch (error) {
    console.error('❌ Error sending reset OTP email:', error);
    // Log fallback in case SMTP fails during presentation
    console.log('\n=========================================');
    console.log(`🔑 [FALLBACK OTP] Code for patient ${email}:`);
    console.log(`👉 OTP: ${otp} 👈`);
    console.log('=========================================\n');
    throw new Error('Failed to send verification email. Details: ' + error.message);
  }
};

export const sendAppointmentConfirmationEmail = async (email, patientName, appointment, pdfBuffer) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log('\n=========================================');
    doc_logging:
    console.log(`✉️ [DEVELOPMENT EMAIL] Appointment Confirmation for ${patientName} (${email}):`);
    console.log(`Doctor: Dr. ${appointment.dentist?.fullName || 'N/A'}`);
    console.log(`Treatment: ${appointment.treatment}`);
    console.log(`Date/Time: ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}`);
    console.log(`PDF Attachment: Simulated (Buffer size: ${pdfBuffer.length} bytes)`);
    console.log('=========================================\n');
    return { success: true, message: 'Email logged to server console (development mode).' };
  }

  try {
    const cleanPass = emailPass.replace(/[\s\u00a0]/g, '');

    let transportConfig = {
      auth: {
        user: emailUser,
        pass: cleanPass,
      },
    };

    if (process.env.EMAIL_HOST && process.env.EMAIL_HOST.toLowerCase().includes('gmail')) {
      transportConfig.service = 'gmail';
    } else {
      transportConfig.host = process.env.EMAIL_HOST;
      transportConfig.port = parseInt(process.env.EMAIL_PORT || '587');
      transportConfig.secure = process.env.EMAIL_PORT === '465';
      transportConfig.tls = {
        rejectUnauthorized: false,
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const recipients = [email, emailUser].filter(Boolean).join(', ');

    const mailOptions = {
      from: `"DentCare Clinic" <${emailUser}>`,
      to: recipients,
      subject: 'DentCare Clinic - Appointment Booking Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0ea5e9; text-align: center;">Appointment Confirmed!</h2>
          <p>Dear ${patientName},</p>
          <p>Thank you for scheduling your appointment with DentCare Dental Clinic. We have successfully received your booking. Here are the details:</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 130px;">Treatment:</td>
                <td style="padding: 6px 0; color: #0f172a;">${appointment.treatment}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Dentist:</td>
                <td style="padding: 6px 0; color: #0f172a;">Dr. ${appointment.dentist?.fullName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Date:</td>
                <td style="padding: 6px 0; color: #0f172a;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Time Slot:</td>
                <td style="padding: 6px 0; color: #0f172a;">${appointment.time}</td>
              </tr>
            </table>
          </div>

          <p>Please find attached your appointment booking receipt PDF for your records.</p>
          <p>If you need to reschedule or cancel your appointment, please contact us at least 24 hours prior to your slot.</p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
          <p style="font-size: 12px; color: #64748b; text-align: center;">This is an automated message from DentCare Dental Clinic.</p>
        </div>
      `,
      attachments: [
        {
          filename: `Appointment-Receipt-${appointment._id.toString().substring(18).toUpperCase()}.pdf`,
          content: pdfBuffer
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Confirmation email sent to ${recipients}: ${info.messageId}`);
    return { success: true, message: 'Confirmation email sent.' };
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    console.log('\n=========================================');
    console.log(`✉️ [FALLBACK EMAIL] Appointment Confirmation for ${patientName} (${email}):`);
    console.log(`Doctor: Dr. ${appointment.dentist?.fullName || 'N/A'}`);
    console.log(`Treatment: ${appointment.treatment}`);
    console.log(`Date/Time: ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}`);
    console.log('=========================================\n');
    throw new Error('Failed to send confirmation email. Details: ' + error.message);
  }
};

export const sendPatientWelcomeEmail = async (email, patientName, tempPassword) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log('\n=========================================');
    console.log(`✉️ [DEVELOPMENT WELCOME EMAIL] Welcome to DentCare, ${patientName} (${email}):`);
    console.log(`Your temporary credentials:`);
    console.log(`Username: ${email}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log('=========================================\n');
    return { success: true, message: 'Email logged to server console (development mode).' };
  }

  try {
    const cleanPass = emailPass.replace(/[\s\u00a0]/g, '');

    let transportConfig = {
      auth: {
        user: emailUser,
        pass: cleanPass,
      },
    };

    if (process.env.EMAIL_HOST && process.env.EMAIL_HOST.toLowerCase().includes('gmail')) {
      transportConfig.service = 'gmail';
    } else {
      transportConfig.host = process.env.EMAIL_HOST;
      transportConfig.port = parseInt(process.env.EMAIL_PORT || '587');
      transportConfig.secure = process.env.EMAIL_PORT === '465';
      transportConfig.tls = {
        rejectUnauthorized: false,
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const recipients = [email, emailUser].filter(Boolean).join(', ');

    const mailOptions = {
      from: `"DentCare Clinic" <${emailUser}>`,
      to: recipients,
      subject: 'Welcome to DentCare Clinic - Your Account Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0ea5e9; text-align: center;">Welcome to DentCare!</h2>
          <p>Dear ${patientName},</p>
          <p>Your patient record has been successfully registered at DentCare Dental Clinic by the administrator.</p>
          <p>You can now log in to the DentCare Patient web portal and mobile app using the following temporary credentials:</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 130px;">Email / User:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Temporary Password:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold; font-family: monospace; font-size: 16px;">${tempPassword}</td>
              </tr>
            </table>
          </div>

          <p style="color: #ef4444; font-weight: bold;">Important: Please reset your password after your first login to secure your account.</p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
          <p style="font-size: 12px; color: #64748b; text-align: center;">This is an automated message from DentCare Dental Clinic.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Patient welcome email sent to ${recipients}: ${info.messageId}`);
    return { success: true, message: 'Welcome email sent.' };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    console.log('\n=========================================');
    console.log(`✉️ [FALLBACK WELCOME] Credentials for ${patientName} (${email}):`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log('=========================================\n');
    throw new Error('Failed to send welcome email. Details: ' + error.message);
  }
};
