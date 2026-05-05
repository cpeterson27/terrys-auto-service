const RESEND_API_KEY = process.env.RESEND_API_KEY;

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  if (!RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not configured. Email not sent.');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@terrysautoservice.com',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email service error: ${response.statusText}`);
    }

    console.log(`✓ Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const invoiceEmailTemplate = (
  invoiceNumber: string,
  totalAmount: number,
  dueDate: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Invoice #${invoiceNumber}</h2>
      <p>Thank you for your business!</p>
      <p><strong>Amount Due:</strong> $${totalAmount.toFixed(2)}</p>
      <p><strong>Due Date:</strong> ${dueDate}</p>
      <p>Please contact us if you have any questions.</p>
      <hr>
      <footer style="font-size: 12px; color: #666;">
        <p>Terry's Auto Service</p>
      </footer>
    </div>
  `;
};

export const bookingConfirmationTemplate = (
  customerName: string,
  date: string,
  time: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Confirmation</h2>
      <p>Hi ${customerName},</p>
      <p>Your appointment has been confirmed!</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p>Please arrive 10 minutes early. If you need to reschedule, please contact us as soon as possible.</p>
      <hr>
      <footer style="font-size: 12px; color: #666;">
        <p>Terry's Auto Service</p>
      </footer>
    </div>
  `;
};

export const bookingCancellationTemplate = (
  customerName: string,
  date: string,
  time: string,
  reason?: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Appointment Cancelled</h2>
      <p>Hi ${customerName},</p>
      <p>We are sorry, but Terry needs to cancel your appointment with Terry's Auto Service.</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please choose another day and submit a new appointment request when it is convenient for you. We apologize for the inconvenience.</p>
      <hr>
      <footer style="font-size: 12px; color: #666;">
        <p>Terry's Auto Service</p>
      </footer>
    </div>
  `;
};

export const customerBookingCancellationTemplate = (
  customerName: string,
  customerEmail: string,
  date: string,
  time: string,
  vehicleInfo: string,
  reason?: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Customer Cancelled Appointment</h2>
      <p>${customerName} cancelled an appointment with Terry's Auto Service.</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>The appointment has been marked cancelled in the dashboard.</p>
      <hr>
      <footer style="font-size: 12px; color: #666;">
        <p>Terry's Auto Service</p>
      </footer>
    </div>
  `;
};

export const emailVerificationTemplate = (
  customerName: string,
  verificationUrl: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify your email</h2>
      <p>Hi ${customerName},</p>
      <p>Please confirm this email address for your Terry's Auto Service account.</p>
      <p>
        <a href="${verificationUrl}" style="background: #2563eb; color: #ffffff; display: inline-block; padding: 12px 18px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Verify Email
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${verificationUrl}</p>
      <p>This link expires in 24 hours.</p>
      <hr>
      <footer style="font-size: 12px; color: #666;">
        <p>Terry's Auto Service</p>
      </footer>
    </div>
  `;
};
