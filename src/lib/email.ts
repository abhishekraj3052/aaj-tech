import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendAdminWelcomeEmail(toEmail: string, name: string, tempPassword?: string) {
  const mailOptions = {
    from: `"Aaj Tech Trading" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: 'Welcome to Aaj Tech Trading Admin Portal',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #D2232A;">Welcome to Aaj Tech Trading</h2>
                <p>Dear ${name || 'Admin'},</p>
                <p>Your admin account has been created successfully. You can now log in to the admin portal.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #D2232A;">
                  <p style="margin: 0;"><strong>Login Details:</strong></p>
                  <p style="margin: 10px 0 0 0;"><strong>Email:</strong> ${toEmail}</p>
                  ${tempPassword ? `<p style="margin: 10px 0 0 0;"><strong>Password:</strong> ${tempPassword}</p>` : ''}
                </div>
                <p>Please log in at <a href="${process.env.NEXT_PUBLIC_API_URL}/login" style="color: #D2232A;">${process.env.NEXT_PUBLIC_API_URL}/login</a>.</p>
                <p>If you have any issues, please contact the Super Admin.</p>
                <p>Best Regards,<br>Team Aaj Tech Trading</p>
            </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to', toEmail);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendLeadNotificationEmail(lead: { fullName: string; email: string; phone: string; message: string }) {
  const mailOptions = {
    from: `"Aaj Tech Chatbot" <${process.env.EMAIL_FROM}>`,
    to: process.env.EMAIL_USER || 'abhisunil9795@gmail.com',
    subject: `New Lead Captured: ${lead.fullName}`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #D2232A;">New Chatbot Lead Captured</h2>
                <p>Hello Admin,</p>
                <p>A new visitor inquiry has been captured through the chatbot widget. Here are the details:</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #D2232A;">
                  <p style="margin: 0 0 10px 0;"><strong>Lead Details:</strong></p>
                  <p style="margin: 5px 0;"><strong>Name:</strong> ${lead.fullName}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${lead.email}</p>
                  <p style="margin: 5px 0;"><strong>Phone:</strong> ${lead.phone}</p>
                  <p style="margin: 10px 0 0 0;"><strong>Message:</strong></p>
                  <p style="margin: 5px 0; font-style: italic; background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #eee;">
                    ${lead.message}
                  </p>
                </div>
                <p>Please log in to the admin panel at <a href="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/chatbot" style="color: #D2232A;">Admin Chatbot Dashboard</a> to manage this lead.</p>
                <p>Best Regards,<br>Aaj Tech Trading Chatbot System</p>
            </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Lead notification email sent.');
    return true;
  } catch (error) {
    console.error('Error sending lead email:', error);
    return false;
  }
}

