'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCrLakh, formatINRFull } from '@/lib/format';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Target, TrendingDown, Trophy, Users, MapPin, Activity } from 'lucide-react';

type ZoneRow = {
  serviceZoneId: number;
  serviceZone: { id: number; name: string };
  productType: string | null;
  targetValue: number;
  actualValue: number;
  achievement: number;
  variance: number;
};

type UserRow = {
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    serviceZones?: Array<{ serviceZone: { id: number; name: string } }>;
  };
  productType: string | null;
  targetValue: number;
  actualValue: number;
  achievement: number;
  variance: number;
};

interface Props {
  zoneTargets: ZoneRow[];
  userTargets: UserRow[];
  summary: any;
  targetPeriod: string;
  periodType: 'MONTHLY' | 'YEARLY';
  zones: Array<{ id: number; name: string }>;
  onOpenZoneDetails?: (zoneId: number, targetPeriod: string, periodType: 'MONTHLY' | 'YEARLY') => void;
  onOpenUserDetails?: (userId: number, targetPeriod: string, periodType: 'MONTHLY' | 'YEARLY') => void;
  isZoneUser?: boolean;
}

const palette = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#10B981', '#F97316', '#84CC16', '#E11D48'];

function pct(n: number) {
  if (!isFinite(n)) return '0.0';
  return Math.max(0, n).toFixed(1);
}

