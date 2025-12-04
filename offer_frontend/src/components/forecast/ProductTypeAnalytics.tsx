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
  Line,
  Area,
  AreaChart
} from 'recharts'
import { Package, TrendingUp, TrendingDown, DollarSign, Target, Award } from 'lucide-react'

interface ProductTypeAnalytics {
  forecastByProductType: Record<string, { count: number; value: number }>
  actualByProductType: Record<string, { count: number; value: number }>
}

interface ProductTypeAnalyticsProps {
  analytics: {
    forecastByProductType: Record<string, { count: number; value: number }>
    actualByProductType: Record<string, { count: number; value: number }>
  }
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

export function ProductTypeAnalytics({ analytics }: ProductTypeAnalyticsProps) {
  // Process data
  const allProductTypes = Array.from(new Set([
    ...Object.keys(analytics.forecastByProductType || {}),
    ...Object.keys(analytics.actualByProductType || {})
  ]))

  const productTypeData = allProductTypes.map(productType => {
    const forecast = analytics.forecastByProductType[productType] || { count: 0, value: 0 }
    const actual = analytics.actualByProductType[productType] || { count: 0, value: 0 }
    const achievement = forecast.value > 0 ? (actual.value / forecast.value) * 100 : 0
    const variance = forecast.value - actual.value

    return {
      productType,
      forecastValue: forecast.value,
      actualValue: actual.value,
      forecastOffers: forecast.count,
      actualOffers: actual.count,
      achievement,
      variance,
      winRate: forecast.count > 0 ? (actual.count / forecast.count) * 100 : 0
    }
  })

  // Calculate totals
  const totalProductTypes = allProductTypes.length
  const totalForecastValue = productTypeData.reduce((sum, pt) => sum + pt.forecastValue, 0)
  const totalActualValue = productTypeData.reduce((sum, pt) => sum + pt.actualValue, 0)
  const overallAchievement = totalForecastValue > 0 ? (totalActualValue / totalForecastValue) * 100 : 0

  // Top performers
  const topByValue = [...productTypeData].sort((a, b) => b.actualValue - a.actualValue)[0]
  const topByAchievement = [...productTypeData].sort((a, b) => b.achievement - a.achievement)[0]
  const topByWinRate = [...productTypeData].sort((a, b) => b.winRate - a.winRate)[0]

  // Achievement distribution
  const achievementDistribution = [
    { name: '≥100%', count: productTypeData.filter(pt => pt.achievement >= 100).length },
    { name: '80-99%', count: productTypeData.filter(pt => pt.achievement >= 80 && pt.achievement < 100).length },
    { name: '60-79%', count: productTypeData.filter(pt => pt.achievement >= 60 && pt.achievement < 80).length },
    { name: '<60%', count: productTypeData.filter(pt => pt.achievement < 60).length }
  ]

  // Value contribution pie data
  const valueContribution = productTypeData
    .filter(pt => pt.actualValue > 0)
    .sort((a, b) => b.actualValue - a.actualValue)
    .slice(0, 8)
    .map(pt => ({
      name: pt.productType,
      value: pt.actualValue
    }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-700">Total Products</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalProductTypes}</p>
            <p className="text-sm text-gray-500">Active types</p>
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
              <h3 className="font-semibold text-gray-700">Achievement</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatPercent(overallAchievement)}</p>
            <p className="text-sm text-gray-500">Overall</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-gray-700">Top Product</h3>
            </div>
            <p className="text-lg font-bold text-amber-600">{topByValue?.productType || 'N/A'}</p>
            <p className="text-sm text-gray-500">{formatCurrency(topByValue?.actualValue || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Type Performance Comparison */}
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Package className="h-5 w-5 text-blue-600" />
              Product Type Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="productType" 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
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

        {/* Value Contribution Pie Chart */}
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-amber-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Value Contribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={valueContribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {valueContribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [formatCurrency(value), 'Actual Value']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Rate Chart */}
      <Card className="shadow-xl border-0 rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Target className="h-5 w-5 text-emerald-600" />
            Achievement Rate by Product Type
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="productType" 
                tick={{ fill: '#6b7280', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                domain={[0, 150]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Achievement']}
              />
              <Bar 
                dataKey="achievement" 
                fill="#8b5cf6"
                name="Achievement %"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Product Type Table */}
      <Card className="shadow-xl border-0 rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Package className="h-5 w-5 text-gray-600" />
            Product Type Performance Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Type</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Forecast Offers</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Forecast Value</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actual Offers</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actual Value</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Win Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Achievement</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Variance</th>
                </tr>
              </thead>
              <tbody>
                {productTypeData
                  .sort((a, b) => b.actualValue - a.actualValue)
                  .map((productType) => (
                  <tr key={productType.productType} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{productType.productType}</td>
                    <td className="text-right py-3 px-4 text-gray-600">{productType.forecastOffers}</td>
                    <td className="text-right py-3 px-4 font-medium text-blue-600">{formatCurrency(productType.forecastValue)}</td>
                    <td className="text-right py-3 px-4 text-gray-600">{productType.actualOffers}</td>
                    <td className="text-right py-3 px-4 font-medium text-emerald-600">{formatCurrency(productType.actualValue)}</td>
                    <td className="text-right py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        productType.winRate >= 50 ? 'bg-emerald-50 text-emerald-700' :
                        productType.winRate >= 30 ? 'bg-blue-50 text-blue-700' :
                        productType.winRate >= 15 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {formatPercent(productType.winRate)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        productType.achievement >= 100 ? 'bg-emerald-50 text-emerald-700' :
                        productType.achievement >= 80 ? 'bg-blue-50 text-blue-700' :
                        productType.achievement >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {formatPercent(productType.achievement)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {productType.variance >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-rose-600" />
                        )}
                        <span className={`font-medium ${
                          productType.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {formatCurrency(Math.abs(productType.variance))}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
