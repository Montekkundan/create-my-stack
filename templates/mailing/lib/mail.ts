import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';

// Configure mail transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendMailOptions {
  to: string | string[];
  subject: string;
  email: ReactElement;
  from?: string;
  attachments?: any[];
}

/**
 * Send an email using a React Email component
 */
export async function sendMail({ 
  to, 
  subject, 
  email, 
  from = process.env.EMAIL_FROM,
  attachments = []
}: SendMailOptions) {
  const html = render(email);
  const text = render(email, { plainText: true });
  
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      attachments,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
