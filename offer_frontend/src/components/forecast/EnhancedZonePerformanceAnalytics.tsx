'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Legend,
  LineChart,
  Line
} from 'recharts'
import { MapPin, TrendingUp, TrendingDown, Package, Target, DollarSign } from 'lucide-react'

interface ZonePerformance {
  zoneId: number
  zoneName: string
  forecastOffers: number
  forecastValue: number
  actualOffers: number
  actualValue: number
  achievement: number
  productTypes: Record<string, { forecast: number; actual: number; achievement: number }>
  users: Array<{
    userId: number
    userName: string
    forecastOffers: number
    forecastValue: number
    actualOffers: number
    actualValue: number
    achievement: number
  }>
}

interface EnhancedZonePerformanceProps {
  zonePerformance: ZonePerformance[]
}

const formatCurrency = (value: number) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`
  }
  return `₹${value.toLocaleString('en-IN')}`
}

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`
}

const getAchievementColor = (value: number) => {
  if (value >= 100) return '#10b981' // emerald-500
  if (value >= 80) return '#3b82f6'  // blue-500
  if (value >= 60) return '#f59e0b'  // amber-500
  return '#ef4444' // rose-500
}

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // purple-500
  '#f59e0b', // amber-500
  '#ef4444', // rose-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes('Value') ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function EnhancedZonePerformanceAnalytics({ zonePerformance }: EnhancedZonePerformanceProps) {
  // Calculate totals
  const totalZones = zonePerformance.length
  const totalForecastValue = zonePerformance.reduce((sum, zone) => sum + zone.forecastValue, 0)
  const totalActualValue = zonePerformance.reduce((sum, zone) => sum + zone.actualValue, 0)
  const overallAchievement = totalForecastValue > 0 ? (totalActualValue / totalForecastValue) * 100 : 0

  // Top performers
  const topByValue = [...zonePerformance].sort((a, b) => b.actualValue - a.actualValue)[0]
  const topByAchievement = [...zonePerformance].sort((a, b) => b.achievement - a.achievement)[0]

  // Prepare data for charts
  const performanceData = zonePerformance.map(zone => ({
    zoneName: zone.zoneName,
    forecastValue: zone.forecastValue,
    actualValue: zone.actualValue,
    achievement: zone.achievement
  }))

  // Zone product type breakdown data
  const zoneProductData = zonePerformance.map(zone => {
    const productTypes = Object.keys(zone.productTypes)
    return {
      zoneName: zone.zoneName,
      ...productTypes.reduce((acc, pt) => {
        acc[pt] = zone.productTypes[pt].actual || 0
        return acc
      }, {} as Record<string, number>)
    }
  })

  // Achievement distribution
  const achievementDistribution = [
    { name: '≥100%', count: zonePerformance.filter(z => z.achievement >= 100).length },
    { name: '80-99%', count: zonePerformance.filter(z => z.achievement >= 80 && z.achievement < 100).length },
    { name: '60-79%', count: zonePerformance.filter(z => z.achievement >= 60 && z.achievement < 80).length },
    { name: '<60%', count: zonePerformance.filter(z => z.achievement < 60).length }
  ]

  // Get all unique product types across all zones
  const allProductTypes = Array.from(new Set(
    zonePerformance.flatMap(zone => Object.keys(zone.productTypes))
  ))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-700">Total Zones</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalZones}</p>
            <p className="text-sm text-gray-500">Active zones</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-700">Total Value</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalActualValue)}</p>
            <p className="text-sm text-gray-500">Won value</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-700">Overall Achievement</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatPercent(overallAchievement)}</p>
            <p className="text-sm text-gray-500">Across all zones</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-gray-700">Top Zone</h3>
            </div>
            <p className="text-lg font-bold text-amber-600">{topByValue?.zoneName || 'N/A'}</p>
            <p className="text-sm text-gray-500">{formatCurrency(topByValue?.actualValue || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Performance Comparison */}
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <MapPin className="h-5 w-5 text-blue-600" />
              Zone Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="zoneName" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => value >= 10000000 ? `${value/10000000}Cr` : value >= 100000 ? `${value/100000}L` : value}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="forecastValue" 
                  fill="#3b82f6" 
                  name="Forecast Value"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="actualValue" 
                  fill="#10b981" 
                  name="Actual Value"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Achievement Distribution */}
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-amber-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Target className="h-5 w-5 text-purple-600" />
              Achievement Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={achievementDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {achievementDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, 'Zones']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Zone Product Type Breakdown */}
      {allProductTypes.length > 0 && (
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Package className="h-5 w-5 text-emerald-600" />
              Zone Product Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={zoneProductData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="zoneName" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => value >= 10000000 ? `${value/10000000}Cr` : value >= 100000 ? `${value/100000}L` : value}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {allProductTypes.map((productType, index) => (
                  <Bar 
                    key={productType}
                    dataKey={productType} 
                    fill={COLORS[index % COLORS.length]}
                    name={productType}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Zone Performance Table */}
      <Card className="shadow-xl border-0 rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <MapPin className="h-5 w-5 text-gray-600" />
            Zone Performance Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {zonePerformance.map((zone) => (
              <div key={zone.zoneId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{zone.zoneName}</h3>
                  <div className="flex items-center gap-2">
                    {zone.achievement >= 100 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    ) : zone.achievement >= 80 ? (
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-600" />
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      zone.achievement >= 100 ? 'bg-emerald-50 text-emerald-700' :
                      zone.achievement >= 80 ? 'bg-blue-50 text-blue-700' :
                      zone.achievement >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {formatPercent(zone.achievement)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Forecast</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(zone.forecastValue)}</p>
                    <p className="text-xs text-gray-500">{zone.forecastOffers} offers</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-gray-600">Actual</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(zone.actualValue)}</p>
                    <p className="text-xs text-gray-500">{zone.actualOffers} won</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Variance</p>
                    <p className="text-lg font-bold text-purple-600">{formatCurrency(zone.forecastValue - zone.actualValue)}</p>
                    <p className="text-xs text-gray-500">Difference</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-gray-600">Users</p>
                    <p className="text-lg font-bold text-amber-600">{zone.users.length}</p>
                    <p className="text-xs text-gray-500">Active users</p>
                  </div>
                </div>

                {/* Product Types */}
                {Object.keys(zone.productTypes).length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Product Types</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(zone.productTypes).map(([productType, data]) => (
                        <div key={productType} className="text-xs p-2 bg-gray-50 rounded">
                          <div className="font-medium text-gray-700">{productType}</div>
                          <div className="text-gray-600">
                            {formatCurrency(data.actual)} / {formatCurrency(data.forecast)}
                          </div>
                          <div className="text-gray-500">
                            {formatPercent(data.achievement)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
