import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const errorHandler = (err: any, req: AuthRequest, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate field value',
    });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
