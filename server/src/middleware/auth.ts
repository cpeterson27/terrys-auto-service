import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { JWTPayload } from '../types';

export interface AuthRequest {
  headers?: any;
  body?: any;
  params?: any;
  query?: any;
  user?: JWTPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const generateTokens = (userId: string, email: string, role: 'admin' | 'customer') => {
  const payload = { userId, email, role };
  
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: '1h',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
};