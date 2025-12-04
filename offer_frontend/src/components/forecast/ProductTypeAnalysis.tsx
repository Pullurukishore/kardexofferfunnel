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
  Legend
} from 'recharts'
import { Package, TrendingUp, DollarSign, Award } from 'lucide-react'

interface ForecastAnalytics {
  forecastByProductType: Record<string, { count: number; value: number }>
  actualByProductType: Record<string, { count: number; value: number }>
}

interface ProductTypeAnalysisProps {
  analytics: ForecastAnalytics
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

export function ProductTypeAnalysis({ analytics }: ProductTypeAnalysisProps) {
  // Transform data for charts
  const productTypeData = Object.keys(analytics.forecastByProductType).map(productType => {
    const forecast = analytics.forecastByProductType[productType] || { count: 0, value: 0 }
    const actual = analytics.actualByProductType[productType] || { count: 0, value: 0 }
    const achievement = forecast.value > 0 ? (actual.value / forecast.value) * 100 : 0
    
    return {
      productType,
      forecastValue: forecast.value,
      actualValue: actual.value,
      forecastOffers: forecast.count,
      actualOffers: actual.count,
      achievement
    }
  }).sort((a, b) => b.forecastValue - a.forecastValue)

  // Prepare data for pie chart
  const pieData = productTypeData.slice(0, 5).map(item => ({
    name: item.productType,
    value: item.forecastValue
  }))

  // Calculate totals
  const totalForecastValue = productTypeData.reduce((sum, item) => sum + item.forecastValue, 0)
  const totalActualValue = productTypeData.reduce((sum, item) => sum + item.actualValue, 0)
  const totalForecastOffers = productTypeData.reduce((sum, item) => sum + item.forecastOffers, 0)
  const totalActualOffers = productTypeData.reduce((sum, item) => sum + item.actualOffers, 0)

  // Find top performers
  const topByValue = productTypeData[0]
  const topByOffers = productTypeData.reduce((max, item) => item.forecastOffers > max.forecastOffers ? item : max, productTypeData[0])
  const topByAchievement = productTypeData.reduce((max, item) => item.achievement > max.achievement && item.forecastValue > 0 ? item : max, productTypeData[0])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-700">Total Forecast</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalForecastValue)}</p>
            <p className="text-sm text-gray-500">{totalForecastOffers} offers</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-700">Total Actual</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalActualValue)}</p>
            <p className="text-sm text-gray-500">{totalActualOffers} won offers</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-700">Top Product</h3>
            </div>
            <p className="text-lg font-bold text-purple-600">{topByValue?.productType || 'N/A'}</p>
            <p className="text-sm text-gray-500">{formatCurrency(topByValue?.forecastValue || 0)}</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-gray-700">Best Achievement</h3>
            </div>
            <p className="text-lg font-bold text-amber-600">{topByAchievement?.productType || 'N/A'}</p>
            <p className="text-sm text-gray-500">{formatPercent(topByAchievement?.achievement || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Value Comparison */}
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Package className="h-5 w-5 text-blue-600" />
              Product Type Value Analysis
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

        {/* Pie Chart - Distribution */}
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-amber-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Package className="h-5 w-5 text-purple-600" />
              Top 5 Product Types Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [formatCurrency(value), 'Forecast Value']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
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
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actual Offers</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Forecast Value</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actual Value</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Achievement</th>
                </tr>
              </thead>
              <tbody>
                {productTypeData.map((item, index) => (
                  <tr key={item.productType} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.productType}</td>
                    <td className="text-right py-3 px-4 text-gray-600">{item.forecastOffers}</td>
                    <td className="text-right py-3 px-4 text-gray-600">{item.actualOffers}</td>
                    <td className="text-right py-3 px-4 font-medium text-blue-600">{formatCurrency(item.forecastValue)}</td>
                    <td className="text-right py-3 px-4 font-medium text-emerald-600">{formatCurrency(item.actualValue)}</td>
                    <td className="text-right py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.achievement >= 100 ? 'bg-emerald-50 text-emerald-700' :
                        item.achievement >= 80 ? 'bg-blue-50 text-blue-700' :
                        item.achievement >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {formatPercent(item.achievement)}
                      </span>
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
