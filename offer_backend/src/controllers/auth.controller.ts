import { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuditService } from '../services/audit.service';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          message: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          serviceZones: {
            include: {
              serviceZone: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ 
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Check for account lockout
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Account locked due to too many failed login attempts. Please try again later.',
          code: 'ACCOUNT_LOCKED',
          retryAfter: Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 1000)
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        // Update failed login attempts
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const MAX_ATTEMPTS = 5;
        const LOCKOUT_MINUTES = 15;
        
        const updateData: any = {
          failedLoginAttempts: failedAttempts,
          lastFailedLogin: new Date()
        };

        if (failedAttempts >= MAX_ATTEMPTS) {
          const lockoutTime = new Date();
          lockoutTime.setMinutes(lockoutTime.getMinutes() + LOCKOUT_MINUTES);
          updateData.accountLockedUntil = lockoutTime;
          updateData.failedLoginAttempts = 0;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });

        const attemptsLeft = MAX_ATTEMPTS - failedAttempts;
        return res.status(401).json({
          success: false,
          message: attemptsLeft > 0 
            ? `Invalid email or password. ${attemptsLeft} attempt(s) left.`
            : 'Account locked due to too many failed attempts.',
          code: attemptsLeft > 0 ? 'INVALID_CREDENTIALS' : 'ACCOUNT_LOCKED',
          ...(attemptsLeft <= 0 && { retryAfter: LOCKOUT_MINUTES * 60 })
        });
      }

      // Reset failed login attempts on successful login
      if (user.failedLoginAttempts > 0 || user.accountLockedUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            accountLockedUntil: null
          }
        });
      }

      // Generate new token version for security
      const tokenVersion = Math.random().toString(36).substring(2, 15);

      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          version: tokenVersion
        },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as SignOptions
      );

      const refreshToken = jwt.sign(
        { 
          userId: user.id,
          version: tokenVersion
        },
        process.env.REFRESH_TOKEN_SECRET as string,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' } as SignOptions
      );

      // Update user with tokens and version
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
          refreshToken,
          tokenVersion: tokenVersion,
        },
      });

      await AuditService.log({
        action: 'USER_LOGIN',
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Set HTTP-only cookies with secure settings
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/'
      };

      res.cookie('accessToken', token, cookieOptions);
      res.cookie('token', token, cookieOptions);
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        zoneId: user.serviceZones[0]?.serviceZoneId || null,
        zones: user.serviceZones.map((sz: any) => ({
          id: sz.serviceZone.id,
          name: sz.serviceZone.name,
        })),
      };

      res.json({
        success: true,
        user: userResponse,
        token, // For backward compatibility
        accessToken: token,
        refreshToken,
      });
      return;
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ 
        success: false,
        message: 'An error occurred during login',
        code: 'INTERNAL_SERVER_ERROR'
      });
      return;
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || 
                    req.cookies?.token || 
                    req.cookies?.accessToken;
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { 
            refreshToken: null as any,
            tokenVersion: new Date().getTime().toString() // Increment token version on logout
          },
        });

        await AuditService.log({
          action: 'USER_LOGOUT',
          userId: decoded.userId,
        });
      }

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('token');
      res.clearCookie('refreshToken');

      res.json({ 
        success: true,
        message: 'Logged out successfully' 
      });
      return;
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Logout failed',
        code: 'INTERNAL_SERVER_ERROR'
      });
      return;
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN',
        });
      }
      let decoded: any;
      try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!);
      } catch (err) {
        logger.error('Refresh token verify error:', err);
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        });
      }
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          tokenVersion: true,
          refreshToken: true,
        },
      });
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
          code: 'USER_NOT_FOUND',
        });
      }
      // Check token version
      if (decoded.version && user.tokenVersion !== decoded.version) {
        return res.status(401).json({
          success: false,
          message: 'Token version mismatch. Please login again.',
          code: 'TOKEN_VERSION_MISMATCH',
        });
      }
      // Accept concurrent session tokens (do NOT aggressively rotate refresh tokens)
      let isValidRefreshToken = false;
      if (user.refreshToken === refreshToken) {
        isValidRefreshToken = true;
      }
      // Also check structure and version for extra safety
      if (
        decoded.userId === user.id &&
        decoded.version === user.tokenVersion
      ) {
        isValidRefreshToken = true;
      }
      if (!isValidRefreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        });
      }
      // Generate new access token
      const newToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          version: user.tokenVersion,
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as SignOptions
      );
      // Only rotate refresh token if necessary (for backward compatibility, do not rotate aggressively)
      const shouldRotateRefreshToken = false; // Set true if you want to force rotation
      let newRefreshToken = refreshToken;
      if (shouldRotateRefreshToken) {
        newRefreshToken = jwt.sign(
          {
            userId: user.id,
            version: user.tokenVersion,
          },
          process.env.REFRESH_TOKEN_SECRET!,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' } as SignOptions
        );
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: newRefreshToken },
        });
      }
      // Set cookies
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      };
      res.cookie('accessToken', newToken, cookieOptions);
      res.cookie('token', newToken, cookieOptions);
      if (shouldRotateRefreshToken) {
        res.cookie('refreshToken', newRefreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
      res.json({
        success: true,
        accessToken: newToken,
        refreshToken: newRefreshToken,
      });
      return;
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
      return;
    }
  }

  static async me(req: AuthRequest, res: Response) {
    try {
      // Prefer authenticated user set by middleware
      const authUser = req.user;

      let userIdToFetch: number | null = authUser?.id ?? null;

      // Fallback: try to extract token from header or cookies if middleware didn't set req.user
      if (!userIdToFetch) {
        const headerToken = req.headers.authorization?.replace('Bearer ', '');
        const cookieToken = req.cookies?.accessToken || req.cookies?.token;
        const token = headerToken || cookieToken;

        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userIdToFetch = decoded.userId;
      }

      const user = await prisma.user.findUnique({
        where: { id: userIdToFetch! },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          isActive: true,
          serviceZones: {
            include: {
              serviceZone: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid user' });
      }

      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        zoneId: user.serviceZones[0]?.serviceZoneId || null,
        phone: user.phone,
        zones: user.serviceZones.map((sz: any) => ({
          id: sz.serviceZone.id,
          name: sz.serviceZone.name,
        })),
      };

      res.json({ user: userResponse });
      return;
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }
}
