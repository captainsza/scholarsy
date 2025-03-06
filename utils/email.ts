// utils/email.ts

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: EmailOptions) => {
  // Configure your email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_SMTP_SERVER_HOST,
    port: Number(process.env.MAIL_SMTP_SERVER_PORT),
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  // Use a valid sender email address
  const fromEmail = process.env.MAIL_USERNAME || 'your-email@gmail.com'; // should match auth.user
  
  try {
    await transporter.sendMail({
      from: `ScholarSync <${fromEmail}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    
    if (process.env.NODE_ENV !== 'production') {
      // In development, log the email content instead of sending
      console.log('-------------------------');
      console.log('Email would have been sent:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML Content: ${html}`);
      console.log('-------------------------');
    } else {
      // In production, rethrow the error to be handled by the caller
      throw error;
    }
  }
};

// Helper function to send verification email
export const sendVerificationEmail = async (email: string, token: string) => {
  // Get base URL with fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 (process.env.NODE_ENV === 'production' 
                  ? 'https://your-production-domain.com' 
                  : 'http://localhost:3000');
  
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Verify your ScholarSync account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email address</h2>
        <p>Thank you for registering with ScholarSync. Please click the button below to verify your email address:</p>
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If you did not create this account, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  });
};

// Helper function to send approval notification
export const sendApprovalEmail = async (email: string, approved: boolean) => {
  const subject = approved ? 
    'Your ScholarSync account has been approved' : 
    'Your ScholarSync account registration was not approved';
  
  const html = approved ? `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Account Approved</h2>
      <p>Congratulations! Your ScholarSync account has been approved by the administrator.</p>
      <p>You can now log in to access all features of the system.</p>
      <div style="margin: 30px 0;">
        <a href="/login" style="background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Login to Your Account
        </a>
      </div>
    </div>
  ` : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Account Not Approved</h2>
      <p>Unfortunately, your ScholarSync account registration was not approved by the administrator.</p>
      <p>Please contact the administration for more information.</p>
    </div>
  `;
  
  await sendEmail({
    to: email,
    subject,
    html,
  });
};

// Helper function to send password reset email
export const sendPasswordResetEmail = async (email: string, token: string) => {
  console.log(`Starting password reset email process for: ${email}`);
  
  // Get base URL with fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 (process.env.NODE_ENV === 'production' 
                  ? 'https://your-production-domain.com' 
                  : 'http://localhost:3000');
  
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  console.log(`Password reset URL generated: ${resetUrl}`);
  
  console.log('Attempting to send password reset email...');
  await sendEmail({
    to: email,
    subject: 'Reset your ScholarSync password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>You requested a password reset for your ScholarSync account. Click the button below to set a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `,
  });
  console.log(`Password reset email process completed for: ${email}`);
};
