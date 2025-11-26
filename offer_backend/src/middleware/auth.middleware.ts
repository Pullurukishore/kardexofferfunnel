import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    zoneId?: string;
  };
}

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  version?: string;
}

interface RefreshTokenPayload {
  userId: number;
  version?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get tokens from header or cookies
    let accessToken: string | undefined;
    let refreshToken: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    } else if (req.cookies?.accessToken) {
      accessToken = req.cookies.accessToken;
    } else if (req.cookies?.token) {
      accessToken = req.cookies.token;
    }
    refreshToken = req.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided',
        code: 'MISSING_AUTH_TOKEN',
      });
    }

    let decoded: JwtPayload | null = null;
    let isRefreshing = false;
    if (accessToken) {
      try {
        decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as JwtPayload;
      } catch (error) {
        if (refreshToken) {
          isRefreshing = true;
        } else {
          return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
          });
        }
      }
    }

    // If access token is expired but refresh token is present, try to refresh
    if ((!decoded || isRefreshing) && refreshToken) {
      try {
        const refreshPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as RefreshTokenPayload;
        if (!refreshPayload?.userId) {
          return res.status(401).json({
            success: false,
            error: 'Invalid refresh token',
            code: 'INVALID_REFRESH_TOKEN',
          });
        }
        // Find user with refresh token
        const user = await prisma.user.findUnique({
          where: { id: refreshPayload.userId, isActive: true },
          select: {
            id: true,
            email: true,
            role: true,
            tokenVersion: true,
            refreshToken: true,
            serviceZones: {
              select: { serviceZoneId: true },
              take: 1,
            },
          },
        });
        if (!user || user.refreshToken !== refreshToken) {
          return res.status(401).json({
            success: false,
            error: 'Invalid refresh token',
            code: 'INVALID_REFRESH_TOKEN',
          });
        }
        // Check token version
        if (refreshPayload.version && user.tokenVersion !== refreshPayload.version) {
          return res.status(401).json({
            success: false,
            error: 'Token version mismatch. Please login again.',
            code: 'TOKEN_VERSION_MISMATCH',
          });
        }
        // Generate new access token (do NOT rotate refresh token aggressively)
        const newAccessToken = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            version: user.tokenVersion,
          },
          process.env.JWT_SECRET!,
          { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as jwt.SignOptions
        );
        // Set new access token cookies
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax' as const,
          maxAge: 24 * 60 * 60 * 1000,
          path: '/',
        };
        res.cookie('accessToken', newAccessToken, cookieOptions);
        res.cookie('token', newAccessToken, cookieOptions);
        // Attach user to request
        const zoneId = user.serviceZones[0]?.serviceZoneId?.toString();
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          zoneId: zoneId,
        };
        return next();
      } catch (error) {
        logger.error('Refresh token error:', error);
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        });
      }
    }

    // If access token is valid
    if (decoded) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          tokenVersion: true,
          serviceZones: {
            select: { serviceZoneId: true },
            take: 1,
          },
        },
      });
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or inactive user',
          code: 'INVALID_USER',
        });
      }
      if (decoded.version && user.tokenVersion !== decoded.version) {
        return res.status(401).json({
          success: false,
          error: 'Token version mismatch. Please login again.',
          code: 'TOKEN_VERSION_MISMATCH',
        });
      }
      const zoneId = user.serviceZones[0]?.serviceZoneId?.toString();
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        zoneId: zoneId,
      };
      return next();
    }
    // If nothing worked
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Alias for authenticate function
export const authenticateToken = authenticate;

// Admin-only middleware
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

// Zone Manager or Admin middleware
export const requireZoneManagerOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'ZONE_MANAGER') {
    res.status(403).json({ error: 'Zone Manager or Admin access required' });
    return;
  }

  next();
};
