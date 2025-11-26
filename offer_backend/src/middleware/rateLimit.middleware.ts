import { Request, Response, NextFunction } from 'express';

// Simple rate limiting for 30-user performance
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number;    // Time window in milliseconds
  max: number;         // Max requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export const rateLimitMiddleware = (options: RateLimitOptions) => {
  const { windowMs, max, message, keyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate key (IP-based or user-based)
    const key = keyGenerator 
      ? keyGenerator(req)
      : req.ip || 'unknown';

    const now = Date.now();
    const userLimit = store[key];

    // Initialize or reset window
    if (!userLimit || now > userLimit.resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    // Check limit
    if (userLimit.count >= max) {
      return res.status(429).json({
        error: message || 'Too many requests',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
    }

    // Increment count
    userLimit.count++;
    next();
  };
};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  }
}, 60000); // Clean every minute
