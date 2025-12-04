import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import ExcelJS from 'exceljs';

const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function pad2(n: number) { return n.toString().padStart(2, '0'); }

export class ForecastController {
  static async getSummary(req: AuthRequest, res: Response) {
    try {
      const { year: yearParam } = req.query as any;
      const now = new Date();
      const year = yearParam ? parseInt(yearParam as string) : now.getFullYear();

      const zones = await prisma.serviceZone.findMany({ 
        select: { id: true, name: true, shortForm: true },
        orderBy: { name: 'asc' }
      });
      const zoneIds = zones.map(z => z.id);

      // Enhanced forecast data with analytics
      const offersForecast = await prisma.offer.findMany({
        where: {
          poExpectedMonth: { startsWith: `${year}-` },
          status: { notIn: ['CANCELLED','LOST'] as any },
        },
        select: { 
          zoneId: true, 
          poExpectedMonth: true, 
          offerValue: true, 
          productType: true,
          probabilityPercentage: true,
          stage: true,
          createdAt: true
        },
      });

      const offersActual = await prisma.offer.findMany({
        where: {
          OR: [
            { poReceivedMonth: { startsWith: `${year}-` } },
            { poDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59, 999) } },
          ],
          stage: { in: ['WON','PO_RECEIVED','ORDER_BOOKED'] as any },
        },
        select: { 
          zoneId: true, 
          poReceivedMonth: true, 
          poDate: true, 
          poValue: true,
          stage: true,
          productType: true 
        },
      });

