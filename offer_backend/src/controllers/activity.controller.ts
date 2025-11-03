import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

/**
 * ActivityController - Handles all activity/audit logging and retrieval
 * Logs all important actions (create, update, delete, status changes) to AuditLog table
 */
export class ActivityController {
  /**
   * Get real-time activity stream (admin only)
   */
  static async getRealtimeActivities(req: AuthRequest, res: Response) {
    try {
      const { since } = req.query;
      const sinceDate = since ? new Date(since as string) : new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes

      const activities = await prisma.auditLog.findMany({
        where: {
          createdAt: { gte: sinceDate }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      });

      res.json({
        success: true,
        activities,
        count: activities.length,
        timestamp: new Date().toISOString()
      });
      return;
    } catch (error) {
      logger.error('Get realtime activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch realtime activities'
      });
      return;
    }
  }

  /**
   * Get activity heatmap data (admin only)
   */
  static async getActivityHeatmap(req: AuthRequest, res: Response) {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));

      const heatmapData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date,
          EXTRACT(hour FROM "createdAt") as hour,
          COUNT(*) as activity_count
        FROM "AuditLog" 
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE_TRUNC('day', "createdAt"), EXTRACT(hour FROM "createdAt")
        ORDER BY date DESC, hour ASC
      `;

      res.json({
        success: true,
        heatmap: heatmapData,
        period: {
          days: parseInt(days as string),
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      });
      return;
    } catch (error) {
      logger.error('Get activity heatmap error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity heatmap'
      });
      return;
    }
  }
  /**
   * Get activity logs for a specific offer
   */
  static async getOfferActivities(req: AuthRequest, res: Response) {
    try {
      const { offerReferenceNumber } = req.params;
      const { page = 1, limit = 50 } = req.query;

      if (!offerReferenceNumber) {
        res.status(400).json({
          success: false,
          message: 'Offer reference number is required'
        });
        return;
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Get the offer to extract offerId
      const offer = await prisma.offer.findUnique({
        where: { offerReferenceNumber },
        select: { id: true }
      });

      if (!offer) {
        res.status(404).json({
          success: false,
          message: 'Offer not found'
        });
        return;
      }

      const [activities, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: {
            offerId: offer.id
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take
        }),
        prisma.auditLog.count({
          where: {
            offerId: offer.id
          }
        })
      ]);

      res.json({
        success: true,
        activities,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
      return;
    } catch (error) {
      logger.error('Get offer activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activities'
      });
      return;
    }
  }

  /**
   * Get all activities (admin only) with advanced filtering and analytics
   */
  static async getAllActivities(req: AuthRequest, res: Response) {
    try {
      const { 
        entityType, 
        action, 
        userId, 
        search,
        startDate,
        endDate,
        page = 1, 
        limit = 50,
        groupBy,
        timeframe = '7d' // 1d, 7d, 30d, 90d, 1y
      } = req.query;

      const where: any = {};
      
      // Entity type filter
      if (entityType && entityType !== 'All') {
        where.entityType = entityType;
      }
      
      // Action filter
      if (action && action !== 'All Actions') {
        where.action = action;
      }
      
      // User filter
      if (userId && userId !== 'All Users') {
        where.userId = parseInt(userId as string);
      }

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      // Search filter (enhanced)
      if (search) {
        where.OR = [
          { entityId: { contains: search as string, mode: 'insensitive' } },
          { action: { contains: search as string, mode: 'insensitive' } },
          { entityType: { contains: search as string, mode: 'insensitive' } },
          { user: { 
            OR: [
              { name: { contains: search as string, mode: 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' } }
            ]
          }}
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Get time ranges for analytics
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const [activities, total, todayCount, yesterdayCount, weekCount, monthCount, actionCounts, hourlyStats] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take
        }),
        prisma.auditLog.count({ where }),
        prisma.auditLog.count({
          where: { createdAt: { gte: today } }
        }),
        prisma.auditLog.count({
          where: { 
            createdAt: { 
              gte: yesterday,
              lt: today
            }
          }
        }),
        prisma.auditLog.count({
          where: { createdAt: { gte: lastWeek } }
        }),
        prisma.auditLog.count({
          where: { createdAt: { gte: lastMonth } }
        }),
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: true,
          orderBy: {
            _count: {
              action: 'desc'
            }
          }
        }),
        // Hourly activity for the last 24 hours
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('hour', "createdAt") as hour,
            COUNT(*) as count
          FROM "AuditLog" 
          WHERE "createdAt" >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
          GROUP BY DATE_TRUNC('hour', "createdAt")
          ORDER BY hour DESC
        `
      ]);

      // Get unique users with activity counts
      const uniqueUsers = await prisma.auditLog.groupBy({
        by: ['userId'],
        where: { userId: { not: null } },
        _count: true,
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: 20
      });

      // Fetch user details
      const userIds = uniqueUsers.map(u => u.userId).filter(Boolean) as number[];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, role: true }
      });

      const usersWithActivity = uniqueUsers.map(activity => {
        const user = users.find(u => u.id === activity.userId);
        return {
          id: activity.userId,
          name: user?.name || 'Unknown',
          email: user?.email || 'Unknown',
          role: user?.role || 'Unknown',
          activityCount: activity._count
        };
      });

      // Calculate trends
      const todayVsYesterday = yesterdayCount > 0 
        ? ((todayCount - yesterdayCount) / yesterdayCount) * 100 
        : todayCount > 0 ? 100 : 0;

      // Get entity type distribution
      const entityTypeStats = await prisma.auditLog.groupBy({
        by: ['entityType'],
        _count: true,
        where: { createdAt: { gte: lastWeek } },
        orderBy: {
          _count: {
            entityType: 'desc'
          }
        }
      });

      // Get IP address stats (security monitoring)
      const ipStats = await prisma.auditLog.groupBy({
        by: ['ipAddress'],
        _count: true,
        where: { 
          ipAddress: { not: null },
          createdAt: { gte: lastWeek }
        },
        orderBy: {
          _count: {
            ipAddress: 'desc'
          }
        },
        take: 10
      });

      res.json({
        success: true,
        activities,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string))
        },
        stats: {
          total,
          todayCount,
          yesterdayCount,
          weekCount,
          monthCount,
          todayVsYesterday,
          uniqueUsersCount: usersWithActivity.length,
          actionCounts: actionCounts.reduce((acc, item) => {
            acc[item.action] = item._count;
            return acc;
          }, {} as Record<string, number>),
          entityTypeStats: entityTypeStats.reduce((acc, item) => {
            acc[item.entityType] = item._count;
            return acc;
          }, {} as Record<string, number>)
        },
        analytics: {
          hourlyActivity: hourlyStats,
          topUsers: usersWithActivity,
          entityTypes: entityTypeStats,
          ipAddresses: ipStats
        },
        uniqueUsers: usersWithActivity
      });
      return;
    } catch (error) {
      logger.error('Get all activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activities'
      });
      return;
    }
  }

  /**
   * Log a generic activity
   */
  static async logActivity(params: {
    action: string;
    entityType: string;
    entityId: string;
    offerId?: number;
    userId: number;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          offerId: params.offerId,
          userId: params.userId,
          details: params.details || {},
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null
        }
      });
      
      logger.info(`Activity logged: ${params.action} on ${params.entityType} ${params.entityId}`);
    } catch (error) {
      logger.error('Log activity error:', error);
      // Don't throw error to prevent blocking main operations
    }
  }

  /**
   * Log offer creation
   */
  static async logOfferCreate(params: {
    offerId: number;
    offerReferenceNumber: string;
    offerData: any;
    userId: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await ActivityController.logActivity({
      action: 'OFFER_CREATED',
      entityType: 'Offer',
      entityId: params.offerReferenceNumber,
      offerId: params.offerId,
      userId: params.userId,
      details: {
        title: params.offerData.title,
        productType: params.offerData.productType,
        company: params.offerData.company,
        offerValue: params.offerData.offerValue,
        status: params.offerData.status,
        stage: params.offerData.stage
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }

  /**
   * Log offer update with automatic change detection
   */
  static async logOfferUpdate(params: {
    offerId: number;
    offerReferenceNumber: string;
    oldData: any;
    newData: any;
    userId: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    // Detect changes
    const changes: any = {};
    const fieldsToTrack = [
      'title', 'description', 'productType', 'lead', 'status', 'stage', 
      'priority', 'offerValue', 'offerMonth', 'poExpectedMonth', 
      'probabilityPercentage', 'poNumber', 'poDate', 'poValue', 
      'poReceivedMonth', 'assignedToId', 'remarks', 'openFunnel'
    ];

    for (const field of fieldsToTrack) {
      if (params.newData[field] !== undefined && 
          params.oldData[field] !== params.newData[field]) {
        changes[field] = {
          from: params.oldData[field],
          to: params.newData[field]
        };
      }
    }

    if (Object.keys(changes).length === 0) {
      return; // No changes to log
    }

    await ActivityController.logActivity({
      action: 'OFFER_UPDATED',
      entityType: 'Offer',
      entityId: params.offerReferenceNumber,
      offerId: params.offerId,
      userId: params.userId,
      details: { changes },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }

  /**
   * Log offer status change
   */
  static async logOfferStatusChange(params: {
    offerId: number;
    offerReferenceNumber: string;
    fromStatus: string;
    toStatus: string;
    fromStage?: string;
    toStage?: string;
    notes?: string;
    userId: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await ActivityController.logActivity({
      action: 'OFFER_STATUS_UPDATED',
      entityType: 'Offer',
      entityId: params.offerReferenceNumber,
      offerId: params.offerId,
      userId: params.userId,
      details: {
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        fromStage: params.fromStage,
        toStage: params.toStage,
        notes: params.notes
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }

  /**
   * Log offer deletion
   */
  static async logOfferDelete(params: {
    offerId: number;
    offerReferenceNumber: string;
    userId: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await ActivityController.logActivity({
      action: 'OFFER_DELETED',
      entityType: 'Offer',
      entityId: params.offerReferenceNumber,
      offerId: params.offerId,
      userId: params.userId,
      details: { offerReferenceNumber: params.offerReferenceNumber },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }

  /**
   * Log offer note added
   */
  static async logOfferNoteAdded(params: {
    offerId: number;
    offerReferenceNumber: string;
    content: string;
    userId: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await ActivityController.logActivity({
      action: 'OFFER_NOTE_ADDED',
      entityType: 'Offer',
      entityId: params.offerReferenceNumber,
      offerId: params.offerId,
      userId: params.userId,
      details: { content: params.content },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }

  /**
   * Get user activity history (admin only)
   */
  static async getUserActivities(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [activities, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: {
            userId: parseInt(userId)
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take
        }),
        prisma.auditLog.count({
          where: {
            userId: parseInt(userId)
          }
        })
      ]);

      res.json({
        success: true,
        activities,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
      return;
    } catch (error) {
      logger.error('Get user activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user activities'
      });
      return;
    }
  }

  /**
   * Get comprehensive activity analytics (admin only)
   */
  static async getActivityStats(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, timeframe = '30d' } = req.query;

      const where: any = {};
      
      // Set default timeframe if no dates provided
      const now = new Date();
      if (!startDate && !endDate) {
        const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
        where.createdAt = {
          gte: new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
        };
      } else {
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate as string);
          if (endDate) where.createdAt.lte = new Date(endDate as string);
        }
      }

      const [
        totalActivities,
        offerCreated,
        offerUpdated,
        offerDeleted,
        statusChanged,
        activitiesByUser,
        dailyActivity,
        peakHours,
        riskActivities
      ] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.count({ where: { ...where, action: 'OFFER_CREATED' } }),
        prisma.auditLog.count({ where: { ...where, action: 'OFFER_UPDATED' } }),
        prisma.auditLog.count({ where: { ...where, action: 'OFFER_DELETED' } }),
        prisma.auditLog.count({ where: { ...where, action: 'OFFER_STATUS_UPDATED' } }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          where,
          _count: true,
          orderBy: {
            _count: {
              userId: 'desc'
            }
          },
          take: 15
        }),
        // Daily activity trend
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('day', "createdAt") as date,
            COUNT(*) as count,
            COUNT(DISTINCT "userId") as unique_users
          FROM "AuditLog" 
          WHERE "createdAt" >= ${where.createdAt?.gte || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)}
          GROUP BY DATE_TRUNC('day', "createdAt")
          ORDER BY date DESC
          LIMIT 30
        `,
        // Peak activity hours
        prisma.$queryRaw`
          SELECT 
            EXTRACT(hour FROM "createdAt") as hour,
            COUNT(*) as count
          FROM "AuditLog" 
          WHERE "createdAt" >= ${where.createdAt?.gte || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)}
          GROUP BY EXTRACT(hour FROM "createdAt")
          ORDER BY count DESC
        `,
        // Risk activities (multiple deletions, late night activities)
        prisma.auditLog.findMany({
          where: {
            ...where,
            OR: [
              { action: 'OFFER_DELETED' },
              { 
                AND: [
                  { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
                  {
                    createdAt: {
                      gte: new Date(now.setHours(22, 0, 0, 0)),
                      lt: new Date(now.setHours(6, 0, 0, 0))
                    }
                  }
                ]
              }
            ]
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        })
      ]);

      // Fetch user details for top users
      const userIds = activitiesByUser.map(a => a.userId).filter(Boolean) as number[];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, role: true }
      });

      const topUsers = activitiesByUser.map(activity => {
        const user = users.find(u => u.id === activity.userId);
        return {
          userId: activity.userId,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || 'Unknown',
          userRole: user?.role || 'Unknown',
          activityCount: activity._count
        };
      });

      // Calculate activity velocity (activities per day)
      const daysInPeriod = where.createdAt?.gte 
        ? Math.ceil((now.getTime() - where.createdAt.gte.getTime()) / (24 * 60 * 60 * 1000))
        : 30;
      const avgActivitiesPerDay = totalActivities / Math.max(daysInPeriod, 1);

      res.json({
        success: true,
        stats: {
          totalActivities,
          offerCreated,
          offerUpdated,
          offerDeleted,
          statusChanged,
          avgActivitiesPerDay: Math.round(avgActivitiesPerDay * 100) / 100,
          topUsers,
          dailyTrend: dailyActivity,
          peakHours: peakHours,
          riskActivities: riskActivities.length,
          timeframeAnalysis: {
            period: daysInPeriod,
            velocity: avgActivitiesPerDay,
            efficiency: totalActivities > 0 ? ((offerCreated + offerUpdated) / totalActivities) * 100 : 0
          }
        },
        analytics: {
          dailyActivity,
          peakHours,
          riskActivities
        }
      });
      return;
    } catch (error) {
      logger.error('Get activity stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity statistics'
      });
      return;
    }
  }
}
