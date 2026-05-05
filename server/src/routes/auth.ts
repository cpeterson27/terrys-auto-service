import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthRequest, authMiddleware, generateTokens } from '../middleware/auth';
import { emailVerificationTemplate, sendEmail } from '../utils/emailService';

const router = Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

const createVerificationToken = () => ({
  token: crypto.randomBytes(32).toString('hex'),
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
});

const getPublicUser = (user: any) => ({
  userId: user._id.toString(),
  email: user.email,
  name: user.name,
  phone: user.phone,
  role: user.role,
  emailVerified: user.emailVerified,
});

const sendVerificationEmail = async (user: any) => {
  const { token, expires } = createVerificationToken();

  user.emailVerificationToken = token;
  user.emailVerificationExpires = expires;
  await user.save();

  const verificationUrl = `${getFrontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail(
    user.email,
    'Verify your Terry Auto Service account',
    emailVerificationTemplate(user.name || user.email, verificationUrl)
  );
};

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      name: name.trim(),
      phone,
      role: 'customer',
      emailVerified: false,
    });

    await sendVerificationEmail(user);

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account before logging in.',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });

    if (!user || user.accountDeleted || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    const tokens = generateTokens(user._id.toString(), user.email, user.role);

    res.json({
      user: getPublicUser(user),
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = String(req.query.token || '');

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Verification link is invalid or expired' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({ message: 'Your email has been verified. You can now log in.' });
  } catch (error) {
    next(error);
  }
});

router.post('/resend-verification', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });

    if (!user) {
      return res.json({ message: 'If an account exists, a verification email has been sent.' });
    }

    if (user.emailVerified) {
      return res.json({ message: 'This email is already verified. You can log in.' });
    }

    await sendVerificationEmail(user);
    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user || user.accountDeleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: getPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.patch('/profile', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, name, phone } = req.body;
    const user = await User.findById(req.user?.userId);

    if (!user || user.accountDeleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    user.name = name.trim();
    user.phone = phone || null;

    if (email) {
      const normalizedEmail = normalizeEmail(email);

      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });

        if (existingUser) {
          return res.status(409).json({ error: 'An account with that email already exists' });
        }

        user.email = normalizedEmail;
        user.emailVerified = false;
        await sendVerificationEmail(user);

        return res.json({
          user: getPublicUser(user),
          message: 'Profile updated. Please verify your new email address before your next login.',
        });
      }
    }

    await user.save();
    res.json({ user: getPublicUser(user), message: 'Profile updated.' });
  } catch (error) {
    next(error);
  }
});

router.patch('/password', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user?.userId);

    if (!user || user.accountDeleted || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated.' });
  } catch (error) {
    next(error);
  }
});

router.delete('/profile', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete your profile' });
    }

    const user = await User.findById(req.user?.userId);

    if (!user || user.accountDeleted || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Admin profiles cannot be deleted from this page' });
    }

    const deletedEmail = `deleted-${user._id.toString()}@deleted.local`;

    user.name = 'Deleted Customer';
    user.phone = null;
    user.email = deletedEmail;
    user.password = crypto.randomBytes(32).toString('hex');
    user.emailVerified = false;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.accountDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    res.json({ message: 'Your profile has been deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
