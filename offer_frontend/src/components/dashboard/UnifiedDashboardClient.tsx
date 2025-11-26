'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Area, ComposedChart
} from 'recharts'
import { 
  FileText, MapPin, Users, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  Loader2, Package, Activity, Eye, Percent, BarChart3, Calendar, Target,
  XCircle, Award, CheckCircle, Clock, Zap, ShoppingCart
} from 'lucide-react'
import { apiService } from '@/services/api'

interface DashboardStats {
  totalOffers: number
  activeOffers: number
  wonOffers: number
  lostOffers: number
  closedOffers: number
  totalValue: number
  wonValue: number
  avgOfferValue: number
  wonThisMonth: number
  wonLastMonth: number
  wonLastYear: number
  winRate: number
  conversionRate: number
  momGrowth: number
  yoyGrowth: number
  valueGrowth: number
  last7DaysOffers: number
  last30DaysOffers: number
  avgDealTime: number
  totalZones: number
  activeUsers: number
  wonValueThisMonth: number
  totalTargetValue: number
  targetAchievement: number
}

interface ProductTypePerformance {
  productType: string
  count: number
  value: number
  wonValue: number
  targetValue: number | null
  targetOfferCount: number | null
  achievement: number | null
}

interface DashboardData {
  stats: DashboardStats
  recentOffers: any[]
  offersByStage: Array<{ stage: string; count: number }>
  offersByZone: Array<{ name: string; offers: number; value: number }>
  offersByProductType: Array<{ productType: string; count: number; value: number }>
  topCustomers: Array<{ customer: string; count: number }>
  monthlyTrend: Array<{ month: string; offers: number; value: number }>
  productTypePerformance: ProductTypePerformance[]
  zoneProductTypeBreakdown: any[]
  zones: Array<{ id: number; name: string }>
  velocityMetrics: Array<{ stage: string; count: number; avgValue: number }>
  currentMonthTargets?: {
    period: string
    zones: Array<{ id: number; zoneId: number; zone: string; targetValue: number; targetOfferCount: number | null }>
    users: Array<{ id: number; userId: number; user: string; targetValue: number; targetOfferCount: number | null }>
    productTypes: Array<{ id: number; zoneId: number; zone: string; productType: string; targetValue: number; targetOfferCount: number | null }>
  }
  myOffersByStage?: Array<{ stage: string; count: number }>
  myOffersByProductType?: Array<{ productType: string; count: number; value: number }>
  myMonthlyTrend?: Array<{ month: string; offers: number; value: number }>
  myRecentOffers?: any[]
  myProductTypePerformance?: Array<{ productType: string; count: number; value: number; wonValue: number }>
  myTarget?: { period: string; targetValue: number; achievement: number; actualValue: number }
  myYearlyTarget?: { period: string; targetValue: number; achievement: number; actualValue: number }
  zoneTarget?: { zoneName: string; period: string; targetValue: number; achievement: number; actualValue: number }
  zoneYearlyTarget?: { zoneName: string; period: string; targetValue: number; achievement: number; actualValue: number }
}

interface UnifiedDashboardClientProps {
  mode: 'admin' | 'zoneManager' | 'zoneUser'
}

