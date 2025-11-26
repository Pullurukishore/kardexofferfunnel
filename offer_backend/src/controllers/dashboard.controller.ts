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
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
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
        offersByProductType,
        topCustomers,
        allZones,
        allUsers,
        monthlyOffers,
        stageVelocity,
        currentMonthTargets,
        productTypePerformance,
        zoneProductTypeBreakdown,
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
          by: ['productType'],
          where: { ...where, productType: { not: null } },
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
        prisma.serviceZone.findMany(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.$queryRaw`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
            COUNT(*)::int as offers,
            SUM(COALESCE("offerValue", 0))::float as value
          FROM "Offer"
          WHERE "createdAt" >= ${twelveMonthsAgo}
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
        // Product type performance (all-time or filtered by query params)
        prisma.offer.groupBy({
          by: ['productType'],
          where: { 
            ...where, 
            productType: { not: null }
          },
          _count: true,
          _sum: { offerValue: true, poValue: true },
        }),
        // Zone and product type breakdown (uses date filters in `where`)
        prisma.offer.groupBy({
          by: ['zoneId', 'productType'],
          where: { ...where, productType: { not: null } },
          _count: true,
          _sum: { offerValue: true, poValue: true },
        }),
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

      // Get zone stats including zones with zero activity
      const offersByZoneMap = new Map<number, any>(offersByZone.map((z: any) => [z.zoneId, z]));
      const zoneStats = allZones.map((zone: any) => {
        const z = offersByZoneMap.get(zone.id);
        return {
          name: zone.name,
          offers: z ? z._count : 0,
          value: z && z._sum.offerValue ? Number(z._sum.offerValue) : 0,
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

      const allProductTypes = [
        'RELOCATION',
        'CONTRACT',
        'SPP',
        'UPGRADE_KIT',
        'SOFTWARE',
        'BD_CHARGES',
        'BD_SPARE',
        'MIDLIFE_UPGRADE',
        'RETROFIT_KIT',
      ];

      const offersByProductTypeMap = new Map<string, any>(
        offersByProductType.map((p: any) => [p.productType, p])
      );

      const productTypeStats = allProductTypes.map((pt) => {
        const entry = offersByProductTypeMap.get(pt);
        const value = entry && entry._sum.offerValue ? Number(entry._sum.offerValue) : 0;
        const count = entry ? entry._count : 0;
        return { productType: pt, count, value };
      });

      const productTypeTargetAggregates = (currentMonthTargets.productTypeTargets || []).reduce(
        (acc: Record<string, { targetValue: number; targetOfferCount: number | null }>, t: any) => {
          const key = t.productType as string;
          const prev = acc[key] || { targetValue: 0, targetOfferCount: 0 };
          const tv = Number(t.targetValue);
          const toc = t.targetOfferCount != null ? Number(t.targetOfferCount) : 0;
          acc[key] = { targetValue: prev.targetValue + tv, targetOfferCount: (prev.targetOfferCount || 0) + toc };
          return acc;
        },
        {}
      );

      const productTypePerformanceMap = new Map<string, any>(
        productTypePerformance.map((p: any) => [p.productType, p])
      );

      const productTypePerformanceData = allProductTypes.map((pt) => {
        const perf = productTypePerformanceMap.get(pt);
        const base = offersByProductTypeMap.get(pt);
        const count = perf ? perf._count : base ? base._count : 0;
        const value = perf && perf._sum.offerValue
          ? Number(perf._sum.offerValue)
          : base && base._sum.offerValue
          ? Number(base._sum.offerValue)
          : 0;
        const wonValue = perf && perf._sum.poValue ? Number(perf._sum.poValue) : 0;
        const tgt = productTypeTargetAggregates[pt];
        const targetValue = tgt ? Number(tgt.targetValue) : null;
        const targetOfferCount = tgt && tgt.targetOfferCount ? Number(tgt.targetOfferCount) : null;
        const achievement = targetValue && targetValue > 0 ? (wonValue / targetValue) * 100 : null;
        return { productType: pt, count, value, wonValue, targetValue, targetOfferCount, achievement };
      });

      // Normalize zone x product type breakdown to include all zones and all product types
      const zonePTMap = new Map<string, any>((zoneProductTypeBreakdown as any[]).map((row: any) => {
        const key = `${row.zoneId}|${row.productType}`;
        return [key, row];
      }));
      const zoneProductTypeBreakdownFull = allZones.flatMap((zone: any) =>
        allProductTypes.map((pt) => {
          const key = `${zone.id}|${pt}`;
          const row = zonePTMap.get(key);
          return {
            zoneId: zone.id,
            zoneName: zone.name,
            productType: pt,
            count: row ? (row._count || row.count || 0) : 0,
            value: row ? (row._sum?.offerValue ? Number(row._sum.offerValue) : row.value ? Number(row.value) : 0) : 0,
            wonValue: row ? (row._sum?.poValue ? Number(row._sum.poValue) : row.wonValue ? Number(row.wonValue) : 0) : 0,
          };
        })
      );

      // Calculate overall target achievement
      const totalTargetValue = currentMonthTargets.zones.reduce((sum: number, t: any) => sum + Number(t.targetValue), 0);
      const currentMonthWonValue = await prisma.offer.aggregate({
        where: { 
          stage: 'WON',
          createdAt: { gte: firstDayOfMonth }
        },
        _sum: { poValue: true },
      });
      const wonValueThisMonth = currentMonthWonValue._sum.poValue ? Number(currentMonthWonValue._sum.poValue) : 0;
      const targetAchievement = totalTargetValue > 0 ? (wonValueThisMonth / totalTargetValue) * 100 : 0;

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
          wonValueThisMonth,
          totalTargetValue,
          targetAchievement: Math.round(targetAchievement * 10) / 10,
        },
        recentOffers,
        offersByStage: offersByStage.map((s) => ({
          stage: s.stage,
          count: s._count,
        })),
        offersByZone: zoneStats,
        offersByProductType: productTypeStats,
        zones: allZones.map((z: any) => ({ id: z.id, name: z.name })),
        topCustomers: topCustomersWithNames,
        monthlyTrend: monthlyOffers,
        velocityMetrics,
        productTypePerformance: productTypePerformanceData,
        zoneProductTypeBreakdown: zoneProductTypeBreakdownFull,
        currentMonthTargets: {
          period: currentPeriod,
          zones: currentMonthTargets.zones.map((t: any) => ({
            id: t.id,
            zoneId: t.serviceZoneId,
            zone: t.serviceZone.name,
            targetValue: Number(t.targetValue),
            targetOfferCount: t.targetOfferCount
          })),
          users: currentMonthTargets.users.map((t: any) => ({
            id: t.id,
            userId: t.userId,
            user: t.user.name || t.user.email,
            targetValue: Number(t.targetValue),
            targetOfferCount: t.targetOfferCount
          })),
          productTypes: currentMonthTargets.productTypeTargets.map((t: any) => ({
            id: t.id,
            zoneId: t.serviceZoneId,
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
      const userId = req.user.id;
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
      const yearlyPeriod = `${now.getFullYear()}`;
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
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
        myWonOffers,
        wonThisMonth,
        wonLastMonth,
        last7DaysOffers,
        last30DaysOffers,
        recentOffers,
        offersByStage,
        offersByProductType,
        topCustomers,
        monthlyTrend,
        myTarget,
        myYearlyTarget,
        zoneTarget,
        zoneYearlyTarget,
        productTypeTargets,
        productTypePerformance,
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
          where: { ...where, createdById: userId },
        }),
        prisma.offer.count({
          where: { ...where, createdById: userId, stage: 'WON' },
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
            zone: {
              select: {
                id: true,
                name: true,
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
          by: ['productType'],
          where: { ...where, productType: { not: null } },
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
        // Get user's personal target (monthly)
        prisma.userTarget.findFirst({
          where: { 
            userId: userId,
            targetPeriod: currentPeriod,
            periodType: 'MONTHLY',
            productType: null
          }
        }),
        // Get user's personal target (yearly)
        prisma.userTarget.findFirst({
          where: { 
            userId: userId,
            targetPeriod: yearlyPeriod,
            periodType: 'YEARLY',
            productType: null
          }
        }),
        // Get zone target (monthly)
        prisma.zoneTarget.findFirst({
          where: { 
            serviceZoneId: zoneId,
            targetPeriod: currentPeriod,
            periodType: 'MONTHLY',
            productType: null
          },
          include: { serviceZone: { select: { id: true, name: true } } }
        }),
        // Get zone target (yearly)
        prisma.zoneTarget.findFirst({
          where: { 
            serviceZoneId: zoneId,
            targetPeriod: yearlyPeriod,
            periodType: 'YEARLY',
            productType: null
          },
          include: { serviceZone: { select: { id: true, name: true } } }
        }),
        // Get product type targets for this zone
        prisma.zoneTarget.findMany({
          where: { 
            serviceZoneId: zoneId,
            targetPeriod: currentPeriod,
            periodType: 'MONTHLY',
            productType: { not: null }
          },
          include: { serviceZone: { select: { id: true, name: true } } }
        }),
        // Product type performance this month
        prisma.offer.groupBy({
          by: ['productType'],
          where: { 
            zoneId,
            createdAt: { gte: firstDayOfMonth },
            productType: { not: null }
          },
          _count: true,
          _sum: { offerValue: true, poValue: true },
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

      // Product type stats
      const productTypeStats = offersByProductType.map((p: any) => ({
        productType: p.productType,
        count: p._count,
        value: p._sum.offerValue ? Number(p._sum.offerValue) : 0,
      }));

      // Product type performance with targets
      const productTypePerformanceData = productTypePerformance.map((p: any) => {
        const target = productTypeTargets.find(
          (t: any) => t.productType === p.productType
        );
        return {
          productType: p.productType,
          count: p._count,
          value: p._sum.offerValue ? Number(p._sum.offerValue) : 0,
          wonValue: p._sum.poValue ? Number(p._sum.poValue) : 0,
          targetValue: target ? Number(target.targetValue) : null,
          targetOfferCount: target?.targetOfferCount || null,
          achievement: target ? ((p._sum.poValue ? Number(p._sum.poValue) : 0) / Number(target.targetValue)) * 100 : null,
        };
      });

      // Calculate my achievement (monthly)
      const myTargetValue = myTarget ? Number(myTarget.targetValue) : 0;
      const myWonValue = await prisma.offer.aggregate({
        where: { 
          zoneId,
          createdById: userId,
          stage: 'WON',
          createdAt: { gte: firstDayOfMonth }
        },
        _sum: { poValue: true },
      });
      const myWonValueThisMonth = myWonValue._sum.poValue ? Number(myWonValue._sum.poValue) : 0;
      const myAchievement = myTargetValue > 0 ? (myWonValueThisMonth / myTargetValue) * 100 : 0;

      // Calculate my achievement (yearly)
      const myYearlyTargetValue = myYearlyTarget ? Number(myYearlyTarget.targetValue) : 0;
      const myYearlyWonValue = await prisma.offer.aggregate({
        where: { 
          zoneId,
          createdById: userId,
          stage: 'WON',
          createdAt: { gte: firstDayOfYear }
        },
        _sum: { poValue: true },
      });
      const myWonValueThisYear = myYearlyWonValue._sum.poValue ? Number(myYearlyWonValue._sum.poValue) : 0;
      const myYearlyAchievement = myYearlyTargetValue > 0 ? (myWonValueThisYear / myYearlyTargetValue) * 100 : 0;

      // Calculate zone achievement (monthly)
      const zoneTargetValue = zoneTarget ? Number(zoneTarget.targetValue) : 0;
      const zoneWonValue = await prisma.offer.aggregate({
        where: { 
          zoneId,
          stage: 'WON',
          createdAt: { gte: firstDayOfMonth }
        },
        _sum: { poValue: true },
      });
      const zoneWonValueThisMonth = zoneWonValue._sum.poValue ? Number(zoneWonValue._sum.poValue) : 0;
      const zoneAchievement = zoneTargetValue > 0 ? (zoneWonValueThisMonth / zoneTargetValue) * 100 : 0;

      // Calculate zone achievement (yearly)
      const zoneYearlyTargetValue = zoneYearlyTarget ? Number(zoneYearlyTarget.targetValue) : 0;
      const zoneYearlyWonValue = await prisma.offer.aggregate({
        where: { 
          zoneId,
          stage: 'WON',
          createdAt: { gte: firstDayOfYear }
        },
        _sum: { poValue: true },
      });
      const zoneWonValueThisYear = zoneYearlyWonValue._sum.poValue ? Number(zoneYearlyWonValue._sum.poValue) : 0;
      const zoneYearlyAchievement = zoneYearlyTargetValue > 0 ? (zoneWonValueThisYear / zoneYearlyTargetValue) * 100 : 0;

      // Per-user aggregations for personal dashboard
      const [
        myOffersByStage,
        myOffersByProductType,
        myMonthlyTrend,
        myRecentOffers,
        myProductTypePerformanceFull,
      ] = await Promise.all([
        prisma.offer.groupBy({
          by: ['stage'],
          where: { ...where, createdById: userId },
          _count: true,
        }),
        prisma.offer.groupBy({
          by: ['productType'],
          where: { ...where, createdById: userId, productType: { not: null } },
          _count: true,
          _sum: { offerValue: true },
        }),
        prisma.$queryRaw`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
            COUNT(*)::int as offers,
            SUM(COALESCE("offerValue", 0))::float as value
          FROM "Offer"
          WHERE "zoneId" = ${zoneId} AND "createdById" = ${userId} AND "createdAt" >= ${sixMonthsAgo}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY DATE_TRUNC('month', "createdAt")
        `,
        prisma.offer.findMany({
          where: { ...where, createdById: userId },
          include: {
            customer: { select: { id: true, companyName: true } },
            zone: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.offer.groupBy({
          by: ['productType'],
          where: {
            zoneId,
            createdById: userId,
            createdAt: { gte: firstDayOfMonth },
            productType: { not: null },
          },
          _count: true,
          _sum: { offerValue: true, poValue: true },
        }),
      ]);

      const myProductTypePerformance = myProductTypePerformanceFull.map((p: any) => ({
        productType: p.productType,
        count: p._count,
        value: p._sum.offerValue ? Number(p._sum.offerValue) : 0,
        wonValue: p._sum.poValue ? Number(p._sum.poValue) : 0,
      }));

      return res.json({
        stats: {
          totalOffers,
          openOffers,
          activeOffers,
          wonOffers,
          lostOffers,
          myOffers,
          myWonOffers,
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
          myWonValueThisMonth,
          myAchievement: Math.round(myAchievement * 10) / 10,
          zoneWonValueThisMonth,
          zoneAchievement: Math.round(zoneAchievement * 10) / 10,
        },
        recentOffers,
        offersByStage: offersByStage.map((s: any) => ({
          stage: s.stage,
          count: s._count,
        })),
        offersByProductType: productTypeStats,
        topCustomers: topCustomersWithNames,
        monthlyTrend,
        productTypePerformance: productTypePerformanceData,
        // Per-user data for zone user dashboards
        myOffersByStage: myOffersByStage.map((s: any) => ({ stage: s.stage, count: s._count })),
        myOffersByProductType: myOffersByProductType.map((p: any) => ({ productType: p.productType, count: p._count, value: p._sum.offerValue ? Number(p._sum.offerValue) : 0 })),
        myMonthlyTrend,
        myRecentOffers,
        myProductTypePerformance,
        myTarget: myTarget ? {
          targetValue: Number(myTarget.targetValue),
          targetOfferCount: myTarget.targetOfferCount,
          period: currentPeriod,
          achievement: Math.round(myAchievement * 10) / 10,
          actualValue: myWonValueThisMonth,
        } : null,
        myYearlyTarget: myYearlyTarget ? {
          targetValue: Number(myYearlyTarget.targetValue),
          targetOfferCount: myYearlyTarget.targetOfferCount,
          period: yearlyPeriod,
          achievement: Math.round(myYearlyAchievement * 10) / 10,
          actualValue: myWonValueThisYear,
        } : null,
        zoneTarget: zoneTarget ? {
          zoneName: zoneTarget.serviceZone.name,
          targetValue: Number(zoneTarget.targetValue),
          targetOfferCount: zoneTarget.targetOfferCount,
          period: currentPeriod,
          achievement: Math.round(zoneAchievement * 10) / 10,
          actualValue: zoneWonValueThisMonth,
        } : null,
        zoneYearlyTarget: zoneYearlyTarget ? {
          zoneName: zoneYearlyTarget.serviceZone.name,
          targetValue: Number(zoneYearlyTarget.targetValue),
          targetOfferCount: zoneYearlyTarget.targetOfferCount,
          period: yearlyPeriod,
          achievement: Math.round(zoneYearlyAchievement * 10) / 10,
          actualValue: zoneWonValueThisYear,
        } : null,
        productTypeTargets: productTypeTargets.map((t: any) => ({
          id: t.id,
          productType: t.productType,
          targetValue: Number(t.targetValue),
          targetOfferCount: t.targetOfferCount,
        })),
      });
    } catch (error) {
      logger.error('Get zone dashboard error:', error);
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  // Zone Manager dashboard stats (same as admin but filtered by zone)
  static async getZoneManagerDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get zone ID from ServicePersonZone relationship
      const userZone = await prisma.servicePersonZone.findFirst({
        where: { userId },
        select: { serviceZoneId: true }
      });

      if (!userZone) {
        return res.status(400).json({ 
          error: 'Zone ID is required',
          message: 'Zone manager must be assigned to a zone. Please contact administrator to assign a zone to this user.',
          userId
        });
      }

      const zoneId = userZone.serviceZoneId;
      const { startDate, endDate } = req.query;

      logger.info(`Zone Manager Dashboard - User ID: ${userId}, Zone ID: ${zoneId}`);

      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);

      const where: any = { zoneId };
      if (dateFilter.gte || dateFilter.lte) {
        where.createdAt = dateFilter;
      }

      // Debug: Check how many offers are in this zone
      const totalOffersInZone = await prisma.offer.count({ where });
      logger.info(`Total offers in zone ${zoneId}: ${totalOffersInZone}`);

      // Get current date for monthly calculations
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastYearSameMonth = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      const lastYearSameMonthEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
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
        offersByProductType,
        topCustomers,
        allZones,
        allUsers,
        monthlyOffers,
        stageVelocity,
        currentMonthTargets,
        productTypePerformance,
        zoneProductTypeBreakdown,
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
          by: ['productType'],
          where: { ...where, productType: { not: null } },
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
        prisma.serviceZone.findMany({ where: { id: zoneId } }),
        prisma.user.count({ where: { isActive: true, serviceZones: { some: { serviceZoneId: zoneId } } } }),
        prisma.$queryRaw`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
            COUNT(*)::int as offers,
            SUM(COALESCE("offerValue", 0))::float as value
          FROM "Offer"
          WHERE "zoneId" = ${zoneId} AND "createdAt" >= ${twelveMonthsAgo}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY DATE_TRUNC('month', "createdAt")
        `,
        prisma.offer.groupBy({
          by: ['stage'],
          where: { ...where, stage: { notIn: ['LOST'] } },
          _count: true,
          _avg: { offerValue: true },
        }),
        // Get current month targets for this zone
        Promise.all([
          prisma.zoneTarget.findMany({
            where: { serviceZoneId: zoneId, targetPeriod: currentPeriod, periodType: 'MONTHLY', productType: null },
            include: { serviceZone: { select: { id: true, name: true } } }
          }),
          prisma.userTarget.findMany({
            where: { 
              targetPeriod: currentPeriod, 
              periodType: 'MONTHLY', 
              productType: null
            },
            include: { user: { select: { id: true, name: true, email: true, role: true, serviceZones: { select: { serviceZoneId: true } } } } }
          }).then(targets => targets.filter(t => t.user.serviceZones.some(sz => sz.serviceZoneId === zoneId))),
          prisma.zoneTarget.findMany({
            where: { serviceZoneId: zoneId, targetPeriod: currentPeriod, periodType: 'MONTHLY', productType: { not: null } },
            include: { serviceZone: { select: { id: true, name: true } } }
          }),
        ]).then(([zones, users, productTypeTargets]) => ({ zones, users, productTypeTargets })),
        // Product type performance (filtered by zone)
        prisma.offer.groupBy({
          by: ['productType'],
          where: { 
            ...where, 
            productType: { not: null }
          },
          _count: true,
          _sum: { offerValue: true, poValue: true },
        }),
        // Zone and product type breakdown (only this zone)
        prisma.offer.groupBy({
          by: ['zoneId', 'productType'],
          where: { ...where, productType: { not: null } },
          _count: true,
          _sum: { offerValue: true, poValue: true },
        }),
      ]);

      // Calculate advanced metrics
      const closedOffers = wonOffers + lostOffers;
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

      // Get zone stats (only this zone)
      const offersByZoneMap = new Map<number, any>(offersByZone.map((z: any) => [z.zoneId, z]));
      const zoneStats = allZones.map((zone: any) => {
        const z = offersByZoneMap.get(zone.id);
        return {
          name: zone.name,
          offers: z ? z._count : 0,
          value: z && z._sum.offerValue ? Number(z._sum.offerValue) : 0,
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

      const allProductTypes = [
        'RELOCATION',
        'CONTRACT',
        'SPP',
        'UPGRADE_KIT',
        'SOFTWARE',
        'BD_CHARGES',
        'BD_SPARE',
        'MIDLIFE_UPGRADE',
        'RETROFIT_KIT',
      ];

      const offersByProductTypeMap = new Map<string, any>(
        offersByProductType.map((p: any) => [p.productType, p])
      );

      const productTypeStats = allProductTypes.map((pt) => {
        const entry = offersByProductTypeMap.get(pt);
        const value = entry && entry._sum.offerValue ? Number(entry._sum.offerValue) : 0;
        const count = entry ? entry._count : 0;
        return { productType: pt, count, value };
      });

      const productTypeTargetAggregates = (currentMonthTargets.productTypeTargets || []).reduce(
        (acc: Record<string, { targetValue: number; targetOfferCount: number | null }>, t: any) => {
          const key = t.productType as string;
          const prev = acc[key] || { targetValue: 0, targetOfferCount: 0 };
          const tv = Number(t.targetValue);
          const toc = t.targetOfferCount != null ? Number(t.targetOfferCount) : 0;
          acc[key] = { targetValue: prev.targetValue + tv, targetOfferCount: (prev.targetOfferCount || 0) + toc };
          return acc;
        },
        {}
      );

      const productTypePerformanceMap = new Map<string, any>(
        productTypePerformance.map((p: any) => [p.productType, p])
      );

      const productTypePerformanceData = allProductTypes.map((pt) => {
        const perf = productTypePerformanceMap.get(pt);
        const base = offersByProductTypeMap.get(pt);
        const count = perf ? perf._count : base ? base._count : 0;
        const value = perf && perf._sum.offerValue
          ? Number(perf._sum.offerValue)
          : base && base._sum.offerValue
          ? Number(base._sum.offerValue)
          : 0;
        const wonValue = perf && perf._sum.poValue ? Number(perf._sum.poValue) : 0;
        const tgt = productTypeTargetAggregates[pt];
        const targetValue = tgt ? Number(tgt.targetValue) : null;
        const targetOfferCount = tgt && tgt.targetOfferCount ? Number(tgt.targetOfferCount) : null;
        const achievement = targetValue && targetValue > 0 ? (wonValue / targetValue) * 100 : null;
        return { productType: pt, count, value, wonValue, targetValue, targetOfferCount, achievement };
      });

      // Normalize zone x product type breakdown (only this zone)
      const zonePTMap = new Map<string, any>((zoneProductTypeBreakdown as any[]).map((row: any) => {
        const key = `${row.zoneId}|${row.productType}`;
        return [key, row];
      }));
      const zoneProductTypeBreakdownFull = allZones.flatMap((zone: any) =>
        allProductTypes.map((pt) => {
          const key = `${zone.id}|${pt}`;
          const row = zonePTMap.get(key);
          return {
            zoneId: zone.id,
            zoneName: zone.name,
            productType: pt,
            count: row ? (row._count || row.count || 0) : 0,
            value: row ? (row._sum?.offerValue ? Number(row._sum.offerValue) : row.value ? Number(row.value) : 0) : 0,
            wonValue: row ? (row._sum?.poValue ? Number(row._sum.poValue) : row.wonValue ? Number(row.wonValue) : 0) : 0,
          };
        })
      );

      // Calculate overall target achievement
      const totalTargetValue = currentMonthTargets.zones.reduce((sum: number, t: any) => sum + Number(t.targetValue), 0);
      const currentMonthWonValue = await prisma.offer.aggregate({
        where: { 
          zoneId,
          stage: 'WON',
          createdAt: { gte: firstDayOfMonth }
        },
        _sum: { poValue: true },
      });
      const wonValueThisMonth = currentMonthWonValue._sum.poValue ? Number(currentMonthWonValue._sum.poValue) : 0;
      const targetAchievement = totalTargetValue > 0 ? (wonValueThisMonth / totalTargetValue) * 100 : 0;

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
          totalZones: 1, // Only their zone
          activeUsers: allUsers,
          wonValueThisMonth,
          totalTargetValue,
          targetAchievement: Math.round(targetAchievement * 10) / 10,
        },
        recentOffers,
        offersByStage: offersByStage.map((s) => ({
          stage: s.stage,
          count: s._count,
        })),
        offersByZone: zoneStats,
        offersByProductType: productTypeStats,
        zones: allZones.map((z: any) => ({ id: z.id, name: z.name })),
        topCustomers: topCustomersWithNames,
        monthlyTrend: monthlyOffers,
        velocityMetrics,
        productTypePerformance: productTypePerformanceData,
        zoneProductTypeBreakdown: zoneProductTypeBreakdownFull,
        currentMonthTargets: {
          period: currentPeriod,
          zones: currentMonthTargets.zones.map((t: any) => ({
            id: t.id,
            zoneId: t.serviceZoneId,
            zone: t.serviceZone.name,
            targetValue: Number(t.targetValue),
            targetOfferCount: t.targetOfferCount
          })),
          users: currentMonthTargets.users.map((t: any) => ({
            id: t.id,
            userId: t.userId,
            user: t.user.name || t.user.email,
            targetValue: Number(t.targetValue),
            targetOfferCount: t.targetOfferCount
          })),
          productTypes: currentMonthTargets.productTypeTargets.map((t: any) => ({
            id: t.id,
            zoneId: t.serviceZoneId,
            zone: t.serviceZone.name,
            productType: t.productType,
            targetValue: Number(t.targetValue),
            targetOfferCount: t.targetOfferCount
          }))
        },
      });
    } catch (error) {
      logger.error('Get zone manager dashboard error:', error);
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
