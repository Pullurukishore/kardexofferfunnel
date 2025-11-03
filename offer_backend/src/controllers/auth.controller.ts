import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuditService } from '../services/audit.service';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
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
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is inactive' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: user.failedLoginAttempts + 1,
            lastFailedLogin: new Date(),
          },
        });
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as SignOptions
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.REFRESH_TOKEN_SECRET as string,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' } as SignOptions
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
          refreshToken,
        },
      });

      await AuditService.log({
        action: 'USER_LOGIN',
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
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
        user: userResponse,
        token,
        refreshToken,
      });
      return;
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
      return;
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { refreshToken: null },
        });

        await AuditService.log({
          action: 'USER_LOGOUT',
          userId: decoded.userId,
        });
      }

      res.json({ message: 'Logged out successfully' });
      return;
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.refreshToken !== refreshToken || !user.isActive) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const newToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as SignOptions
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id },
        process.env.REFRESH_TOKEN_SECRET as string,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' } as SignOptions
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: newRefreshToken,
        },
      });

      res.json({ token: newToken, refreshToken: newRefreshToken });
      return;
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
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
