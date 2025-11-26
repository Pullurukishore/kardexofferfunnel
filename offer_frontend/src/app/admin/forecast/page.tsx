'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Target, TrendingUp, Award, BarChart3, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ZoneInfo = { id: number; name: string; shortForm: string };

type MonthlyRow = {
  month: number;
  monthName: string;
  forecast: number;
  euro: number;
  mtdActual: number;
  variance: number;
  achievement: number;
  byZone: Record<string, number>;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

const achClass = (v: number) =>
  v >= 100
    ? 'text-emerald-700 bg-emerald-50'
    : v >= 80
    ? 'text-amber-700 bg-amber-50'
    : 'text-rose-700 bg-rose-50';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const pad = (n: number) => n.toString().padStart(2, '0');
const devClass = (v: number) => (v < 0 ? 'text-blue-700 bg-blue-50' : v > 0 ? 'text-rose-700 bg-rose-50' : 'text-slate-700 bg-slate-50');

export default function AdminForecastPage() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('highlights');
  const [zones, setZones] = useState<ZoneInfo[]>([]);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [quarters, setQuarters] = useState<any[]>([]);
  const [productTotals, setProductTotals] = useState<{ productType: string; total: number }[]>([]);
  const [breakdownZones, setBreakdownZones] = useState<any[]>([]);
  const [poAgg, setPoAgg] = useState<any[]>([]);
  const [poZoneTables, setPoZoneTables] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<{ rows: any[]; total: any; year?: number } | null>(null);

  const load = async (y = year) => {
    setLoading(true);
    try {
      const [summaryRes, breakdownRes, poExpectedRes, highlightsRes] = await Promise.all([
        apiService.getForecastSummary({ year: y }),
        apiService.getForecastBreakdown({ year: y }),
        apiService.getForecastPoExpected({ year: y }),
        apiService.getForecastHighlights({ year: y }),
      ]);
      const data = summaryRes?.data || summaryRes;
      const breakdown = breakdownRes?.data || breakdownRes;
      const poExp = poExpectedRes?.data || poExpectedRes;
      const hl = (highlightsRes?.data || highlightsRes) || null;
      const zonesList: ZoneInfo[] = data.zones || [];
      const zoneNamesLocal = zonesList.map(z => z.name);
      const monthlyData: MonthlyRow[] = data.monthly || [];
      setZones(zonesList);
      // Build full 12-month view with zeros for missing months; keep all zone columns
      const monthlyIndex: Record<number, MonthlyRow> = {};
      monthlyData.forEach(r => { monthlyIndex[r.month] = r; });
      const fullMonthly: MonthlyRow[] = Array.from({ length: 12 }).map((_, i) => {
        const m = i + 1;
        const existing = monthlyIndex[m];
        if (existing) {
          // Ensure byZone has all zones (fill missing with 0)
          const filledByZone: Record<string, number> = {};
          zoneNamesLocal.forEach(zn => { filledByZone[zn] = Number(existing.byZone?.[zn] || 0); });
          return { ...existing, byZone: filledByZone };
        }
        const emptyByZone: Record<string, number> = {};
        zoneNamesLocal.forEach(zn => { emptyByZone[zn] = 0; });
        return {
          month: m,
          monthName: MONTHS[i],
          forecast: 0,
          euro: 0,
          mtdActual: 0,
          variance: 0,
          achievement: 0,
          byZone: emptyByZone,
        } as MonthlyRow;
      });
      setMonthly(fullMonthly);
      setTotals(data.totals || null);
      setQuarters(data.quarters || []);
      setProductTotals(data.productTypeTotals || []);
      // Merge breakdown with all zones (include empty zones)
      const bdZones: any[] = [];
      const bdIndex = new Map<number, any>((breakdown.zones || []).map((z: any) => [z.zoneId, z]));
      for (const z of zonesList) {
        const item = bdIndex.get(z.id) || {
          zoneId: z.id,
          zoneName: z.name,
          users: [],
          productTypes: [],
          matrix: {},
          totals: { byUser: {}, byProductType: {}, zoneTotal: 0 },
        };
        bdZones.push(item);
      }
      setBreakdownZones(bdZones);
      // Aggregated monthly PO expected from backend only
      const agg = poExp?.aggregatedByMonth || {};
      const poAggRows: any[] = [];
      for (let i = 0; i < 12; i++) {
        const mm = pad(i + 1);
        const entry = agg[mm] || { byZone: {}, total: 0, euro: 0 };
        const byZoneFilled: Record<string, number> = {};
        zoneNamesLocal.forEach(zn => { byZoneFilled[zn] = Number(entry.byZone?.[zn] || 0); });
        poAggRows.push({
          monthName: MONTHS[i],
          forecast: Number(entry.total || 0),
          euro: Number(entry.euro || 0),
          total: Number(entry.total || 0),
          byZone: byZoneFilled,
          startOfMonth: MONTHS[i],
        });
      }
      setPoAgg(poAggRows);
      // Build per-zone PO expected tables
      const perZone = poExp?.perZone || {};
      const zoneTables = zonesList.map((zone: ZoneInfo) => {
        const z: any = perZone?.[(zone as any).id] || perZone?.[String((zone as any).id)] || { zoneId: zone.id, zoneName: zone.name, months: {} };
        const userMap = new Map<number, string>();
        Object.values(z.months || {}).forEach((m: any) => {
          Object.values(m.users || {}).forEach((u: any) => userMap.set(u.userId, u.userName));
        });
        const users = Array.from(userMap.entries()).map(([id, name]) => ({ id, name }));
        const rows = MONTHS.map((mn, idx) => {
          const mm = pad(idx + 1);
          const mrec = (z.months && z.months[mm]) || { users: {}, total: 0 };
          const byUser: Record<number, number> = {};
          users.forEach((u: any) => {
            byUser[u.id] = Number((mrec.users?.[u.id]?.amount) || 0);
          });
          return { monthName: mn, byUser, total: Number(mrec.total || 0) };
        });
        return { zoneId: zone.id, zoneName: zone.name, users, rows };
      });
      setPoZoneTables(zoneTables);
      setHighlights(hl);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(year);
  }, [year]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return [now - 1, now, now + 1];
  }, []);

  const zoneNames = useMemo(() => zones.map(z => z.name), [zones]);

  return (
    <div className="p-6 space-y-6 relative">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Forecast</h1>
          <p className="text-sm text-slate-600">Admin overview of monthly forecast vs target and actuals</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border px-3 py-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-semibold outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => load(year)} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest">Annual Forecast</p>
              <p className="text-3xl font-black text-blue-900 mt-2">{totals ? inr(totals.annualForecast) : '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-green-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Annual Actual</p>
              <p className="text-3xl font-black text-emerald-900 mt-2">{totals ? inr(totals.annualActual) : '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-widest">Variance</p>
              <p className="text-3xl font-black text-indigo-900 mt-2">{totals ? inr(totals.variance) : '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-0">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Achievement</p>
              <p className={`text-3xl font-black mt-2 ${totals ? (totals.achievement >= 100 ? 'text-emerald-700' : totals.achievement >= 80 ? 'text-amber-700' : 'text-rose-700') : ''}`}>{totals ? pct(totals.achievement) : '—'}</p>
            </div>
            <div className={`p-3 rounded-xl shadow-lg ${totals ? (totals.achievement >= 100 ? 'bg-emerald-100' : totals.achievement >= 80 ? 'bg-amber-100' : 'bg-rose-100') : 'bg-slate-100'}`}>
              <Award className={`w-6 h-6 ${totals ? (totals.achievement >= 100 ? 'text-emerald-700' : totals.achievement >= 80 ? 'text-amber-700' : 'text-rose-700') : 'text-slate-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 p-1 shadow-md border border-slate-200">
          <TabsTrigger value="highlights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg transition-all">
            🎯 Highlights
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all">
            📅 Monthly
          </TabsTrigger>
          <TabsTrigger value="po-agg" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg transition-all">
            📊 PO Agg
          </TabsTrigger>
          <TabsTrigger value="po-zone" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg transition-all">
            🗺️ PO Zones
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg transition-all">
            👥 Zone×User×Product
          </TabsTrigger>
          <TabsTrigger value="totals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all">
            📦 Product Totals
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}

      {activeTab === 'highlights' && highlights && (
        <Card className="rounded-2xl shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
            <CardTitle className="text-lg">Offers Highlights</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest sticky left-0 bg-slate-50 z-20">Zone</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">No. of Offers</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">Offers Value</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">Orders Received</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">Open Funnel</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">Order Booking</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">BU for Booking / {year}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">%</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">Balance BU</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {highlights.rows?.map((r, idx) => (
                    <tr key={r.zoneId} className={`hover:bg-amber-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                      <td className="px-4 py-2 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10">{r.zoneName}</td>
                      <td className="px-4 py-2 text-right text-sm">{r.numOffers || 0}</td>
                      <td className="px-4 py-2 text-right text-sm font-bold">{inr(r.offersValue || 0)}</td>
                      <td className="px-4 py-2 text-right text-sm">{inr(r.ordersReceived || 0)}</td>
                      <td className="px-4 py-2 text-right text-sm">{inr(r.openFunnel || 0)}</td>
                      <td className="px-4 py-2 text-right text-sm">{inr(r.orderBooking || 0)}</td>
                      <td className="px-4 py-2 text-right text-sm">{inr(r.buYear || 0)}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${devClass(r.devPercent || 0)}`}>{(r.devPercent || 0).toFixed(0)}%</span>
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-bold">{inr(r.balanceBu || 0)}</td>
                    </tr>
                  ))}
                  {highlights.total && (
                    <tr className="bg-slate-50">
                      <td className="px-4 py-2 text-sm font-bold uppercase tracking-wide">Total</td>
                      <td className="px-4 py-2 text-right text-sm font-bold">{highlights.total.numOffers || 0}</td>
                      <td className="px-4 py-2 text-right text-sm font-bold">{inr(highlights.total.offersValue || 0)}</td>
                      <td className="px-4 py-2 text-right text-sm font-bold">{inr(highlights.total.ordersReceived || 0)}</td>
                      <td className="px-4 py-2 text-right text-sm font-bold">{inr(highlights.total.openFunnel || 0)}</td>
                      <td className="px-4 py-2 text-right text-sm font-bold">{inr(highlights.total.orderBooking || 0)}</td>
                      <td className="px-4 py-2 text-right text-sm font-bold">{inr(highlights.total.buYear || 0)}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${devClass(highlights.total.devPercent || 0)}`}>{(highlights.total.devPercent || 0).toFixed(0)}%</span>
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-black text-indigo-700">{inr(highlights.total.balanceBu || 0)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'highlights' && (
      <Card className="rounded-2xl shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
          <CardTitle className="text-lg">Quarter Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quarters.map((q) => (
              <div key={q.quarter} className="rounded-xl p-4 border bg-white">
                <div className="text-xs font-semibold text-slate-600 uppercase">{q.quarter}</div>
                <div className="mt-2 text-sm text-slate-600">Target</div>
                <div className="text-xl font-bold">{inr(q.target || 0)}</div>
                <div className="mt-1 text-sm text-slate-600">Forecast</div>
                <div className="text-xl font-bold">{inr(q.forecast || 0)}</div>
                <div className={`mt-3 inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${achClass(100 + (q.devPercent || 0))}`}>
                  Dev {q.devPercent ? q.devPercent.toFixed(1) : '0.0'}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* PO Expected — Per Zone Tables */}
      {activeTab === 'po-zone' && poZoneTables.length > 0 && (
        <div className="space-y-6">
          {poZoneTables.map((z) => (
            <Card key={`pozone-${z.zoneId}`} className="rounded-2xl shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
                <CardTitle className="text-lg">PO Expected Month — {z.zoneName}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest sticky left-0 bg-slate-50 z-20">Month</th>
                        {(z.users && z.users.length ? z.users : [{ id: 0, name: 'N/A' }]).map((u: any) => (
                          <th key={`poz-${z.zoneId}-u-${u.id}`} className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest">{(u.name && String(u.name).trim()) ? u.name : 'N/A'}</th>
                        ))}
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {z.rows.map((r: any, idx: number) => (
                        <tr key={`pozrow-${z.zoneId}-${idx}`} className={`hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                          <td className="px-6 py-3 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10">{r.monthName}</td>
                          {(z.users && z.users.length ? z.users : [{ id: 0, name: 'N/A' }]).map((u: any) => (
                            <td key={`pozcell-${z.zoneId}-${idx}-${u.id}`} className="px-6 py-3 text-right text-sm">{inr(r.byUser?.[u.id] || 0)}</td>
                          ))}
                          <td className="px-6 py-3 text-right text-sm font-bold">{inr(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'monthly' && (
      <Card className="rounded-2xl shadow-2xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="text-lg">Monthly Forecast by Zone</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest sticky left-0 bg-slate-50 z-20">Month</th>
                {zoneNames.map((zn) => (
                  <th key={zn} className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">{zn}</th>
                ))}
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">Offers Count</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">MTD Actual</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">Variance</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">Ach%</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {monthly.map((row, idx) => (
                <tr key={row.month} className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                  <td className="px-6 py-3 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10">{row.monthName}</td>
                  {zoneNames.map((zn) => (
                    <td key={zn} className="px-6 py-3 text-right text-sm font-bold text-slate-800">{inr(row.byZone?.[zn] || 0)}</td>
                  ))}
                  <td className="px-6 py-3 text-right text-sm font-bold text-indigo-700">{inr(row.forecast)}</td>
                  <td className="px-6 py-3 text-right text-sm text-slate-700">{row.euro}</td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-emerald-700">{inr(row.mtdActual)}</td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-indigo-700">{inr(row.variance)}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${achClass(row.achievement)}`}>{pct(row.achievement)}</span>
                    <div className="mt-1 w-24 h-1.5 bg-slate-200 rounded-full ml-auto overflow-hidden">
                      <div
                        className={`${row.achievement >= 100 ? 'bg-emerald-500' : row.achievement >= 80 ? 'bg-amber-500' : 'bg-rose-500'} h-full`}
                        style={{ width: `${Math.max(0, Math.min(100, row.achievement))}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}

      {activeTab === 'totals' && (
      <Card className="rounded-2xl shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
          <CardTitle className="text-lg">Total of All Zones by Product Type</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest sticky left-0 bg-slate-50 z-20">Product Type</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {productTotals.map((p, idx) => (
                  <tr key={p.productType} className={`hover:bg-indigo-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10">{p.productType}</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-slate-800">{inr(p.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Zone → User × Product Type Grids */}
      {activeTab === 'breakdown' && breakdownZones.length > 0 && (
        <div className="space-y-6">
          {breakdownZones.map((z) => (
            <Card key={z.zoneId} className="rounded-2xl shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
                <CardTitle className="text-lg">{z.zoneName} — User × Product Type</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest sticky left-0 bg-slate-50 z-20">Product Type</th>
                        {(z.users && z.users.length ? z.users : [{ id: 0, name: 'N/A' }]).map((u: any) => (
                          <th key={u.id} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">{(u.name && String(u.name).trim()) ? u.name : 'N/A'}</th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {z.productTypes.map((pt: string, idx: number) => (
                        <tr key={pt} className={`hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                          <td className="px-4 py-2 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10">{pt}</td>
                          {(z.users && z.users.length ? z.users : [{ id: 0, name: 'N/A' }]).map((u: any) => (
                            <td key={`${pt}-${u.id}`} className="px-4 py-2 text-right text-sm">{inr((z.matrix?.[pt]?.[u.id] || 0))}</td>
                          ))}
                          <td className="px-4 py-2 text-right text-sm font-bold">{inr(z.totals?.byProductType?.[pt] || 0)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50">
                        <td className="px-4 py-2 text-sm font-bold uppercase tracking-wide">Total</td>
                        {(z.users && z.users.length ? z.users : [{ id: 0, name: 'N/A' }]).map((u: any) => (
                          <td key={`total-${u.id}`} className="px-4 py-2 text-right text-sm font-bold">{inr(z.totals?.byUser?.[u.id] || 0)}</td>
                        ))}
                        <td className="px-4 py-2 text-right text-sm font-black text-indigo-700">{inr(z.totals?.zoneTotal || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* PO Expected — Aggregated Monthly */}
      {activeTab === 'po-agg' && (
      <Card className="rounded-2xl shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
          <CardTitle className="text-lg">PO Expected — Aggregated Monthly</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest sticky left-0 bg-slate-50 z-20">Month</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest">Forecast</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest">Offers Count</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest">Start of the Month</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest">Total</th>
                  {zoneNames.map((zn) => (
                    <th key={`po-agg-${zn}`} className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest">{zn}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {poAgg.map((r, idx) => (
                  <tr key={idx} className={`hover:bg-indigo-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10">{r.monthName}</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-indigo-700">{inr(r.forecast)}</td>
                    <td className="px-6 py-3 text-right text-sm">{r.euro}</td>
                    <td className="px-6 py-3 text-left text-sm text-slate-600">{r.startOfMonth}</td>
                    <td className="px-6 py-3 text-right text-sm font-bold">{inr(r.total)}</td>
                    {zoneNames.map((zn) => (
                      <td key={`po-agg-cell-${idx}-${zn}`} className="px-6 py-3 text-right text-sm">{inr(r.byZone?.[zn] || 0)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
