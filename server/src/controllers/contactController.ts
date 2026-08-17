import { Request, Response, NextFunction } from 'express';
import { ContactMessage } from '../models/ContactMessage';
import { AuthRequest } from '../middleware/auth';
import { sendEmail } from '../utils/emailService';
import { sendSms } from '../utils/smsService';

const recentSubmissions = new Map<string, number>();

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const notifyTerry = async (contact: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPhone = process.env.ADMIN_PHONE?.trim() || process.env.BUSINESS_PHONE?.trim();
  const dashboardUrl = `${(process.env.FRONTEND_URL || 'https://terrysauto.shop').split(',')[0].trim()}/messages`;
  const safe = {
    name: escapeHtml(contact.name),
    email: escapeHtml(contact.email),
    phone: escapeHtml(contact.phone || 'Not provided'),
    subject: escapeHtml(contact.subject),
    message: escapeHtml(contact.message).replace(/\n/g, '<br>'),
  };
  const notifications: Promise<void>[] = [];
  const emailSubject = contact.subject.replace(/[\r\n]+/g, ' ').trim().slice(0, 140);

  if (adminEmail) {
    notifications.push(sendEmail(
      adminEmail,
      `New website message: ${emailSubject}`,
      `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
        <h2>New website message</h2>
        <p><strong>From:</strong> ${safe.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${safe.email}">${safe.email}</a></p>
        <p><strong>Phone:</strong> ${safe.phone}</p>
        <p><strong>Subject:</strong> ${safe.subject}</p>
        <div style="padding:16px;background:#f3f4f6;border-radius:6px">${safe.message}</div>
        <p><a href="${dashboardUrl}">Open messages dashboard</a></p>
      </div>`
    ));
  } else {
    console.warn('⚠️  ADMIN_EMAIL not configured. Contact email notification not sent.');
  }

  if (adminPhone) {
    const preview = contact.message.replace(/\s+/g, ' ').trim().slice(0, 240);
    notifications.push(sendSms(
      adminPhone,
      `New Terry's Auto Service message from ${contact.name}: ${contact.subject}. ${preview}${contact.message.length > 240 ? '…' : ''} Reply: ${contact.phone || contact.email}`
    ));
  } else {
    console.warn('⚠️  ADMIN_PHONE or BUSINESS_PHONE not configured. Contact text notification not sent.');
  }

  const results = await Promise.allSettled(notifications);
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('Contact notification failed:', result.reason);
    }
  });
};

export const createContactMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, subject, message, company } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const lastSubmission = recentSubmissions.get(ipAddress) || 0;

    if (Date.now() - lastSubmission < 60_000) {
      return res.status(429).json({ error: 'Please wait a minute before sending another message' });
    }

    if (company) {
      return res.status(200).json({ success: true });
    }

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }

    await ContactMessage.create({ name, email, phone, subject, message });

    recentSubmissions.set(ipAddress, Date.now());

    await notifyTerry({ name, email, phone, subject, message });

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const listContactMessages = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

export const updateContactMessageStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;

    if (!['new', 'read', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid message status' });
    }

    const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message });
  } catch (error) {
    next(error);
  }
};

export const replyToContactMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';

    if (!body || body.length > 5000) {
      return res.status(400).json({ error: 'Reply must be between 1 and 5,000 characters' });
    }

    const contact = await ContactMessage.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim() || req.user?.email;
    if (!adminEmail) {
      return res.status(503).json({ error: 'Admin reply email is not configured' });
    }

    const cleanSubject = contact.subject.replace(/[\r\n]+/g, ' ').trim().slice(0, 140);
    const safeBody = escapeHtml(body).replace(/\n/g, '<br>');
    const safeName = escapeHtml(contact.name);

    await sendEmail(
      contact.email,
      `Re: ${cleanSubject}`,
      `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
        <p>Hi ${safeName},</p>
        <div>${safeBody}</div>
        <hr style="margin-top:24px;border:0;border-top:1px solid #ddd">
        <p style="color:#555">Terry's Auto Service</p>
      </div>`,
      { replyTo: adminEmail, required: true }
    );

    contact.replies.push({ body, sentAt: new Date(), sentBy: req.user?.email });
    contact.status = 'read';
    await contact.save();

    res.json({ message: contact, success: true });
  } catch (error) {
    next(error);
  }
};
