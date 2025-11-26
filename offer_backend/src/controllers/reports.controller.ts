import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { generatePdf, getPdfColumns } from '../utils/pdfGenerator';
import { generateExcel, getExcelColumns } from '../utils/excelGenerator';
import { TargetController } from './target.controller';

export class ReportsController {
  /**
   * Generate comprehensive offer report with filtering and pagination
   * Returns offers with important fields for list view
   */
  static async generateReport(req: AuthRequest, res: Response) {
    try {
      const {
        reportType,
        from,
        to,
        zoneId,
        customerId,
        productType,
        status,
        stage,
        assignedToId,
        search,
        page = '1',
        limit = '50',
      } = req.query;

      // Handle different report types
      if (reportType === 'target-report') {
        return ReportsController.generateTargetReport(req, res);
      }
      
      if (reportType !== 'offer-summary') {
        return res.status(400).json({ 
          error: 'Invalid report type. Supported types: "offer-summary", "target-report"' 
        });
      }

      // Build where clause
      const where: any = {};

      // Date range filter
      if (from || to) {
        where.createdAt = {};
        if (from) {
          where.createdAt.gte = new Date(from as string);
        }
        if (to) {
          const endDate = new Date(to as string);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
        }
      }

      // Zone filter - zone users can only see their zone's offers
      if (req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER') {
        if (req.user.zoneId) {
          where.zoneId = parseInt(req.user.zoneId);
        }
      } else if (zoneId) {
        where.zoneId = parseInt(zoneId as string);
      }

      // Other filters
      if (customerId) {
        where.customerId = parseInt(customerId as string);
      }
      if (productType) {
        where.productType = productType;
      }
      if (status) {
        where.status = status;
      }
      if (stage) {
        where.stage = stage;
      }
      if (assignedToId) {
        where.assignedToId = parseInt(assignedToId as string);
      }

      // Search filter
      if (search) {
        where.OR = [
          { offerReferenceNumber: { contains: search as string, mode: 'insensitive' } },
          { title: { contains: search as string, mode: 'insensitive' } },
          { company: { contains: search as string, mode: 'insensitive' } },
          { contactPersonName: { contains: search as string, mode: 'insensitive' } },
          { poNumber: { contains: search as string, mode: 'insensitive' } },
          { machineSerialNumber: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Fetch offers with important fields
      const [offers, total] = await Promise.all([
        prisma.offer.findMany({
          where,
          select: {
            // Basic Information
            id: true,
            offerReferenceNumber: true,
            offerReferenceDate: true,
            title: true,
            description: true,
            productType: true,
            lead: true,
            
            // Customer Information
            company: true,
            location: true,
            department: true,
            registrationDate: true,
            
            // Contact Information
            contactPersonName: true,
            contactNumber: true,
            email: true,
            
            // Asset Information
            machineSerialNumber: true,
            
            // Status & Progress
            status: true,
            stage: true,
            priority: true,
            
            // Financial Information
            offerValue: true,
            offerMonth: true,
            poExpectedMonth: true,
            probabilityPercentage: true,
            
            // PO Information
            poNumber: true,
            poDate: true,
            poValue: true,
            poReceivedMonth: true,
            
            // Business Information
            openFunnel: true,
            remarks: true,
            
            // System Dates
            bookingDateInSap: true,
            offerEnteredInCrm: true,
            offerClosedInCrm: true,
            
            // Relations (important fields only)
            customer: {
              select: {
                id: true,
                companyName: true,
                location: true,
                department: true,
              },
            },
            contact: {
              select: {
                id: true,
                contactPersonName: true,
                contactNumber: true,
                email: true,
              },
            },
            zone: {
              select: {
                id: true,
                name: true,
                shortForm: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            updatedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.offer.count({ where }),
      ]);

      // Calculate summary statistics
      const summary = await prisma.offer.aggregate({
        where,
        _count: { id: true },
        _sum: {
          offerValue: true,
          poValue: true,
        },
      });

      // Won offers statistics
      const wonOffers = await prisma.offer.aggregate({
        where: { ...where, stage: 'WON' },
        _count: { id: true },
        _sum: {
          offerValue: true,
          poValue: true,
        },
      });

      // Status distribution
      const statusDistribution = await prisma.offer.groupBy({
        where,
        by: ['status'],
        _count: { id: true },
      });

      // Stage distribution
      const stageDistribution = await prisma.offer.groupBy({
        where,
        by: ['stage'],
        _count: { id: true },
      });

      // Product type distribution
      const productTypeDistribution = await prisma.offer.groupBy({
        where,
        by: ['productType'],
        _count: { id: true },
        _sum: {
          offerValue: true,
        },
      });

      // Format distributions
      const statusDist: Record<string, number> = {};
      statusDistribution.forEach((item) => {
        statusDist[item.status] = item._count.id;
      });

      const stageDist: Record<string, number> = {};
      stageDistribution.forEach((item) => {
        stageDist[item.stage] = item._count.id;
      });

      const productTypeDist: Record<string, { count: number; totalValue: number }> = {};
      productTypeDistribution.forEach((item) => {
        productTypeDist[item.productType || 'UNKNOWN'] = {
          count: item._count.id,
          totalValue: Number(item._sum.offerValue || 0),
        };
      });

      res.json({
        success: true,
        data: {
          offers,
          summary: {
            totalOffers: summary._count.id,
            totalOfferValue: Number(summary._sum.offerValue || 0),
            totalPoValue: Number(summary._sum.poValue || 0),
            wonOffers: wonOffers._count.id,
            wonOfferValue: Number(wonOffers._sum.offerValue || 0),
            wonPoValue: Number(wonOffers._sum.poValue || 0),
            successRate: summary._count.id > 0 ? (wonOffers._count.id / summary._count.id) * 100 : 0,
            conversionRate: summary._sum.offerValue ? (Number(summary._sum.poValue || 0) / Number(summary._sum.offerValue || 1)) * 100 : 0,
          },
          statusDistribution: statusDist,
          stageDistribution: stageDist,
          productTypeDistribution: productTypeDist,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
      return;
    } catch (error) {
      logger.error('Generate report error:', error);
      res.status(500).json({ error: 'Failed to generate report' });
      return;
    }
  }

  /**
   * Get full zone target details with project-wise offers
   */
  static async getZoneTargetDetails(req: AuthRequest, res: Response) {
    try {
      let { zoneId, targetPeriod, periodType } = req.query as any;

      // Default to user's zone for zone roles if not provided
      if ((!zoneId || zoneId === '') && (req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER') && req.user.zoneId) {
        zoneId = req.user.zoneId.toString();
      }

      if (!zoneId || !targetPeriod || !periodType) {
        return res.status(400).json({ error: 'Zone ID, target period, and period type are required' });
      }

      const zoneIdNum = parseInt(zoneId as string);

      // Enforce access for zone users
      if ((req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER') && req.user.zoneId) {
        if (zoneIdNum !== parseInt(req.user.zoneId.toString())) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      // Fetch zone info
      const zone = await prisma.serviceZone.findUnique({
        where: { id: zoneIdNum },
        select: { id: true, name: true, shortForm: true }
      });
      if (!zone) {
        return res.status(404).json({ error: 'Zone not found' });
      }

      // Fetch zone targets for the period
      const zoneTargets = await prisma.zoneTarget.findMany({
        where: {
          serviceZoneId: zoneIdNum,
          targetPeriod: targetPeriod as string,
          periodType: periodType as any,
        },
        include: {
          serviceZone: { select: { id: true, name: true, shortForm: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          updatedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { productType: 'asc' },
      });

      // Define all product types
      const allProductTypes = ['RELOCATION', 'CONTRACT', 'SPP', 'UPGRADE_KIT', 'SOFTWARE', 'BD_CHARGES', 'BD_SPARE', 'MIDLIFE_UPGRADE', 'RETROFIT_KIT'];
      
      // Create targets for all product types (use existing or create empty ones)
      const targetsMap = new Map(zoneTargets.map(t => [t.productType || 'ALL', t]));
      const allZoneTargets = allProductTypes.map(pt => 
        targetsMap.get(pt) || {
          id: null,
          serviceZoneId: zoneIdNum,
          targetPeriod: targetPeriod as string,
          periodType: periodType as string,
          productType: pt,
          targetValue: 0,
          targetOfferCount: null,
          createdById: 0,
          updatedById: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          serviceZone: zone,
          createdBy: null,
          updatedBy: null,
        }
      );

      // Build offers and performance for each target
      const targetsWithPerformance = await Promise.all(
        allZoneTargets.map(async (target: any) => {
          const dateFilter = TargetController.buildDateFilter(target.targetPeriod, target.periodType);
          const startDate: Date = dateFilter.gte as Date;
          const endDate: Date = dateFilter.lte as Date;

          const whereClause: any = {
            zoneId: zoneIdNum,
            stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] },
            ...(target.productType ? { productType: target.productType } : {}),
            OR: [
              {
                AND: [
                  { stage: { in: ['PO_RECEIVED', 'ORDER_BOOKED'] } },
                  { poDate: { gte: startDate, lte: endDate } },
                ],
              },
              {
                AND: [
                  { stage: 'ORDER_BOOKED' },
                  { bookingDateInSap: { gte: startDate, lte: endDate } },
                ],
              },
              {
                AND: [
                  { stage: 'WON' },
                  { offerClosedInCrm: { gte: startDate, lte: endDate } },
                ],
              },
              {
                AND: [
                  { OR: [ { poDate: null }, { offerClosedInCrm: null }, { bookingDateInSap: null } ] },
                  { createdAt: { gte: startDate, lte: endDate } },
                ],
              },
            ],
          };

          // Fetch offers for this zone (and product type if specified)
          const offers = await prisma.offer.findMany({
            where: whereClause,
            include: {
              customer: { select: { id: true, companyName: true } },
              zone: { select: { id: true, name: true } },
              createdBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          });

          let actualValue = 0;
          let actualOfferCount = 0;
          const contributingOffers: any[] = [];
          for (const offer of offers) {
            if (['WON', 'PO_RECEIVED', 'ORDER_BOOKED'].includes(offer.stage)) {
              const value = offer.poValue ? Number(offer.poValue) : (offer.offerValue ? Number(offer.offerValue) : 0);
              if (value > 0) {
                actualValue += value;
                actualOfferCount++;
                contributingOffers.push({
                  id: offer.id,
                  offerReferenceNumber: offer.offerReferenceNumber,
                  company: offer.company,
                  stage: offer.stage,
                  offerValue: offer.offerValue ? Number(offer.offerValue) : 0,
                  poValue: offer.poValue ? Number(offer.poValue) : 0,
                  value,
                  createdAt: offer.createdAt,
                  poDate: offer.poDate,
                  bookingDateInSap: offer.bookingDateInSap,
                  offerClosedInCrm: offer.offerClosedInCrm,
                  customer: offer.customer,
                  zone: offer.zone,
                });
              }
            }
          }

          const targetValue = Number(target.targetValue || 0);
          const achievement = targetValue > 0 ? (actualValue / targetValue) * 100 : 0;

          // Calculate zone/user contribution breakdown
          const zoneContribution = new Map<number, { name: string; value: number; count: number }>();
          for (const offer of contributingOffers) {
            const zoneId = offer.zone?.id || 0;
            const zoneName = offer.zone?.name || 'Unknown';
            const existing = zoneContribution.get(zoneId) || { name: zoneName, value: 0, count: 0 };
            existing.value += offer.value;
            existing.count += 1;
            zoneContribution.set(zoneId, existing);
          }

          // Get top customers for this product type
          const customerContribution = new Map<number, { name: string; value: number; count: number }>();
          for (const offer of contributingOffers) {
            const customerId = offer.customer?.id || 0;
            const customerName = offer.customer?.companyName || 'Unknown';
            const existing = customerContribution.get(customerId) || { name: customerName, value: 0, count: 0 };
            existing.value += offer.value;
            existing.count += 1;
            customerContribution.set(customerId, existing);
          }

          const topCustomers = Array.from(customerContribution.values())
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

          return {
            ...target,
            targetValue,
            actualValue,
            actualOfferCount,
            targetOfferCount: target.targetOfferCount || 0,
            achievement: Math.round(achievement * 100) / 100,
            variance: actualValue - targetValue,
            variancePercentage: targetValue > 0 ? Math.round(((actualValue - targetValue) / targetValue) * 100 * 100) / 100 : 0,
            contributingOffers,
            allOffers: offers.map((o) => ({
              id: o.id,
              offerReferenceNumber: o.offerReferenceNumber,
              company: o.company,
              stage: o.stage,
              offerValue: o.offerValue ? Number(o.offerValue) : 0,
              poValue: o.poValue ? Number(o.poValue) : 0,
              createdAt: o.createdAt,
              poDate: o.poDate,
              bookingDateInSap: o.bookingDateInSap,
              offerClosedInCrm: o.offerClosedInCrm,
              customer: o.customer,
              zone: o.zone,
            })),
            analytics: {
              zoneContribution: Array.from(zoneContribution.values()),
              topCustomers,
            },
          };
        })
      );

      // Calculate overall summary
      const totalTargetValue = targetsWithPerformance.reduce((sum, t: any) => sum + (t.targetValue || 0), 0);
      const totalActualValue = targetsWithPerformance.reduce((sum, t: any) => sum + (t.actualValue || 0), 0);
      const totalTargetOfferCount = targetsWithPerformance.reduce((sum, t: any) => sum + (t.targetOfferCount || 0), 0);
      const totalActualOfferCount = targetsWithPerformance.reduce((sum, t: any) => sum + (t.actualOfferCount || 0), 0);

      res.json({
        success: true,
        data: {
          zone,
          targets: targetsWithPerformance,
          summary: {
            totalTargets: targetsWithPerformance.length,
            totalTargetValue,
            totalActualValue,
            totalTargetOfferCount,
            totalActualOfferCount,
            overallAchievement: totalTargetValue > 0 ? Math.round((totalActualValue / totalTargetValue) * 100 * 100) / 100 : 0,
          },
          period: { targetPeriod, periodType },
        },
      });
      return;
    } catch (error) {
      logger.error('Get zone target details error:', error);
      res.status(500).json({ error: 'Failed to fetch zone target details' });
      return;
    }
  }

  /**
   * Get full offer details for view option
   * Returns complete offer information with all relations
   */
  static async getOfferDetails(req: AuthRequest, res: Response) {
    try {
      const { offerId } = req.params;

      if (!offerId) {
        return res.status(400).json({ error: 'Offer ID is required' });
      }

      const offer = await prisma.offer.findUnique({
        where: { id: parseInt(offerId) },
        include: {
          customer: {
            include: {
              contacts: {
                where: {
                  isActive: true,
                },
              },
            },
          },
          contact: true,
          zone: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          offerSpareParts: {
            include: {
              sparePart: {
                select: {
                  id: true,
                  name: true,
                  partNumber: true,
                  description: true,
                  category: true,
                  basePrice: true,
                  imageUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          offerAssets: {
            include: {
              asset: {
                include: {
                  customer: {
                    select: {
                      id: true,
                      companyName: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          stageRemarks: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Zone users and zone managers can only access offers in their zone
      if ((req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER') && req.user.zoneId) {
        if (offer.zoneId !== parseInt(req.user.zoneId)) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      res.json({
        success: true,
        data: {
          offer,
        },
      });
      return;
    } catch (error) {
      logger.error('Get offer details error:', error);
      res.status(500).json({ error: 'Failed to fetch offer details' });
      return;
    }
  }

  /**
   * Legacy analytics report endpoint (kept for compatibility)
   */
  static async getAnalyticsReport(req: AuthRequest, res: Response) {
    try {
      // Redirect to generateReport with reportType=offer-summary
      req.query.reportType = 'offer-summary';
      return ReportsController.generateReport(req, res);
    } catch (error) {
      logger.error('Get analytics report error:', error);
      res.status(500).json({ error: 'Failed to generate analytics report' });
      return;
    }
  }

  /**
   * Export report to PDF or Excel
   */
  static async exportReport(req: AuthRequest, res: Response) {
    try {
      const {
        reportType,
        from,
        to,
        zoneId,
        customerId,
        productType,
        status,
        stage,
        format = 'pdf',
      } = req.query;

      if (!reportType || reportType !== 'offer-summary') {
        return res.status(400).json({ 
          error: 'Invalid report type. Only "offer-summary" is supported.' 
        });
      }

      // Build where clause (same as generateReport)
      const where: any = {};

      if (from || to) {
        where.createdAt = {};
        if (from) {
          where.createdAt.gte = new Date(from as string);
        }
        if (to) {
          const endDate = new Date(to as string);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
        }
      }

      if (req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER') {
        if (req.user.zoneId) {
          where.zoneId = parseInt(req.user.zoneId);
        }
      } else if (zoneId) {
        where.zoneId = parseInt(zoneId as string);
      }

      if (customerId) {
        where.customerId = parseInt(customerId as string);
      }
      if (productType) {
        where.productType = productType;
      }
      if (status) {
        where.status = status;
      }
      if (stage) {
        where.stage = stage;
      }

      // Fetch offers with all necessary fields
      const offers = await prisma.offer.findMany({
        where,
        select: {
          offerReferenceNumber: true,
          offerReferenceDate: true,
          title: true,
          company: true,
          location: true,
          contactPersonName: true,
          productType: true,
          stage: true,
          offerValue: true,
          poNumber: true,
          poValue: true,
          createdAt: true,
          zone: {
            select: {
              name: true,
            },
          },
          createdBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate summary
      const summary = await prisma.offer.aggregate({
        where,
        _count: { id: true },
        _sum: {
          offerValue: true,
          poValue: true,
        },
      });

      const summaryData = {
        'Total Offers': summary._count.id,
        'Total Offer Value': summary._sum.offerValue 
          ? `₹${(Number(summary._sum.offerValue) / 100000).toFixed(2)}L` 
          : '₹0.00L',
        'Total PO Value': summary._sum.poValue 
          ? `₹${(Number(summary._sum.poValue) / 100000).toFixed(2)}L` 
          : '₹0.00L',
      };

      const filters = {
        from: from ? new Date(from as string).toISOString() : undefined,
        to: to ? new Date(to as string).toISOString() : undefined,
        zoneId: zoneId as string | undefined,
        customerId: customerId as string | undefined,
        productType: productType as string | undefined,
      };

      const title = 'Offer Summary Report';

      if (format === 'excel') {
        const columns = getExcelColumns('offer-summary');
        await generateExcel(res, offers, columns, title, filters, summaryData);
        return;
      } else if (format === 'pdf') {
        const columns = getPdfColumns('offer-summary');
        await generatePdf(res, offers, columns, title, filters, summaryData);
        return;
      } else {
        return res.status(400).json({ error: 'Invalid format. Use "pdf" or "excel"' });
      }
    } catch (error) {
      logger.error('Export report error:', error);
      res.status(500).json({ error: 'Failed to export report' });
      return;
    }
  }

  /**
   * Generate comprehensive target report with zone and user targets
   * Shows ALL zones and users (like targets page), not just those with targets
   */
  static async generateTargetReport(req: AuthRequest, res: Response) {
    try {
      const {
        targetPeriod,
        periodType = 'YEARLY',
        zoneId,
      } = req.query;

      if (!targetPeriod) {
        return res.status(400).json({ 
          error: 'Target period is required (format: YYYY-MM for monthly or YYYY for yearly)' 
        });
      }

      // Use TargetController methods directly (same as target pages)
      // This ensures consistency between target pages and target report

      // Store the original periodType to check if monthly view
      const originalPeriodType = periodType as string;
      const targetPeriodStr = targetPeriod as string;
      const isMonthlyView = originalPeriodType === 'MONTHLY' || targetPeriodStr.includes('-');

      // ==================== ZONE TARGETS ====================
      // Call getZoneTargets with grouped=true to get grouped targets
      const zoneTargetParams: any = {
        targetPeriod: isMonthlyView ? targetPeriodStr.split('-')[0] : targetPeriodStr,
        periodType: 'YEARLY', // Always fetch yearly targets
        grouped: 'true',
        ...(isMonthlyView && { actualValuePeriod: targetPeriodStr })
      };

      const zoneIdStr = zoneId as string | undefined;
      if (zoneIdStr && zoneIdStr !== 'all') {
        zoneTargetParams.zoneId = zoneIdStr;
      }

      // Create a mock request for TargetController methods
      const mockReq = {
        ...req,
        query: zoneTargetParams
      } as any;

      // Fetch zone targets using TargetController
      let zoneTargetsWithPerformance: any[] = [];
      try {
        const zoneResponse = await new Promise((resolve, reject) => {
          TargetController.getZoneTargets(mockReq, {
            json: (data: any) => resolve(data),
            status: () => ({ json: (data: any) => reject(data) })
          } as any);
        });
        zoneTargetsWithPerformance = (zoneResponse as any).targets || [];
      } catch (error) {
        logger.error('Error fetching zone targets:', error);
        zoneTargetsWithPerformance = [];
      }

      // ==================== USER TARGETS ====================
      // Fetch user targets using TargetController
      const userTargetParams: any = {
        targetPeriod: isMonthlyView ? targetPeriodStr.split('-')[0] : targetPeriodStr,
        periodType: 'YEARLY', // Always fetch yearly targets
        grouped: 'true',
        ...(isMonthlyView && { actualValuePeriod: targetPeriodStr })
      };

      if (zoneIdStr && zoneIdStr !== 'all') {
        userTargetParams.zoneId = zoneIdStr;
      }

      const mockReqUser = {
        ...req,
        query: userTargetParams
      } as any;

      let userTargetsWithPerformance: any[] = [];
      try {
        const userResponse = await new Promise((resolve, reject) => {
          TargetController.getUserTargets(mockReqUser, {
            json: (data: any) => resolve(data),
            status: () => ({ json: (data: any) => reject(data) })
          } as any);
        });
        userTargetsWithPerformance = (userResponse as any).targets || [];
      } catch (error) {
        logger.error('Error fetching user targets:', error);
        userTargetsWithPerformance = [];
      }

      // Target controller already handles monthly division when isMonthlyView is true
      // No need to divide again here - values are already correct from the target controller

      // Calculate summary
      const totalZoneTargetValue = zoneTargetsWithPerformance.reduce((sum: number, t: any) => sum + (t.targetValue || 0), 0);
      const totalZoneActualValue = zoneTargetsWithPerformance.reduce((sum: number, t: any) => sum + (t.actualValue || 0), 0);
      const totalUserTargetValue = userTargetsWithPerformance.reduce((sum: number, t: any) => sum + (t.targetValue || 0), 0);
      const totalUserActualValue = userTargetsWithPerformance.reduce((sum: number, t: any) => sum + (t.actualValue || 0), 0);

      const summary = {
        totalZoneTargets: zoneTargetsWithPerformance.length,
        totalZoneTargetValue,
        totalZoneActualValue,
        totalZoneAchievement: totalZoneTargetValue > 0 ? (totalZoneActualValue / totalZoneTargetValue) * 100 : 0,
        totalUserTargets: userTargetsWithPerformance.length,
        totalUserTargetValue,
        totalUserActualValue,
        totalUserAchievement: totalUserTargetValue > 0 ? (totalUserActualValue / totalUserTargetValue) * 100 : 0,
      };

      res.json({
        success: true,
        data: {
          zoneTargets: zoneTargetsWithPerformance,
          userTargets: userTargetsWithPerformance,
          summary,
          period: {
            targetPeriod: targetPeriodStr,
            periodType: originalPeriodType,
          },
        },
      });
      return;
    } catch (error) {
      logger.error('Generate target report error:', error);
      res.status(500).json({ error: 'Failed to generate target report' });
      return;
    }
  }

  /**
   * Get full user target details
   */
  static async getUserTargetDetails(req: AuthRequest, res: Response) {
    try {
      const { userId, targetPeriod, periodType } = req.query;

      if (!userId || !targetPeriod || !periodType) {
        return res.status(400).json({
          error: 'User ID, target period, and period type are required'
        });
      }

      const userTargets = await prisma.userTarget.findMany({
        where: {
          userId: parseInt(userId as string),
          targetPeriod: targetPeriod as string,
          periodType: periodType as any,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              phone: true,
              serviceZones: {
                include: {
                  serviceZone: { select: { id: true, name: true, shortForm: true } },
                },
              },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
          updatedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { productType: 'asc' },
      });

      // Define all product types
      const allProductTypes = ['RELOCATION', 'CONTRACT', 'SPP', 'UPGRADE_KIT', 'SOFTWARE', 'BD_CHARGES', 'BD_SPARE', 'MIDLIFE_UPGRADE', 'RETROFIT_KIT'];
      
      // Create targets for all product types (use existing or create empty ones)
      const targetsMap = new Map(userTargets.map(t => [t.productType || 'ALL', t]));
      const allTargets = allProductTypes.map(pt => 
        targetsMap.get(pt) || {
          id: null,
          userId: parseInt(userId as string),
          targetPeriod: targetPeriod as string,
          periodType: periodType as any,
          productType: pt,
          targetValue: 0,
          targetOfferCount: null,
          createdById: 0,
          updatedById: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: userTargets[0]?.user || null,
          createdBy: null,
          updatedBy: null,
        }
      );

      const targetsWithPerformance = await Promise.all(
        allTargets.map(async (target) => {
          const dateFilter = TargetController.buildDateFilter(target.targetPeriod, target.periodType);
          const startDate: Date = dateFilter.gte as Date;
          const endDate: Date = dateFilter.lte as Date;

          const whereClause: any = {
            createdById: target.userId,
            stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] },
            ...(target.productType ? { productType: target.productType } : {}),
            OR: [
              {
                AND: [
                  { stage: { in: ['PO_RECEIVED', 'ORDER_BOOKED'] } },
                  { poDate: { gte: startDate, lte: endDate } },
                ],
              },
              {
                AND: [
                  { stage: 'ORDER_BOOKED' },
                  { bookingDateInSap: { gte: startDate, lte: endDate } },
                ],
              },
              {
                AND: [
                  { stage: 'WON' },
                  { offerClosedInCrm: { gte: startDate, lte: endDate } },
                ],
              },
              {
                AND: [
                  { OR: [ { poDate: null }, { offerClosedInCrm: null }, { bookingDateInSap: null } ] },
                  { createdAt: { gte: startDate, lte: endDate } },
                ],
              },
            ],
          };

          const offers = await prisma.offer.findMany({
            where: whereClause,
            include: {
              customer: { select: { id: true, companyName: true } },
              zone: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          });

          let actualValue = 0;
          let actualOfferCount = 0;
          const contributingOffers: any[] = [];

          for (const offer of offers) {
            const value = offer.poValue ? Number(offer.poValue) : (offer.offerValue ? Number(offer.offerValue) : 0);
            if (value > 0) {
              actualValue += value;
              actualOfferCount++;
              contributingOffers.push({
                id: offer.id,
                offerReferenceNumber: offer.offerReferenceNumber,
                company: offer.company,
                stage: offer.stage,
                offerValue: offer.offerValue ? Number(offer.offerValue) : 0,
                poValue: offer.poValue ? Number(offer.poValue) : 0,
                value,
                createdAt: offer.createdAt,
                poDate: offer.poDate,
                bookingDateInSap: offer.bookingDateInSap,
                offerClosedInCrm: offer.offerClosedInCrm,
                customer: offer.customer,
                zone: offer.zone,
              });
            }
          }

          const targetValue = Number(target.targetValue || 0);
          const achievement = targetValue > 0 ? (actualValue / targetValue) * 100 : 0;

          // Calculate zone/user contribution breakdown
          const zoneContribution = new Map<number, { name: string; value: number; count: number }>();
          for (const offer of contributingOffers) {
            const zoneId = offer.zone?.id || 0;
            const zoneName = offer.zone?.name || 'Unknown';
            const existing = zoneContribution.get(zoneId) || { name: zoneName, value: 0, count: 0 };
            existing.value += offer.value;
            existing.count += 1;
            zoneContribution.set(zoneId, existing);
          }

          // Get top customers for this product type
          const customerContribution = new Map<number, { name: string; value: number; count: number }>();
          for (const offer of contributingOffers) {
            const customerId = offer.customer?.id || 0;
            const customerName = offer.customer?.companyName || 'Unknown';
            const existing = customerContribution.get(customerId) || { name: customerName, value: 0, count: 0 };
            existing.value += offer.value;
            existing.count += 1;
            customerContribution.set(customerId, existing);
          }

          const topCustomers = Array.from(customerContribution.values())
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

          return {
            ...target,
            targetValue,
            actualValue,
            actualOfferCount,
            targetOfferCount: target.targetOfferCount || 0,
            achievement: Math.round(achievement * 100) / 100,
            variance: actualValue - targetValue,
            variancePercentage: targetValue > 0 ? Math.round(((actualValue - targetValue) / targetValue) * 100 * 100) / 100 : 0,
            contributingOffers,
            allOffers: offers.map((o) => ({
              id: o.id,
              offerReferenceNumber: o.offerReferenceNumber,
              company: o.company,
              stage: o.stage,
              offerValue: o.offerValue ? Number(o.offerValue) : 0,
              poValue: o.poValue ? Number(o.poValue) : 0,
              createdAt: o.createdAt,
              poDate: o.poDate,
              bookingDateInSap: o.bookingDateInSap,
              offerClosedInCrm: o.offerClosedInCrm,
              customer: o.customer,
              zone: o.zone,
            })),
            analytics: {
              zoneContribution: Array.from(zoneContribution.values()),
              topCustomers,
            },
          };
        })
      );

      const totalTargetValue = targetsWithPerformance.reduce((sum: number, t: any) => sum + (t.targetValue || 0), 0);
      const totalActualValue = targetsWithPerformance.reduce((sum: number, t: any) => sum + (t.actualValue || 0), 0);
      const totalTargetOfferCount = targetsWithPerformance.reduce((sum: number, t: any) => sum + (t.targetOfferCount || 0), 0);
      const totalActualOfferCount = targetsWithPerformance.reduce((sum: number, t: any) => sum + (t.actualOfferCount || 0), 0);

      res.json({
        success: true,
        data: {
          user: userTargets[0]?.user || null,
          targets: targetsWithPerformance,
          summary: {
            totalTargets: targetsWithPerformance.length,
            totalTargetValue,
            totalActualValue,
            totalTargetOfferCount,
            totalActualOfferCount,
            overallAchievement: totalTargetValue > 0
              ? Math.round((totalActualValue / totalTargetValue) * 100 * 100) / 100
              : 0,
          },
          period: {
            targetPeriod,
            periodType,
          },
        },
      });
      return;
    } catch (error) {
      logger.error('Get user target details error:', error);
      res.status(500).json({ error: 'Failed to fetch user target details' });
      return;
    }
  }

  /**
   * Get target details - unified endpoint for both zone and user targets
   * Similar to getOfferDetails but for targets
   * Usage: GET /api/reports/targets/{targetId}?type=zone&targetPeriod=2025-11&periodType=MONTHLY
   *        GET /api/reports/targets/{targetId}?type=user&targetPeriod=2025-11&periodType=MONTHLY
   */
  static async getTargetDetails(req: AuthRequest, res: Response) {
    try {
      const { targetId } = req.params;
      const { type, targetPeriod, periodType } = req.query;

      if (!type || !targetPeriod || !periodType) {
        res.status(400).json({
          success: false,
          error: 'type, targetPeriod, and periodType are required'
        });
        return;
      }

      if (type === 'zone') {
        const mockReq = {
          ...req,
          params: { zoneId: targetId },
          query: { targetPeriod, periodType }
        } as any;

        TargetController.getZoneTargetDetails(mockReq, {
          json: (data: any) => {
            res.json(data);
          },
          status: (code: number) => ({
            json: (data: any) => {
              res.status(code).json(data);
            }
          })
        } as any);
        return;
      } else if (type === 'user') {
        const mockReq = {
          ...req,
          params: { userId: targetId },
          query: { targetPeriod, periodType }
        } as any;

        TargetController.getUserTargetDetails(mockReq, {
          json: (data: any) => {
            res.json(data);
          },
          status: (code: number) => ({
            json: (data: any) => {
              res.status(code).json(data);
            }
          })
        } as any);
        return;
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid type. Use "zone" or "user"'
        });
        return;
      }
    } catch (error) {
      logger.error('Get target details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch target details'
      });
    }
  }

  /**
   * Product Type Analysis Report
   * Shows performance metrics by product type
   */
  static async getProductTypeAnalysis(req: AuthRequest, res: Response) {
    try {
      const { from, to, zoneId } = req.query;

      // Build where clause
      const where: any = {};

      // Date range filter
      if (from || to) {
        where.createdAt = {};
        if (from) {
          where.createdAt.gte = new Date(from as string);
        }
        if (to) {
          const endDate = new Date(to as string);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
        }
      }

      // Zone filter - zone users can only see their zone's offers
      if (req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER') {
        if (req.user.zoneId) {
          where.zoneId = parseInt(req.user.zoneId);
        }
      } else if (zoneId) {
        where.zoneId = parseInt(zoneId as string);
      }

      // Get all product types with metrics
      const productTypeMetrics = await prisma.offer.groupBy({
        where,
        by: ['productType'],
        _count: { id: true },
        _sum: {
          offerValue: true,
          poValue: true,
        },
      });

      // Get won offers by product type
      const wonByProductType = await prisma.offer.groupBy({
        where: { ...where, stage: 'WON' },
        by: ['productType'],
        _count: { id: true },
        _sum: {
          offerValue: true,
          poValue: true,
        },
      });

      // Get lost offers by product type (stage = 'LOST')
      const lostByProductType = await prisma.offer.groupBy({
        where: { ...where, stage: 'LOST' },
        by: ['productType'],
        _count: { id: true },
      });

      // Define all product types
      const allProductTypes = ['RELOCATION', 'CONTRACT', 'SPP', 'UPGRADE_KIT', 'SOFTWARE', 'BD_CHARGES', 'BD_SPARE', 'MIDLIFE_UPGRADE', 'RETROFIT_KIT'];

      // Create maps for easy lookup
      const metricsMap = new Map(productTypeMetrics.map(m => [m.productType || 'UNKNOWN', m]));
      const wonMap = new Map(wonByProductType.map(m => [m.productType || 'UNKNOWN', m]));
      const lostMap = new Map(lostByProductType.map(m => [m.productType || 'UNKNOWN', m]));

      // Build comprehensive analysis for ALL product types (including those with 0 offers)
      const analysis = allProductTypes.map((productType) => {
        const metric = metricsMap.get(productType);
        const wonMetric = wonMap.get(productType);
        const lostMetric = lostMap.get(productType);

        const totalOffers = metric?._count.id || 0;
        const totalValue = Number(metric?._sum.offerValue || 0);
        const totalPoValue = Number(metric?._sum.poValue || 0);
        const wonOffers = wonMetric?._count.id || 0;
        const wonValue = Number(wonMetric?._sum.offerValue || 0);
        const wonPoValue = Number(wonMetric?._sum.poValue || 0);
        const lostOffers = lostMetric?._count.id || 0;

        const winRate = totalOffers > 0 ? (wonOffers / totalOffers) * 100 : 0;
        const avgDealSize = totalOffers > 0 ? totalValue / totalOffers : 0;

        return {
          productType,
          totalOffers,
          wonOffers,
          lostOffers,
          totalValue,
          wonValue,
          totalPoValue,
          wonPoValue,
          winRate: Math.round(winRate * 100) / 100,
          avgDealSize: Math.round(avgDealSize * 100) / 100,
          conversionRate: wonOffers > 0 ? Math.round((wonOffers / totalOffers) * 100 * 100) / 100 : 0,
        };
      });

      // Sort by total value descending, then by product type name
      analysis.sort((a, b) => {
        if (b.totalValue !== a.totalValue) {
          return b.totalValue - a.totalValue;
        }
        return a.productType.localeCompare(b.productType);
      });

      // Calculate totals
      const totalOffers = analysis.reduce((sum, a) => sum + a.totalOffers, 0);
      const totalWonOffers = analysis.reduce((sum, a) => sum + a.wonOffers, 0);
      const totalLostOffers = analysis.reduce((sum, a) => sum + a.lostOffers, 0);
      const totalValue = analysis.reduce((sum, a) => sum + a.totalValue, 0);
      const totalWonValue = analysis.reduce((sum, a) => sum + a.wonValue, 0);
      const totalPoValue = analysis.reduce((sum, a) => sum + a.totalPoValue, 0);
      const totalWonPoValue = analysis.reduce((sum, a) => sum + a.wonPoValue, 0);

      const totals = {
        totalOffers,
        wonOffers: totalWonOffers,
        lostOffers: totalLostOffers,
        totalValue,
        wonValue: totalWonValue,
        totalPoValue,
        wonPoValue: totalWonPoValue,
        winRate: totalOffers > 0 ? Math.round((totalWonOffers / totalOffers) * 100 * 100) / 100 : 0,
        avgDealSize: totalOffers > 0 ? Math.round((totalValue / totalOffers) * 100) / 100 : 0,
        conversionRate: totalOffers > 0 ? Math.round((totalWonOffers / totalOffers) * 100 * 100) / 100 : 0,
      };

      res.json({
        success: true,
        data: {
          analysis,
          totals,
          dateRange: {
            from: from || null,
            to: to || null,
          },
        },
      });
    } catch (error) {
      logger.error('Product type analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate product type analysis',
      });
    }
  }

  /**
   * Customer Performance Report
   * Shows performance metrics by customer
   */
  static async getCustomerPerformance(req: AuthRequest, res: Response) {
    try {
      const { from, to, zoneId, limit = '20' } = req.query;

      // Build where clause
      const where: any = {};

      // Date range filter
      if (from || to) {
        where.createdAt = {};
        if (from) {
          where.createdAt.gte = new Date(from as string);
        }
        if (to) {
          const endDate = new Date(to as string);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
        }
      }

      // Zone filter - zone users can only see their zone's offers
      if (req.user?.role === 'ZONE_USER' || req.user?.role === 'ZONE_MANAGER') {
        if (req.user.zoneId) {
          where.zoneId = parseInt(req.user.zoneId);
        }
      } else if (zoneId) {
        where.zoneId = parseInt(zoneId as string);
      }

      // Get all customer metrics
      const customerMetrics = await prisma.offer.groupBy({
        where,
        by: ['customerId'],
        _count: { id: true },
        _sum: {
          offerValue: true,
          poValue: true,
        },
      });

      // Get won offers by customer
      const wonByCustomer = await prisma.offer.groupBy({
        where: { ...where, stage: 'WON' },
        by: ['customerId'],
        _count: { id: true },
        _sum: {
          offerValue: true,
          poValue: true,
        },
      });

      // Get lost offers by customer (stage = 'LOST')
      const lostByCustomer = await prisma.offer.groupBy({
        where: { ...where, stage: 'LOST' },
        by: ['customerId'],
        _count: { id: true },
      });

      // Create maps for easy lookup
      const metricsMap = new Map(customerMetrics.map(m => [m.customerId, m]));
      const wonMap = new Map(wonByCustomer.map(m => [m.customerId, m]));
      const lostMap = new Map(lostByCustomer.map(m => [m.customerId, m]));

      // Get customer details
      const customerIds = customerMetrics.map(m => m.customerId);
      const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: {
          id: true,
          companyName: true,
          location: true,
          industry: true,
          zone: { select: { id: true, name: true } },
        },
      });

      // Build comprehensive analysis
      const analysis = customers.map((customer) => {
        const metric = metricsMap.get(customer.id);
        const wonMetric = wonMap.get(customer.id);
        const lostMetric = lostMap.get(customer.id);

        const totalOffers = metric?._count.id || 0;
        const totalValue = Number(metric?._sum.offerValue || 0);
        const totalPoValue = Number(metric?._sum.poValue || 0);
        const wonOffers = wonMetric?._count.id || 0;
        const wonValue = Number(wonMetric?._sum.offerValue || 0);
        const wonPoValue = Number(wonMetric?._sum.poValue || 0);
        const lostOffers = lostMetric?._count.id || 0;

        const winRate = totalOffers > 0 ? (wonOffers / totalOffers) * 100 : 0;
        const avgDealSize = totalOffers > 0 ? totalValue / totalOffers : 0;

        return {
          customerId: customer.id,
          companyName: customer.companyName,
          location: customer.location,
          industry: customer.industry,
          zone: customer.zone,
          totalOffers,
          wonOffers,
          lostOffers,
          totalValue,
          wonValue,
          totalPoValue,
          wonPoValue,
          winRate: Math.round(winRate * 100) / 100,
          avgDealSize: Math.round(avgDealSize * 100) / 100,
          conversionRate: totalOffers > 0 ? Math.round((wonOffers / totalOffers) * 100 * 100) / 100 : 0,
        };
      });

      // Sort by total value descending
      analysis.sort((a, b) => b.totalValue - a.totalValue);

      // Get top customers
      const limitNum = parseInt(limit as string) || 20;
      const topCustomers = analysis.slice(0, limitNum);

      // Calculate totals
      const totalCustomers = analysis.length;
      const totalOffers2 = analysis.reduce((sum, a) => sum + a.totalOffers, 0);
      const totalWonOffers2 = analysis.reduce((sum, a) => sum + a.wonOffers, 0);
      const totalLostOffers2 = analysis.reduce((sum, a) => sum + a.lostOffers, 0);
      const totalValue2 = analysis.reduce((sum, a) => sum + a.totalValue, 0);
      const totalWonValue2 = analysis.reduce((sum, a) => sum + a.wonValue, 0);
      const totalPoValue2 = analysis.reduce((sum, a) => sum + a.totalPoValue, 0);
      const totalWonPoValue2 = analysis.reduce((sum, a) => sum + a.wonPoValue, 0);

      const totals = {
        totalCustomers,
        totalOffers: totalOffers2,
        wonOffers: totalWonOffers2,
        lostOffers: totalLostOffers2,
        totalValue: totalValue2,
        wonValue: totalWonValue2,
        totalPoValue: totalPoValue2,
        wonPoValue: totalWonPoValue2,
        winRate: totalOffers2 > 0 ? Math.round((totalWonOffers2 / totalOffers2) * 100 * 100) / 100 : 0,
        avgDealSize: totalOffers2 > 0 ? Math.round((totalValue2 / totalOffers2) * 100) / 100 : 0,
        conversionRate: totalOffers2 > 0 ? Math.round((totalWonOffers2 / totalOffers2) * 100 * 100) / 100 : 0,
      };

      res.json({
        success: true,
        data: {
          topCustomers,
          allCustomers: analysis,
          totals,
          dateRange: {
            from: from || null,
            to: to || null,
          },
        },
      });
    } catch (error) {
      logger.error('Customer performance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate customer performance report',
      });
    }
  }

}