      // Get user data for analytics
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          serviceZones: {
            select: {
              serviceZone: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      // Enhanced analytics with user and zone breakdowns
      const analytics = {
        totalForecastOffers: offersForecast.length,
        totalActualOffers: offersActual.length,
        forecastValue: offersForecast.reduce((sum, o) => sum + Number(o.offerValue || 0), 0),
        actualValue: offersActual.reduce((sum, o) => sum + Number(o.poValue || 0), 0),
        winRate: 0,
        conversionRate: 0,
        avgDealSize: 0,
        forecastByStage: {} as Record<string, { count: number; value: number }>,
        forecastByProductType: {} as Record<string, { count: number; value: number }>,
        actualByProductType: {} as Record<string, { count: number; value: number }>,
        zonePerformance: zones.map(z => ({
          zoneId: z.id,
          zoneName: z.name,
          forecastOffers: 0,
          forecastValue: 0,
          actualOffers: 0,
          actualValue: 0,
          achievement: 0,
          productTypes: {} as Record<string, { forecast: number; actual: number; achievement: number }>,
          users: [] as Array<{
            userId: number;
            userName: string;
            forecastOffers: number;
            forecastValue: number;
            actualOffers: number;
            actualValue: number;
            achievement: number;
          }>
        })),
        userPerformance: [] as Array<{
          userId: number;
          userName: string;
          userEmail: string;
          zoneName: string;
          forecastOffers: number;
          forecastValue: number;
          actualOffers: number;
          actualValue: number;
          achievement: number;
          productTypes: Record<string, { forecast: number; actual: number }>
        }>,
        quarterlyBreakdown: [] as Array<{
          quarter: string;
          forecastValue: number;
          actualValue: number;
          variance: number;
          achievement: number;
          zoneBreakdown: Array<{ zoneName: string; forecast: number; actual: number }>
        }>
      };

      // Calculate forecast by stage
      offersForecast.forEach(o => {
        const stage = o.stage || 'UNKNOWN';
        if (!analytics.forecastByStage[stage]) {
          analytics.forecastByStage[stage] = { count: 0, value: 0 };
        }
        analytics.forecastByStage[stage].count++;
        analytics.forecastByStage[stage].value += Number(o.offerValue || 0);
      });

      // Calculate forecast by product type
      offersForecast.forEach(o => {
        const pt = o.productType || 'UNKNOWN';
        if (!analytics.forecastByProductType[pt]) {
          analytics.forecastByProductType[pt] = { count: 0, value: 0 };
        }
        analytics.forecastByProductType[pt].count++;
        analytics.forecastByProductType[pt].value += Number(o.offerValue || 0);
      });

      // Calculate actual by product type
      offersActual.forEach(o => {
        const pt = o.productType || 'UNKNOWN';
        if (!analytics.actualByProductType[pt]) {
          analytics.actualByProductType[pt] = { count: 0, value: 0 };
        }
        analytics.actualByProductType[pt].count++;
        analytics.actualByProductType[pt].value += Number(o.poValue || 0);
      });

      // Calculate zone performance with detailed breakdowns
      analytics.zonePerformance.forEach(zone => {
        const zoneForecast = offersForecast.filter(o => o.zoneId === zone.zoneId);
        const zoneActual = offersActual.filter(o => o.zoneId === zone.zoneId);
        
        zone.forecastOffers = zoneForecast.length;
        zone.forecastValue = zoneForecast.reduce((sum, o) => sum + Number(o.offerValue || 0), 0);
        zone.actualOffers = zoneActual.length;
        zone.actualValue = zoneActual.reduce((sum, o) => sum + Number(o.poValue || 0), 0);
        zone.achievement = zone.forecastValue > 0 ? (zone.actualValue / zone.forecastValue) * 100 : 0;

        // Calculate zone product type breakdown
        zoneForecast.forEach(o => {
          const pt = o.productType || 'UNKNOWN';
          if (!zone.productTypes[pt]) {
            zone.productTypes[pt] = { forecast: 0, actual: 0, achievement: 0 };
          }
          zone.productTypes[pt].forecast += Number(o.offerValue || 0);
        });

        zoneActual.forEach(o => {
          const pt = o.productType || 'UNKNOWN';
          if (zone.productTypes[pt]) {
            zone.productTypes[pt].actual += Number(o.poValue || 0);
            zone.productTypes[pt].achievement = zone.productTypes[pt].forecast > 0 
              ? (zone.productTypes[pt].actual / zone.productTypes[pt].forecast) * 100 
              : 0;
          }
        });
      });

      // Calculate user performance
      users.forEach(user => {
        const userZone = user.serviceZones[0]?.serviceZone;
        if (!userZone) return;

        const userForecast = offersForecast.filter(o => o.zoneId === userZone.id);
        const userActual = offersActual.filter(o => o.zoneId === userZone.id);
        
        const forecastOffers = userForecast.length;
        const forecastValue = userForecast.reduce((sum, o) => sum + Number(o.offerValue || 0), 0);
        const actualOffers = userActual.length;
        const actualValue = userActual.reduce((sum, o) => sum + Number(o.poValue || 0), 0);
        const achievement = forecastValue > 0 ? (actualValue / forecastValue) * 100 : 0;

        // Calculate user product types
        const productTypes: Record<string, { forecast: number; actual: number }> = {};
        userForecast.forEach(o => {
          const pt = o.productType || 'UNKNOWN';
          if (!productTypes[pt]) productTypes[pt] = { forecast: 0, actual: 0 };
          productTypes[pt].forecast += Number(o.offerValue || 0);
        });
        userActual.forEach(o => {
          const pt = o.productType || 'UNKNOWN';
          if (productTypes[pt]) productTypes[pt].actual += Number(o.poValue || 0);
        });

        analytics.userPerformance.push({
          userId: user.id,
          userName: user.name || '',
          userEmail: user.email || '',
          zoneName: userZone.name,
          forecastOffers,
          forecastValue,
          actualOffers,
          actualValue,
          achievement,
          productTypes
        });
      });

      // Calculate quarterly breakdown
      const quarterlyBreakdown = [
        { q: 'Q1', months: [1, 2, 3] },
        { q: 'Q2', months: [4, 5, 6] },
        { q: 'Q3', months: [7, 8, 9] },
        { q: 'Q4', months: [10, 11, 12] }
      ];

      quarterlyBreakdown.forEach(q => {
        const quarterlyForecast = offersForecast.filter(o => {
          const month = parseInt(o.poExpectedMonth?.split('-')[1] || '0');
          return q.months.includes(month);
        });
        const quarterlyActual = offersActual.filter(o => {
          const month = parseInt((o.poReceivedMonth || o.poDate?.toISOString())?.split('-')[1] || '0');
          return q.months.includes(month);
        });

        const forecastValue = quarterlyForecast.reduce((sum, o) => sum + Number(o.offerValue || 0), 0);
        const actualValue = quarterlyActual.reduce((sum, o) => sum + Number(o.poValue || 0), 0);
        const variance = forecastValue - actualValue;
        const achievement = forecastValue > 0 ? (actualValue / forecastValue) * 100 : 0;

        const zoneBreakdown = zones.map(zone => {
          const zoneQuarterForecast = quarterlyForecast.filter(o => o.zoneId === zone.id);
          const zoneQuarterActual = quarterlyActual.filter(o => o.zoneId === zone.id);
          return {
            zoneName: zone.name,
            forecast: zoneQuarterForecast.reduce((sum, o) => sum + Number(o.offerValue || 0), 0),
            actual: zoneQuarterActual.reduce((sum, o) => sum + Number(o.poValue || 0), 0)
          };
        });

        analytics.quarterlyBreakdown.push({
          quarter: q.q,
          forecastValue,
          actualValue,
          variance,
          achievement,
          zoneBreakdown
        });
      });

      // Calculate overall metrics
      analytics.winRate = analytics.totalForecastOffers > 0 ? 
        (analytics.totalActualOffers / analytics.totalForecastOffers) * 100 : 0;
      analytics.conversionRate = analytics.forecastValue > 0 ? 
        (analytics.actualValue / analytics.forecastValue) * 100 : 0;
      analytics.avgDealSize = analytics.totalActualOffers > 0 ? 
        analytics.actualValue / analytics.totalActualOffers : 0;

      const monthly: any[] = [];
      const byZoneKeys = zones.map(z => z.name);

      const productTotalsMap = new Map<string, number>();

      const forecastIndex: Record<string, Record<number, { value: number; count: number }>> = {};
      for (const o of offersForecast) {
        const mm = (o.poExpectedMonth || '').split('-')[1];
        if (!mm) continue;
        const m = parseInt(mm, 10);
        forecastIndex[mm] ||= {} as any;
        const zoneId = o.zoneId || 0;
        forecastIndex[mm][zoneId] ||= { value: 0, count: 0 };
        forecastIndex[mm][zoneId].value += Number(o.offerValue || 0);
        forecastIndex[mm][zoneId].count += 1;
        if (o.productType) {
          productTotalsMap.set(o.productType, (productTotalsMap.get(o.productType) || 0) + Number(o.offerValue || 0));
        }
      }

      const actualIndex: Record<string, Record<number, number>> = {};
      for (const o of offersActual) {
        const monthStr = o.poReceivedMonth || (o.poDate ? `${o.poDate.getFullYear()}-${pad2(o.poDate.getMonth()+1)}` : null);
        if (!monthStr) continue;
        if (!monthStr.startsWith(`${year}-`)) continue;
        const mm = monthStr.split('-')[1];
        const z = o.zoneId || 0;
        actualIndex[mm] ||= {} as any;
        actualIndex[mm][z] = (actualIndex[mm][z] || 0) + Number(o.poValue || 0);
      }

      const monthTargets: Record<string, number> = {};
      const monthlyTargets = await prisma.zoneTarget.findMany({
        where: { periodType: 'MONTHLY' as any, targetPeriod: { startsWith: `${year}-` } },
        select: { targetPeriod: true, targetValue: true },
      });
      for (const t of monthlyTargets) {
        const mm = (t.targetPeriod || '').split('-')[1];
        if (!mm) continue;
        monthTargets[mm] = (monthTargets[mm] || 0) + Number(t.targetValue || 0);
      }

      let annualForecast = 0;
      let annualActual = 0;

      for (let m = 1; m <= 12; m++) {
        const mm = pad2(m);
        const name = monthNames[m-1];
        const byZone: Record<string, number> = {};
        let forecastSum = 0;
        let euroCount = 0;
        for (const z of zones) {
          const rec = (forecastIndex[mm] && forecastIndex[mm][z.id]) ? forecastIndex[mm][z.id] : { value: 0, count: 0 };
          byZone[z.name] = rec.value;
          forecastSum += rec.value;
          euroCount += rec.count;
        }
        const actualZones = actualIndex[mm] || {};
        const actualSum = Object.values(actualZones).reduce((s: number, v: any) => s + (v as number), 0);

        // Include all months for complete view
        annualForecast += forecastSum;
        annualActual += actualSum;

        const variance = forecastSum - actualSum;
        const achievement = forecastSum > 0 ? (actualSum / forecastSum) * 100 : 0;
        monthly.push({ month: m, monthName: name, forecast: forecastSum, euro: euroCount, mtdActual: actualSum, variance, achievement, byZone });
      }

      const productTypeTotals = Array.from(productTotalsMap.entries()).map(([productType, total]) => ({ productType, total }));

      const quarters = [
        { q: 'Q1', months: ['01','02','03'] },
        { q: 'Q2', months: ['04','05','06'] },
        { q: 'Q3', months: ['07','08','09'] },
        { q: 'Q4', months: ['10','11','12'] },
      ].map(q => {
        const target = q.months.reduce((s, mm) => s + (monthTargets[mm] || 0), 0);
        const forecast = q.months.reduce((s, mm) => s + ((monthly.find(x => pad2(x.month) === mm)?.forecast) || 0), 0);
        const devPercent = target > 0 ? ((forecast - target) / target) * 100 : 0;
        return { quarter: q.q, target, forecast, devPercent };
      });

      res.json({
        success: true,
        data: {
          year,
          zones,
          monthly,
          analytics,
          totals: {
            annualForecast,
            annualActual,
            variance: annualForecast - annualActual,
            achievement: annualForecast > 0 ? (annualActual / annualForecast) * 100 : 0,
          },
          productTypeTotals,
          quarters,
        },
      });
      return;
    } catch (error) {
      logger.error('Forecast summary error:', error);
      res.status(500).json({ error: 'Failed to compute forecast summary' });
      return;
    }
  }

