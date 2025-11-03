'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  FileText, 
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  DollarSign,
  User,
  Briefcase,
  Clock,
  Award,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import { apiService } from '@/services/api'

interface ZoneDashboardStats {
  totalOffers: number
  openOffers: number
  wonOffers: number
  lostOffers: number
  myOffers: number
  totalValue: number
  wonValue: number
  winRate: string
  activeOffers: number
  wonThisMonth: number
  wonLastMonth: number
  last7DaysOffers: number
  last30DaysOffers: number
  avgOfferValue: number
  conversionRate: number
  momGrowth: number
}

interface Target {
  targetValue: number
  targetOfferCount?: number
  period: string
}

interface ZoneTarget extends Target {
  zoneName: string
}

interface ZoneDashboardData {
  stats: ZoneDashboardStats
  recentOffers: any[]
  offersByStage: Array<{ stage: string; count: number }>
  topCustomers: Array<{ customer: string; count: number }>
  monthlyTrend: Array<{ month: string; offers: number; value: number }>
  myTarget?: Target | null
  zoneTarget?: ZoneTarget | null
  zonePerformance?: Array<{ name: string; value: number }>
}

export default function ZoneUserDashboard() {
  const [dashboardData, setDashboardData] = useState<ZoneDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const data = await apiService.getZoneDashboard()
        setDashboardData(data)
      } catch (err: any) {
        console.error('Failed to fetch zone dashboard data:', err)
        setError(err?.response?.data?.error || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
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
  const closedOffers = stats.wonOffers + stats.lostOffers
  const winRateNum = closedOffers > 0 ? (stats.wonOffers / closedOffers) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Zone Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Your zone performance and analytics</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Last 30 Days
          </button>
          <a 
            href="/zone-user/offers/new"
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-colors"
          >
            + New Offer
          </a>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-50 to-violet-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-violet-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <Activity className="h-5 w-5 text-violet-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Total Offers</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900">{stats.totalOffers}</h3>
              </div>
              <p className="text-xs text-slate-500">{stats.openOffers} currently open</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-600 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Won Offers</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900">{stats.wonOffers}</h3>
                <span className="text-sm font-semibold text-emerald-600">
                  {winRateNum.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-slate-500">{formatCurrency(stats.wonValue)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Pipeline Value</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</h3>
              </div>
              <p className="text-xs text-slate-500">Total offers value</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-600 rounded-xl">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">My Offers</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900">{stats.myOffers}</h3>
              </div>
              <p className="text-xs text-slate-500">Assigned to me</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Targets Section */}
      {(dashboardData.myTarget || dashboardData.zoneTarget) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Personal Target */}
          {dashboardData.myTarget && (
            <Card className="border-l-4 border-l-violet-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-violet-600" />
                  My Personal Target
                </CardTitle>
                <CardDescription>
                  Performance target for {dashboardData.myTarget.period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-violet-50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Target Value</p>
                      <p className="text-2xl font-bold text-violet-600">
                        {formatCurrency(dashboardData.myTarget.targetValue)}
                      </p>
                    </div>
                    {dashboardData.myTarget.targetOfferCount && (
                      <div className="text-right">
                        <p className="text-sm text-slate-600 mb-1">Target Count</p>
                        <p className="text-2xl font-bold text-violet-600">
                          {dashboardData.myTarget.targetOfferCount}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Current Won Value</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(stats.wonValue)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min((stats.wonValue / dashboardData.myTarget.targetValue) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    {((stats.wonValue / dashboardData.myTarget.targetValue) * 100).toFixed(1)}% achieved
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Zone Target */}
          {dashboardData.zoneTarget && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  {dashboardData.zoneTarget.zoneName} Zone Target
                </CardTitle>
                <CardDescription>
                  Zone-wide target for {dashboardData.zoneTarget.period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Target Value</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(dashboardData.zoneTarget.targetValue)}
                      </p>
                    </div>
                    {dashboardData.zoneTarget.targetOfferCount && (
                      <div className="text-right">
                        <p className="text-sm text-slate-600 mb-1">Target Count</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {dashboardData.zoneTarget.targetOfferCount}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Zone Performance</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.wonValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Win Rate</p>
                <p className="text-2xl font-bold text-slate-900">
                  {closedOffers === 0 ? 'N/A' : `${winRateNum.toFixed(1)}%`}
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Avg Deal Size</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(stats.avgOfferValue || (stats.totalOffers > 0 ? stats.totalValue / stats.totalOffers : 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Last 30 Days</p>
                <p className="text-2xl font-bold text-slate-900">{stats.last30DaysOffers || stats.totalOffers}</p>
              </div>
              <Clock className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Lost Offers</p>
                <p className="text-2xl font-bold text-slate-900">{stats.lostOffers}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-violet-600" />
              Offer Stage Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of your zone's offers by stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.offersByStage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.offersByStage.map(s => ({
                      name: formatStage(s.stage),
                      value: s.count,
                      color: s.stage === 'WON' ? '#10B981' : s.stage === 'LOST' ? '#EF4444' : '#3B82F6'
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => `${props.name}: ${props.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.offersByStage.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.stage === 'WON' ? '#10B981' : entry.stage === 'LOST' ? '#EF4444' : '#3B82F6'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                No stage data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Top Customers
            </CardTitle>
            <CardDescription>
              Customers with most offers in your zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.topCustomers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.topCustomers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="customer" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Offers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Zone Offers</CardTitle>
          <CardDescription>
            Latest offers in your zone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recentOffers.length > 0 ? (
              dashboardData.recentOffers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{offer.customer?.companyName || 'Unknown'}</p>
                      {offer.assignedTo && (
                        <span className="text-xs text-gray-500">• {offer.assignedTo.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      Created on {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{formatCurrency(offer.offerValue || 0)}</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStageColor(offer.stage)}`}>
                      {formatStage(offer.stage)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                No recent offers found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
