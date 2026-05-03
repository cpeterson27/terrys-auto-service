import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { generateTokens } from '../middleware/auth';

const router = Router();

const getPublicUser = (user: any) => ({
  userId: user._id.toString(),
  email: user.email,
  name: user.name,
  phone: user.phone,
  role: user.role,
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const user = await User.create({
      email,
      password,
      name,
      phone,
      role: 'customer',
    });

    const tokens = generateTokens(user._id.toString(), user.email, user.role);

    res.status(201).json({
      user: getPublicUser(user),
      ...tokens,
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

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
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

export default router;
