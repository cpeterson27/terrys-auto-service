import { Router } from 'express';
import {
  deleteProfile,
  forgotPassword,
  getMe,
  login,
  logout,
  refreshSession,
  register,
  resendVerification,
  resetPassword,
  updatePassword,
  updateProfile,
  verifyEmail,
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshSession);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, getMe);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/password', authMiddleware, updatePassword);
router.delete('/profile', authMiddleware, deleteProfile);

export default router;
