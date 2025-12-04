'use client';

import { useEffect, useMemo, useState, Fragment } from 'react';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Loader2, Download, BarChart3, TrendingUp, MapPin, Package, Activity, Users } from 'lucide-react';
import { ForecastSummaryCards } from '@/components/forecast/ForecastSummaryCards';
import { ZonePerformanceChart } from '@/components/forecast/ZonePerformanceChart';
import { MonthlyTrendChart } from '@/components/forecast/MonthlyTrendChart';
import { ProductTypeAnalysis } from '@/components/forecast/ProductTypeAnalysis';
import { UserPerformanceAnalytics } from '@/components/forecast/UserPerformanceAnalytics';
import { EnhancedZonePerformanceAnalytics } from '@/components/forecast/EnhancedZonePerformanceAnalytics';
import { ProductTypeAnalytics } from '@/components/forecast/ProductTypeAnalytics';

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

const inr = (n: number) => `₹${(n / 10000000).toFixed(2)}Cr`;
const pct = (n: number) => `${n.toFixed(1)}%`;
const ZONE_ORDER = ['WEST', 'SOUTH', 'NORTH', 'EAST'];
const sortZones = (zones: ZoneInfo[]) => {
  const sorted = [...zones].sort((a, b) => {
    const aIdx = ZONE_ORDER.indexOf(a.name);
    const bIdx = ZONE_ORDER.indexOf(b.name);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });
  return sorted;
};

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
  const [downloading, setDownloading] = useState<boolean>(false);
  const [zones, setZones] = useState<ZoneInfo[]>([]);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [quarters, setQuarters] = useState<any[]>([]);
  const [productTotals, setProductTotals] = useState<{ productType: string; total: number }[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (y: number) => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes] = await Promise.all([
        apiService.getForecastSummary({ year: y }),
      ]);
      
      if (summaryRes.success && summaryRes.data) {
        setZones(summaryRes.data.zones || []);
        setMonthly(summaryRes.data.monthly || []);
        setTotals(summaryRes.data.totals || null);
        setQuarters(summaryRes.data.quarters || []);
        setProductTotals(summaryRes.data.productTypeTotals || []);
        setAnalytics(summaryRes.data.analytics || null);
      } else {
        setError('Failed to load forecast data');
      }
    } catch (err: any) {
      console.error('Forecast load error:', err);
      setError(err?.message || 'Failed to load forecast data');
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

  const downloadExcel = async () => {
    setDownloading(true);
    try {
      const blob = await apiService.exportForecastExcel({ year });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Forecast_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const zoneNames = useMemo(() => zones.map(z => z.name), [zones]);
  const quarterSummaries = useMemo(() => {
    const defs = [
      { label: 'Q1', months: [1, 2, 3] },
      { label: 'Q2', months: [4, 5, 6] },
      { label: 'Q3', months: [7, 8, 9] },
      { label: 'Q4', months: [10, 11, 12] },
    ];
    return defs.map((q, idx) => {
      const rows = monthly.filter(r => q.months.includes(r.month));
      const forecast = rows.reduce((s, r) => s + (Number(r.forecast) || 0), 0);
      const actual = rows.reduce((s, r) => s + (Number(r.mtdActual) || 0), 0);
      const euro = rows.reduce((s, r) => s + (Number(r.euro) || 0), 0);
      const variance = forecast - actual;
      const achievement = forecast > 0 ? (actual / forecast) * 100 : 0;
      const target = Number(quarters?.[idx]?.target || 0);
      const devPercent = Number(quarters?.[idx]?.devPercent || 0);
      return { label: q.label, endMonth: q.months[2], forecast, euro, actual, variance, achievement, target, devPercent };
    });
  }, [monthly, quarters]);
  const yearSummary = useMemo(() => {
    const forecast = monthly.reduce((s, r) => s + (Number(r.forecast) || 0), 0);
    const actual = monthly.reduce((s, r) => s + (Number(r.mtdActual) || 0), 0);
    const euro = monthly.reduce((s, r) => s + (Number(r.euro) || 0), 0);
    const variance = forecast - actual;
    const achievement = forecast > 0 ? (actual / forecast) * 100 : 0;
    return { forecast, euro, actual, variance, achievement };
  }, [monthly]);

  return (
    <div className="p-4 space-y-6 relative bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-blue-600" />
            Forecast Report {year}
          </h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive sales forecasting and performance analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm">
            <Calendar className="w-5 h-5 text-blue-600" />
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-semibold outline-none text-gray-700"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => load(year)} className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={downloadExcel} className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg">
            <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
            {downloading ? 'Downloading…' : 'Download Excel'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg font-medium text-gray-700">Loading forecast data...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl">
          <p className="font-medium">Error: {error}</p>
        </div>
      )}

      {/* Success State */}
      {!loading && !error && analytics && (
        <div className="space-y-8">
          {/* Executive Summary Dashboard */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Executive Summary</h2>
            </div>
            
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-bold text-blue-800">Total Offers</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.zonePerformance?.reduce((sum: number, zone: any) => sum + (zone.forecastOffers || 0), 0) || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Across all zones</div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-800">Total Value</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {inr(analytics.zonePerformance?.reduce((sum: number, zone: any) => sum + (zone.forecastValue || 0), 0) || 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Forecast value</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-bold text-purple-800">Achievement</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.zonePerformance?.length > 0 
                    ? (analytics.zonePerformance.reduce((sum: number, zone: any) => sum + zone.achievement, 0) / analytics.zonePerformance.length).toFixed(1)
                    : '0.0'}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Average achievement</div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">Balance BU</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {inr(analytics.zonePerformance?.reduce((sum: number, zone: any) => {
                    const buForBooking = (zone.forecastValue || 0) * 1.2;
                    const actualValue = zone.actualValue || 0;
                    return sum + Math.max(0, buForBooking - actualValue);
                  }, 0) || 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Remaining to target</div>
              </div>
            </div>

            {/* Zone Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.zonePerformance?.map((zone: any, index: number) => (
                <div key={zone.zoneName} className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-800">{zone.zoneName}</span>
                    <div className={`w-3 h-3 rounded-full ${
                      zone.achievement >= 100 ? 'bg-green-500' : 
                      zone.achievement >= 80 ? 'bg-amber-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Offers:</span>
                      <span className="font-bold text-blue-600">{zone.forecastOffers || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-bold text-blue-600">{inr(zone.forecastValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Achievement:</span>
                      <span className={`font-bold ${
                        zone.achievement >= 100 ? 'text-green-600' : 
                        zone.achievement >= 80 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {zone.achievement.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-bold text-indigo-600">
                        {inr(Math.max(0, (zone.forecastValue * 1.2) - zone.actualValue))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comprehensive Performance Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-amber-600" />
                <h2 className="text-2xl font-bold text-gray-900">Performance Overview</h2>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  ≥100% Excellent
                </span>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                  80-99% Good
                </span>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  &lt;80% Needs Attention
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-bold text-gray-800 border border-gray-300">Zone</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-800 border border-gray-300">Offers</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-800 border border-gray-300">Forecast Value</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-800 border border-gray-300">Orders Received</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-800 border border-gray-300">Open Funnel</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-800 border border-gray-300">BU Target</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-800 border border-gray-300">Achievement %</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-800 border border-gray-300">Balance BU</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.zonePerformance?.map((zone: any, zoneIndex: number) => (
                    <tr key={`${zone.zoneName}-${zoneIndex}`} className="border border-gray-300 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900 border border-gray-300">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            zone.achievement >= 100 ? 'bg-green-500' : 
                            zone.achievement >= 80 ? 'bg-amber-500' : 'bg-red-500'
                          }`}></div>
                          {zone.zoneName}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-blue-600 border border-gray-300">
                        {zone.forecastOffers || 0}
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-blue-600 border border-gray-300">
                        {inr(zone.forecastValue)}
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-green-600 border border-gray-300">
                        {inr(zone.actualValue)}
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-amber-600 border border-gray-300">
                        {inr(zone.forecastValue - zone.actualValue)}
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-gray-900 border border-gray-300">
                        {inr(zone.forecastValue * 1.2)}
                      </td>
                      <td className="text-right py-3 px-4 border border-gray-300">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          zone.achievement >= 100 ? 'text-green-700 bg-green-50' : 
                          zone.achievement >= 80 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
                        }`}>
                          {zone.achievement.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-indigo-600 border border-gray-300">
                        {inr(Math.max(0, (zone.forecastValue * 1.2) - zone.actualValue))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quarterly & Product Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quarterly Analysis */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Quarterly Analysis</h2>
              </div>
              <div className="space-y-4">
                {['Q1', 'Q2'].map((quarter, index) => (
                  <div key={quarter} className="bg-white border-2 border-gray-300 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-bold text-gray-800">{quarter}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (analytics.quarterlyBreakdown?.[index]?.achievement || 0) >= 100 ? 'bg-green-100 text-green-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {((analytics.quarterlyBreakdown?.[index]?.achievement || 0) - 100).toFixed(1)}% Dev
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Forecast:</span>
                        <div className="font-bold text-blue-600">
                          {inr(analytics.quarterlyBreakdown?.[index]?.forecastValue || 0)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">BU Target:</span>
                        <div className="font-bold text-gray-900">
                          {inr((analytics.quarterlyBreakdown?.[index]?.forecastValue || 0) * 1.2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Type Performance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900">Product Types</h2>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(analytics.forecastByProductType || {})
                  .sort(([,a], [,b]) => (b as any).value - (a as any).value)
                  .slice(0, 6)
                  .map(([productType, data]: [string, any], index: number) => (
                  <div key={productType} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-bold text-gray-800">{productType}</span>
                        <div className="text-xs text-gray-500">
                          {(data as any).count || 0} offers
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-600">
                          {inr((data as any).value)}
                        </div>
                        <div className="text-xs text-green-600">
                          {inr(analytics.actualByProductType?.[productType]?.value || 0)} actual
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Performance Highlights */}
          {analytics.userPerformance && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Top Performers</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.userPerformance
                  .sort((a: any, b: any) => b.achievement - a.achievement)
                  .slice(0, 6)
                  .map((user: any, index: number) => (
                  <div key={user.userName} className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-800">{user.userName}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.achievement >= 100 ? 'bg-green-100 text-green-800' :
                        user.achievement >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        #{index + 1}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Zone:</span>
                        <span className="font-bold text-gray-900">{user.zoneName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Achievement:</span>
                        <span className={`font-bold ${
                          user.achievement >= 100 ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          {user.achievement.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span className="font-bold text-blue-600">{inr(user.forecastValue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Analytics Charts */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
            </div>
            
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {analytics.zonePerformance && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Zone Performance Trends</h3>
                    <ZonePerformanceChart zonePerformance={analytics.zonePerformance} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Enhanced Zone Analytics</h3>
                    <EnhancedZonePerformanceAnalytics zonePerformance={analytics.zonePerformance} />
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {analytics.userPerformance && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">User Performance Analysis</h3>
                    <UserPerformanceAnalytics userPerformance={analytics.userPerformance} />
                  </div>
                )}
                {analytics && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Type Analytics</h3>
                    <ProductTypeAnalytics analytics={analytics} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Monthly Trends */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trend Analysis</h3>
              <MonthlyTrendChart monthlyData={monthly} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
