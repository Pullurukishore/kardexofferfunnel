import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

export class ReportsController {
  // Get comprehensive analytics report
  static async getAnalyticsReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, zoneId } = req.query;
      const userRole = req.user?.role;
      const userZoneId = req.user?.zoneId ? parseInt(req.user.zoneId) : undefined;

      // Build date filter
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);

      // Build where clause
      const where: any = {};
      if (dateFilter.gte || dateFilter.lte) {
        where.createdAt = dateFilter;
      }
      
      // Apply zone filter based on role
      if (userRole === 'ZONE_USER' && userZoneId) {
        where.zoneId = userZoneId;
      } else if (zoneId && zoneId !== 'all') {
        where.zoneId = parseInt(zoneId as string);
      }

      // Get current and previous month data for growth calculation
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch all data in parallel
      const [
        totalOffers,
        activeOffers,
        wonOffers,
        lostOffers,
        totalValue,
        wonValue,
        avgOfferValue,
        currentMonthOffers,
        previousMonthOffers,
        currentMonthValue,
        previousMonthValue,
        offersByStage,
        offersByZone,
        monthlyTrends,
        userPerformance,
      ] = await Promise.all([
        // Total counts
        prisma.offer.count({ where }),
        prisma.offer.count({ where: { ...where, stage: { notIn: ['WON', 'LOST'] } } }),
        prisma.offer.count({ where: { ...where, stage: 'WON' } }),
        prisma.offer.count({ where: { ...where, stage: 'LOST' } }),
        
        // Value aggregations
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
        
        // Current month
        prisma.offer.count({
          where: { ...where, createdAt: { gte: currentMonthStart } },
        }),
        
        // Previous month
        prisma.offer.count({
          where: { ...where, createdAt: { gte: previousMonthStart, lte: previousMonthEnd } },
        }),
        
        // Current month value
        prisma.offer.aggregate({
          where: { ...where, createdAt: { gte: currentMonthStart } },
          _sum: { offerValue: true },
        }),
        
        // Previous month value
        prisma.offer.aggregate({
          where: { ...where, createdAt: { gte: previousMonthStart, lte: previousMonthEnd } },
          _sum: { offerValue: true },
        }),
        
        // Stage distribution
        prisma.offer.groupBy({
          by: ['stage'],
          where,
          _count: true,
        }),
        
        // Zone performance
        prisma.offer.groupBy({
          by: ['zoneId'],
          where,
          _count: true,
          _sum: { offerValue: true },
        }),
        
        // Monthly trends (last 12 months)
        where.zoneId
          ? prisma.$queryRaw`
              SELECT 
                TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
                COUNT(*)::int as offers,
                SUM(COALESCE("offerValue", 0))::float as value,
                COUNT(CASE WHEN stage = 'WON' THEN 1 END)::int as won,
                COUNT(CASE WHEN stage = 'LOST' THEN 1 END)::int as lost
              FROM "Offer"
              WHERE "createdAt" >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
                AND "zoneId" = ${where.zoneId}
              GROUP BY DATE_TRUNC('month', "createdAt")
              ORDER BY DATE_TRUNC('month', "createdAt")
            `
          : prisma.$queryRaw`
              SELECT 
                TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
                COUNT(*)::int as offers,
                SUM(COALESCE("offerValue", 0))::float as value,
                COUNT(CASE WHEN stage = 'WON' THEN 1 END)::int as won,
                COUNT(CASE WHEN stage = 'LOST' THEN 1 END)::int as lost
              FROM "Offer"
              WHERE "createdAt" >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
              GROUP BY DATE_TRUNC('month', "createdAt")
              ORDER BY DATE_TRUNC('month', "createdAt")
            `,
        
        // User performance (top 10)
        prisma.$queryRaw`
          SELECT 
            u.id,
            u.name,
            u.email,
            sz.name as "zoneName",
            COUNT(o.id)::int as offers,
            SUM(COALESCE(o."offerValue", 0))::float as value,
            COUNT(CASE WHEN o.stage = 'WON' THEN 1 END)::int as won,
            COUNT(CASE WHEN o.stage = 'LOST' THEN 1 END)::int as lost,
            CASE 
              WHEN COUNT(CASE WHEN o.stage IN ('WON', 'LOST') THEN 1 END) > 0 
              THEN ROUND((COUNT(CASE WHEN o.stage = 'WON' THEN 1 END)::numeric / 
                   COUNT(CASE WHEN o.stage IN ('WON', 'LOST') THEN 1 END)::numeric * 100), 2)
              ELSE 0 
            END as "winRate"
          FROM "User" u
          LEFT JOIN "Offer" o ON o."createdById" = u.id
          LEFT JOIN "ServiceZone" sz ON sz.id = (
            SELECT "zoneId" FROM "Offer" WHERE "createdById" = u.id LIMIT 1
          )
          WHERE u."isActive" = true
          GROUP BY u.id, u.name, u.email, sz.name
          HAVING COUNT(o.id) > 0
          ORDER BY "winRate" DESC, offers DESC
          LIMIT 10
        `,
      ]);

      // Calculate growth rates
      const offerGrowth = previousMonthOffers > 0 
        ? ((currentMonthOffers - previousMonthOffers) / previousMonthOffers) * 100 
        : 0;
      
      const currentValue = currentMonthValue._sum.offerValue ? Number(currentMonthValue._sum.offerValue) : 0;
      const previousValue = previousMonthValue._sum.offerValue ? Number(previousMonthValue._sum.offerValue) : 0;
      const valueGrowth = previousValue > 0 
        ? ((currentValue - previousValue) / previousValue) * 100 
        : 0;

      // Calculate win rate
      const closedOffers = wonOffers + lostOffers;
      const winRate = closedOffers > 0 ? (wonOffers / closedOffers) * 100 : 0;

      // Get all zones for mapping
      const allZones = await prisma.serviceZone.findMany({
        where: { isActive: true },
      });

      // Map zone performance
      const zonePerformance = offersByZone.map((z) => {
        const zone = allZones.find((zone) => zone.id === z.zoneId);
        const zoneOffers = z._count;
        const zoneValue = z._sum.offerValue ? Number(z._sum.offerValue) : 0;
        
        return {
          zone: zone?.name || 'Unknown',
          offers: zoneOffers,
          value: zoneValue,
          avgDeal: zoneOffers > 0 ? Math.round(zoneValue / zoneOffers) : 0,
        };
      });

      // Calculate conversion funnel
      const stageOrder = ['INITIAL', 'PROPOSAL_SENT', 'NEGOTIATION', 'FINAL_APPROVAL', 'PO_RECEIVED', 'ORDER_BOOKED', 'WON'];
      const stageCounts = offersByStage.reduce((acc, s) => {
        acc[s.stage] = s._count;
        return acc;
      }, {} as Record<string, number>);

      const maxCount = Math.max(...Object.values(stageCounts));
      const conversionFunnel = stageOrder.map((stage) => ({
        stage: stage.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
        count: stageCounts[stage] || 0,
        percentage: maxCount > 0 ? Math.round(((stageCounts[stage] || 0) / maxCount) * 100) : 0,
      }));

      res.json({
        summary: {
          totalOffers,
          activeOffers,
          wonOffers,
          lostOffers,
          totalValue: totalValue._sum.offerValue ? Number(totalValue._sum.offerValue) : 0,
          wonValue: wonValue._sum.poValue ? Number(wonValue._sum.poValue) : 0,
          avgDealSize: avgOfferValue._avg.offerValue ? Number(avgOfferValue._avg.offerValue) : 0,
          winRate: Math.round(winRate * 10) / 10,
          offerGrowth: Math.round(offerGrowth * 10) / 10,
          valueGrowth: Math.round(valueGrowth * 10) / 10,
        },
        offersByStage: offersByStage.map((s) => ({
          name: s.stage.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
          value: s._count,
          color: s.stage === 'WON' ? '#10B981' : s.stage === 'LOST' ? '#EF4444' : '#3B82F6',
        })),
        zonePerformance,
        monthlyTrends,
        userPerformance,
        conversionFunnel,
      });
    } catch (error) {
      logger.error('Get analytics report error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics report' });
    }
  }

  // Export report data (placeholder for future implementation)
  static async exportReport(req: AuthRequest, res: Response) {
    try {
      const { format } = req.params; // 'pdf' or 'excel'
      
      // TODO: Implement actual export functionality
      res.json({ 
        message: `Export to ${format} will be implemented`,
        format 
      });
    } catch (error) {
      logger.error('Export report error:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  }
}
