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
  Line
} from 'recharts'
import { 
  FileText, 
  MapPin, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Target,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
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
}


interface DashboardData {
  stats: DashboardStats
  recentOffers: any[]
  offersByStage: Array<{ stage: string; count: number }>
  offersByZone: Array<{ name: string; offers: number; value: number }>
  topCustomers: Array<{ customer: string; count: number }>
  monthlyTrend: Array<{ month: string; offers: number; value: number }>
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const data = await apiService.getAdminDashboard()
        setDashboardData(data)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-slate-600 mt-1">Real-time analytics and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Last 30 Days
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Advanced Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-50 to-violet-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-violet-600 rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
              {getTrendIcon(stats.momGrowth)}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Won This Month</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900">{stats.wonThisMonth}</h3>
                <span className={`text-sm font-semibold flex items-center gap-1 ${getTrendColor(stats.momGrowth)}`}>
                  {stats.momGrowth > 0 ? '+' : ''}{stats.momGrowth.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-slate-500">vs {stats.wonLastMonth} last month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-600 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              {getTrendIcon(stats.valueGrowth)}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Pipeline Value</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</h3>
                <span className={`text-sm font-semibold flex items-center gap-1 ${getTrendColor(stats.valueGrowth)}`}>
                  {stats.valueGrowth > 0 ? '+' : ''}{stats.valueGrowth.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-slate-500">Active pipeline</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              {stats.closedOffers < 3 && (
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                  Low sample
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Win Rate</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900">
                  {stats.closedOffers === 0 ? 'N/A' : `${stats.winRate.toFixed(1)}%`}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {stats.closedOffers === 0 
                  ? 'No closed offers yet' 
                  : `${stats.wonOffers} won, ${stats.lostOffers} lost (${stats.closedOffers} total)`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-600 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Active Offers</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900">{stats.activeOffers}</h3>
              </div>
              <p className="text-xs text-slate-500">{stats.last7DaysOffers} in last 7 days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-slate-900">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Avg Deal Size</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.avgOfferValue)}</p>
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
                <p className="text-2xl font-bold text-slate-900">{stats.last30DaysOffers}</p>
              </div>
              <Clock className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Active Zones</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalZones}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Active Users</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stage Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Offer Stage Distribution</CardTitle>
            <CardDescription>
              Breakdown of offers by current stage
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  label={(props: any) => `${props.name} ${props.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.offersByStage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.stage === 'WON' ? '#10B981' : entry.stage === 'LOST' ? '#EF4444' : '#3B82F6'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Zone Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Zone Performance</CardTitle>
            <CardDescription>
              Offer value by zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.offersByZone}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Value']} />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Offers Trend and Recent Offers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Offers Trend */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Offers Trend</CardTitle>
            <CardDescription>
              Monthly offer submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dashboardData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="offers" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Offers */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Offers</CardTitle>
            <CardDescription>
              Latest offers added by zone users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentOffers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{offer.customer?.companyName || 'Unknown'}</p>
                      <span className="text-xs text-gray-500">• {offer.zone?.name || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Added by {offer.createdBy?.name || offer.createdBy?.email || 'N/A'} on {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{formatCurrency(offer.offerValue || 0)}</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStageColor(offer.stage)}`}>
                      {formatStage(offer.stage)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
