'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar, Legend,
  Area, AreaChart, ComposedChart
} from 'recharts'
import { 
  FileText, MapPin, Users, DollarSign, TrendingUp, TrendingDown, Clock,
  CheckCircle, XCircle, Target, Zap, Activity, ArrowUpRight, ArrowDownRight,
  Loader2, Package, Award, BarChart3, Calendar, Filter, Download, RefreshCw,
  Eye, Percent, ShoppingCart, Briefcase
} from 'lucide-react'
import { apiService } from '@/services/api'
import UnifiedDashboardClient from '@/components/dashboard/UnifiedDashboardClient'

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
  currentMonthTargets: {
    period: string
    zones: Array<{ id: number; zoneId: number; zone: string; targetValue: number; targetOfferCount: number | null }>
    users: Array<{ id: number; userId: number; user: string; targetValue: number; targetOfferCount: number | null }>
    productTypes: Array<{ id: number; zoneId: number; zone: string; productType: string; targetValue: number; targetOfferCount: number | null }>
  }
}

export default function ZoneManagerDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<'ALL' | 'LAST_7' | 'LAST_30' | 'THIS_MONTH'>('ALL')
  const [ptSortBy, setPtSortBy] = useState<'value' | 'count' | 'wonValue' | 'wonShare'>('value')
  const [ptSortDir, setPtSortDir] = useState<'desc' | 'asc'>('desc')

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
        const data = await apiService.getZoneManagerDashboard(params)
        setDashboardData(data)
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err)
        
        // Check if it's a zone manager without zone assignment
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
  }, [range])

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
    if (value > 0) return "text-green-600"
    if (value < 0) return "text-red-600"
    return "text-gray-600"
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
    const m = s.match(/^(\\d{4})[-/](\\d{1,2})$/)
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

  const formatProductTypeLabel = (s: string) => String(s || '').split('_').join(' ')
  const RenderProductTypeTick = (props: any) => {
    const { x, y, payload } = props
    const label = formatProductTypeLabel(payload?.value)
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="#64748b" fontSize={12} transform="rotate(-30)">{label}</text>
      </g>
    )
  }

  const RenderStageLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name, value } = props
    if (!percent || percent < 0.08) return null
    const RADIAN = Math.PI / 180
    const radius = outerRadius + 14
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="#334155" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
        {`${name}: ${value}`}
      </text>
    )
  }

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

  // Use the unified dashboard client to keep UI identical to Admin
  return (
    <UnifiedDashboardClient mode="zoneManager" />
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Zone Manager Dashboard
              </h1>
            </div>
            <p className="text-slate-600 text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-time insights and performance metrics for your zone
            </p>
          </div>
        </div>

        {/* Overall Performance (All-Time Totals) */}
        <Card className="overflow-hidden border-0 shadow-2xl bg-white">
          <CardHeader className="bg-white border-b">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-violet-100">
                  <Award className="h-10 w-10 text-violet-700" />
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
                <div className="text-5xl lg:text-6xl font-extrabold mb-1 text-slate-900">{formatCurrency(stats.wonValue)}</div>
                <div className="flex items-center justify-center lg:justify-end gap-2 text-slate-600">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  <p className="text-sm">Total Won Value</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl p-5 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <p className="text-slate-700 text-sm font-medium">Total Won Value</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.wonValue)}</p>
                <p className="text-xs text-slate-600 mt-1">{stats.wonOffers} offers won</p>
              </div>
              <div className="rounded-xl p-5 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-amber-600" />
                  <p className="text-slate-700 text-sm font-medium">Total Offers</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalOffers}</p>
                <p className="text-xs text-slate-600 mt-1">in system</p>
              </div>
              <div className="rounded-xl p-5 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-5 w-5 text-cyan-600" />
                  <p className="text-slate-700 text-sm font-medium">Win Rate</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.closedOffers === 0 ? 'N/A' : `${stats.winRate.toFixed(1)}%`}</p>
                <p className="text-xs text-slate-600 mt-1">{stats.wonOffers}W / {stats.lostOffers}L</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white relative">
            <CardHeader className="bg-white border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="text-xs font-medium text-slate-500">All-time</div>
              </div>
            </CardHeader>
            <CardContent className="p-6 relative">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Wins</p>
                <h3 className="text-4xl font-bold text-slate-900">{stats.wonOffers}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <span>Closed: {stats.closedOffers} total</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white relative">
            <CardHeader className="bg-white border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(stats.valueGrowth)}
                  <span className={`text-xs font-bold ${getTrendColor(stats.valueGrowth)}`}>
                    {stats.valueGrowth > 0 ? '+' : ''}{stats.valueGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 relative">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Pipeline Value</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Active pipeline</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white relative">
            <CardHeader className="bg-white border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Percent className="h-6 w-6 text-white" />
                </div>
                {stats.closedOffers < 3 && (
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full font-medium">
                    Low sample
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 relative">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Win Rate</p>
                <h3 className="text-4xl font-bold text-slate-900">
                  {stats.closedOffers === 0 ? 'N/A' : `${stats.winRate.toFixed(1)}%`}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>
                      {stats.closedOffers === 0 
                        ? 'No closed offers yet' 
                        : `${stats.wonOffers}W / ${stats.lostOffers}L`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Zap className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Active Offers</p>
                <h3 className="text-4xl font-bold text-slate-900">{stats.activeOffers}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Active in pipeline</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Conversion Rate</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.conversionRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-indigo-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Avg Deal Size</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.avgOfferValue)}</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <ShoppingCart className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-cyan-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wide mb-1">Total Offers</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalOffers}</p>
                </div>
                <div className="p-3 bg-cyan-100 rounded-xl">
                  <FileText className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-5">
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
        </div>

        {/* Enhanced Product Type Performance */}
        {((dashboardData?.productTypePerformance?.length ?? 0) > 0) && (
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

        {/* Enhanced Charts Row */}
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
                    label={RenderStageLabel}
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
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
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

        {/* Zone × Product Type Breakdown (Stacked) */}
        {pivotByZone.length > 0 && productTypesForStack.length > 0 && (
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
                      name={formatProductTypeLabel(pt)} 
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
                  Latest offers added by zone users
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
              {(dashboardData?.recentOffers || []).map((offer, index) => (
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
                        Added by {offer.createdBy?.name || offer.createdBy?.email || 'N/A'} 
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
                    <div className={`px-3 py-2 rounded-xl text-xs font-semibold shadow-sm ${getStageColor(offer.stage)}`}>
                      {formatStage(offer.stage)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Full-Width 12-Month Offers Trend */}
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
                      return [formatCurrency(Number(value)), 'Revenue'];
                    }
                    return [value, 'Offers'];
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={50}
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '20px', fontSize: '14px', fontWeight: 600 }}
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
            
            {/* Summary Stats Below Chart */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-200">
              <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl">
                <p className="text-sm font-semibold text-cyan-700 uppercase tracking-wide mb-2">Total Offers</p>
                <p className="text-3xl font-bold text-slate-900">
                  {normalizedMonthlyTrend.reduce((sum, month) => sum + month.offers, 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl">
                <p className="text-sm font-semibold text-violet-700 uppercase tracking-wide mb-2">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(normalizedMonthlyTrend.reduce((sum, month) => sum + month.value, 0))}
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl">
                <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">Avg Offers/Month</p>
                <p className="text-3xl font-bold text-slate-900">
                  {Math.round(normalizedMonthlyTrend.reduce((sum, month) => sum + month.offers, 0) / normalizedMonthlyTrend.length)}
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">Avg Revenue/Month</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(normalizedMonthlyTrend.reduce((sum, month) => sum + month.value, 0) / normalizedMonthlyTrend.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
