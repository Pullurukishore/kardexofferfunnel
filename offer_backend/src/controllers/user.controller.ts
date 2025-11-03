import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

/**
 * UserController - Handles all user management operations
 */
export class UserController {
  /**
   * Get all users with filters and statistics
   */
  static async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const { role, zoneId, isActive, search } = req.query;

      const where: any = {};
      
      if (role && role !== 'All Roles') where.role = role;
      if (zoneId && zoneId !== 'All Zones') where.zoneId = parseInt(zoneId as string);
      if (isActive !== undefined) where.isActive = isActive === 'true';
      
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            serviceZones: {
              include: {
                serviceZone: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            _count: {
              select: {
                createdOffers: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      // Get offer statistics for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const offerStats = await prisma.offer.aggregate({
            where: { createdById: user.id },
            _sum: { offerValue: true },
            _count: true
          });

          // Get primary zone (first assigned zone)
          const primaryZone = user.serviceZones[0]?.serviceZone;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            zoneId: primaryZone?.id || null,
            zoneName: primaryZone?.name || (user.role === 'ADMIN' ? 'All Zones' : 'No Zone'),
            isActive: user.isActive,
            lastLogin: user.lastLoginAt,
            createdAt: user.createdAt,
            offersCount: offerStats._count || 0,
            totalValue: offerStats._sum.offerValue ? Number(offerStats._sum.offerValue) : 0
          };
        })
      );

      res.json({
        success: true,
        users: usersWithStats,
        total: totalCount
      });
      return;
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
      return;
    }
  }

  /**
   * Get single user by ID
   */
  static async getUserById(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: {
          serviceZones: {
            include: {
              serviceZone: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Get user statistics
      const [offerStats, recentOffers] = await Promise.all([
        prisma.offer.aggregate({
          where: { createdById: user.id },
          _sum: { offerValue: true },
          _count: true
        }),
        prisma.offer.findMany({
          where: { createdById: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            offerReferenceNumber: true,
            title: true,
            offerValue: true,
            stage: true,
            createdAt: true
          }
        })
      ]);

      const primaryZone = user.serviceZones[0]?.serviceZone;

      res.json({
        success: true,
        user: {
          ...user,
          password: undefined,
          serviceZones: undefined,
          zoneId: primaryZone?.id || null,
          zoneName: primaryZone?.name || (user.role === 'ADMIN' ? 'All Zones' : 'No Zone'),
          offersCount: offerStats._count || 0,
          totalValue: offerStats._sum.offerValue ? Number(offerStats._sum.offerValue) : 0,
          recentOffers
        }
      });
      return;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user'
      });
      return;
    }
  }

  /**
   * Create new user
   */
  static async createUser(req: AuthRequest, res: Response) {
    try {
      const { name, email, phone, password, role, zoneId } = req.body;

      // Validation
      if (!name || !email || !password || !role) {
        res.status(400).json({
          success: false,
          message: 'Name, email, password, and role are required'
        });
        return;
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate token version
      const tokenVersion = require('crypto').randomUUID();

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          password: hashedPassword,
          role,
          tokenVersion,
          isActive: true
        }
      });

      // If zone is provided and user is ZONE_USER, create zone assignment
      if (zoneId && role === 'ZONE_USER') {
        await prisma.servicePersonZone.create({
          data: {
            userId: user.id,
            serviceZoneId: parseInt(zoneId)
          }
        });
      }

      logger.info(`User created: ${user.email} by admin ${req.user?.email}`);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      });
      return;
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
      return;
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { name, email, phone, role, zoneId, isActive } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if email is being changed and if it already exists
      if (email && email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
          return;
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          name: name || user.name,
          email: email || user.email,
          phone: phone !== undefined ? phone : user.phone,
          role: role || user.role,
          isActive: isActive !== undefined ? isActive : user.isActive
        }
      });

      // Handle zone update if provided
      if (zoneId !== undefined && role === 'ZONE_USER') {
        // Remove existing zone assignments
        await prisma.servicePersonZone.deleteMany({
          where: { userId: user.id }
        });
        
        // Add new zone assignment if provided
        if (zoneId) {
          await prisma.servicePersonZone.create({
            data: {
              userId: user.id,
              serviceZoneId: parseInt(zoneId)
            }
          });
        }
      }

      logger.info(`User updated: ${updatedUser.email} by admin ${req.user?.email}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          isActive: updatedUser.isActive
        }
      });
      return;
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
      return;
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if user has created offers
      const offerCount = await prisma.offer.count({
        where: { createdById: user.id }
      });

      if (offerCount > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete user. User has ${offerCount} offers associated. Please reassign or delete offers first.`
        });
        return;
      }

      await prisma.user.delete({
        where: { id: parseInt(userId) }
      });

      logger.info(`User deleted: ${user.email} by admin ${req.user?.email}`);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
      return;
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
      return;
    }
  }

  /**
   * Bulk activate/deactivate users
   */
  static async bulkUpdateStatus(req: AuthRequest, res: Response) {
    try {
      const { userIds, isActive } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
        return;
      }

      await prisma.user.updateMany({
        where: {
          id: { in: userIds.map((id: string) => parseInt(id)) }
        },
        data: { isActive }
      });

      logger.info(`Bulk ${isActive ? 'activated' : 'deactivated'} ${userIds.length} users by admin ${req.user?.email}`);

      res.json({
        success: true,
        message: `Successfully ${isActive ? 'activated' : 'deactivated'} ${userIds.length} users`
      });
      return;
    } catch (error) {
      logger.error('Bulk update status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
      return;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(req: AuthRequest, res: Response) {
    try {
      const [
        totalUsers,
        activeUsers,
        adminUsers,
        zoneUsers,
        recentUsers
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { role: 'ZONE_USER' } }),
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            serviceZones: {
              include: {
                serviceZone: {
                  select: {
                    name: true
                  }
                }
              },
              take: 1
            }
          }
        })
      ]);

      res.json({
        success: true,
        stats: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          adminUsers,
          zoneUsers,
          recentUsers: recentUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            zoneName: u.serviceZones[0]?.serviceZone.name || (u.role === 'ADMIN' ? 'All Zones' : 'No Zone'),
            createdAt: u.createdAt
          }))
        }
      });
      return;
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics'
      });
      return;
    }
  }
}
