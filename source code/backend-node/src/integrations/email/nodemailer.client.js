import nodemailer from 'nodemailer';

/**
 * Creates an email client for sending emails.
 */
export const createEmailClient = ({ smtpHost, smtpPort, smtpUser, smtpPass, emailFrom }) => {

  // Configure the SMTP transporter.
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: parseInt(smtpPort, 10) === 465, // Use SSL for port 465.
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  /**
   * Sends an OTP email to the user.
   */
  const sendOTPEmail = async ({ toEmail, otp }) => {

    // HTML template for the OTP email.
    const htmlEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">
            Jeet Ahirwar Marketplace
          </h2>
        </div>

        <p style="font-size: 16px; color: #334155; line-height: 1.5; margin: 0 0 15px 0;">Hello User,</p>

        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
          To verify your e-commerce account identity and authorize the current checkout session securely, please use the following One-Time Password (OTP) verification code:
        </p>

        <div style="background-color: #f8fafc; border: 1px dashed #3b82f6; padding: 20px; text-align: center; margin: 25px 0; border-radius: 6px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e3a8a; font-family: 'Courier New', Courier, monospace;">
            ${otp}
          </span>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 25px 0;">
          * Security Notice: This code is highly confidential and valid for exactly <strong>10 minutes</strong>. Do not share this registration token with anybody, system administrators will never request active OTP details.
        </p>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; margin-top: 30px;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">
            This is an automated system security notification dispatching service.<br />
            &copy; 2026 Jeet Ahirwar Marketplace Systems. All rights secured.
          </p>
        </div>
      </div>
    `;

    // Email configuration.
    const mailOptions = {
      from: `"Jeet Ahirwar Identity Gate" <${emailFrom}>`,
      to: toEmail,
      subject: `Secure OTP Verification Token - Jeet Ahirwar Marketplace`,
      html: htmlEmailContent,
    };

    // Send the email.
    return transporter.sendMail(mailOptions);
  };

  return Object.freeze({
    sendOTPEmail,
  });
};