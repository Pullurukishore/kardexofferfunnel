'use client'

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
} from 'recharts'
import { 
  FileText, 
  CheckCircle,
  XCircle,
  DollarSign,
  Briefcase,
  Clock,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  Package,
  Trophy,
  Users
} from 'lucide-react'

interface ZoneManagerDashboardClientProps {
  dashboardData: any;
}

export default function ZoneManagerDashboardClient({ dashboardData }: ZoneManagerDashboardClientProps) {
  const { stats } = dashboardData
  const closedOffers = stats.wonOffers + stats.lostOffers
  const winRateNum = closedOffers > 0 ? (stats.wonOffers / closedOffers) * 100 : 0

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Zone Manager Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Overview of all zone offers and team performance</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Last 30 Days
          </button>
          <a 
            href="/zone-manager/offers"
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-colors"
          >
            View All Offers
          </a>
        </div>
      </div>

      {/* Zone Achievement */}
      {dashboardData.zoneTarget && (
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{dashboardData.zoneTarget.zoneName} Zone Performance</h3>
                  <p className="text-blue-100 text-sm">Period: {dashboardData.zoneTarget.period}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{stats.zoneAchievement.toFixed(1)}%</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-blue-100 text-xs mb-1">Zone Won Value</p>
                <p className="text-lg font-bold">{formatCurrency(stats.zoneWonValueThisMonth)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-blue-100 text-xs mb-1">Zone Target</p>
                <p className="text-lg font-bold">{formatCurrency(dashboardData.zoneTarget.targetValue)}</p>
              </div>
            </div>
            <div className="mt-3 w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all"
                style={{ width: `${Math.min(stats.zoneAchievement, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-50 to-violet-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-violet-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Total Zone Offers</p>
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
                <Trophy className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Win Rate</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900">
                  {closedOffers === 0 ? 'N/A' : `${winRateNum.toFixed(1)}%`}
                </h3>
              </div>
              <p className="text-xs text-slate-500">{stats.wonOffers} / {closedOffers} closed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Type Performance */}
      {dashboardData.productTypePerformance && dashboardData.productTypePerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-violet-600" />
              Product Type Performance
            </CardTitle>
            <CardDescription>
              Monthly performance by product type in your zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.productTypePerformance.map((product: any) => (
                <div key={product.productType} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-100 rounded-lg">
                        <Package className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{product.productType}</h4>
                        <p className="text-sm text-slate-600">{product.count} offers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">{formatCurrency(product.wonValue)}</p>
                      <p className="text-xs text-slate-600">Won value</p>
                    </div>
                  </div>
                  {product.targetValue && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Target: {formatCurrency(product.targetValue)}</span>
                        <span className={`font-semibold ${
                          product.achievement && product.achievement >= 100 
                            ? 'text-green-600' 
                            : product.achievement && product.achievement >= 75 
                            ? 'text-amber-600' 
                            : 'text-red-600'
                        }`}>
                          {product.achievement?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            product.achievement && product.achievement >= 100 
                              ? 'bg-green-600' 
                              : product.achievement && product.achievement >= 75 
                              ? 'bg-amber-600' 
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(product.achievement || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Avg Deal Size</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(stats.avgOfferValue || (stats.totalOffers > 0 ? stats.totalValue / stats.totalOffers : 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600">Active Offers</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeOffers || stats.openOffers}</p>
              </div>
              <Award className="h-8 w-8 text-indigo-500" />
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
              Breakdown of zone offers by stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.offersByStage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.offersByStage.map((s: any) => ({
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
                    {dashboardData.offersByStage.map((entry: any, index: number) => (
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

      {/* Product Type Distribution */}
      {dashboardData.offersByProductType && dashboardData.offersByProductType.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-violet-600" />
                Product Type Distribution
              </CardTitle>
              <CardDescription>
                Offer count by product type in your zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.offersByProductType.map((p: any) => ({
                      name: p.productType,
                      value: p.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => `${props.name}: ${props.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.offersByProductType.map((entry: any, index: number) => {
                      const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Product Type Value
              </CardTitle>
              <CardDescription>
                Total offer value by product type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.offersByProductType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productType" />
                  <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Value']} />
                  <Bar dataKey="value" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

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
              dashboardData.recentOffers.map((offer: any) => (
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
