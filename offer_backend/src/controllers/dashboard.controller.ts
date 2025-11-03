import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

export class DashboardController {
  // Admin dashboard stats with advanced analytics
  static async getAdminDashboard(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);

      const where: any = dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {};

      // Get current date for monthly calculations
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastYearSameMonth = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      const lastYearSameMonthEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Get current period for targets
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Get comprehensive statistics
      const [
        totalOffers,
        activeOffers,
        wonOffers,
        lostOffers,
        totalValue,
        wonValue,
        avgOfferValue,
        wonThisMonth,
        wonLastMonth,
        wonLastYear,
        currentMonthValue,
        previousMonthValue,
        last7DaysOffers,
        last30DaysOffers,
        recentOffers,
        offersByStage,
        offersByZone,
        topCustomers,
        allZones,
        allUsers,
        monthlyOffers,
        stageVelocity,
        currentMonthTargets,
      ] = await Promise.all([
        prisma.offer.count({ where }),
        prisma.offer.count({ where: { ...where, stage: { notIn: ['WON', 'LOST'] } } }),
        prisma.offer.count({ where: { ...where, stage: 'WON' } }),
        prisma.offer.count({ where: { ...where, stage: 'LOST' } }),
        prisma.offer.aggregate({
          where,
          _sum: { offerValue: true },
        }),
        prisma.offer.aggregate({
          where: { ...where, stage: 'WON' },
          _sum: { poValue: true },
        }),
        prisma.offer.aggregate({
          where,
          _avg: { offerValue: true },
        }),
        prisma.offer.count({ 
          where: { ...where, stage: 'WON', createdAt: { gte: firstDayOfMonth } } 
        }),
        prisma.offer.count({ 
          where: { ...where, stage: 'WON', createdAt: { gte: previousMonthStart, lte: previousMonthEnd } } 
        }),
        prisma.offer.count({ 
          where: { ...where, stage: 'WON', createdAt: { gte: lastYearSameMonth, lte: lastYearSameMonthEnd } } 
        }),
        prisma.offer.aggregate({
          where: { ...where, createdAt: { gte: firstDayOfMonth } },
          _sum: { offerValue: true },
        }),
        prisma.offer.aggregate({
          where: { ...where, createdAt: { gte: previousMonthStart, lte: previousMonthEnd } },
          _sum: { offerValue: true },
        }),
        prisma.offer.count({ 
          where: { ...where, createdAt: { gte: last7Days } } 
        }),
        prisma.offer.count({ 
          where: { ...where, createdAt: { gte: last30Days } } 
        }),
        prisma.offer.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                companyName: true,
              },
            },
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.offer.groupBy({
          by: ['stage'],
          where,
          _count: true,
        }),
        prisma.offer.groupBy({
          by: ['zoneId'],
          where,
          _count: true,
          _sum: { offerValue: true },
        }),
        prisma.offer.groupBy({
          by: ['customerId'],
          where,
          _count: true,
          orderBy: {
            _count: {
              customerId: 'desc',
            },
          },
          take: 10,
        }),
        prisma.serviceZone.findMany({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.$queryRaw`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
            COUNT(*)::int as offers,
            SUM(COALESCE("offerValue", 0))::float as value
          FROM "Offer"
          WHERE "createdAt" >= ${sixMonthsAgo}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY DATE_TRUNC('month', "createdAt")
        `,
        prisma.offer.groupBy({
          by: ['stage'],
          where: { ...where, stage: { notIn: ['LOST'] } },
          _count: true,
          _avg: { offerValue: true },
        }),
        // Get current month targets
        Promise.all([
          prisma.zoneTarget.findMany({
            where: { targetPeriod: currentPeriod, periodType: 'MONTHLY', productType: null },
            include: { serviceZone: { select: { id: true, name: true } } }
          }),
          prisma.userTarget.findMany({
            where: { targetPeriod: currentPeriod, periodType: 'MONTHLY', productType: null },
            include: { user: { select: { id: true, name: true, email: true, role: true } } }
          }),
          prisma.zoneTarget.findMany({
            where: { targetPeriod: currentPeriod, periodType: 'MONTHLY', productType: { not: null } },
            include: { serviceZone: { select: { id: true, name: true } } }
          }),
        ]).then(([zones, users, productTypeTargets]) => ({ zones, users, productTypeTargets })),
      ]);

      // Calculate advanced metrics
      const closedOffers = wonOffers + lostOffers;
      // Only show win rate if we have at least 3 closed offers for meaningful data
      const winRate = closedOffers >= 3 ? (wonOffers / closedOffers) * 100 : (closedOffers > 0 ? (wonOffers / closedOffers) * 100 : 0);
      
      // Month-over-Month growth
      const momGrowth = wonLastMonth > 0 ? ((wonThisMonth - wonLastMonth) / wonLastMonth) * 100 : 0;
      const yoyGrowth = wonLastYear > 0 ? ((wonThisMonth - wonLastYear) / wonLastYear) * 100 : 0;
      