  static async getBreakdown(req: AuthRequest, res: Response) {
    try {
      const { year: yearParam } = req.query as any;
      const now = new Date();
      const year = yearParam ? parseInt(yearParam as string) : now.getFullYear();

      const offers = await prisma.offer.findMany({
        where: {
          poExpectedMonth: { startsWith: `${year}-` },
          status: { notIn: ['CANCELLED','LOST'] as any },
        },
        select: {
          zoneId: true,
          productType: true,
          offerValue: true,
          assignedToId: true,
          createdById: true,
          zone: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      // Fetch all zones with their users
      const allZones = await prisma.serviceZone.findMany({
        select: {
          id: true,
          name: true,
          servicePersons: {
            select: { user: { select: { id: true, name: true } } }
          }
        }
      });

      const zones: any[] = [];
      const zoneBuckets = new Map<number, { zoneId: number; zoneName: string; rows: any[] }>();
      for (const o of offers) {
        const zoneId = o.zoneId || 0;
        const zoneName = o.zone?.name || 'Unknown';
        if (!zoneBuckets.has(zoneId)) zoneBuckets.set(zoneId, { zoneId, zoneName, rows: [] });
        // Use assignedToId if available, otherwise use createdById (creator)
        const userId = o.assignedToId || o.createdById || 0;
        const userName = o.assignedTo?.name || o.createdBy?.name || 'N/A';
        zoneBuckets.get(zoneId)!.rows.push({
          userId,
          userName,
          productType: o.productType || 'UNKNOWN',
          value: Number(o.offerValue || 0),
        });
      }

      for (const zoneInfo of allZones) {
        const bucket = zoneBuckets.get(zoneInfo.id);
        // Get all users in this zone from ServicePersonZone
        const zoneUsersMap = new Map<number, string>();
        for (const sp of zoneInfo.servicePersons) {
          zoneUsersMap.set(sp.user.id, sp.user.name || 'N/A');
        }
        // Also include users with offers in this zone
        if (bucket) {
          for (const r of bucket.rows) {
            zoneUsersMap.set(r.userId, r.userName);
          }
        }
        const usersOrder = Array.from(zoneUsersMap.entries()).map(([id, name]) => ({ id, name }));
        
        const productSet = bucket ? Array.from(new Set(bucket.rows.map(r => r.productType))) : [];
        const matrix: Record<string, Record<number, number>> = {};
        const totalsByUser: Record<number, number> = {};
        const totalsByProduct: Record<string, number> = {};
        let zoneTotal = 0;
        
        // Initialize matrix with all products and users (fill with 0)
        for (const pt of productSet) {
          matrix[pt] = {} as any;
          for (const u of usersOrder) {
            matrix[pt][u.id] = 0;
          }
        }
        
        // Fill in actual values
        if (bucket) {
          for (const r of bucket.rows) {
            matrix[r.productType] ||= {} as any;
            matrix[r.productType][r.userId] = (matrix[r.productType][r.userId] || 0) + r.value;
            totalsByUser[r.userId] = (totalsByUser[r.userId] || 0) + r.value;
            totalsByProduct[r.productType] = (totalsByProduct[r.productType] || 0) + r.value;
            zoneTotal += r.value;
          }
        }
        
        zones.push({
          zoneId: zoneInfo.id,
          zoneName: zoneInfo.name,
          users: usersOrder,
          productTypes: productSet,
          matrix,
          totals: { byUser: totalsByUser, byProductType: totalsByProduct, zoneTotal }
        });
      }

      res.json({ success: true, data: { year, zones } });
      return;
    } catch (error) {
      logger.error('Forecast breakdown error:', error);
      res.status(500).json({ error: 'Failed to compute forecast breakdown' });
      return;
    }
  }

  static async getPoExpected(req: AuthRequest, res: Response) {
    try {
      const { year: yearParam } = req.query as any;
      const now = new Date();
      const year = yearParam ? parseInt(yearParam as string) : now.getFullYear();

      const offers = await prisma.offer.findMany({
        where: { poExpectedMonth: { startsWith: `${year}-` }, status: { notIn: ['CANCELLED','LOST'] as any } },
        select: {
          zoneId: true,
          poExpectedMonth: true,
          offerValue: true,
          assignedToId: true,
          createdById: true,
          zone: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        }
      });

      const perZone: Record<number, { zoneId: number; zoneName: string; months: Record<string, { users: Record<number, { userId: number; userName: string; amount: number }>; total: number }> }> = {};
      const aggregatedByMonth: Record<string, { byZone: Record<string, number>; total: number; euro: number }> = {};

      for (const o of offers) {
        const mm = (o.poExpectedMonth || '').split('-')[1];
        if (!mm) continue;
        const z = o.zoneId || 0;
        const zoneName = o.zone?.name || 'Unknown';
        if (!perZone[z]) perZone[z] = { zoneId: z, zoneName, months: {} };
        perZone[z].months[mm] ||= { users: {}, total: 0 };
        // Use assignedToId if available, otherwise use createdById (creator)
        const uid = o.assignedToId || o.createdById || 0;
        const userName = o.assignedTo?.name || o.createdBy?.name || 'N/A';
        const userRec = perZone[z].months[mm].users[uid] || { userId: uid, userName, amount: 0 };
        userRec.amount += Number(o.offerValue || 0);
        perZone[z].months[mm].users[uid] = userRec;
        perZone[z].months[mm].total += Number(o.offerValue || 0);

        // aggregated
        const agg = (aggregatedByMonth[mm] ||= { byZone: {}, total: 0, euro: 0 });
        agg.byZone[zoneName] = (agg.byZone[zoneName] || 0) + Number(o.offerValue || 0);
        agg.total += Number(o.offerValue || 0);
        agg.euro += 1;
      }

      res.json({ success: true, data: { year, perZone, aggregatedByMonth } });
      return;
    } catch (error) {
      logger.error('Forecast PO expected error:', error);
      res.status(500).json({ error: 'Failed to compute PO expected data' });
      return;
    }
  }

  static async getHighlights(req: AuthRequest, res: Response) {
    try {
      const { year: yearParam } = req.query as any;
      const now = new Date();
      const year = yearParam ? parseInt(yearParam as string) : now.getFullYear();

      const zones = await prisma.serviceZone.findMany({ select: { id: true, name: true } });

      // Offers in the year (by expected month) excluding cancelled/lost
      const offers = await prisma.offer.findMany({
        where: {
          poExpectedMonth: { startsWith: `${year}-` },
          status: { notIn: ['CANCELLED','LOST'] as any },
        },
        select: { zoneId: true, offerValue: true, openFunnel: true },
      });

      const offersByZone: Record<number, { count: number; value: number; openFunnel: number }> = {};
      for (const z of zones) offersByZone[z.id] = { count: 0, value: 0, openFunnel: 0 };
      for (const o of offers) {
        const z = o.zoneId || 0;
        if (!offersByZone[z]) offersByZone[z] = { count: 0, value: 0, openFunnel: 0 };
        offersByZone[z].count += 1;
        offersByZone[z].value += Number(o.offerValue || 0);
        if (o.openFunnel) offersByZone[z].openFunnel += Number(o.offerValue || 0);
      }

      // Orders received/booked in the year
      const orders = await prisma.offer.findMany({
        where: {
          OR: [
            { poReceivedMonth: { startsWith: `${year}-` } },
            { poDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59, 999) } },
          ],
          stage: { in: ['WON','PO_RECEIVED','ORDER_BOOKED'] as any },
        },
        select: { zoneId: true, poValue: true, stage: true },
      });
      const ordersByZone: Record<number, { received: number; booked: number }> = {};
      for (const z of zones) ordersByZone[z.id] = { received: 0, booked: 0 };
      for (const o of orders) {
        const z = o.zoneId || 0;
        if (!ordersByZone[z]) ordersByZone[z] = { received: 0, booked: 0 };
        ordersByZone[z].received += Number(o.poValue || 0);
        if ((o as any).stage === 'ORDER_BOOKED') ordersByZone[z].booked += Number(o.poValue || 0);
      }

      // BU for booking (year target) - prefer yearly target; fallback to monthly sum
      const buByZone: Record<number, number> = {};
      for (const z of zones) buByZone[z.id] = 0;
      const yearlyTargets = await prisma.zoneTarget.findMany({
        where: { periodType: 'YEARLY' as any, targetPeriod: `${year}` },
        select: { serviceZoneId: true, targetValue: true },
      });
      if (yearlyTargets.length > 0) {
        for (const t of yearlyTargets) buByZone[t.serviceZoneId] = (buByZone[t.serviceZoneId] || 0) + Number(t.targetValue || 0);
      } else {
        const monthlyTargets = await prisma.zoneTarget.findMany({
          where: { periodType: 'MONTHLY' as any, targetPeriod: { startsWith: `${year}-` } },
          select: { serviceZoneId: true, targetValue: true },
        });
        for (const t of monthlyTargets) buByZone[t.serviceZoneId] = (buByZone[t.serviceZoneId] || 0) + Number(t.targetValue || 0);
      }

      const rows = zones.map(z => {
        const o = offersByZone[z.id] || { count: 0, value: 0, openFunnel: 0 };
        const ord = ordersByZone[z.id] || { received: 0, booked: 0 };
        const bu = buByZone[z.id] || 0;
        const devPercent = bu > 0 ? ((ord.received - bu) / bu) * 100 : 0;
        const balanceBu = bu - ord.received;
        // Open Funnel = Offers not yet converted to PO (Offers Value - Orders Received)
        const openFunnel = o.value - ord.received;
        return {
          zoneId: z.id,
          zoneName: z.name,
          numOffers: o.count,
          offersValue: o.value,
          ordersReceived: ord.received,
          openFunnel: Math.max(0, openFunnel),
          orderBooking: ord.booked,
          buYear: bu,
          devPercent,
          balanceBu,
        };
      });

      const total = rows.reduce((a, r) => {
        a.numOffers += r.numOffers;
        a.offersValue += r.offersValue;
        a.ordersReceived += r.ordersReceived;
        a.openFunnel += r.openFunnel;
        a.orderBooking += r.orderBooking;
        a.buYear += r.buYear;
        a.balanceBu += r.balanceBu;
        return a;
      }, { numOffers: 0, offersValue: 0, ordersReceived: 0, openFunnel: 0, orderBooking: 0, buYear: 0, balanceBu: 0 });
      const devPercent = total.buYear > 0 ? ((total.ordersReceived - total.buYear) / total.buYear) * 100 : 0;

      res.json({ success: true, data: { year, rows, total: { ...total, devPercent } } });
      return;
    } catch (error) {
      logger.error('Forecast highlights error:', error);
      res.status(500).json({ error: 'Failed to compute forecast highlights' });
      return;
    }
  }

  static async exportExcel(req: AuthRequest, res: Response) {
    try {
      const { year: yearParam } = req.query as any;
      const now = new Date();
      const year = yearParam ? parseInt(yearParam as string) : now.getFullYear();

      const zones = await prisma.serviceZone.findMany({ select: { id: true, name: true, shortForm: true } });
      const zoneNames = zones.map(z => z.name);


      
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          serviceZones: {
            select: {
              serviceZone: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      const offersForecast = await prisma.offer.findMany({
        where: { poExpectedMonth: { startsWith: `${year}-` }, status: { notIn: ['CANCELLED','LOST'] as any } },
        select: { 
          zoneId: true, 
          poExpectedMonth: true, 
          offerValue: true, 
          productType: true,
          probabilityPercentage: true,
          stage: true,
          createdAt: true
        },
      });

      const offersActual = await prisma.offer.findMany({
        where: {
          OR: [
            { poReceivedMonth: { startsWith: `${year}-` } },
            { poDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59, 999) } },
          ],
          stage: { in: ['WON','PO_RECEIVED','ORDER_BOOKED'] as any },
        },
        select: { 
          zoneId: true, 
          poReceivedMonth: true, 
          poDate: true, 
          poValue: true,
          stage: true,
          productType: true 
        },
      });

      // Enhanced analytics with user and zone breakdowns
      const analytics = {
        totalForecastOffers: offersForecast.length,
        totalActualOffers: offersActual.length,
        forecastValue: offersForecast.reduce((sum, o) => sum + Number(o.offerValue || 0), 0),
        actualValue: offersActual.reduce((sum, o) => sum + Number(o.poValue || 0), 0),
        winRate: 0,
        conversionRate: 0,
        avgDealSize: 0,
        forecastByStage: {} as Record<string, { count: number; value: number }>,
        forecastByProductType: {} as Record<string, { count: number; value: number }>,
        actualByProductType: {} as Record<string, { count: number; value: number }>,
        zonePerformance: zones.map(z => ({
          zoneId: z.id,
          zoneName: z.name,
          forecastOffers: 0,
          forecastValue: 0,
          actualOffers: 0,
          actualValue: 0,
          achievement: 0,
          productTypes: {} as Record<string, { forecast: number; actual: number; achievement: number }>,
          users: [] as Array<{
            userId: number;
            userName: string;
            forecastOffers: number;
            forecastValue: number;
            actualOffers: number;
            actualValue: number;
            achievement: number;
          }>
        })),
        userPerformance: [] as Array<{
          userId: number;
          userName: string;
          userEmail: string;
          zoneName: string;
          forecastOffers: number;
          forecastValue: number;
          actualOffers: number;
          actualValue: number;
          achievement: number;
          productTypes: Record<string, { forecast: number; actual: number }>
        }>,
        quarterlyBreakdown: [] as Array<{
          quarter: string;
          forecastValue: number;
          actualValue: number;
          variance: number;
          achievement: number;
          zoneBreakdown: Array<{ zoneName: string; forecast: number; actual: number }>
        }>
      };

      // Calculate forecast by stage
      offersForecast.forEach(o => {
        const stage = o.stage || 'UNKNOWN';
        if (!analytics.forecastByStage[stage]) {
          analytics.forecastByStage[stage] = { count: 0, value: 0 };
        }
        analytics.forecastByStage[stage].count++;
        analytics.forecastByStage[stage].value += Number(o.offerValue || 0);
      });

      // Calculate forecast by product type
      offersForecast.forEach(o => {
        const pt = o.productType || 'UNKNOWN';
        if (!analytics.forecastByProductType[pt]) {
          analytics.forecastByProductType[pt] = { count: 0, value: 0 };
        }
        analytics.forecastByProductType[pt].count++;
        analytics.forecastByProductType[pt].value += Number(o.offerValue || 0);
      });

      // Calculate actual by product type
      offersActual.forEach(o => {
        const pt = o.productType || 'UNKNOWN';
        if (!analytics.actualByProductType[pt]) {
          analytics.actualByProductType[pt] = { count: 0, value: 0 };
        }
        analytics.actualByProductType[pt].count++;
        analytics.actualByProductType[pt].value += Number(o.poValue || 0);
      });

      // Calculate zone performance with detailed breakdowns
      analytics.zonePerformance.forEach(zone => {
        const zoneForecast = offersForecast.filter(o => o.zoneId === zone.zoneId);
        const zoneActual = offersActual.filter(o => o.zoneId === zone.zoneId);
        
        zone.forecastOffers = zoneForecast.length;
        zone.forecastValue = zoneForecast.reduce((sum, o) => sum + Number(o.offerValue || 0), 0);
        zone.actualOffers = zoneActual.length;
        zone.actualValue = zoneActual.reduce((sum, o) => sum + Number(o.poValue || 0), 0);
        zone.achievement = zone.forecastValue > 0 ? (zone.actualValue / zone.forecastValue) * 100 : 0;

        // Calculate zone product type breakdown
        zoneForecast.forEach(o => {
          const pt = o.productType || 'UNKNOWN';
          if (!zone.productTypes[pt]) {
            zone.productTypes[pt] = { forecast: 0, actual: 0, achievement: 0 };
          }
          zone.productTypes[pt].forecast += Number(o.offerValue || 0);
        });

        zoneActual.forEach(o => {
          const pt = o.productType || 'UNKNOWN';
          if (zone.productTypes[pt]) {
            zone.productTypes[pt].actual += Number(o.poValue || 0);
            zone.productTypes[pt].achievement = zone.productTypes[pt].forecast > 0 
              ? (zone.productTypes[pt].actual / zone.productTypes[pt].forecast) * 100 
              : 0;
          }
        });
      });

      // Calculate user performance
      users.forEach(user => {
        const userZone = user.serviceZones[0]?.serviceZone;
        if (!userZone) return;

        const userForecast = offersForecast.filter(o => o.zoneId === userZone.id);
        const userActual = offersActual.filter(o => o.zoneId === userZone.id);
        
        const forecastOffers = userForecast.length;
        const forecastValue = userForecast.reduce((sum, o) => sum + Number(o.offerValue || 0), 0);
        const actualOffers = userActual.length;
        const actualValue = userActual.reduce((sum, o) => sum + Number(o.poValue || 0), 0);
        const achievement = forecastValue > 0 ? (actualValue / forecastValue) * 100 : 0;

        // Calculate user product types
        const productTypes: Record<string, { forecast: number; actual: number }> = {};
        userForecast.forEach(o => {
          const pt = o.productType || 'UNKNOWN';
          if (!productTypes[pt]) productTypes[pt] = { forecast: 0, actual: 0 };
          productTypes[pt].forecast += Number(o.offerValue || 0);
        });
        userActual.forEach(o => {
          const pt = o.productType || 'UNKNOWN';
          if (productTypes[pt]) productTypes[pt].actual += Number(o.poValue || 0);
        });

        analytics.userPerformance.push({
          userId: user.id,
          userName: user.name || '',
          userEmail: user.email || '',
          zoneName: userZone.name,
          forecastOffers,
          forecastValue,
          actualOffers,
          actualValue,
          achievement,
          productTypes
        });
      });

      // Calculate quarterly breakdown
      const quarterlyBreakdown = [
        { q: 'Q1', months: [1, 2, 3] },
        { q: 'Q2', months: [4, 5, 6] },
        { q: 'Q3', months: [7, 8, 9] },
        { q: 'Q4', months: [10, 11, 12] }
      ];

      quarterlyBreakdown.forEach(q => {
        const quarterlyForecast = offersForecast.filter(o => {
          const month = parseInt(o.poExpectedMonth?.split('-')[1] || '0');
          return q.months.includes(month);
        });
        const quarterlyActual = offersActual.filter(o => {
          const month = parseInt((o.poReceivedMonth || o.poDate?.toISOString())?.split('-')[1] || '0');
          return q.months.includes(month);
        });

        const forecastValue = quarterlyForecast.reduce((sum, o) => sum + Number(o.offerValue || 0), 0);
        const actualValue = quarterlyActual.reduce((sum, o) => sum + Number(o.poValue || 0), 0);
        const variance = forecastValue - actualValue;
        const achievement = forecastValue > 0 ? (actualValue / forecastValue) * 100 : 0;

        const zoneBreakdown = zones.map(zone => {
          const zoneQuarterForecast = quarterlyForecast.filter(o => o.zoneId === zone.id);
          const zoneQuarterActual = quarterlyActual.filter(o => o.zoneId === zone.id);
          return {
            zoneName: zone.name,
            forecast: zoneQuarterForecast.reduce((sum, o) => sum + Number(o.offerValue || 0), 0),
            actual: zoneQuarterActual.reduce((sum, o) => sum + Number(o.poValue || 0), 0)
          };
        });

        analytics.quarterlyBreakdown.push({
          quarter: q.q,
          forecastValue,
          actualValue,
          variance,
          achievement,
          zoneBreakdown
        });
      });

      // Calculate overall metrics
      analytics.winRate = analytics.totalForecastOffers > 0 ? 
        (analytics.totalActualOffers / analytics.totalForecastOffers) * 100 : 0;
      analytics.conversionRate = analytics.forecastValue > 0 ? 
        (analytics.actualValue / analytics.forecastValue) * 100 : 0;
      analytics.avgDealSize = analytics.totalActualOffers > 0 ? 
        analytics.actualValue / analytics.totalActualOffers : 0;

      const forecastIndex: Record<string, Record<number, { value: number; count: number }>> = {};
      const productTotalsMap = new Map<string, number>();
      for (const o of offersForecast) {
        const mm = (o.poExpectedMonth || '').split('-')[1];
        if (!mm) continue;
        const z = o.zoneId || 0;
        (forecastIndex[mm] ||= {} as any);
        (forecastIndex[mm][z] ||= { value: 0, count: 0 });
        forecastIndex[mm][z].value += Number(o.offerValue || 0);
        forecastIndex[mm][z].count += 1;
        if (o.productType) productTotalsMap.set(o.productType, (productTotalsMap.get(o.productType) || 0) + Number(o.offerValue || 0));
      }

      const actualIndex: Record<string, Record<number, number>> = {};
      for (const o of offersActual) {
        const monthStr = o.poReceivedMonth || (o.poDate ? `${o.poDate.getFullYear()}-${pad2(o.poDate.getMonth()+1)}` : null);
        if (!monthStr) continue;
        if (!monthStr.startsWith(`${year}-`)) continue;
        const mm = monthStr.split('-')[1];
        const z = o.zoneId || 0;
        (actualIndex[mm] ||= {} as any);
        actualIndex[mm][z] = (actualIndex[mm][z] || 0) + Number(o.poValue || 0);
      }

      const monthTargets: Record<string, number> = {};
      const monthlyTargets = await prisma.zoneTarget.findMany({
        where: { periodType: 'MONTHLY' as any, targetPeriod: { startsWith: `${year}-` } },
        select: { targetPeriod: true, targetValue: true },
      });
      for (const t of monthlyTargets) {
        const mm = (t.targetPeriod || '').split('-')[1];
        if (!mm) continue;
        monthTargets[mm] = (monthTargets[mm] || 0) + Number(t.targetValue || 0);
      }

      const monthlyFull: { month: number; monthName: string; forecast: number; euro: number; mtdActual: number; variance: number; achievement: number; byZone: Record<string, number> }[] = [];
      let annualForecast = 0;
      let annualActual = 0;
      for (let m = 1; m <= 12; m++) {
        const mm = pad2(m);
        const byZone: Record<string, number> = {};
        let forecastSum = 0;
        let euroCount = 0;
        for (const z of zones) {
          const rec = (forecastIndex[mm] && forecastIndex[mm][z.id]) ? forecastIndex[mm][z.id] : { value: 0, count: 0 };
          byZone[z.name] = rec.value;
          forecastSum += rec.value;
          euroCount += rec.count;
        }
        const actualSum = Object.values(actualIndex[mm] || {}).reduce((s, v: any) => s + (v as number), 0);
        const variance = forecastSum - actualSum;
        const achievement = forecastSum > 0 ? (actualSum / forecastSum) * 100 : 0;
        annualForecast += forecastSum;
        annualActual += actualSum;
        monthlyFull.push({ month: m, monthName: monthNames[m-1], forecast: forecastSum, euro: euroCount, mtdActual: actualSum, variance, achievement, byZone });
      }

      const productTypeTotals = Array.from(productTotalsMap.entries()).map(([productType, total]) => ({ productType, total }));
      const quarters = [
        { q: 'Q1', months: ['01','02','03'] },
        { q: 'Q2', months: ['04','05','06'] },
        { q: 'Q3', months: ['07','08','09'] },
        { q: 'Q4', months: ['10','11','12'] },
      ].map(q => {
        const target = q.months.reduce((s, mm) => s + (monthTargets[mm] || 0), 0);
        const forecast = q.months.reduce((s, mm) => s + ((monthlyFull.find(x => pad2(x.month) === mm)?.forecast) || 0), 0);
        const devPercent = target > 0 ? ((forecast - target) / target) * 100 : 0;
        return { quarter: q.q, target, forecast, devPercent };
      });

      const offersForHighlights = await prisma.offer.findMany({
        where: { poExpectedMonth: { startsWith: `${year}-` }, status: { notIn: ['CANCELLED','LOST'] as any } },
        select: { zoneId: true, offerValue: true, openFunnel: true },
      });
      const ordersForHighlights = await prisma.offer.findMany({
        where: {
          OR: [
            { poReceivedMonth: { startsWith: `${year}-` } },
            { poDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59, 999) } },
          ],
          stage: { in: ['WON','PO_RECEIVED','ORDER_BOOKED'] as any },
        },
        select: { zoneId: true, poValue: true, stage: true },
      });
      const offersByZone: Record<number, { count: number; value: number; openFunnel: number }> = {};
      for (const z of zones) offersByZone[z.id] = { count: 0, value: 0, openFunnel: 0 };
      for (const o of offersForHighlights) {
        const z = o.zoneId || 0;
        if (!offersByZone[z]) offersByZone[z] = { count: 0, value: 0, openFunnel: 0 };
        offersByZone[z].count += 1;
        offersByZone[z].value += Number(o.offerValue || 0);
        if ((o as any).openFunnel) offersByZone[z].openFunnel += Number(o.offerValue || 0);
      }
      const ordersByZone: Record<number, { received: number; booked: number }> = {};
      for (const z of zones) ordersByZone[z.id] = { received: 0, booked: 0 };
      for (const o of ordersForHighlights) {
        const z = o.zoneId || 0;
        if (!ordersByZone[z]) ordersByZone[z] = { received: 0, booked: 0 };
        ordersByZone[z].received += Number(o.poValue || 0);
        if ((o as any).stage === 'ORDER_BOOKED') ordersByZone[z].booked += Number(o.poValue || 0);
      }
      const yearlyTargets = await prisma.zoneTarget.findMany({ where: { periodType: 'YEARLY' as any, targetPeriod: `${year}` }, select: { serviceZoneId: true, targetValue: true } });
      const buByZone: Record<number, number> = {};
      for (const z of zones) buByZone[z.id] = 0;
      if (yearlyTargets.length > 0) {
        for (const t of yearlyTargets) buByZone[t.serviceZoneId] = (buByZone[t.serviceZoneId] || 0) + Number(t.targetValue || 0);
      } else {
        const mTargets = await prisma.zoneTarget.findMany({ where: { periodType: 'MONTHLY' as any, targetPeriod: { startsWith: `${year}-` } }, select: { serviceZoneId: true, targetValue: true } });
        for (const t of mTargets) buByZone[t.serviceZoneId] = (buByZone[t.serviceZoneId] || 0) + Number(t.targetValue || 0);
      }
      const highlightsRows = zones.map(z => {
        const o = offersByZone[z.id] || { count: 0, value: 0, openFunnel: 0 };
        const ord = ordersByZone[z.id] || { received: 0, booked: 0 };
        const bu = buByZone[z.id] || 0;
        const devPercent = bu > 0 ? ((ord.received - bu) / bu) * 100 : 0;
        const balanceBu = bu - ord.received;
        const openFunnel = o.value - ord.received;
        return { zoneName: z.name, numOffers: o.count, offersValue: o.value, ordersReceived: ord.received, openFunnel: Math.max(0, openFunnel), orderBooking: ord.booked, buYear: bu, devPercent, balanceBu };
      });
      const highlightsTotal = highlightsRows.reduce((a, r) => {
        a.numOffers += r.numOffers; a.offersValue += r.offersValue; a.ordersReceived += r.ordersReceived; a.openFunnel += r.openFunnel; a.orderBooking += r.orderBooking; a.buYear += r.buYear; a.balanceBu += r.balanceBu; return a;
      }, { numOffers: 0, offersValue: 0, ordersReceived: 0, openFunnel: 0, orderBooking: 0, buYear: 0, balanceBu: 0 });
      const highlightsDev = highlightsTotal.buYear > 0 ? ((highlightsTotal.ordersReceived - highlightsTotal.buYear) / highlightsTotal.buYear) * 100 : 0;

      const aggregatedByMonth: Record<string, { byZone: Record<string, number>; total: number; euro: number }> = {};
      for (const o of offersForecast) {
        const mm = (o.poExpectedMonth || '').split('-')[1];
        if (!mm) continue;
        const z = zones.find(zn => zn.id === (o.zoneId || 0));
        const zoneName = z?.name || 'Unknown';
        const agg = (aggregatedByMonth[mm] ||= { byZone: {}, total: 0, euro: 0 });
        agg.byZone[zoneName] = (agg.byZone[zoneName] || 0) + Number(o.offerValue || 0);
        agg.total += Number(o.offerValue || 0);
        agg.euro += 1;
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Forecast Analytics');

      // Set professional column widths
      ws.columns = [
        { width: 12 },  // Zone
        { width: 10 },  // Month
        { width: 12 },  // No. of Offers
        { width: 15 },  // Offers Value
        { width: 15 },  // Orders Received
        { width: 12 },  // Open Funnel
        { width: 12 },  // Order Booking
        { width: 18 },  // BU for Booking /2025
        { width: 8 },   // %
        { width: 12 },  // Balance BU
        { width: 12 },  // Forecast
        { width: 8 },   // Euro
        { width: 12 },  // Total
      ];

      // Create professional header section
      ws.mergeCells('A1:M1');
      ws.getCell('A1').value = `Forecast Analytics Report - ${year}`;
      ws.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF2C3E50' } };
      ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFECF0F1' }
      };

      // Add subtitle with timestamp
      ws.mergeCells('A2:M2');
      ws.getCell('A2').value = `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
      ws.getCell('A2').font = { size: 10, color: { argb: 'FF7F8C8D' } };
      ws.getCell('A2').alignment = { horizontal: 'center' };

      // Add empty row
      ws.addRow([]);

      // Executive Summary Section
      ws.addRow([]);
      ws.mergeCells('A4:M4');
      ws.getCell('A4').value = 'EXECUTIVE SUMMARY';
      ws.getCell('A4').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell('A4').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3498DB' }
      };

      // Calculate summary metrics
      const totalOffers = analytics.zonePerformance?.reduce((sum: number, zone: any) => sum + (zone.forecastOffers || 0), 0) || 0;
      const totalValue = analytics.zonePerformance?.reduce((sum: number, zone: any) => sum + (zone.forecastValue || 0), 0) || 0;
      const avgAchievement = analytics.zonePerformance?.length > 0 
        ? (analytics.zonePerformance.reduce((sum: number, zone: any) => sum + zone.achievement, 0) / analytics.zonePerformance.length).toFixed(1)
        : '0.0';
      const totalBalanceBU = analytics.zonePerformance?.reduce((sum: number, zone: any) => {
        const buForBooking = (zone.forecastValue || 0) * 1.2;
        const actualValue = zone.actualValue || 0;
        return sum + Math.max(0, buForBooking - actualValue);
      }, 0) || 0;

      // Summary KPIs
      ws.addRow(['Total Offers', totalOffers, '', '', 'Total Value', totalValue, '', '', 'Avg Achievement', avgAchievement + '%', '', '', '']);
      const summaryRow = ws.getRow(5);
      summaryRow.font = { bold: true, size: 12 };
      summaryRow.height = 25;
      
      // Style summary cells
      for (let j = 1; j <= 10; j++) {
        const cell = summaryRow.getCell(j);
        if (cell.value) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: j <= 2 ? 'FFE8F4FD' : j <= 5 ? 'FFE8F8F5' : j <= 8 ? 'FFFEF9E7' : 'FFFDF2E9' }
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            left: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            bottom: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            right: { style: 'thin', color: { argb: 'FFBDC3C7' } }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }

      // Add empty row
      ws.addRow([]);

      // Performance Overview Section
      ws.addRow([]);
      ws.mergeCells('A8:M8');
      ws.getCell('A8').value = 'PERFORMANCE OVERVIEW';
      ws.getCell('A8').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      ws.getCell('A8').alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell('A8').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF9B59B6' }
      };

      // Add performance legend
      ws.addRow(['Performance Legend:', '', '', '', '', '', '', '', '', '', '', '', '']);
      ws.addRow(['≥100% Excellent', '', '', '', '80-99% Good', '', '', '', '<80% Needs Attention', '', '', '']);
      const legendRow1 = ws.getRow(10);
      const legendRow2 = ws.getRow(11);
      
      // Style legend rows
      [legendRow1, legendRow2].forEach((row, index) => {
        for (let j = 1; j <= 10; j++) {
          const cell = row.getCell(j);
          if (cell.value) {
            const colors = index === 0 ? ['FFD5F4E6', 'FFD4EFDF', 'FFFAEBD7'] : ['FFA9DFBF', 'FFA3E4D7', 'FFF5CBA'];
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: colors[Math.floor((j-1)/3)] }
            };
            cell.font = { bold: true, size: 10, color: { argb: 'FF27AE60' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        }
      });

      // Add headers with professional styling
      ws.addRow([]);
      ws.addRow([
        'Zone', 'Month', 'No. of Offers', 'Offers Value', 'Orders Received', 
        'Open Funnel', 'Order Booking ', `BU for Booking /${year}`, '%', 'Balance BU',
        'Forecast', 'Euro', 'Total'
      ]);

      // Style header row with gradient effect
      const headerRow = ws.getRow(13);
      headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'gradient',
        gradient: 'path',
        center: { left: 0.5, top: 0.5 },
        stops: [
          { position: 0, color: { argb: 'FF34495E' } },
          { position: 100, color: { argb: 'FF2C3E50' } }
        ]
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 22;

      // Add borders to header
      for (let j = 1; j <= 13; j++) {
        const cell = headerRow.getCell(j);
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF34495E' } },
          left: { style: 'thin', color: { argb: 'FFBDC3C7' } },
          bottom: { style: 'medium', color: { argb: 'FF34495E' } },
          right: { style: 'thin', color: { argb: 'FFBDC3C7' } }
        };
      }

      // Add zone-wise data with alternating row colors and performance-based styling
      let rowIndex = 14;
      for (const zone of analytics.zonePerformance) {
        const forecastValue = zone.forecastValue || 0;
        const actualValue = zone.actualValue || 0;
        const openFunnel = forecastValue - actualValue;
        const orderBooking = actualValue;
        const buForBooking = forecastValue * 1.2;
        const achievement = forecastValue > 0 ? (actualValue / forecastValue) * 100 : 0;
        const balanceBU = Math.max(0, buForBooking - actualValue);
        const euro = zone.forecastOffers || 0;
        const total = forecastValue + actualValue;

        const dataRow = ws.addRow([
          zone.zoneName,
          'Current',
          zone.forecastOffers || 0,
          forecastValue,
          actualValue,
          openFunnel,
          orderBooking,
          buForBooking,
          achievement.toFixed(2),
          balanceBU,
          forecastValue,
          euro,
          total
        ]);

        // Apply alternating row colors
        const isEvenRow = rowIndex % 2 === 0;
        const rowColor = isEvenRow ? 'FFF8F9FA' : 'FFFFFFFF';
        
        // Style data rows
        for (let j = 1; j <= 13; j++) {
          const cell = dataRow.getCell(j);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFECF0F1' } },
            left: { style: 'thin', color: { argb: 'FFECF0F1' } },
            bottom: { style: 'thin', color: { argb: 'FFECF0F1' } },
            right: { style: 'thin', color: { argb: 'FFECF0F1' } }
          };
          cell.alignment = { horizontal: j === 1 || j === 2 ? 'left' : 'right' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowColor }
          };

          // Special styling for achievement column
          if (j === 9) {
            if (achievement >= 100) {
              cell.font = { bold: true, color: { argb: 'FF27AE60' } };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD5F4E6' }
              };
            } else if (achievement >= 80) {
              cell.font = { bold: true, color: { argb: 'FFF39C12' } };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFEF9E7' }
              };
            } else {
              cell.font = { bold: true, color: { argb: 'FFE74C3C' } };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFAEBD7' }
              };
            }
          }
        }
        rowIndex++;
      }

      // Quarterly Analysis Section with enhanced styling
      ws.addRow([]);
      ws.addRow([]);
      ws.mergeCells('A' + (rowIndex + 2) + ':M' + (rowIndex + 2));
      ws.getCell('A' + (rowIndex + 2)).value = 'QUARTERLY ANALYSIS';
      ws.getCell('A' + (rowIndex + 2)).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      ws.getCell('A' + (rowIndex + 2)).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell('A' + (rowIndex + 2)).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF16A085' }
      };

      ws.addRow(['Quarter', 'Q1 Forecast', 'Q1 BU', 'Dev', 'Performance', '', '', '', '', '', '', '', '']);
      rowIndex += 4;
      
      // Style quarterly header
      const quarterlyHeaderRow = ws.getRow(rowIndex);
      quarterlyHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      quarterlyHeaderRow.fill = {
        type: 'gradient',
        gradient: 'path',
        center: { left: 0.5, top: 0.5 },
        stops: [
          { position: 0, color: { argb: 'FF16A085' } },
          { position: 100, color: { argb: 'FF1ABC9C' } }
        ]
      };
      
      for (const [index, quarter] of analytics.quarterlyBreakdown.entries()) {
        const quarterName = `Q${index + 1}`;
        const qForecast = quarter.forecastValue || 0;
        const qBU = qForecast * 1.2;
        const qDev = quarter.achievement ? ((quarter.achievement - 100)) : 0;
        const qPerformance = qDev >= 0 ? 'Above Target' : 'Below Target';

        const qRow = ws.addRow([
          quarterName,
          qForecast,
          qBU,
          qDev.toFixed(2),
          qPerformance,
          '', '', '', '', '', '', '', ''
        ]);

        // Style quarterly data rows
        for (let j = 1; j <= 5; j++) {
          const cell = qRow.getCell(j);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            left: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            bottom: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            right: { style: 'thin', color: { argb: 'FFBDC3C7' } }
          };
          cell.alignment = { horizontal: j === 1 || j === 5 ? 'center' : 'right' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8F8F5' }
          };

          // Performance indicator styling
          if (j === 5) {
            if (qDev >= 0) {
              cell.font = { bold: true, color: { argb: 'FF27AE60' } };
            } else {
              cell.font = { bold: true, color: { argb: 'FFE74C3C' } };
            }
          }
        }
        rowIndex++;
      }

      // Top Performers Section
      ws.addRow([]);
      ws.addRow([]);
      ws.mergeCells('A' + (rowIndex + 2) + ':M' + (rowIndex + 2));
      ws.getCell('A' + (rowIndex + 2)).value = 'TOP PERFORMERS';
      ws.getCell('A' + (rowIndex + 2)).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      ws.getCell('A' + (rowIndex + 2)).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell('A' + (rowIndex + 2)).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE67E22' }
      };

      ws.addRow(['Rank', 'User', 'Zone', 'Achievement %', 'Value', '', '', '', '', '', '', '', '']);
      rowIndex += 4;
      
      // Style performers header
      const performersHeaderRow = ws.getRow(rowIndex);
      performersHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      performersHeaderRow.fill = {
        type: 'gradient',
        gradient: 'path',
        center: { left: 0.5, top: 0.5 },
        stops: [
          { position: 0, color: { argb: 'FFE67E22' } },
          { position: 100, color: { argb: 'FFF39C12' } }
        ]
      };

      // Add top 6 performers
      const topPerformers = analytics.userPerformance
        .sort((a: any, b: any) => b.achievement - a.achievement)
        .slice(0, 6);

      for (const [index, user] of topPerformers.entries()) {
        const rank = index + 1;
        const pRow = ws.addRow([
          `#${rank}`,
          user.userName,
          user.zoneName,
          user.achievement.toFixed(1) + '%',
          user.forecastValue,
          '', '', '', '', '', '', '', ''
        ]);

        // Style performer rows
        for (let j = 1; j <= 5; j++) {
          const cell = pRow.getCell(j);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            left: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            bottom: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            right: { style: 'thin', color: { argb: 'FFBDC3C7' } }
          };
          cell.alignment = { horizontal: j === 1 || j === 2 || j === 3 ? 'left' : 'right' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFDF2E9' }
          };

          // Rank styling
          if (j === 1) {
            cell.font = { bold: true, color: { argb: 'FFE67E22' } };
            if (rank <= 3) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: rank === 1 ? 'FFFFD700' : rank === 2 ? 'FFC0C0C0' : 'FFCD7F32' }
              };
            }
          }

          // Achievement styling
          if (j === 4) {
            if (user.achievement >= 100) {
              cell.font = { bold: true, color: { argb: 'FF27AE60' } };
            } else if (user.achievement >= 80) {
              cell.font = { bold: true, color: { argb: 'FFF39C12' } };
            } else {
              cell.font = { bold: true, color: { argb: 'FFE74C3C' } };
            }
          }
        }
        rowIndex++;
      }

      // Product Type Analysis Section
      ws.addRow([]);
      ws.addRow([]);
      ws.mergeCells('A' + (rowIndex + 2) + ':M' + (rowIndex + 2));
      ws.getCell('A' + (rowIndex + 2)).value = 'PRODUCT TYPE ANALYSIS';
      ws.getCell('A' + (rowIndex + 2)).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      ws.getCell('A' + (rowIndex + 2)).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell('A' + (rowIndex + 2)).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF8E44AD' }
      };

      ws.addRow(['Product Type', 'Forecast Value', 'Actual Value', 'Achievement %', '', '', '', '', '', '', '', '', '']);
      rowIndex += 4;
      
      // Style product header
      const productHeaderRow = ws.getRow(rowIndex);
      productHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      productHeaderRow.fill = {
        type: 'gradient',
        gradient: 'path',
        center: { left: 0.5, top: 0.5 },
        stops: [
          { position: 0, color: { argb: 'FF8E44AD' } },
          { position: 100, color: { argb: 'FF9B59B6' } }
        ]
      };

      // Add top product types
      const topProducts = Object.entries(analytics.forecastByProductType || {})
        .sort(([,a], [,b]) => (b as any).value - (a as any).value)
        .slice(0, 6);

      for (const [productType, data] of topProducts) {
        const forecast = (data as any).value || 0;
        const actual = analytics.actualByProductType?.[productType]?.value || 0;
        const achievement = forecast > 0 ? (actual / forecast) * 100 : 0;

        const pRow = ws.addRow([
          productType,
          forecast,
          actual,
          achievement.toFixed(1) + '%',
          '', '', '', '', '', '', '', '', ''
        ]);

        // Style product rows
        for (let j = 1; j <= 4; j++) {
          const cell = pRow.getCell(j);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            left: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            bottom: { style: 'thin', color: { argb: 'FFBDC3C7' } },
            right: { style: 'thin', color: { argb: 'FFBDC3C7' } }
          };
          cell.alignment = { horizontal: j === 1 ? 'left' : 'right' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF4ECF7' }
          };

          // Achievement styling
          if (j === 4) {
            if (achievement >= 100) {
              cell.font = { bold: true, color: { argb: 'FF27AE60' } };
            } else if (achievement >= 80) {
              cell.font = { bold: true, color: { argb: 'FFF39C12' } };
            } else {
              cell.font = { bold: true, color: { argb: 'FFE74C3C' } };
            }
          }
        }
        rowIndex++;
      }

      // Footer section
      ws.addRow([]);
      ws.addRow([]);
      ws.mergeCells('A' + (rowIndex + 2) + ':M' + (rowIndex + 2));
      ws.getCell('A' + (rowIndex + 2)).value = `Report generated on ${new Date().toLocaleDateString()} - Forecast Analytics System`;
      ws.getCell('A' + (rowIndex + 2)).font = { size: 10, color: { argb: 'FF7F8C8D' } };
      ws.getCell('A' + (rowIndex + 2)).alignment = { horizontal: 'center' };

      // Apply column auto-width where needed
      ws.columns.forEach((column, index) => {
        if (index === 0 || index === 1) { // Zone and Month columns
          column.width = 15;
        }
      });

      const buf = await wb.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Forecast_${year}.xlsx`);
      res.send(Buffer.from(buf));
      return;
    } catch (error) {
      logger.error('Forecast export error:', error);
      res.status(500).json({ error: 'Failed to export forecast' });
      return;
    }
  }
}
