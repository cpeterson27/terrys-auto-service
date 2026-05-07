import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthRequest, generateTokens } from '../middleware/auth';
import { JWTPayload } from '../types';
import { emailVerificationTemplate, passwordResetTemplate, sendEmail } from '../utils/emailService';
import { subscribeProfileToKlaviyo } from '../utils/klaviyo';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BLOCKED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.net',
  'example.org',
  'test.com',
  'invalid.com',
  'fake.com',
  'email.com',
]);

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';
const ACCESS_TOKEN_MAX_AGE = 12 * 60 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getCookieValue = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) {
    return '';
  }

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : '';
};

const getCookieOptions = (maxAge: number) => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    maxAge,
    path: '/',
  };
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie(ACCESS_COOKIE, accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE));
  res.cookie(REFRESH_COOKIE, refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE));
};

export const clearAuthCookies = (res: Response) => {
  const options = getCookieOptions(0);
  res.clearCookie(ACCESS_COOKIE, options);
  res.clearCookie(REFRESH_COOKIE, options);
};

const issueAuthSession = (res: Response, user: any) => {
  const tokens = generateTokens(user._id.toString(), user.email, user.role);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
};

const validateEmailAddress = (email: string) => {
  if (!EMAIL_PATTERN.test(email)) {
    return 'Please enter a valid email address';
  }

  const [localPart, domain] = email.split('@');

  if (
    !localPart ||
    !domain ||
    BLOCKED_EMAIL_DOMAINS.has(domain) ||
    localPart.length < 2
  ) {
    return 'Please enter a valid email address you can access — we’ll use it to send important updates.';
  }

  return null;
};

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

const createVerificationToken = () => ({
  token: crypto.randomBytes(32).toString('hex'),
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
});

const createPasswordResetToken = () => ({
  token: crypto.randomBytes(32).toString('hex'),
  expires: new Date(Date.now() + 60 * 60 * 1000),
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

const sendPasswordResetEmail = async (user: any) => {
  const { token, expires } = createPasswordResetToken();

  user.passwordResetToken = token;
  user.passwordResetExpires = expires;
  await user.save();

  const resetUrl = `${getFrontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail(
    user.email,
    'Reset your Terry Auto Service password',
    passwordResetTemplate(user.name || user.email, resetUrl)
  );
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, phone, marketingOptIn } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({ error: 'Name, email, cell phone, and password are required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const emailError = validateEmailAddress(normalizedEmail);

    if (emailError) {
      return res.status(400).json({ error: emailError });
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
      phone: phone.trim(),
      role: 'customer',
      emailVerified: false,
    });

    try {
      await sendVerificationEmail(user);
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);
      console.error('Verification email failed during registration:', emailError);
      return res.status(502).json({
        error: 'We could not send a verification email to that address. Please check the email and try again.',
      });
    }

    if (marketingOptIn === true) {
      subscribeProfileToKlaviyo({
        email: user.email,
        name: user.name,
        phone: user.phone || undefined,
      }).catch((klaviyoError) => {
        console.error('Klaviyo subscription failed during registration:', klaviyoError);
      });
    }

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account before logging in.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
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

    issueAuthSession(res, user);

    res.json({ user: getPublicUser(user) });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ message: 'Logged out.' });
};

export const refreshSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const refreshToken = getCookieValue(req.headers?.cookie, REFRESH_COOKIE);

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'secret') as JWTPayload;
    const user = await User.findById(decoded.userId);

    if (!user || user.accountDeleted) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Session expired' });
    }

    issueAuthSession(res, user);
    res.json({ user: getPublicUser(user) });
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
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

    issueAuthSession(res, user);

    res.json({
      message: 'Your email has been verified. Redirecting...',
      user: getPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
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
      return res.json({ message: 'This email is already verified. If you cannot log in, use Forgot password.' });
    }

    await sendVerificationEmail(user);
    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });

    if (user && !user.accountDeleted) {
      await sendPasswordResetEmail(user);
    }

    res.json({ message: 'If an account exists for that email, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user || user.accountDeleted) {
      return res.status(400).json({ error: 'Password reset link is invalid or expired' });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    issueAuthSession(res, user);

    res.json({
      message: 'Password updated. Redirecting...',
      user: getPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user || user.accountDeleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: getPublicUser(user) });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, name, phone } = req.body;
    const user = await User.findById(req.user?.userId);

    if (!user || user.accountDeleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (user.role === 'customer' && !phone?.trim()) {
      return res.status(400).json({ error: 'Cell phone is required' });
    }

    user.name = name.trim();
    user.phone = phone?.trim() || null;

    if (email) {
      const normalizedEmail = normalizeEmail(email);
      const emailError = validateEmailAddress(normalizedEmail);

      if (emailError) {
        return res.status(400).json({ error: emailError });
      }

      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });

        if (existingUser) {
          return res.status(409).json({ error: 'An account with that email already exists' });
        }

        const previousEmail = user.email;
        const previousEmailVerified = user.emailVerified;
        user.email = normalizedEmail;
        user.emailVerified = false;

        try {
          await sendVerificationEmail(user);
        } catch (emailError) {
          user.email = previousEmail;
          user.emailVerified = previousEmailVerified;
          user.emailVerificationToken = null;
          user.emailVerificationExpires = null;
          await user.save();
          console.error('Verification email failed during profile update:', emailError);
          return res.status(502).json({
            error: 'We could not send a verification email to that address. Please check the email and try again.',
          });
        }

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
};

export const updatePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

export const deleteProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    clearAuthCookies(res);

    res.json({ message: 'Your profile has been deleted.' });
  } catch (error) {
    next(error);
  }
};
