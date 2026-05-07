import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { JWTPayload } from '../types';

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

export interface AuthRequest {
  headers?: any;
  body?: any;
  params?: any;
  query?: any;
  user?: JWTPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bearerToken = req.headers?.authorization?.replace('Bearer ', '');
    const token = bearerToken || getCookieValue(req.headers?.cookie, 'accessToken');
    
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
    expiresIn: '12h',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
};