export default function TargetReportAnalytics({ zoneTargets, userTargets, summary, targetPeriod, periodType, zones, onOpenZoneDetails, onOpenUserDetails, isZoneUser }: Props) {
  const [valueUnit, setValueUnit] = useState<'AUTO' | 'LAKH' | 'CR' | 'INR'>('AUTO');
  const [selectedProductType, setSelectedProductType] = useState<string>('ALL_PRODUCTS');
  const [topN, setTopN] = useState<number>(10);
  const formatValue = useCallback((v: number) => {
    if (valueUnit === 'INR') return formatINRFull(v);
    if (valueUnit === 'CR') {
      const cr = v / 10000000;
      return `₹${cr.toFixed(2)}Cr`;
    }
    if (valueUnit === 'LAKH') {
      const lakh = v / 100000;
      return `₹${lakh.toFixed(2)}L`;
    }
    return formatCrLakh(v);
  }, [valueUnit]);
  const filteredZoneTargets = useMemo(() => {
    return selectedProductType === 'ALL_PRODUCTS'
      ? zoneTargets
      : (zoneTargets || []).filter(r => (r.productType || 'ALL_PRODUCTS') === selectedProductType);
  }, [zoneTargets, selectedProductType]);

  const filteredUserTargets = useMemo(() => {
    return selectedProductType === 'ALL_PRODUCTS'
      ? userTargets
      : (userTargets || []).filter(r => (r.productType || 'ALL_PRODUCTS') === selectedProductType);
  }, [userTargets, selectedProductType]);

  const zoneAgg = useMemo(() => {
    const map = new Map<number, { zoneId: number; zoneName: string; target: number; actual: number; achievement: number; variance: number }>();
    for (const row of filteredZoneTargets || []) {
      if (!row) continue;
      const zId = row.serviceZoneId;
      const zoneName = row.serviceZone?.name || 'Unknown';
      const entry = map.get(zId) || { zoneId: zId, zoneName, target: 0, actual: 0, achievement: 0, variance: 0 };
      const targetVal = Number(row.targetValue) || 0;
      const actualVal = Number(row.actualValue) || 0;
      const varianceVal = Number(row.variance) !== undefined ? Number(row.variance) : (actualVal - targetVal);
      entry.target += targetVal;
      entry.actual += actualVal;
      entry.variance += varianceVal;
      map.set(zId, entry);
    }
    const arr = Array.from(map.values()).map(x => ({
      ...x,
      achievement: x.target > 0 ? (x.actual / x.target) * 100 : 0,
    }));
    return arr.sort((a, b) => b.target - a.target);
  }, [filteredZoneTargets]);

  const userAgg = useMemo(() => {
    const map = new Map<number, { userId: number; name: string; email: string; target: number; actual: number; achievement: number; variance: number; zones: string }>();
    for (const row of filteredUserTargets || []) {
      if (!row) continue;
      const uId = row.userId;
      const zonesStr = (row.user?.serviceZones || []).map((z: any) => z?.serviceZone?.name).filter(Boolean).join(', ');
      const entry = map.get(uId) || { userId: uId, name: row.user?.name || row.user?.email || 'User', email: row.user?.email || '', target: 0, actual: 0, achievement: 0, variance: 0, zones: zonesStr };
      const targetVal = Number(row.targetValue) || 0;
      const actualVal = Number(row.actualValue) || 0;
      const varianceVal = Number(row.variance) !== undefined ? Number(row.variance) : (actualVal - targetVal);
      entry.target += targetVal;
      entry.actual += actualVal;
      entry.variance += varianceVal;
      entry.zones = zonesStr || entry.zones;
      map.set(uId, entry);
    }
    const arr = Array.from(map.values()).map(x => ({
      ...x,
      achievement: x.target > 0 ? (x.actual / x.target) * 100 : 0,
    }));
    return arr.sort((a, b) => b.target - a.target);
  }, [filteredUserTargets]);

  const productTypeAgg = useMemo(() => {
    const map = new Map<string, { productType: string; target: number; actual: number; achievement: number }>();
    for (const row of zoneTargets || []) {
      if (!row) continue;
      const pt = row.productType || 'ALL_PRODUCTS';
      const entry = map.get(pt) || { productType: pt, target: 0, actual: 0, achievement: 0 };
      entry.target += Number(row.targetValue) || 0;
      entry.actual += Number(row.actualValue) || 0;
      map.set(pt, entry);
    }
    const arr = Array.from(map.values()).map(x => ({ ...x, achievement: x.target > 0 ? (x.actual / x.target) * 100 : 0 }));
    const byNamed = arr.filter(a => a.productType !== 'ALL_PRODUCTS');
    const total = arr.find(a => a.productType === 'ALL_PRODUCTS') || { productType: 'ALL_PRODUCTS', target: 0, actual: 0, achievement: 0 };
    return { list: byNamed.sort((a, b) => b.actual - a.actual), total };
  }, [zoneTargets]);

  const zptActualMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of zoneTargets || []) {
      if (!row) continue;
      const key = `${row.serviceZoneId}|${row.productType || 'ALL_PRODUCTS'}`;
      m.set(key, (m.get(key) || 0) + (Number(row.actualValue) || 0));
    }
    return m;
  }, [zoneTargets]);

  const topZones = useMemo(() => [...zoneAgg].sort((a, b) => b.achievement - a.achievement).slice(0, 5), [zoneAgg]);
  const bottomZones = useMemo(() => [...zoneAgg].sort((a, b) => a.achievement - b.achievement).slice(0, 5), [zoneAgg]);
  const topUsers = useMemo(() => [...userAgg].sort((a, b) => b.achievement - a.achievement).slice(0, 5), [userAgg]);
  const worstGaps = useMemo(() => [...zoneAgg].sort((a, b) => a.variance - b.variance).slice(0, 5), [zoneAgg]);

  const coverage = useMemo(() => {
    const zonesWithTargets = new Set((zoneTargets || []).filter(z => z).map(z => z.serviceZoneId));
    const totalZones = zones?.length || 0;
    const count = zonesWithTargets.size;
    const pctZones = totalZones > 0 ? Math.round((count / totalZones) * 100) : 0;
    const usersWithTargets = new Set((userTargets || []).filter(u => u).map(u => u.userId)).size;
    return { zones: { count, total: totalZones, pct: pctZones }, users: { count: usersWithTargets } };
  }, [zoneTargets, userTargets, zones]);

  const isMonthlyCurrent = useMemo(() => {
    if (periodType !== 'MONTHLY') return false;
    if (!targetPeriod || !targetPeriod.includes('-')) return false;
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return cur === targetPeriod;
  }, [periodType, targetPeriod]);

  const pace = useMemo(() => {
    if (!isMonthlyCurrent) return null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = now.getDate();
    const target = Number(summary?.totalZoneTargetValue || 0);
    const actual = Number(summary?.totalZoneActualValue || 0);
    const reqDaily = daysInMonth > 0 ? target / daysInMonth : 0;
    const curDaily = day > 0 ? actual / day : 0;
    const pacePct = reqDaily > 0 ? (curDaily / reqDaily) * 100 : 0;
    const onTrack = pacePct >= 100 || actual >= target;
    const gap = Math.max(0, target - actual);
    const neededPerDay = Math.max(0, (target - actual) / Math.max(1, daysInMonth - day));
    return { daysInMonth, day, reqDaily, curDaily, pacePct, onTrack, gap, neededPerDay, target, actual };
  }, [isMonthlyCurrent, summary]);

  const zoneBarData = useMemo(() => {
    return (zoneAgg || []).slice(0, 10).map((z) => {
      if (!z) return null;
      return {
        zoneId: z.zoneId,
        zone: z.zoneName,
        Target: Math.round(z.target || 0),
        Actual: Math.round(z.actual || 0),
        Achievement: Math.round(z.achievement || 0),
      };
    }).filter(Boolean);
  }, [zoneAgg]);

  const productPieData = useMemo(() => {
    return (productTypeAgg?.list || []).filter(p => p).map((p) => ({
      name: String(p.productType || 'Unknown').split('_').join(' '),
      value: Math.round(Number(p.actual) || 0),
    }));
  }, [productTypeAgg]);

  const bins = useMemo(() => {
    const vals = (zoneAgg || []).filter(z => z).map(z => z.achievement).filter(v => isFinite(v));
    const ranges = [
      { key: '0-50', min: 0, max: 50 },
      { key: '50-80', min: 50, max: 80 },
      { key: '80-100', min: 80, max: 100 },
      { key: '100-120', min: 100, max: 120 },
      { key: '120+', min: 120, max: Infinity },
    ];
    return ranges.map(r => ({ range: r.key, count: vals.filter(v => v >= r.min && v < r.max).length }));
  }, [zoneAgg]);

  const totalAchievement = useMemo(() => {
    const val = Number(summary?.totalZoneAchievement || 0);
    return val > 0 ? val : (Number(summary?.totalZoneTargetValue || 0) > 0 ? (Number(summary?.totalZoneActualValue || 0) / Number(summary?.totalZoneTargetValue || 0)) * 100 : 0);
  }, [summary]);

  const kpis = useMemo(() => {
    const totalTarget = Number(summary?.totalZoneTargetValue || 0);
    const totalActual = Number(summary?.totalZoneActualValue || 0);
    const totalVariance = totalActual - totalTarget;
    const zones100 = (zoneAgg || []).filter(z => z && (z.achievement || 0) >= 100).length;
    const zonesUnder80 = (zoneAgg || []).filter(z => z && (z.achievement || 0) < 80).length;
    const topPT = (productTypeAgg?.list || [])[0];
    const totalPTActual = productTypeAgg?.total?.actual || 0;
    const topPTShare = topPT && totalPTActual > 0 ? (topPT.actual / totalPTActual) * 100 : 0;
    return { totalTarget, totalActual, totalVariance, zones100, zonesUnder80, topPTName: topPT?.productType || 'N/A', topPTShare };
  }, [summary, zoneAgg, productTypeAgg]);

  const topZonesForStack = useMemo(() => (zoneAgg || []).slice(0, 6), [zoneAgg]);
  const productTypesForStack = useMemo(() => (productTypeAgg?.list || []).map(p => p?.productType).filter(Boolean), [productTypeAgg]);
  const zoneProductStack = useMemo(() => {
    return (topZonesForStack || []).map(z => {
      if (!z) return null;
      const row: any = { zone: z.zoneName };
      for (const pt of productTypesForStack || []) {
        if (!pt) continue;
        const key = `${z.zoneId}|${pt}`;
        row[pt] = zptActualMap.get(key) || 0;
      }
      return row;
    }).filter(Boolean);
  }, [topZonesForStack, productTypesForStack, zptActualMap]);

  const paretoData = useMemo(() => {
    const list = [...(productTypeAgg?.list || [])];
    const total = productTypeAgg?.total?.actual || 0;
    let acc = 0;
    return list.map((p) => {
      if (!p) return { name: 'Unknown', value: 0, cumPct: 0 };
      acc += Number(p.actual) || 0;
      return { name: String(p.productType).split('_').join(' '), value: Number(p.actual) || 0, cumPct: total > 0 ? (acc / total) * 100 : 0 };
    });
  }, [productTypeAgg]);

  const bestZone = useMemo(() => zoneAgg.length ? zoneAgg.reduce((a, b) => (b.achievement > a.achievement ? b : a)) : null, [zoneAgg]);
  const worstZone = useMemo(() => zoneAgg.length ? zoneAgg.reduce((a, b) => (b.achievement < a.achievement ? b : a)) : null, [zoneAgg]);
  const bestUser = useMemo(() => userAgg.length ? userAgg.reduce((a, b) => (b.achievement > a.achievement ? b : a)) : null, [userAgg]);

  const zoneRiskData = useMemo(() => (zoneAgg || []).map(z => {
    if (!z) return null;
    return {
      zoneId: z.zoneId,
      zone: z.zoneName,
      x: Math.round(z.achievement || 0),
      y: Math.round(z.target || 0),
      z: Math.max(1, Math.round(z.actual || 0)),
      color: (z.achievement || 0) >= 100 ? '#10B981' : (z.achievement || 0) >= 80 ? '#3B82F6' : '#F59E0B',
    };
  }).filter(Boolean), [zoneAgg]);

  const handleZoneDrill = useCallback((zoneId?: number) => {
    if (!zoneId || !onOpenZoneDetails) return;
    onOpenZoneDetails(zoneId, targetPeriod, periodType);
  }, [onOpenZoneDetails, targetPeriod, periodType]);

  const handleUserDrill = useCallback((userId?: number) => {
    if (!userId || !onOpenUserDetails) return;
    onOpenUserDetails(userId, targetPeriod, periodType);
  }, [onOpenUserDetails, targetPeriod, periodType]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Target className="h-5 w-5 text-indigo-600" /> Overall Achievement
            </CardTitle>
            <CardDescription>Progress towards target</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{ name: 'Achievement', value: Math.max(0, Math.min(150, totalAchievement)) }]} startAngle={90} endAngle={-270}>
                    <RadialBar background dataKey="value" fill="#6366F1" cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-slate-900">{pct(totalAchievement)}%</div>
                <div className="text-sm text-slate-600 mt-1">Actual: <span title={formatINRFull(summary?.totalZoneActualValue || 0)} className="font-medium">{formatValue(summary?.totalZoneActualValue || 0)}</span></div>
                <div className="text-sm text-slate-600">Target: <span title={formatINRFull(summary?.totalZoneTargetValue || 0)} className="font-medium">{formatValue(summary?.totalZoneTargetValue || 0)}</span></div>
                <div className="mt-2">
                  <Badge variant="outline" className={totalAchievement >= 100 ? 'border-green-600 text-green-700' : totalAchievement >= 80 ? 'border-blue-600 text-blue-700' : totalAchievement >= 50 ? 'border-amber-600 text-amber-700' : 'border-rose-600 text-rose-700'}>
                    {totalAchievement >= 100 ? 'On Target' : totalAchievement >= 80 ? 'Near Target' : totalAchievement >= 50 ? 'Needs Attention' : 'Off Track'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="text-slate-500">Values:</span>
              <button className={`px-2 py-1 rounded border ${valueUnit==='AUTO'?'border-slate-700 text-slate-900':'border-slate-300 text-slate-600'}`} onClick={() => setValueUnit('AUTO')}>Auto</button>
              <button className={`px-2 py-1 rounded border ${valueUnit==='LAKH'?'border-slate-700 text-slate-900':'border-slate-300 text-slate-600'}`} onClick={() => setValueUnit('LAKH')}>Lakh</button>
              <button className={`px-2 py-1 rounded border ${valueUnit==='CR'?'border-slate-700 text-slate-900':'border-slate-300 text-slate-600'}`} onClick={() => setValueUnit('CR')}>Cr</button>
              <button className={`px-2 py-1 rounded border ${valueUnit==='INR'?'border-slate-700 text-slate-900':'border-slate-300 text-slate-600'}`} onClick={() => setValueUnit('INR')}>Full</button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <MapPin className="h-5 w-5 text-emerald-600" /> Coverage
            </CardTitle>
            <CardDescription>Zones and users with targets</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg p-4 bg-emerald-50 border border-emerald-100">
                <div className="text-xs text-emerald-700">Zones Covered</div>
                <div className="text-2xl font-bold text-emerald-800">{coverage.zones.count}/{coverage.zones.total}</div>
                <div className="text-xs text-emerald-700 mt-1">{coverage.zones.pct}% coverage</div>
              </div>
              <div className="rounded-lg p-4 bg-indigo-50 border border-indigo-100">
                <div className="text-xs text-indigo-700">Users With Targets</div>
                <div className="text-2xl font-bold text-indigo-800">{coverage.users.count}</div>
                <div className="text-xs text-indigo-700 mt-1">Active assignments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Activity className="h-5 w-5 text-amber-600" /> {periodType === 'MONTHLY' ? 'Monthly Pace' : 'Performance Spread'}
            </CardTitle>
            <CardDescription>{periodType === 'MONTHLY' ? 'Run-rate to hit target' : 'Zone achievement distribution'}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {periodType === 'MONTHLY' && pace ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg p-4 bg-amber-50 border border-amber-100">
                  <div className="text-xs text-amber-700">Current Pace</div>
                  <div className="text-3xl font-bold text-amber-800">{pct(pace.pacePct)}%</div>
                  <div className="text-xs text-amber-700 mt-1">Daily actual {formatCrLakh(pace.curDaily)} vs need {formatCrLakh(pace.reqDaily)}</div>
                </div>
                <div className="rounded-lg p-4 bg-rose-50 border border-rose-100">
                  <div className="text-xs text-rose-700">Target Gap</div>
                  <div className="text-3xl font-bold text-rose-800">{formatCrLakh(pace.gap)}</div>
                  <div className="text-xs text-rose-700 mt-1">Need {formatCrLakh(pace.neededPerDay)} per day</div>
                </div>
              </div>
            ) : (
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bins}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-0 shadow-lg ${kpis.totalVariance >= 0 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100' : 'bg-gradient-to-br from-rose-50 to-rose-100'}`}>
          <CardContent className="p-5">
            <div className={`text-xs font-semibold ${kpis.totalVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Total Variance</div>
            <div className={`text-3xl font-bold mt-2 ${kpis.totalVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>{kpis.totalVariance >= 0 ? '+' : ''}{formatCrLakh(kpis.totalVariance)}</div>
            <div className={`text-xs mt-1 ${kpis.totalVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Actual vs Target</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-100">
          <CardContent className="p-5">
            <div className="text-xs font-semibold text-emerald-700">Zones ≥ 100%</div>
            <div className="text-3xl font-bold mt-2 text-emerald-800">{kpis.zones100}</div>
            <div className="text-xs mt-1 text-emerald-600">High performers</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-100">
          <CardContent className="p-5">
            <div className="text-xs font-semibold text-amber-700">Zones &lt; 80%</div>
            <div className="text-3xl font-bold mt-2 text-amber-800">{kpis.zonesUnder80}</div>
            <div className="text-xs mt-1 text-amber-600">At risk</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-100">
          <CardContent className="p-5">
            <div className="text-xs font-semibold text-indigo-700">Top Product Type</div>
            <div className="text-lg font-bold mt-2 text-indigo-800">{String(kpis.topPTName).split('_').join(' ')}</div>
            <div className="text-xs mt-1 text-indigo-600">{pct(kpis.topPTShare)}% of actual</div>
          </CardContent>
        </Card>
      </div>



      {!isZoneUser && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Trophy className="h-5 w-5 text-emerald-600" /> Top Zones
            </CardTitle>
            <CardDescription>By achievement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(topZones || []).slice(0, 5).map((z, idx) => {
                if (!z) return null;
                return (
                  <div key={z.zoneId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">{idx + 1}</span>
                      <div>
                        <button className="font-medium text-slate-800 hover:underline" onClick={() => handleZoneDrill(z.zoneId)}>{z.zoneName}</button>
                        <div className="text-xs text-slate-500">{formatCrLakh(z.actual || 0)} / {formatCrLakh(z.target || 0)}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-600 text-emerald-700">{pct(z.achievement || 0)}%</Badge>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Users className="h-5 w-5 text-indigo-600" /> Top Users
            </CardTitle>
            <CardDescription>By achievement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(topUsers || []).slice(0, 5).map((u, idx) => {
                if (!u) return null;
                return (
                  <div key={u.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">{idx + 1}</span>
                      <div>
                        <div className="font-medium text-slate-800">{u.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{u.email || 'N/A'}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-indigo-600 text-indigo-700">{pct(u.achievement || 0)}%</Badge>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingDown className="h-5 w-5 text-rose-600" /> Biggest Gaps
            </CardTitle>
            <CardDescription>Variance to target</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(worstGaps || []).slice(0, 5).map((z) => {
                if (!z) return null;
                return (
                  <div key={z.zoneId} className="flex items-center justify-between">
                    <button className="font-medium text-slate-800 hover:underline text-left" onClick={() => handleZoneDrill(z.zoneId)}>{z.zoneName || 'Unknown'}</button>
                    <div className="text-rose-700" title={formatINRFull(Math.abs(z.variance || 0))}>-{formatCrLakh(Math.abs(z.variance || 0))}</div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