      // Value growth
      const currentValue = currentMonthValue._sum.offerValue ? Number(currentMonthValue._sum.offerValue) : 0;
      const previousValue = previousMonthValue._sum.offerValue ? Number(previousMonthValue._sum.offerValue) : 0;
      const valueGrowth = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
      
      // Conversion rate
      const conversionRate = totalOffers > 0 ? (wonOffers / totalOffers) * 100 : 0;
      
      // Average deal time (mock - would need actual tracking)
      const avgDealTime = 45; // days

      // Get zone names for zone stats with values
      const zoneStats = offersByZone.map((z) => {
        const zone = allZones.find((zone) => zone.id === z.zoneId);
        return {
          name: zone?.name || 'Unknown',
          offers: z._count,
          value: z._sum.offerValue ? Number(z._sum.offerValue) : 0,
        };
      });

      // Get customer names for top customers
      const customerIds = topCustomers.map((c) => c.customerId);
      const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, companyName: true },
      });

      const topCustomersWithNames = topCustomers.map((c) => ({
        customer: customers.find((cust) => cust.id === c.customerId)?.companyName || 'Unknown',
        count: c._count,
      }));

      // Stage velocity
      const velocityMetrics = stageVelocity.map((s) => ({
        stage: s.stage,
        count: s._count,
        avgValue: s._avg.offerValue ? Number(s._avg.offerValue) : 0,
      }));

      return res.json({
        stats: {
          totalOffers,
          activeOffers,
          wonOffers,
          lostOffers,
          closedOffers,
          totalValue: totalValue._sum.offerValue ? Number(totalValue._sum.offerValue) : 0,
          wonValue: wonValue._sum.poValue ? Number(wonValue._sum.poValue) : 0,
          avgOfferValue: avgOfferValue._avg.offerValue ? Number(avgOfferValue._avg.offerValue) : 0,
          wonThisMonth,
          wonLastMonth,
          wonLastYear,
          winRate: Math.round(winRate * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10,
          momGrowth: Math.round(momGrowth * 10) / 10,
          yoyGrowth: Math.round(yoyGrowth * 10) / 10,
          valueGrowth: Math.round(valueGrowth * 10) / 10,
          last7DaysOffers,
          last30DaysOffers,
          avgDealTime,
          totalZones: allZones.length,
          activeUsers: allUsers,
        },
        recentOffers,
        offersByStage: offersByStage.map((s) => ({
          stage: s.stage,
          count: s._count,
        })),
        offersByZone: zoneStats,
        topCustomers: topCustomersWithNames,
        monthlyTrend: monthlyOffers,
        velocityMetrics,
        currentMonthTargets: {
          period: currentPeriod,
          zones: currentMonthTargets.zones.map((t: any) => ({
            id: t.id,
            zone: t.serviceZone.name,
            targetValue: Number(t.targetValue),
            targetOfferCount: t.targetOfferCount
          })),
          users: currentMonthTargets.users.map((t: any) => ({
            id: t.id,
            user: t.user.name || t.user.email,
            targetValue: Number(t.targetValue),
            targetOfferCount: t.targetOfferCount
          })),
          productTypes: currentMonthTargets.productTypeTargets.map((t: any) => ({
            id: t.id,
            zone: t.serviceZone.name,
            productType: t.productType,
            targetValue: Number(t.targetValue),
            targetOfferCount: t.targetOfferCount
          }))
        },
      });
    } catch (error) {
      logger.error('Get admin dashboard error:', error);
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  // Zone dashboard stats
  static async getZoneDashboard(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.zoneId) {
        return res.status(400).json({ error: 'Zone ID is required' });
      }

      const zoneId = parseInt(req.user.zoneId);
      const { startDate, endDate } = req.query;

      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);

      const where: any = { zoneId };
      if (dateFilter.gte || dateFilter.lte) {
        where.createdAt = dateFilter;
      }

      // Get current period for targets and time ranges
      const now = new Date();
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      // Get statistics
      const [
        totalOffers,
        openOffers,
        activeOffers,
        wonOffers,
        lostOffers,
        totalValue,
        wonValue,
        avgOfferValue,
        myOffers,
        wonThisMonth,
        wonLastMonth,
        last7DaysOffers,
        last30DaysOffers,
        recentOffers,
        offersByStage,
        topCustomers,
        monthlyTrend,
        myTarget,
        zoneTarget,
      ] = await Promise.all([
        prisma.offer.count({ where }),
        prisma.offer.count({ where: { ...where, status: 'OPEN' } }),
        prisma.offer.count({ where: { ...where, stage: { notIn: ['WON', 'LOST'] } } }),
        prisma.offer.count({ where: { ...where, stage: 'WON' } }),
        prisma.offer.count({ where: { ...where, stage: 'LOST' } }),
        prisma.offer.aggregate({
          where,
          _sum: { offerValue: true },
        }),
        prisma.offer.aggregate({
          where: { ...where, stage: 'WON' },
          _sum: { poValue: true },
        }),
        prisma.offer.aggregate({
          where,
          _avg: { offerValue: true },
        }),
        prisma.offer.count({
          where: { ...where, createdById: req.user.id },
        }),
        prisma.offer.count({ 
          where: { ...where, stage: 'WON', createdAt: { gte: firstDayOfMonth } } 
        }),
        prisma.offer.count({ 
          where: { ...where, stage: 'WON', createdAt: { gte: previousMonthStart, lte: previousMonthEnd } } 
        }),
        prisma.offer.count({ 
          where: { ...where, createdAt: { gte: last7Days } } 
        }),
        prisma.offer.count({ 
          where: { ...where, createdAt: { gte: last30Days } } 
        }),
        prisma.offer.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                companyName: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.offer.groupBy({
          by: ['stage'],
          where,
          _count: true,
        }),
        prisma.offer.groupBy({
          by: ['customerId'],
          where,
          _count: true,
          orderBy: {
            _count: {
              customerId: 'desc',
            },
          },
          take: 10,
        }),
        prisma.$queryRaw`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
            COUNT(*)::int as offers,
            SUM(COALESCE("offerValue", 0))::float as value
          FROM "Offer"
          WHERE "zoneId" = ${zoneId} AND "createdAt" >= ${sixMonthsAgo}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY DATE_TRUNC('month', "createdAt")
        `,
        // Get user's personal target
        prisma.userTarget.findFirst({
          where: { 
            userId: req.user.id,
            targetPeriod: currentPeriod,
            periodType: 'MONTHLY'
          }
        }),
        // Get zone target
        prisma.zoneTarget.findFirst({
          where: { 
            serviceZoneId: zoneId,
            targetPeriod: currentPeriod,
            periodType: 'MONTHLY'
          },
          include: { serviceZone: { select: { id: true, name: true } } }
        }),
      ]);

      // Calculate advanced metrics
      const closedOffers = wonOffers + lostOffers;
      const winRate = closedOffers > 0 ? ((wonOffers / closedOffers) * 100) : 0;
      const conversionRate = totalOffers > 0 ? (wonOffers / totalOffers) * 100 : 0;
      const momGrowth = wonLastMonth > 0 ? ((wonThisMonth - wonLastMonth) / wonLastMonth) * 100 : 0;

      // Get customer names
      const customerIds = topCustomers.map((c) => c.customerId);
      const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, companyName: true },
      });

      const topCustomersWithNames = topCustomers.map((c) => ({
        customer: customers.find((cust) => cust.id === c.customerId)?.companyName || 'Unknown',
        count: c._count,
      }));

      return res.json({
        stats: {
          totalOffers,
          openOffers,
          activeOffers,
          wonOffers,
          lostOffers,
          myOffers,
          totalValue: totalValue._sum.offerValue ? Number(totalValue._sum.offerValue) : 0,
          wonValue: wonValue._sum.poValue ? Number(wonValue._sum.poValue) : 0,
          avgOfferValue: avgOfferValue._avg.offerValue ? Number(avgOfferValue._avg.offerValue) : 0,
          winRate: Math.round(winRate * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10,
          wonThisMonth,
          wonLastMonth,
          momGrowth: Math.round(momGrowth * 10) / 10,
          last7DaysOffers,
          last30DaysOffers,
        },
        recentOffers,
        offersByStage: offersByStage.map((s: any) => ({
          stage: s.stage,
          count: s._count,
        })),
        topCustomers: topCustomersWithNames,
        monthlyTrend,
        myTarget: myTarget ? {
          targetValue: Number(myTarget.targetValue),
          targetOfferCount: myTarget.targetOfferCount,
          period: currentPeriod
        } : null,
        zoneTarget: zoneTarget ? {
          zoneName: zoneTarget.serviceZone.name,
          targetValue: Number(zoneTarget.targetValue),
          targetOfferCount: zoneTarget.targetOfferCount,
          period: currentPeriod
        } : null,
      });
    } catch (error) {
      logger.error('Get zone dashboard error:', error);
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  // Lightweight sidebar stats
  static async getSidebarStats(req: AuthRequest, res: Response) {
    try {
      const userRole = req.user?.role;
      const zoneId = req.user?.zoneId ? parseInt(req.user.zoneId) : undefined;

      // Build where clause based on user role
      const where: any = {};
      if (userRole === 'ZONE_USER' && zoneId) {
        where.zoneId = zoneId;
      }

      // Get active offers count (all stages except WON and LOST) and total pipeline value
      const [activeOffersCount, activeOfferValue] = await Promise.all([
        prisma.offer.count({ 
          where: { 
            ...where, 
            stage: { 
              notIn: ['WON', 'LOST'] 
            } 
          } 
        }),
        prisma.offer.aggregate({
          where: { 
            ...where, 
            stage: { 
              notIn: ['WON', 'LOST'] 
            } 
          },
          _sum: { offerValue: true },
        }),
      ]);

      // Total pipeline value from active offers
      const totalRevenue = activeOfferValue._sum.offerValue ? Number(activeOfferValue._sum.offerValue) : 0;

      return res.json({
        activeOffers: activeOffersCount,
        revenue: totalRevenue,
      });
    } catch (error) {
      logger.error('Get sidebar stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch sidebar stats' });
    }
  }
}
