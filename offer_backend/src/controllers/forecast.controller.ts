import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function pad2(n: number) { return n.toString().padStart(2, '0'); }

export class ForecastController {
  static async getSummary(req: AuthRequest, res: Response) {
    try {
      const { year: yearParam } = req.query as any;
      const now = new Date();
      const year = yearParam ? parseInt(yearParam as string) : now.getFullYear();

      const zones = await prisma.serviceZone.findMany({ select: { id: true, name: true, shortForm: true } });
      const zoneIds = zones.map(z => z.id);

      const offersForecast = await prisma.offer.findMany({
        where: {
          poExpectedMonth: { startsWith: `${year}-` },
          status: { notIn: ['CANCELLED','LOST'] as any },
        },
        select: { zoneId: true, poExpectedMonth: true, offerValue: true, productType: true },
      });

      const offersActual = await prisma.offer.findMany({
        where: {
          OR: [
            { poReceivedMonth: { startsWith: `${year}-` } },
            { poDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59, 999) } },
          ],
          stage: { in: ['WON','PO_RECEIVED','ORDER_BOOKED'] as any },
        },
        select: { zoneId: true, poReceivedMonth: true, poDate: true, poValue: true },
      });

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

        // Only push rows that have real backend values
        if (forecastSum > 0 || actualSum > 0) {
          annualForecast += forecastSum;
          annualActual += actualSum;

          const variance = forecastSum - actualSum;
          const achievement = forecastSum > 0 ? (actualSum / forecastSum) * 100 : 0;
          monthly.push({ month: m, monthName: name, forecast: forecastSum, euro: euroCount, mtdActual: actualSum, variance, achievement, byZone });
        }
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
}
