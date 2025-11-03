import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

/**
 * TargetController - Handles target management for zones, users, and product types
 * Accessible only by ADMIN users (Director functionality)
 */
export class TargetController {
  // ==================== ZONE TARGETS ====================
  /**
   * Set or update zone target
   */
  static async setZoneTarget(req: AuthRequest, res: Response) {
    try {
      const { serviceZoneId, targetPeriod, periodType, targetValue, targetOfferCount, productType } = req.body;

      if (!serviceZoneId || !targetPeriod || !periodType || !targetValue) {
        return res.status(400).json({
          success: false,
          message: 'Zone ID, target period, period type, and target value are required'
        });
      }

      // Check if target already exists (with optional product type)
      const existingTarget = await prisma.zoneTarget.findUnique({
        where: {
          serviceZoneId_targetPeriod_periodType_productType: {
            serviceZoneId: parseInt(serviceZoneId),
            targetPeriod,
            periodType,
            productType: productType || null
          }
        }
      });

      let target;
      if (existingTarget) {
        // Update existing target
        target = await prisma.zoneTarget.update({
          where: { id: existingTarget.id },
          data: {
            targetValue: new Prisma.Decimal(targetValue),
            targetOfferCount: targetOfferCount || null,
            productType: productType || null,
            updatedById: req.user!.id
          },
          include: {
            serviceZone: {
              select: { id: true, name: true }
            }
          }
        });
      } else {
        // Create new target
        target = await prisma.zoneTarget.create({
          data: {
            serviceZoneId: parseInt(serviceZoneId),
            targetPeriod,
            periodType,
            productType: productType || null,
            targetValue: new Prisma.Decimal(targetValue),
            targetOfferCount: targetOfferCount || null,
            createdById: req.user!.id,
            updatedById: req.user!.id
          },
          include: {
            serviceZone: {
              select: { id: true, name: true }
            }
          }
        });
      }

      logger.info(`Zone target ${existingTarget ? 'updated' : 'created'} for zone ${serviceZoneId} by ${req.user?.email}`);

      return res.json({
        success: true,
        message: `Target ${existingTarget ? 'updated' : 'created'} successfully`,
        target
      });
    } catch (error) {
      logger.error('Set zone target error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to set zone target'
      });
    }
  }

  /**
   * Get all zone targets with actual performance - shows ALL zones regardless of targets
   */
  static async getZoneTargets(req: AuthRequest, res: Response) {
    try {
      const { targetPeriod, periodType, grouped, actualValuePeriod } = req.query;

      if (!targetPeriod || !periodType) {
        return res.status(400).json({
          success: false,
          message: 'Target period and period type are required'
        });
      }

      // Get ALL zones first
      const whereZones: any = { isActive: true };
      
      // For zone users, only show their zone
      if (req.user?.role === 'ZONE_USER' && req.user?.zoneId) {
        whereZones.id = parseInt(req.user.zoneId.toString());
      }

      const allZones = await prisma.serviceZone.findMany({
        where: whereZones,
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });

      // Get existing targets for the period
      const whereTargets: any = {
        targetPeriod: targetPeriod as string,
        periodType: periodType as any
      };
      
      if (req.user?.role === 'ZONE_USER' && req.user?.zoneId) {
        whereTargets.serviceZoneId = parseInt(req.user.zoneId.toString());
      }

      const existingTargets = await prisma.zoneTarget.findMany({
        where: whereTargets,
        include: {
          serviceZone: {
            select: { id: true, name: true }
          }
        }
      });

      // Create a map of existing targets by zone ID
      const targetsByZone = new Map();
      existingTargets.forEach(target => {
        const key = target.serviceZoneId;
        if (!targetsByZone.has(key)) {
          targetsByZone.set(key, []);
        }
        targetsByZone.get(key).push(target);
      });

      // Build complete list with actual performance for ALL zones
      const targetsWithActuals = await Promise.all(
        allZones.map(async (zone: any) => {
          const zoneTargets = targetsByZone.get(zone.id) || [];
          
          // Calculate actual performance for this zone
          // Use actualValuePeriod for monthly view, otherwise use targetPeriod
          const actualPeriod = actualValuePeriod as string || targetPeriod as string;
          const actualPeriodType = actualValuePeriod ? 'MONTHLY' : periodType as string;
          
          // Skip if trying to use yearly period with monthly period type
          if (actualPeriodType === 'MONTHLY' && !actualPeriod.includes('-')) {
            return {
              id: null,
              serviceZoneId: zone.id,
              targetPeriod: targetPeriod as string,
              periodType: periodType as string,
              serviceZone: zone,
              targetValue: 0,
              actualValue: 0,
              actualOfferCount: 0,
              targetOfferCount: 0,
              achievement: 0,
              targetCount: 0
            };
          }
          
          const actual = await TargetController.getZoneActualPerformance(
            zone.id,
            actualPeriod,
            actualPeriodType,
            undefined // Overall performance (no product filter)
          );

          // If zone has targets, sum them up
          if (zoneTargets.length > 0) {
            const totalTargetValue = zoneTargets.reduce((sum: number, t: any) => sum + Number(t.targetValue), 0);
            return {
              id: zoneTargets[0].id, // Use first target's ID
              serviceZoneId: zone.id,
              targetPeriod: targetPeriod as string,
              periodType: periodType as string,
              serviceZone: zone,
              targetValue: totalTargetValue,
              actualValue: actual.value,
              actualOfferCount: actual.count,
              targetOfferCount: zoneTargets.reduce((sum: number, t: any) => sum + (t.targetOfferCount || 0), 0),
              achievement: totalTargetValue > 0 ? (actual.value / totalTargetValue) * 100 : 0,
              targetCount: zoneTargets.length
            };
          } else {
            // Zone has no targets - show with 0 target value
            return {
              id: null,
              serviceZoneId: zone.id,
              targetPeriod: targetPeriod as string,
              periodType: periodType as string,
              serviceZone: zone,
              targetValue: 0,
              actualValue: actual.value,
              actualOfferCount: actual.count,
              targetOfferCount: 0,
              achievement: 0, // No target = 0% achievement
              targetCount: 0
            };
          }
        })
      );

      // If grouped, aggregate by zone
      if (grouped === 'true') {
        const groupedTargets: any = {};
        
        targetsWithActuals.forEach((target) => {
          const key = target.serviceZoneId;
          if (!groupedTargets[key]) {
            groupedTargets[key] = {
              id: target.id,
              serviceZoneId: target.serviceZoneId,
              targetPeriod: target.targetPeriod,
              periodType: target.periodType,
              serviceZone: target.serviceZone,
              targetValue: 0,
              actualValue: 0,
              targetOfferCount: 0,
              actualOfferCount: 0,
              targetCount: 0
            };
          }
          groupedTargets[key].targetValue += target.targetValue;
          groupedTargets[key].actualValue += target.actualValue;
          groupedTargets[key].targetOfferCount += (target.targetOfferCount || 0);
          groupedTargets[key].actualOfferCount += target.actualOfferCount;
          groupedTargets[key].targetCount += 1;
        });

        const result = Object.values(groupedTargets).map((t: any) => ({
          ...t,
          achievement: t.targetValue > 0 ? (t.actualValue / t.targetValue) * 100 : 0
        }));

        return res.json({
          success: true,
          targets: result
        });
      }

      // If not grouped, return individual targets with their actual performance
      const individualTargets = await Promise.all(
        existingTargets.map(async (target: any) => {
          // Use actualValuePeriod for monthly view, otherwise use target's period
          const actualPeriod = actualValuePeriod as string || target.targetPeriod;
          const actualPeriodType = actualValuePeriod ? 'MONTHLY' : target.periodType;
          
          // Skip if trying to use yearly period with monthly period type
          if (actualPeriodType === 'MONTHLY' && !actualPeriod.includes('-')) {
            return {
              id: target.id,
              serviceZoneId: target.serviceZoneId,
              targetPeriod: target.targetPeriod,
              periodType: target.periodType,
              productType: target.productType,
              targetValue: Number(target.targetValue),
              targetOfferCount: target.targetOfferCount,
              actualValue: 0,
              actualOfferCount: 0,
              achievement: 0,
              serviceZone: target.serviceZone
            };
          }
          
          const actual = await TargetController.getZoneActualPerformance(
            target.serviceZoneId,
            actualPeriod,
            actualPeriodType,
            target.productType // Include product type filter for individual targets
          );

          return {
            id: target.id,
            serviceZoneId: target.serviceZoneId,
            targetPeriod: target.targetPeriod,
            periodType: target.periodType,
            productType: target.productType,
            targetValue: Number(target.targetValue),
            targetOfferCount: target.targetOfferCount,
            actualValue: actual.value,
            actualOfferCount: actual.count,
            achievement: Number(target.targetValue) > 0 ? (actual.value / Number(target.targetValue)) * 100 : 0,
            serviceZone: target.serviceZone
          };
        })
      );

      return res.json({
        success: true,
        targets: individualTargets
      });
    } catch (error) {
      logger.error('Get zone targets error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch zone targets'
      });
    }
  }

  /**
   * Update zone target by ID
   */
  static async updateZoneTarget(req: AuthRequest, res: Response) {
    try {
      const { targetId } = req.params;
      const { targetValue, targetOfferCount } = req.body;

      if (!targetValue) {
        return res.status(400).json({
          success: false,
          message: 'Target value is required'
        });
      }

      // Update the target
      const target = await prisma.zoneTarget.update({
        where: { id: parseInt(targetId) },
        data: {
          targetValue: new Prisma.Decimal(targetValue),
          targetOfferCount: targetOfferCount || null,
          updatedById: req.user!.id
        },
        include: {
          serviceZone: {
            select: { id: true, name: true }
          }
        }
      });

      logger.info(`Zone target ${targetId} updated by ${req.user?.email}`);

      return res.json({
        success: true,
        message: 'Target updated successfully',
        target
      });
    } catch (error) {
      logger.error('Update zone target error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update zone target'
      });
    }
  }

  /**
   * Delete zone target
   */
  static async deleteZoneTarget(req: AuthRequest, res: Response) {
    try {
      const { targetId } = req.params;

      await prisma.zoneTarget.delete({
        where: { id: parseInt(targetId) }
      });

      logger.info(`Zone target ${targetId} deleted by ${req.user?.email}`);

      return res.json({
        success: true,
        message: 'Target deleted successfully'
      });
    } catch (error) {
      logger.error('Delete zone target error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete zone target'
      });
    }
  }

  // ==================== USER TARGETS ====================
  
  /**
   * Set or update user target
   */
  static async setUserTarget(req: AuthRequest, res: Response) {
    try {
      const { userId, targetPeriod, periodType, targetValue, targetOfferCount, productType } = req.body;

      if (!userId || !targetPeriod || !periodType || !targetValue) {
        return res.status(400).json({
          success: false,
          message: 'User ID, target period, period type, and target value are required'
        });
      }

      // Check if target already exists (with optional product type)
      const existingTarget = await prisma.userTarget.findUnique({
        where: {
          userId_targetPeriod_periodType_productType: {
            userId: parseInt(userId),
            targetPeriod,
            periodType,
            productType: productType || null
          }
        }
      });

      let target;
      if (existingTarget) {
        // Update existing target
        target = await prisma.userTarget.update({
          where: { id: existingTarget.id },
          data: {
            targetValue: new Prisma.Decimal(targetValue),
            targetOfferCount: targetOfferCount || null,
            productType: productType || null,
            updatedById: req.user!.id
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        });
      } else {
        // Create new target
        target = await prisma.userTarget.create({
          data: {
            userId: parseInt(userId),
            targetPeriod,
            periodType,
            productType: productType || null,
            targetValue: new Prisma.Decimal(targetValue),
            targetOfferCount: targetOfferCount || null,
            createdById: req.user!.id,
            updatedById: req.user!.id
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        });
      }

      logger.info(`User target ${existingTarget ? 'updated' : 'created'} for user ${userId} by ${req.user?.email}`);

      return res.json({
        success: true,
        message: `Target ${existingTarget ? 'updated' : 'created'} successfully`,
        target
      });
    } catch (error) {
      logger.error('Set user target error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to set user target'
      });
    }
  }

  /**
   * Get all user targets with actual performance - shows ALL users regardless of targets
   */
  static async getUserTargets(req: AuthRequest, res: Response) {
    try {
      const { targetPeriod, periodType, grouped, actualValuePeriod } = req.query;

      if (!targetPeriod || !periodType) {
        return res.status(400).json({
          success: false,
          message: 'Target period and period type are required'
        });
      }

      // Get ALL active zone users first
      const whereUsers: any = { 
        isActive: true,
        role: 'ZONE_USER'
      };
      
      // For zone users, only show users in their zone
      if (req.user?.role === 'ZONE_USER' && req.user?.zoneId) {
        whereUsers.serviceZones = {
          some: {
            serviceZoneId: parseInt(req.user.zoneId.toString())
          }
        };
      }

      const allUsers = await prisma.user.findMany({
        where: whereUsers,
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' }
      });

      // Get existing targets for the period
      const whereTargets: any = {
        targetPeriod: targetPeriod as string,
        periodType: periodType as any
      };
      
      if (req.user?.role === 'ZONE_USER' && req.user?.zoneId) {
        whereTargets.user = {
          serviceZones: {
            some: {
              serviceZoneId: parseInt(req.user.zoneId.toString())
            }
          }
        };
      }

      const existingTargets = await prisma.userTarget.findMany({
        where: whereTargets,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      });

      // Create a map of existing targets by user ID
      const targetsByUser = new Map();
      existingTargets.forEach(target => {
        const key = target.userId;
        if (!targetsByUser.has(key)) {
          targetsByUser.set(key, []);
        }
        targetsByUser.get(key).push(target);
      });

      // Build complete list with actual performance for ALL users
      const targetsWithActuals = await Promise.all(
        allUsers.map(async (user: any) => {
          const userTargets = targetsByUser.get(user.id) || [];
          
          // Calculate actual performance for this user
          // Use actualValuePeriod for monthly view, otherwise use targetPeriod
          const actualPeriod = actualValuePeriod as string || targetPeriod as string;
          const actualPeriodType = actualValuePeriod ? 'MONTHLY' : periodType as string;
          
          // Skip if trying to use yearly period with monthly period type
          if (actualPeriodType === 'MONTHLY' && !actualPeriod.includes('-')) {
            return {
              id: null,
              userId: user.id,
              targetPeriod: targetPeriod as string,
              periodType: periodType as string,
              user: user,
              targetValue: 0,
              actualValue: 0,
              actualOfferCount: 0,
              targetOfferCount: 0,
              achievement: 0,
              targetCount: 0
            };
          }
          
          const actual = await TargetController.getUserActualPerformance(
            user.id,
            actualPeriod,
            actualPeriodType,
            undefined // Overall performance (no product filter)
          );

          // If user has targets, sum them up
          if (userTargets.length > 0) {
            const totalTargetValue = userTargets.reduce((sum: number, t: any) => sum + Number(t.targetValue), 0);
            return {
              id: userTargets[0].id, // Use first target's ID
              userId: user.id,
              targetPeriod: targetPeriod as string,
              periodType: periodType as string,
              user: user,
              targetValue: totalTargetValue,
              actualValue: actual.value,
              actualOfferCount: actual.count,
              targetOfferCount: userTargets.reduce((sum: number, t: any) => sum + (t.targetOfferCount || 0), 0),
              achievement: totalTargetValue > 0 ? (actual.value / totalTargetValue) * 100 : 0,
              targetCount: userTargets.length
            };
          } else {
            // User has no targets - show with 0 target value
            return {
              id: null,
              userId: user.id,
              targetPeriod: targetPeriod as string,
              periodType: periodType as string,
              user: user,
              targetValue: 0,
              actualValue: actual.value,
              actualOfferCount: actual.count,
              targetOfferCount: 0,
              achievement: 0, // No target = 0% achievement
              targetCount: 0
            };
          }
        })
      );

      // If grouped, aggregate by user
      if (grouped === 'true') {
        const groupedTargets: any = {};
        
        targetsWithActuals.forEach((target) => {
          const key = target.userId;
          if (!groupedTargets[key]) {
            groupedTargets[key] = {
              id: target.id,
              userId: target.userId,
              targetPeriod: target.targetPeriod,
              periodType: target.periodType,
              user: target.user,
              targetValue: 0,
              actualValue: 0,
              targetOfferCount: 0,
              actualOfferCount: 0,
              targetCount: 0
            };
          }
          groupedTargets[key].targetValue += target.targetValue;
          groupedTargets[key].actualValue += target.actualValue;
          groupedTargets[key].targetOfferCount += (target.targetOfferCount || 0);
          groupedTargets[key].actualOfferCount += target.actualOfferCount;
          groupedTargets[key].targetCount += 1;
        });

        const result = Object.values(groupedTargets).map((t: any) => ({
          ...t,
          achievement: t.targetValue > 0 ? (t.actualValue / t.targetValue) * 100 : 0
        }));

        return res.json({
          success: true,
          targets: result
        });
      }

      // If not grouped, return individual targets with their actual performance
      const individualTargets = await Promise.all(
        existingTargets.map(async (target: any) => {
          // Use actualValuePeriod for monthly view, otherwise use target's period
          const actualPeriod = actualValuePeriod as string || target.targetPeriod;
          const actualPeriodType = actualValuePeriod ? 'MONTHLY' : target.periodType;
          
          // Skip if trying to use yearly period with monthly period type
          if (actualPeriodType === 'MONTHLY' && !actualPeriod.includes('-')) {
            return {
              id: target.id,
              userId: target.userId,
              targetPeriod: target.targetPeriod,
              periodType: target.periodType,
              productType: target.productType,
              targetValue: Number(target.targetValue),
              targetOfferCount: target.targetOfferCount,
              actualValue: 0,
              actualOfferCount: 0,
              achievement: 0,
              user: target.user
            };
          }
          
          const actual = await TargetController.getUserActualPerformance(
            target.userId,
            actualPeriod,
            actualPeriodType,
            target.productType // Include product type filter for individual targets
          );

          return {
            id: target.id,
            userId: target.userId,
            targetPeriod: target.targetPeriod,
            periodType: target.periodType,
            productType: target.productType,
            targetValue: Number(target.targetValue),
            targetOfferCount: target.targetOfferCount,
            actualValue: actual.value,
            actualOfferCount: actual.count,
            achievement: Number(target.targetValue) > 0 ? (actual.value / Number(target.targetValue)) * 100 : 0,
            user: target.user
          };
        })
      );

      return res.json({
        success: true,
        targets: individualTargets
      });
    } catch (error) {
      logger.error('Get user targets error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user targets'
      });
    }
  }

  /**
   * Update user target by ID
   */
  static async updateUserTarget(req: AuthRequest, res: Response) {
    try {
      const { targetId } = req.params;
      const { targetValue, targetOfferCount } = req.body;

      if (!targetValue) {
        return res.status(400).json({
          success: false,
          message: 'Target value is required'
        });
      }

      // Update the target
      const target = await prisma.userTarget.update({
        where: { id: parseInt(targetId) },
        data: {
          targetValue: new Prisma.Decimal(targetValue),
          targetOfferCount: targetOfferCount || null,
          updatedById: req.user!.id
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      logger.info(`User target ${targetId} updated by ${req.user?.email}`);

      return res.json({
        success: true,
        message: 'Target updated successfully',
        target
      });
    } catch (error) {
      logger.error('Update user target error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user target'
      });
    }
  }

  /**
   * Delete user target
   */
  static async deleteUserTarget(req: AuthRequest, res: Response) {
    try {
      const { targetId } = req.params;

      await prisma.userTarget.delete({
        where: { id: parseInt(targetId) }
      });

      logger.info(`User target ${targetId} deleted by ${req.user?.email}`);

      return res.json({
        success: true,
        message: 'Target deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user target error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user target'
      });
    }
  }

  // ==================== PRODUCT TYPE TARGETS ====================
  
  // ==================== ANALYTICS & DASHBOARD ====================

  /**
   * Get comprehensive target dashboard
   */
  static async getTargetDashboard(req: AuthRequest, res: Response) {
    try {
      const { targetPeriod, periodType } = req.query;

      if (!targetPeriod || !periodType) {
        return res.status(400).json({
          success: false,
          message: 'Target period and period type are required'
        });
      }

      // Fetch all targets for the period
      const [zoneTargets, userTargets] = await Promise.all([
        prisma.zoneTarget.findMany({
          where: { targetPeriod: targetPeriod as string, periodType: periodType as any },
          include: { serviceZone: { select: { id: true, name: true } } }
        }),
        prisma.userTarget.findMany({
          where: { targetPeriod: targetPeriod as string, periodType: periodType as any },
          include: { user: { select: { id: true, name: true, email: true } } }
        })
      ]);

      // Calculate actuals for each category
      const zonePerformance = await Promise.all(
        zoneTargets.map(async (target: any) => {
          const actual = await TargetController.getZoneActualPerformance(
            target.serviceZoneId,
            target.targetPeriod,
            target.periodType,
            target.productType
          );
          return {
            id: target.id,
            name: target.serviceZone.name,
            targetValue: Number(target.targetValue),
            actualValue: actual.value,
            targetOfferCount: target.targetOfferCount,
            actualOfferCount: actual.count,
            achievement: Number(target.targetValue) > 0 ? (actual.value / Number(target.targetValue)) * 100 : 0
          };
        })
      );

      const userPerformance = await Promise.all(
        userTargets.map(async (target: any) => {
          const actual = await TargetController.getUserActualPerformance(
            target.userId,
            target.targetPeriod,
            target.periodType,
            target.productType
          );
          return {
            id: target.id,
            name: target.user.name || target.user.email,
            targetValue: Number(target.targetValue),
            actualValue: actual.value,
            targetOfferCount: target.targetOfferCount,
            actualOfferCount: actual.count,
            achievement: Number(target.targetValue) > 0 ? (actual.value / Number(target.targetValue)) * 100 : 0
          };
        })
      );

      // Calculate overall statistics
      const totalTargetValue = 
        zonePerformance.reduce((sum, z) => sum + z.targetValue, 0) +
        userPerformance.reduce((sum, u) => sum + u.targetValue, 0);

      const totalActualValue = 
        zonePerformance.reduce((sum, z) => sum + z.actualValue, 0) +
        userPerformance.reduce((sum, u) => sum + u.actualValue, 0);

      const overallAchievement = totalTargetValue > 0 ? (totalActualValue / totalTargetValue) * 100 : 0;

      return res.json({
        success: true,
        dashboard: {
          period: targetPeriod,
          periodType,
          overall: {
            totalTargetValue,
            totalActualValue,
            achievement: overallAchievement
          },
          zones: zonePerformance,
          users: userPerformance
        }
      });
    } catch (error) {
      logger.error('Get target dashboard error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch target dashboard'
      });
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get actual performance for a zone
   */
  private static async getZoneActualPerformance(
    serviceZoneId: number,
    targetPeriod: string,
    periodType: string,
    productType?: string
  ): Promise<{ value: number; count: number }> {
    try {
      const dateFilter = TargetController.buildDateFilter(targetPeriod, periodType);

    // Build base where clause
    const whereClause: any = {
      zoneId: serviceZoneId,
      createdAt: dateFilter // Use createdAt as the primary date filter
    };

    // Add product type filter if specified
    if (productType) {
      whereClause.productType = productType;
    }

    // Get all offers for the period and zone
    const offers = await prisma.offer.findMany({
      where: whereClause,
      select: {
        id: true,
        stage: true,
        poValue: true,
        offerValue: true,
        createdAt: true,
        offerClosedInCrm: true,
        poDate: true
      }
    });

    // Filter and calculate actual performance
    let totalValue = 0;
    let count = 0;

    for (const offer of offers) {
      // Only count offers that are in successful stages
      if (['WON', 'PO_RECEIVED', 'ORDER_BOOKED'].includes(offer.stage)) {
        // Use poValue if available, otherwise use offerValue (but not both)
        const value = offer.poValue ? Number(offer.poValue) : 
                     (offer.offerValue ? Number(offer.offerValue) : 0);
        
        if (value > 0) {
          totalValue += value;
          count++;
        }
      }
    }

    return {
      value: totalValue,
      count: count
    };
    } catch (error: any) {
      logger.error(`Error getting zone actual performance: ${error.message}`, { serviceZoneId, targetPeriod, periodType, productType });
      return { value: 0, count: 0 };
    }
  }

  /**
   * Get actual performance for a user
   */
  private static async getUserActualPerformance(
    userId: number,
    targetPeriod: string,
    periodType: string,
    productType?: string
  ): Promise<{ value: number; count: number }> {
    try {
      const dateFilter = TargetController.buildDateFilter(targetPeriod, periodType);

    // Build base where clause
    const whereClause: any = {
      createdById: userId,
      createdAt: dateFilter // Use createdAt as the primary date filter
    };

    // Add product type filter if specified
    if (productType) {
      whereClause.productType = productType;
    }

    // Get all offers for the period and user
    const offers = await prisma.offer.findMany({
      where: whereClause,
      select: {
        id: true,
        stage: true,
        poValue: true,
        offerValue: true,
        createdAt: true,
        offerClosedInCrm: true,
        poDate: true
      }
    });

    // Filter and calculate actual performance
    let totalValue = 0;
    let count = 0;

    for (const offer of offers) {
      // Only count offers that are in successful stages
      if (['WON', 'PO_RECEIVED', 'ORDER_BOOKED'].includes(offer.stage)) {
        // Use poValue if available, otherwise use offerValue (but not both)
        const value = offer.poValue ? Number(offer.poValue) : 
                     (offer.offerValue ? Number(offer.offerValue) : 0);
        
        if (value > 0) {
          totalValue += value;
          count++;
        }
      }
    }

    return {
      value: totalValue,
      count: count
    };
    } catch (error: any) {
      logger.error(`Error getting user actual performance: ${error.message}`, { userId, targetPeriod, periodType, productType });
      return { value: 0, count: 0 };
    }
  }

  /**
   * Build date filter based on period type
   */
  private static buildDateFilter(targetPeriod: string, periodType: string): any {
    if (periodType === 'MONTHLY') {
      // Format: "YYYY-MM"
      if (!targetPeriod || !targetPeriod.includes('-')) {
        logger.error(`Invalid monthly period format: ${targetPeriod}. Expected YYYY-MM`);
        throw new Error(`Invalid monthly period format: ${targetPeriod}. Expected YYYY-MM`);
      }
      
      const parts = targetPeriod.split('-');
      if (parts.length !== 2) {
        logger.error(`Invalid monthly period format: ${targetPeriod}. Expected YYYY-MM`);
        throw new Error(`Invalid monthly period format: ${targetPeriod}. Expected YYYY-MM`);
      }
      
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 1900 || year > 2100) {
        logger.error(`Invalid date values: year=${year}, month=${month} from period=${targetPeriod}`);
        throw new Error(`Invalid date values in period: ${targetPeriod}`);
      }
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      // Validate the created dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        logger.error(`Failed to create valid dates from period: ${targetPeriod}`);
        throw new Error(`Failed to create valid dates from period: ${targetPeriod}`);
      }
      
      return {
        gte: startDate,
        lte: endDate
      };
    } else {
      // Format: "YYYY"
      const year = parseInt(targetPeriod);
      
      if (isNaN(year) || year < 1900 || year > 2100) {
        logger.error(`Invalid yearly period: ${targetPeriod}. Expected YYYY`);
        throw new Error(`Invalid yearly period: ${targetPeriod}. Expected YYYY`);
      }
      
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      
      // Validate the created dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        logger.error(`Failed to create valid dates from year: ${year}`);
        throw new Error(`Failed to create valid dates from year: ${year}`);
      }
      
      return {
        gte: startDate,
        lte: endDate
      };
    }
  }
}
