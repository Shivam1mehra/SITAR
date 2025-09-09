import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  let error = {
    code: 'INTERNAL_ERROR',
    message: 'An internal server error occurred',
    details: {}
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: err.details || {}
    };
    res.status(400).json({ success: false, error });
    return;
  }

  if (err.name === 'UnauthorizedError') {
    error = {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      details: {}
    };
    res.status(401).json({ success: false, error });
    return;
  }

  if (err.name === 'ForbiddenError') {
    error = {
      code: 'FORBIDDEN',
      message: 'Access denied',
      details: {}
    };
    res.status(403).json({ success: false, error });
    return;
  }

  // Blockchain-specific errors
  if (err.message && err.message.includes('chaincode')) {
    error = {
      code: 'BLOCKCHAIN_ERROR',
      message: 'Blockchain operation failed',
      details: { originalError: err.message }
    };
    res.status(500).json({ success: false, error });
    return;
  }

  // Default 500 error
  res.status(500).json({ success: false, error });
};