export default function UnifiedDashboardClient({ mode }: UnifiedDashboardClientProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [targetsSummary, setTargetsSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<'ALL' | 'LAST_7' | 'LAST_30' | 'THIS_MONTH'>('ALL')
  const [ptSortBy, setPtSortBy] = useState<'value' | 'count' | 'wonValue' | 'wonShare'>('value')
  const [ptSortDir, setPtSortDir] = useState<'desc' | 'asc'>('desc')
  const [heatmapView, setHeatmapView] = useState<'zone' | 'user'>('zone')

  const getDateParams = () => {
    const now = new Date()
    if (range === 'ALL') return {}
    if (range === 'LAST_7') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return { startDate: start.toISOString(), endDate: now.toISOString() }
    }
    if (range === 'LAST_30') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return { startDate: start.toISOString(), endDate: now.toISOString() }
    }
    if (range === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { startDate: start.toISOString(), endDate: now.toISOString() }
    }
    return {}
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const params = getDateParams()
        let dashData: any
        if (mode === 'admin') {
          dashData = await apiService.getAdminDashboard(params)
        } else if (mode === 'zoneManager') {
          dashData = await apiService.getZoneManagerDashboard(params)
        } else {
          dashData = await apiService.getZoneDashboard(params)
        }
        setDashboardData(dashData)

        // Optional targets summary (admin-only; others may 403)
        try {
          const ts = await apiService.getTargetsSummary()
          if (ts?.data) setTargetsSummary(ts.data)
        } catch {}
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err)
        if (err?.response?.status === 400 && err?.response?.data?.message) {
          setError(err.response.data.message)
        } else {
          setError('Failed to load dashboard data')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [range, mode])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'INITIAL': 'text-blue-600 bg-blue-50',
      'PROPOSAL_SENT': 'text-indigo-600 bg-indigo-50',
      'NEGOTIATION': 'text-purple-600 bg-purple-50',
      'FINAL_APPROVAL': 'text-amber-600 bg-amber-50',
      'PO_RECEIVED': 'text-cyan-600 bg-cyan-50',
      'ORDER_BOOKED': 'text-teal-600 bg-teal-50',
      'WON': 'text-green-600 bg-green-50',
      'LOST': 'text-red-600 bg-red-50',
    }
    return colors[stage] || 'text-gray-600 bg-gray-50'
  }

  const formatStage = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />
    return null
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const breakdown = dashboardData?.zoneProductTypeBreakdown || []
  const pivotByZone = Object.values((breakdown as any[]).reduce((acc: any, item: any) => {
    const key = item.zoneName
    if (!acc[key]) acc[key] = { zoneName: key }
    acc[key][item.productType || 'UNKNOWN'] = (item.value ? Number(item.value) : 0)
    return acc
  }, {} as Record<string, any>))

  const ALL_PRODUCT_TYPES = [
    'RELOCATION',
    'CONTRACT',
    'SPP',
    'UPGRADE_KIT',
    'SOFTWARE',
    'BD_CHARGES',
    'BD_SPARE',
    'MIDLIFE_UPGRADE',
    'RETROFIT_KIT',
  ]
  const offersByPT = dashboardData?.offersByProductType || []
  const perfByPT = dashboardData?.productTypePerformance || []
  const offersByPTMap = new Map((offersByPT as any[]).map((p: any) => [p.productType, p]))
  const perfByPTMap = new Map((perfByPT as any[]).map((p: any) => [p.productType, p]))
  const normalizedProductTypes = ALL_PRODUCT_TYPES.map((pt) => {
    const base: any = offersByPTMap.get(pt) || {}
    const perf: any = perfByPTMap.get(pt) || {}
    return {
      productType: pt,
      count: Number(base.count || 0),
      value: Number(base.value || 0),
      wonValue: Number(perf.wonValue || 0),
      targetValue: perf.targetValue != null ? Number(perf.targetValue) : null,
      targetOfferCount: perf.targetOfferCount ?? null,
      achievement: perf.achievement != null ? Number(perf.achievement) : null,
    }
  })
  const productTypesForStack: string[] = ALL_PRODUCT_TYPES
  const productStackColors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#84CC16', '#F97316']
  const productTypeColorMap = new Map<string, string>(productTypesForStack.map((pt, idx) => [pt, productStackColors[idx % productStackColors.length]]))
  const ptEnriched = normalizedProductTypes.map((p) => ({ ...p, wonShare: p.value > 0 ? p.wonValue / p.value : 0 }))
  const ptMaxValue = Math.max(0, ...ptEnriched.map((p) => Number(p.value || 0)))
  const ptMaxWon = Math.max(0, ...ptEnriched.map((p) => Number(p.wonValue || 0)))
  const getSortKey = (p: any) => {
    if (ptSortBy === 'wonShare') return p.wonShare
    return Number(p[ptSortBy] || 0)
  }
  const ptSorted = [...ptEnriched].sort((a, b) => {
    const av = getSortKey(a)
    const bv = getSortKey(b)
    return ptSortDir === 'desc' ? (bv - av) : (av - bv)
  })
  const toggleSort = (key: 'value' | 'count' | 'wonValue' | 'wonShare') => {
    if (ptSortBy === key) {
      setPtSortDir(ptSortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setPtSortBy(key)
      setPtSortDir('desc')
    }
  }
  const pivotMatrixData = (pivotByZone as any[]).map((row: any) => {
    const filled: any = { ...row }
    productTypesForStack.forEach((pt) => {
      if (filled[pt] == null) filled[pt] = 0
    })
    return filled
  })
  const backendZoneNames = (dashboardData?.zones || []).map(z => z.name)
  const DEFAULT_ZONES = ['North', 'South', 'East', 'West']
  const zoneNames = Array.from(new Set([...DEFAULT_ZONES, ...backendZoneNames]))
  const zoneColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#14B8A6']
  const zoneColorMap = new Map<string, string>(zoneNames.map((z, i) => [z, zoneColors[i % zoneColors.length]]))
  const existingZoneNames = new Set(pivotMatrixData.map((r: any) => String(r.zoneName).trim().toLowerCase()))
  const zeroRowFor = (name: string) => {
    const row: any = { zoneName: name }
    productTypesForStack.forEach((pt) => { row[pt] = 0 })
    return row
  }
  const ensuredMatrixData = [
    ...pivotMatrixData,
    ...zoneNames.filter(z => !existingZoneNames.has(String(z).trim().toLowerCase())).map(z => zeroRowFor(z))
  ]

  const getLast12Months = () => {
    const arr: { key: string; label: string }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('en-US', { month: 'short' })
      arr.push({ key, label })
    }
    return arr
  }

  const toShortMonthLabel = (raw: string): string | null => {
    if (!raw) return null
    const s = String(raw).trim()
    let d = new Date(s)
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-US', { month: 'short' })
    }
    const m = s.match(/^(\d{4})[-/](\d{1,2})$/)
    if (m) {
      d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, 1)
      return d.toLocaleString('en-US', { month: 'short' })
    }
    return s.slice(0, 3).charAt(0).toUpperCase() + s.slice(1, 3).toLowerCase()
  }

  const RenderMonthTick = (props: any) => {
    const { x, y, payload } = props
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="#64748b" fontSize={12} transform="rotate(-35)">{payload.value}</text>
      </g>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">{error || 'No data available'}</p>
        </div>
      </div>
    )
  }

  const { stats } = dashboardData
  const isZoneUser = mode === 'zoneUser'
  const statsAny: any = (dashboardData as any)?.stats || {}
  const myWinRate = (statsAny.myOffers || 0) > 0 ? (Number(statsAny.myWonOffers || 0) / Number(statsAny.myOffers || 0)) * 100 : 0
  const myTotalValue = (statsAny.myOffers || 0) > 0 ? (Number(statsAny.myWonValue || 0) + Number(statsAny.myActiveValue || 0)) : 0
  const myAvgOfferValue = (statsAny.myOffers || 0) > 0 ? (Number(statsAny.myWonValue || 0) / Number(statsAny.myWonOffers || 1)) : 0
  const recentOffersData = isZoneUser ? (((dashboardData as any)?.myRecentOffers) || []) : (dashboardData?.recentOffers || [])
  const conversionRateDisplay = isZoneUser
    ? (typeof (stats as any)?.conversionRate === 'number' && (stats as any).conversionRate > 0
        ? (stats as any).conversionRate
        : myWinRate)
    : stats.conversionRate

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
            </div>
            <p className="text-slate-600 text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-time insights and performance metrics
            </p>
          </div>
        </div>

        {/* Overall Performance */}
        <Card className="group overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-violet-50 via-white to-indigo-50 hover:from-violet-50 hover:to-indigo-100 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="bg-transparent border-b border-violet-100">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Overall Performance</h3>
                  <p className="text-slate-600 text-sm flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    All-time totals across offers and value
                  </p>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <div className="text-5xl lg:text-6xl font-extrabold mb-1 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{formatCurrency(isZoneUser ? Number(statsAny.myWonValueThisMonth || 0) : stats.wonValue)}</div>
                <div className="flex items-center justify-center lg:justify-end gap-2 text-slate-600">
                  <DollarSign className="h-4 w-4 text-violet-500" />
                  <p className="text-sm font-medium">Total Won Value</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="group/card rounded-xl p-5 bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 hover:bg-emerald-50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-emerald-100 rounded-lg group-hover/card:scale-110 transition-transform duration-300">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-emerald-700 text-sm font-semibold uppercase tracking-wide">Total Won Value</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{formatCurrency(isZoneUser ? Number(statsAny.myWonValueThisMonth || 0) : stats.wonValue)}</p>
                <p className="text-xs text-emerald-600 font-medium">{isZoneUser ? (statsAny.myWonOffers || 0) : stats.wonOffers} offers won</p>
                <div className="h-1 w-full bg-emerald-100 rounded-full overflow-hidden mt-3">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                    style={{ width: `${Math.min(100, (Number(isZoneUser ? (statsAny.myWonOffers || 0) : stats.wonOffers) / Number(isZoneUser ? (statsAny.myOffers || 1) : (stats.totalOffers || 1))) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="group/card rounded-xl p-5 bg-gradient-to-br from-amber-50 to-amber-50/50 border border-amber-100 hover:border-amber-300 hover:shadow-lg transition-all duration-300 hover:bg-amber-50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-amber-100 rounded-lg group-hover/card:scale-110 transition-transform duration-300">
                    <Target className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-amber-700 text-sm font-semibold uppercase tracking-wide">Total Offers</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{isZoneUser ? (statsAny.myOffers || 0) : stats.totalOffers}</p>
                <p className="text-xs text-amber-600 font-medium">in system</p>
                <div className="h-1 w-full bg-amber-100 rounded-full overflow-hidden mt-3">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="group/card rounded-xl p-5 bg-gradient-to-br from-teal-50 to-teal-50/50 border border-teal-100 hover:border-teal-300 hover:shadow-lg transition-all duration-300 hover:bg-teal-50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-teal-100 rounded-lg group-hover/card:scale-110 transition-transform duration-300">
                    <DollarSign className="h-5 w-5 text-teal-600" />
                  </div>
                  <p className="text-teal-700 text-sm font-semibold uppercase tracking-wide">Pipeline Value</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{formatCurrency(isZoneUser ? myTotalValue : stats.totalValue)}</p>
                <p className="text-xs text-teal-600 font-medium">{isZoneUser ? 'Your pipeline' : 'Active pipeline'}</p>
                <div className="h-1 w-full bg-teal-100 rounded-full overflow-hidden mt-3">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="group/card rounded-xl p-5 bg-gradient-to-br from-cyan-50 to-cyan-50/50 border border-cyan-100 hover:border-cyan-300 hover:shadow-lg transition-all duration-300 hover:bg-cyan-50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-cyan-100 rounded-lg group-hover/card:scale-110 transition-transform duration-300">
                    <Percent className="h-5 w-5 text-cyan-600" />
                  </div>
                  <p className="text-cyan-700 text-sm font-semibold uppercase tracking-wide">Win Rate</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{isZoneUser ? ((statsAny.myOffers || 0) === 0 ? 'N/A' : `${myWinRate.toFixed(1)}%`) : (stats.closedOffers === 0 ? 'N/A' : `${stats.winRate.toFixed(1)}%`)}</p>
                <p className="text-xs text-cyan-600 font-medium">{isZoneUser ? `${statsAny.myWonOffers || 0}W` : `${stats.wonOffers}W / ${stats.lostOffers}L`}</p>
                <div className="h-1 w-full bg-cyan-100 rounded-full overflow-hidden mt-3">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"
                    style={{ width: `${isZoneUser ? Math.min(100, myWinRate) : stats.winRate}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 via-white to-purple-50 hover:from-purple-50 hover:to-purple-100 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-5 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Conversion Rate</p>
                      <p className="text-3xl font-bold text-slate-900">{conversionRateDisplay.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-purple-100 rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                      style={{ width: `${Math.min(100, conversionRateDisplay)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 hover:from-indigo-50 hover:to-indigo-100 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-5 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Avg Deal Size</p>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(isZoneUser ? myAvgOfferValue : stats.avgOfferValue)}</p>
                    </div>
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <ShoppingCart className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-cyan-50 via-white to-cyan-50 hover:from-cyan-50 hover:to-cyan-100 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-5 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wide mb-1">Total Offers</p>
                      <p className="text-3xl font-bold text-slate-900">{isZoneUser ? (statsAny.myOffers || 0) : stats.totalOffers}</p>
                    </div>
                    <div className="p-3 bg-cyan-100 rounded-xl">
                      <FileText className="h-6 w-6 text-cyan-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!isZoneUser && (
                <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 via-white to-green-50 hover:from-green-50 hover:to-green-100 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-5 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Active Zones</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.totalZones}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-xl">
                        <MapPin className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isZoneUser && (
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Active Users</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.activeUsers}</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-xl">
                        <Users className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Zone Targets (Zone User only) - Monthly & Yearly */}
        {isZoneUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Zone Monthly Target Card */}
              {(dashboardData as any)?.zoneTarget && (
                <Card className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 via-white to-cyan-50 hover:from-blue-50 hover:to-cyan-100 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="bg-transparent border-b border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{(dashboardData as any)?.zoneTarget?.zoneName} Zone - Monthly</h3>
                        <p className="text-xs text-slate-600">{(dashboardData as any)?.zoneTarget?.period}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 relative">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Target</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency((dashboardData as any).zoneTarget?.targetValue || 0)}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-4">
                          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Actual</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency((dashboardData as any).zoneTarget?.actualValue || 0)}</p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-slate-700">Achievement</p>
                          <span className={`text-lg font-bold ${((dashboardData as any).zoneTarget?.achievement || 0) >= 100 ? 'text-green-600' : ((dashboardData as any).zoneTarget?.achievement || 0) >= 80 ? 'text-emerald-600' : ((dashboardData as any).zoneTarget?.achievement || 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{(Number((dashboardData as any).zoneTarget?.achievement || 0)).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Number((dashboardData as any).zoneTarget?.achievement || 0))}%` }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {(dashboardData as any)?.zoneYearlyTarget && (
                <Card className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-emerald-50 via-white to-green-50 hover:from-emerald-50 hover:to-green-100 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="bg-transparent border-b border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{(dashboardData as any)?.zoneYearlyTarget?.zoneName} Zone - Annual</h3>
                        <p className="text-xs text-slate-600">{(dashboardData as any)?.zoneYearlyTarget?.period}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 relative">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 rounded-lg p-4">
                          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Target</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency((dashboardData as any).zoneYearlyTarget?.targetValue || 0)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Actual</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency((dashboardData as any).zoneYearlyTarget?.actualValue || 0)}</p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-slate-700">Achievement</p>
                          <span className={`text-lg font-bold ${((dashboardData as any).zoneYearlyTarget?.achievement || 0) >= 100 ? 'text-green-600' : ((dashboardData as any).zoneYearlyTarget?.achievement || 0) >= 80 ? 'text-emerald-600' : ((dashboardData as any).zoneYearlyTarget?.achievement || 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{(Number((dashboardData as any).zoneYearlyTarget?.achievement || 0)).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Number((dashboardData as any).zoneYearlyTarget?.achievement || 0))}%` }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {!(dashboardData as any)?.zoneTarget && !(dashboardData as any)?.zoneYearlyTarget && (
                <Card className="col-span-full border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardContent className="p-8 text-center">
                    <Target className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No zone targets set for this period</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* My Targets (Zone User only) - Monthly & Yearly */}
        {isZoneUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Monthly Target Card */}
              {(dashboardData as any)?.myTarget && (
                <Card className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 via-white to-cyan-50 hover:from-blue-50 hover:to-cyan-100 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="bg-transparent border-b border-blue-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">My Monthly Target</h3>
                          <p className="text-xs text-slate-600">{(dashboardData as any)?.myTarget?.period}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 relative">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Target</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency((dashboardData as any).myTarget?.targetValue || 0)}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-4">
                          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Actual</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency((dashboardData as any).myTarget?.actualValue || 0)}</p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-slate-700">Achievement</p>
                          <span className={`text-lg font-bold ${
                            ((dashboardData as any).myTarget?.achievement || 0) >= 100 ? 'text-green-600' :
                            ((dashboardData as any).myTarget?.achievement || 0) >= 80 ? 'text-emerald-600' :
                            ((dashboardData as any).myTarget?.achievement || 0) >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {(Number((dashboardData as any).myTarget?.achievement || 0)).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Number((dashboardData as any).myTarget?.achievement || 0))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Yearly Target Card */}
              {(dashboardData as any)?.myYearlyTarget && (
                <Card className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-emerald-50 via-white to-green-50 hover:from-emerald-50 hover:to-green-100 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="bg-transparent border-b border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">My Annual Target</h3>
                          <p className="text-xs text-slate-600">{(dashboardData as any)?.myYearlyTarget?.period}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 relative">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 rounded-lg p-4">
                          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Target</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency((dashboardData as any).myYearlyTarget?.targetValue || 0)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Actual</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency((dashboardData as any).myYearlyTarget?.actualValue || 0)}</p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-slate-700">Achievement</p>
                          <span className={`text-lg font-bold ${
                            ((dashboardData as any).myYearlyTarget?.achievement || 0) >= 100 ? 'text-green-600' :
                            ((dashboardData as any).myYearlyTarget?.achievement || 0) >= 80 ? 'text-emerald-600' :
                            ((dashboardData as any).myYearlyTarget?.achievement || 0) >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {(Number((dashboardData as any).myYearlyTarget?.achievement || 0)).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Number((dashboardData as any).myYearlyTarget?.achievement || 0))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {!(dashboardData as any)?.myTarget && !(dashboardData as any)?.myYearlyTarget && (
                <Card className="col-span-full border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardContent className="p-8 text-center">
                    <Target className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No personal targets set for this period</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Target Summary (Admin/Zone Manager only) */}
        {mode !== 'zoneUser' && targetsSummary && (
          <div className="space-y-6">
            {/* Monthly & Yearly Target Cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Monthly Target Card */}
              <Card className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 via-white to-cyan-50 hover:from-blue-50 hover:to-cyan-100 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="bg-transparent border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Monthly Target</h3>
                        <p className="text-xs text-slate-600">{targetsSummary.currentMonth?.period}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 relative">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Target</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(targetsSummary.currentMonth?.totalTargetValue || 0)}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4">
                        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Actual</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(targetsSummary.currentMonth?.totalActualValue || 0)}</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-slate-700">Achievement</p>
                        <span className={`text-lg font-bold ${
                          (targetsSummary.currentMonth?.achievement || 0) >= 100 ? 'text-green-600' :
                          (targetsSummary.currentMonth?.achievement || 0) >= 80 ? 'text-emerald-600' :
                          (targetsSummary.currentMonth?.achievement || 0) >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {(targetsSummary.currentMonth?.achievement || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, targetsSummary.currentMonth?.achievement || 0)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-2">{targetsSummary.currentMonth?.totalOfferCount || 0} offers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Yearly Target Card */}
              <Card className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-emerald-50 via-white to-green-50 hover:from-emerald-50 hover:to-green-100 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="bg-transparent border-b border-emerald-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Annual Target</h3>
                        <p className="text-xs text-slate-600">{targetsSummary.currentYear?.period}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 relative">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-lg p-4">
                        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Target</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(targetsSummary.currentYear?.totalTargetValue || 0)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Actual</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(targetsSummary.currentYear?.totalActualValue || 0)}</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-slate-700">Achievement</p>
                        <span className={`text-lg font-bold ${
                          (targetsSummary.currentYear?.achievement || 0) >= 100 ? 'text-green-600' :
                          (targetsSummary.currentYear?.achievement || 0) >= 80 ? 'text-emerald-600' :
                          (targetsSummary.currentYear?.achievement || 0) >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {(targetsSummary.currentYear?.achievement || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, targetsSummary.currentYear?.achievement || 0)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-2">{targetsSummary.currentYear?.totalOfferCount || 0} offers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Heatmap */}
            {targetsSummary.byZone && targetsSummary.byZone.length > 0 && (
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Performance Heatmap</CardTitle>
                        <CardDescription className="text-base mt-1">
                          {heatmapView === 'zone' 
                            ? 'Monthly & Yearly target achievement across all zones' 
                            : 'Zone-wise user performance metrics'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const allowUserView = true
                        return (
                          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                            <button
                              onClick={() => setHeatmapView('zone')}
                              className={`px-4 py-2 rounded-md font-medium transition-all ${
                                heatmapView === 'zone'
                                  ? 'bg-white text-purple-600 shadow-md'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              📍 Zone-wise
                            </button>
                            {allowUserView && (
                              <button
                                onClick={() => setHeatmapView('user')}
                                className={`px-4 py-2 rounded-md font-medium transition-all ${
                                  heatmapView === 'user'
                                    ? 'bg-white text-purple-600 shadow-md'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                👥 User-wise
                              </button>
                            )}
                          </div>
                        )
                      })()}
                      {(() => {
                        const zoneIdSet = new Set((dashboardData?.zones || []).map(z => z.id))
                        const zoneNameSet = new Set((dashboardData?.zones || []).map(z => String(z.name).trim().toLowerCase()))
                        const byZoneSource = targetsSummary.byZone || []
                        const displayByZone = mode === 'admin' ? byZoneSource : byZoneSource.filter((z: any) => zoneIdSet.has(z.zoneId) || zoneNameSet.has(String(z.zoneName).trim().toLowerCase()))
                        const usersByZoneSource = targetsSummary.usersByZone || []
                        const displayUsersByZone = (mode === 'admin' || mode === 'zoneManager')
                          ? usersByZoneSource.filter((zb: any) => zoneIdSet.has(zb.zoneId) || zoneNameSet.has(String(zb.zoneName).trim().toLowerCase()))
                          : []
                        const count = heatmapView === 'zone' ? displayByZone.length : displayUsersByZone.reduce((sum: number, zb: any) => sum + (zb.users?.length || 0), 0)
                        const label = heatmapView === 'zone' ? 'zones' : 'users'
                        return (
                          <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                            {count} {label}
                          </span>
                        )
                      })()}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Column Headers */}
                    <div className="grid grid-cols-12 gap-3 mb-4 px-4">
                      <div className="col-span-2">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{heatmapView === 'zone' ? 'Zone' : 'User'}</p>
                      </div>
                      <div className="col-span-5">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">📅 Monthly Progress</p>
                      </div>
                      <div className="col-span-5">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">📈 Yearly Progress</p>
                      </div>
                    </div>

                    {(() => {
                      const zoneIdSet = new Set((dashboardData?.zones || []).map(z => z.id))
                      const zoneNameSet = new Set((dashboardData?.zones || []).map(z => String(z.name).trim().toLowerCase()))
                      const byZoneSource = targetsSummary.byZone || []
                      const displayByZone = mode === 'admin' ? byZoneSource : byZoneSource.filter((z: any) => zoneIdSet.has(z.zoneId) || zoneNameSet.has(String(z.zoneName).trim().toLowerCase()))
                      if (!(heatmapView === 'zone')) return null
                      return displayByZone.map((zone: any) => {
                        const monthlyAch = Math.min(100, (zone.monthlyActual / (zone.monthlyTarget || 1)) * 100)
                        const yearlyAch = Math.min(100, (zone.yearlyActual / (zone.yearlyTarget || 1)) * 100)

                        const getAchievementColor = (achievement: number) => {
                          if (achievement >= 100) return 'from-green-400 to-emerald-500'
                          if (achievement >= 80) return 'from-emerald-400 to-teal-500'
                          if (achievement >= 60) return 'from-amber-400 to-orange-500'
                          return 'from-red-400 to-rose-500'
                        }

                        const getAchievementBg = (achievement: number) => {
                          if (achievement >= 100) return 'bg-green-50 border-green-100'
                          if (achievement >= 80) return 'bg-emerald-50 border-emerald-100'
                          if (achievement >= 60) return 'bg-amber-50 border-amber-100'
                          return 'bg-red-50 border-red-100'
                        }

                        const getStatusEmoji = (achievement: number) => {
                          if (achievement >= 100) return '✨'
                          if (achievement >= 80) return '🎯'
                          if (achievement >= 60) return '⚠️'
                          return '❌'
                        }

                        return (
                          <div key={zone.zoneId} className={`group grid grid-cols-12 gap-3 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${getAchievementBg(monthlyAch)}`}>
                            {/* Zone Name */}
                            <div className="col-span-2 flex items-center">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getAchievementColor(monthlyAch)}`} />
                                <span className="font-bold text-slate-900">{zone.zoneName}</span>
                              </div>
                            </div>

                            {/* Monthly Progress */}
                            <div className="col-span-5 flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(zone.monthlyTarget)} → {formatCurrency(zone.monthlyActual)}</span>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-lg font-bold ${monthlyAch >= 100 ? 'text-green-600' : monthlyAch >= 80 ? 'text-emerald-600' : monthlyAch >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {monthlyAch.toFixed(1)}%
                                      </span>
                                      <div className={`w-2 h-2 rounded-full ${monthlyAch >= 100 ? 'bg-green-500' : monthlyAch >= 80 ? 'bg-emerald-500' : monthlyAch >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                    </div>
                                  </div>
                                  <span className="text-xl">{getStatusEmoji(monthlyAch)}</span>
                                </div>
                                <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full bg-gradient-to-r ${getAchievementColor(monthlyAch)} transition-all duration-500`}
                                    style={{ width: `${monthlyAch}%` }}
                                  />
                                  <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-md transition-all duration-500"
                                    style={{ 
                                      left: `${monthlyAch}%`,
                                      borderColor: monthlyAch >= 100 ? '#16a34a' : monthlyAch >= 80 ? '#10b981' : monthlyAch >= 60 ? '#f59e0b' : '#ef4444',
                                      transform: 'translate(-50%, -50%)',
                                      opacity: 0.25
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{zone.monthlyOfferCount} offers • {zone.monthlyAchievement?.toFixed?.(1)}% achievement</p>
                              </div>
                            </div>

                            {/* Yearly Progress */}
                            <div className="col-span-5 flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(zone.yearlyTarget)} → {formatCurrency(zone.yearlyActual)}</span>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-lg font-bold ${yearlyAch >= 100 ? 'text-green-600' : yearlyAch >= 80 ? 'text-emerald-600' : yearlyAch >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {yearlyAch.toFixed(1)}%
                                      </span>
                                      <div className={`w-2 h-2 rounded-full ${yearlyAch >= 100 ? 'bg-green-500' : yearlyAch >= 80 ? 'bg-emerald-500' : yearlyAch >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                    </div>
                                  </div>
                                  <span className="text-xl">{getStatusEmoji(yearlyAch)}</span>
                                </div>
                                <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full bg-gradient-to-r ${getAchievementColor(yearlyAch)} transition-all duration-500`}
                                    style={{ width: `${yearlyAch}%` }}
                                  />
                                  <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-md transition-all duration-500"
                                    style={{ 
                                      left: `${yearlyAch}%`,
                                      borderColor: yearlyAch >= 100 ? '#16a34a' : yearlyAch >= 80 ? '#10b981' : yearlyAch >= 60 ? '#f59e0b' : '#ef4444',
                                      transform: 'translate(-50%, -50%)',
                                      opacity: 0.25
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{zone.yearlyOfferCount} offers • {zone.yearlyAchievement?.toFixed?.(1)}% achievement</p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })()}

                    {(() => {
                      const zoneIdSet = new Set((dashboardData?.zones || []).map(z => z.id))
                      const zoneNameSet = new Set((dashboardData?.zones || []).map(z => String(z.name).trim().toLowerCase()))
                      const usersByZoneSource = targetsSummary?.usersByZone || []
                      const displayUsersByZone = (mode === 'admin' || mode === 'zoneManager')
                        ? usersByZoneSource.filter((zb: any) => zoneIdSet.has(zb.zoneId) || zoneNameSet.has(String(zb.zoneName).trim().toLowerCase()))
                        : []
                      if (!(heatmapView === 'user') || displayUsersByZone.length === 0) return null
                      return displayUsersByZone.map((zoneData: any) => {
                        return zoneData.users?.map((user: any) => {
                          const monthlyAch = user.monthlyTarget > 0 ? user.monthlyAchievement : 0
                          const yearlyAch = user.yearlyTarget > 0 ? user.yearlyAchievement : 0

                          const getAchievementColor = (achievement: number) => {
                            if (achievement >= 100) return 'from-green-400 to-emerald-500'
                            if (achievement >= 80) return 'from-emerald-400 to-teal-500'
                            if (achievement >= 60) return 'from-amber-400 to-orange-500'
                            return 'from-red-400 to-rose-500'
                          }

                          const getAchievementBg = (achievement: number) => {
                            if (achievement >= 100) return 'bg-green-50 border-green-100'
                            if (achievement >= 80) return 'bg-emerald-50 border-emerald-100'
                            if (achievement >= 60) return 'bg-amber-50 border-amber-100'
                            return 'bg-red-50 border-red-100'
                          }

                          const getStatusEmoji = (achievement: number) => {
                            if (achievement >= 100) return '✨'
                            if (achievement >= 80) return '🎯'
                            if (achievement >= 60) return '⚠️'
                            return '❌'
                          }

                          return (
                            <div key={`${zoneData.zoneId}-${user.userId}`} className={`group grid grid-cols-12 gap-3 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${getAchievementBg(monthlyAch)}`}>
                              {/* User Name */}
                              <div className="col-span-2 flex items-center">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getAchievementColor(monthlyAch)}`} />
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm">{user.userName}</p>
                                    <p className="text-xs text-slate-600">{zoneData.zoneName}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Monthly Progress */}
                              <div className="col-span-5 flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-slate-700">{formatCurrency(user.monthlyTarget)} → {formatCurrency(user.monthlyActual)}</span>
                                      <div className="flex items-center gap-1">
                                        <span className={`text-lg font-bold ${monthlyAch >= 100 ? 'text-green-600' : monthlyAch >= 80 ? 'text-emerald-600' : monthlyAch >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                          {monthlyAch.toFixed(1)}%
                                        </span>
                                        <div className={`w-2 h-2 rounded-full ${monthlyAch >= 100 ? 'bg-green-500' : monthlyAch >= 80 ? 'bg-emerald-500' : monthlyAch >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                      </div>
                                    </div>
                                    <span className="text-xl">{getStatusEmoji(monthlyAch)}</span>
                                  </div>
                                  <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full bg-gradient-to-r ${getAchievementColor(monthlyAch)} transition-all duration-500`}
                                      style={{ width: `${Math.min(100, monthlyAch)}%` }}
                                    />
                                    <div 
                                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-md transition-all duration-500"
                                      style={{ 
                                        left: `${Math.min(100, monthlyAch)}%`,
                                        borderColor: monthlyAch >= 100 ? '#16a34a' : monthlyAch >= 80 ? '#10b981' : monthlyAch >= 60 ? '#f59e0b' : '#ef4444',
                                        transform: 'translate(-50%, -50%)',
                                        opacity: 0.25
                                      }}
                                    />
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1">{user.monthlyOfferCount} offers</p>
                                </div>
                              </div>

                              {/* Yearly Progress */}
                              <div className="col-span-5 flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-slate-700">{formatCurrency(user.yearlyTarget)} → {formatCurrency(user.yearlyActual)}</span>
                                      <div className="flex items-center gap-1">
                                        <span className={`text-lg font-bold ${yearlyAch >= 100 ? 'text-green-600' : yearlyAch >= 80 ? 'text-emerald-600' : yearlyAch >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                          {yearlyAch.toFixed(1)}%
                                        </span>
                                        <div className={`w-2 h-2 rounded-full ${yearlyAch >= 100 ? 'bg-green-500' : yearlyAch >= 80 ? 'bg-emerald-500' : yearlyAch >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                      </div>
                                    </div>
                                    <span className="text-xl">{getStatusEmoji(yearlyAch)}</span>
                                  </div>
                                  <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full bg-gradient-to-r ${getAchievementColor(yearlyAch)} transition-all duration-500`}
                                      style={{ width: `${Math.min(100, yearlyAch)}%` }}
                                    />
                                    <div 
                                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-md transition-all duration-500"
                                      style={{ 
                                        left: `${Math.min(100, yearlyAch)}%`,
                                        borderColor: yearlyAch >= 100 ? '#16a34a' : yearlyAch >= 80 ? '#10b981' : yearlyAch >= 60 ? '#f59e0b' : '#ef4444',
                                        transform: 'translate(-50%, -50%)',
                                        opacity: 0.25
                                      }}
                                    />
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1">{user.yearlyOfferCount} offers • {user.userEmail}</p>
                                </div>
                              </div>
                            </div>
                          )
                        }) || []
                      }).flat()
                    })()}

                    {heatmapView === 'user' && (!targetsSummary?.usersByZone || targetsSummary.usersByZone.length === 0 || targetsSummary.usersByZone.every((z: any) => !z.users || z.users.length === 0)) && (
                      <div className="text-center py-8">
                        <p className="text-slate-600">No user targets data available</p>
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap gap-4 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500" />
                      <span className="text-sm font-medium text-slate-700">✨ Exceeding (≥100%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                      <span className="text-sm font-medium text-slate-700">🎯 On Track (≥80%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                      <span className="text-sm font-medium text-slate-700">⚠️ Needs Attention (≥60%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-rose-500" />
                      <span className="text-sm font-medium text-slate-700">❌ Below Target (&lt;60%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Type Performance */}
            {(dashboardData?.productTypePerformance?.length ?? 0) > 0 && (
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-white border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2 bg-violet-600 rounded-xl">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        Product Type Performance
                      </CardTitle>
                      <CardDescription className="mt-2 text-base">
                        All-time performance by product type
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-slate-700">
                          <th className="px-3 py-2 font-semibold">Product Type</th>
                          <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('count')}>Offers</th>
                          <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('value')}>Total Value</th>
                          <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('wonValue')}>Won Value</th>
                          <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('wonShare')}>Won Share%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ptSorted.map((p) => {
                          const color = productTypeColorMap.get(p.productType) || '#8B5CF6'
                          const valuePct = ptMaxValue > 0 ? Math.round((p.value / ptMaxValue) * 100) : 0
                          const wonPct = ptMaxWon > 0 ? Math.round((p.wonValue / ptMaxWon) * 100) : 0
                          return (
                            <tr key={p.productType} className="align-middle">
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                                  <span className="font-medium text-slate-900">{p.productType}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3">{p.count}</td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-2 rounded-full" style={{ width: `${valuePct}%`, backgroundColor: color }} />
                                  </div>
                                  <span className="tabular-nums font-medium">{formatCurrency(p.value)}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-2 rounded-full" style={{ width: `${wonPct}%`, backgroundColor: color }} />
                                  </div>
                                  <span className="tabular-nums">{formatCurrency(p.wonValue)}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold`} style={{ color: color, backgroundColor: `${color}22` }}>
                                  {(p.wonShare * 100).toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Charts Row */}
        {mode !== 'zoneUser' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Stage Distribution Pie Chart */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                Offer Stage Distribution
              </CardTitle>
              <CardDescription className="text-base">
                Breakdown of offers by current stage
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart margin={{ top: 0, right: 0, bottom: 60, left: 0 }}>
                  <Pie
                    data={(dashboardData?.offersByStage || []).map(s => ({
                      name: formatStage(s.stage),
                      value: s.count,
                      color: s.stage === 'WON' ? '#10B981' : s.stage === 'LOST' ? '#EF4444' : '#3B82F6'
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    paddingAngle={2}
                    outerRadius={105}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(dashboardData?.offersByStage || []).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.stage === 'WON' ? '#10B981' : entry.stage === 'LOST' ? '#EF4444' : entry.stage === 'NEGOTIATION' ? '#8B5CF6' : entry.stage === 'PROPOSAL_SENT' ? '#3B82F6' : '#6366F1'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '12px', 
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Zone Performance Bar Chart */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                Zone Performance
              </CardTitle>
              <CardDescription className="text-base">
                Offer value by zone
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dashboardData?.offersByZone || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Value']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '12px', 
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {(dashboardData?.offersByZone || []).map((entry: any, idx: number) => (
                      <Cell key={`zone-cell-${entry.name}-${idx}`} fill={zoneColorMap.get(entry.name) || '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        )}

        {isZoneUser && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* My Stage Distribution Pie Chart */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                Offer Stage Distribution
              </CardTitle>
              <CardDescription className="text-base">
                Breakdown of offers by current stage
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart margin={{ top: 0, right: 0, bottom: 60, left: 0 }}>
                  <Pie
                    data={((((dashboardData as any)?.myOffersByStage) || []) as any[]).map((s: any) => ({
                      name: formatStage(s.stage),
                      value: s.count,
                      color: s.stage === 'WON' ? '#10B981' : s.stage === 'LOST' ? '#EF4444' : '#3B82F6'
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    paddingAngle={2}
                    outerRadius={105}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {((((dashboardData as any)?.myOffersByStage) || []) as any[]).map((entry: any, index: number) => (
                      <Cell 
                        key={`my-cell-${index}`} 
                        fill={entry.stage === 'WON' ? '#10B981' : entry.stage === 'LOST' ? '#EF4444' : entry.stage === 'NEGOTIATION' ? '#8B5CF6' : entry.stage === 'PROPOSAL_SENT' ? '#3B82F6' : '#6366F1'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '12px', 
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* My 12-Month Offers Trend */}
          {(() => {
            const last12 = getLast12Months()
            const trendMap = new Map<string, { offers: number; value: number }>()
            ;((((dashboardData as any)?.myMonthlyTrend) || []) as any[]).forEach((m: any) => {
              const label = toShortMonthLabel(m.month)
              if (!label) return
              trendMap.set(label, { offers: Number(m.offers || 0), value: Number(m.value || 0) })
            })
            const normalizedMonthlyTrend = last12.map(m => {
              const item = trendMap.get(m.label)
              return { month: m.label, offers: item?.offers || 0, value: item?.value || 0 }
            })
            return (
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-white border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 bg-cyan-600 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    12-Month Offers & Revenue Trend
                  </CardTitle>
                  <CardDescription className="text-base">
                    Personal offers and revenue trend
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={normalizedMonthlyTrend} margin={{ bottom: 20, left: 10, right: 10 }}>
                      <defs>
                        <linearGradient id="colorOffersUser" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorValueUser" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        interval={0}
                        minTickGap={0}
                        tickMargin={12}
                        tick={<RenderMonthTick />}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={{ stroke: '#cbd5e1' }}
                        height={80}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={{ stroke: '#cbd5e1' }}
                        tickFormatter={(value) => `₹${(Number(value) / 100000).toFixed(0)}L`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                          borderRadius: '12px', 
                          border: 'none',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                          padding: '12px'
                        }}
                        labelStyle={{ fontWeight: 700, fontSize: '13px', color: '#1e293b', marginBottom: '6px' }}
                        formatter={(value: any, name: string) => {
                          if (name === 'value') {
                            return [formatCurrency(Number(value)), 'Revenue']
                          }
                          return [value, 'Offers']
                        }}
                      />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="offers" 
                        stroke="#06B6D4" 
                        strokeWidth={3}
                        fill="url(#colorOffersUser)"
                        name="Offers Count"
                        dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                      />
                      <Area 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8B5CF6" 
                        strokeWidth={3}
                        fill="url(#colorValueUser)"
                        name="Revenue Value"
                        dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )
          })()}
        </div>
        )}

        {/* Zone × Product Type Breakdown (Stacked) */}
        {mode !== 'zoneUser' && pivotByZone.length > 0 && productTypesForStack.length > 0 && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                Zone × Product Type Mix
              </CardTitle>
              <CardDescription className="text-base">
                Stacked breakdown of offer value by product type
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={ensuredMatrixData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="zoneName" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tickFormatter={(value) => `₹${(Number(value) / 100000).toFixed(0)}L`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Value']}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                  />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                  {productTypesForStack.map((pt, idx) => (
                    <Bar 
                      key={pt} 
                      dataKey={pt} 
                      name={pt.replace(/_/g, ' ')} 
                      stackId="a" 
                      fill={productStackColors[idx % productStackColors.length]} 
                      radius={[6,6,0,0]} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {isZoneUser && (() => {
          const myPerf: any[] = ((((dashboardData as any)?.myProductTypePerformance) || []) as any[])
          if (!myPerf || myPerf.length === 0) return null
          const myPerfMap = new Map<string, any>(myPerf.map((p: any) => [p.productType, p]))
          const myNormalized = ALL_PRODUCT_TYPES.map((pt) => {
            const base: any = myPerfMap.get(pt) || {}
            return {
              productType: pt,
              count: Number(base.count || 0),
              value: Number(base.value || 0),
              wonValue: Number(base.wonValue || 0),
              wonShare: Number(base.value || 0) > 0 ? Number(base.wonValue || 0) / Number(base.value || 0) : 0,
            }
          })
          const myMaxValue = Math.max(0, ...myNormalized.map(p => Number(p.value || 0)))
          const myMaxWon = Math.max(0, ...myNormalized.map(p => Number(p.wonValue || 0)))
          const getKey = (p: any) => {
            if (ptSortBy === 'wonShare') return p.wonShare
            return Number(p[ptSortBy] || 0)
          }
          const mySorted = [...myNormalized].sort((a, b) => {
            const av = getKey(a)
            const bv = getKey(b)
            return ptSortDir === 'desc' ? (bv - av) : (av - bv)
          })
          return (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-white border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-violet-600 rounded-xl">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      My Product Type Performance
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      This month performance by product type
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-slate-700">
                        <th className="px-3 py-2 font-semibold">Product Type</th>
                        <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('count')}>Offers</th>
                        <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('value')}>Total Value</th>
                        <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('wonValue')}>Won Value</th>
                        <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => toggleSort('wonShare')}>Won Share%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mySorted.map((p) => {
                        const color = productTypeColorMap.get(p.productType) || '#8B5CF6'
                        const valuePct = myMaxValue > 0 ? Math.round((p.value / myMaxValue) * 100) : 0
                        const wonPct = myMaxWon > 0 ? Math.round((p.wonValue / myMaxWon) * 100) : 0
                        return (
                          <tr key={p.productType} className="align-middle">
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                                <span className="font-medium text-slate-900">{p.productType}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3">{p.count}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-2 rounded-full" style={{ width: `${valuePct}%`, backgroundColor: color }} />
                                </div>
                                <span className="tabular-nums font-medium">{formatCurrency(p.value)}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-2 rounded-full" style={{ width: `${wonPct}%`, backgroundColor: color }} />
                                </div>
                                <span className="tabular-nums">{formatCurrency(p.wonValue)}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold`} style={{ color: color, backgroundColor: `${color}22` }}>
                                {(p.wonShare * 100).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {/* Recent Offers */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-white border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Recent Offers
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Latest offers added by users
                </CardDescription>
              </div>
              <button className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View All
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recentOffersData.map((offer: any, index: number) => (
                <div 
                  key={offer.id} 
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg text-white font-bold shadow-md">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-900">{offer.customer?.companyName || 'Unknown'}</p>
                        <span className="px-2 py-0.5 text-xs font-medium text-slate-600 bg-slate-200 rounded-full flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {offer.zone?.name || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Added by {offer.createdBy?.name || offer.createdBy?.email || offer.assignedTo?.name || 'N/A'} 
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3" />
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-600 mb-1">Value</p>
                      <p className="font-bold text-slate-900 text-lg">{formatCurrency(offer.offerValue || 0)}</p>
                    </div>
                    <div className={`px-3 py-2 rounded-xl text-xs font-semibold ${getStageColor(offer.stage)}`}>
                      {formatStage(offer.stage)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 12-Month Offers Trend */}
        {mode !== 'zoneUser' && (() => {
          const last12 = getLast12Months()
          const trendMap = new Map<string, { offers: number; value: number }>()
          ;(dashboardData?.monthlyTrend || []).forEach((m: any) => {
            const label = toShortMonthLabel(m.month)
            if (!label) return
            trendMap.set(label, { offers: Number(m.offers || 0), value: Number(m.value || 0) })
          })
          const normalizedMonthlyTrend = last12.map(m => {
            const item = trendMap.get(m.label)
            return { month: m.label, offers: item?.offers || 0, value: item?.value || 0 }
          })

          return (
            <Card className="border-0 shadow-2xl">
              <CardHeader className="bg-white border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-3 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl shadow-lg">
                        <TrendingUp className="h-7 w-7 text-white" />
                      </div>
                      12-Month Offers & Revenue Trend
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      Year-over-year performance analysis with offer count and revenue tracking
                    </CardDescription>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                      <span className="text-sm font-medium text-slate-700">Offers</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"></div>
                      <span className="text-sm font-medium text-slate-700">Revenue</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <ResponsiveContainer width="100%" height={450}>
                  <ComposedChart data={normalizedMonthlyTrend} margin={{ bottom: 20, left: 10, right: 10 }}>
                    <defs>
                      <linearGradient id="colorOffersLarge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorValueLarge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      interval={0}
                      minTickGap={0}
                      tickMargin={12}
                      tick={<RenderMonthTick />}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      height={80}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      label={{ value: 'Number of Offers', angle: -90, position: 'insideLeft', style: { fill: '#475569', fontWeight: 600 } }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                      label={{ value: 'Revenue Value', angle: 90, position: 'insideRight', style: { fill: '#475569', fontWeight: 600 } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                        borderRadius: '16px', 
                        border: 'none',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        padding: '16px'
                      }}
                      labelStyle={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', marginBottom: '8px' }}
                      formatter={(value: any, name: string) => {
                        if (name === 'value') {
                          return [formatCurrency(Number(value)), 'Revenue']
                        }
                        return [value, 'Offers']
                      }}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="offers" 
                      stroke="#06B6D4" 
                      strokeWidth={4}
                      fill="url(#colorOffersLarge)"
                      name="Offers Count"
                      dot={{ fill: '#06B6D4', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8, strokeWidth: 2 }}
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8B5CF6" 
                      strokeWidth={4}
                      fill="url(#colorValueLarge)"
                      name="Revenue Value"
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8, strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )
        })()}
      </div>
    </div>
  )
}
