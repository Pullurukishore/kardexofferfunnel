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
  Legend,
  Cell
} from 'recharts'
import { MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ZonePerformance {
  zoneId: number
  zoneName: string
  forecastOffers: number
  forecastValue: number
  actualOffers: number
  actualValue: number
  achievement: number
}

interface ZonePerformanceChartProps {
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

const getTrendIcon = (value: number) => {
  if (value >= 100) return <TrendingUp className="h-4 w-4 text-emerald-600" />
  if (value >= 80) return <Minus className="h-4 w-4 text-blue-600" />
  return <TrendingDown className="h-4 w-4 text-rose-600" />
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800">{label}</p>
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

export function ZonePerformanceChart({ zonePerformance }: ZonePerformanceChartProps) {
  const chartData = zonePerformance.map(zone => ({
    zoneName: zone.zoneName,
    forecastValue: zone.forecastValue,
    actualValue: zone.actualValue,
    achievement: zone.achievement,
    forecastOffers: zone.forecastOffers,
    actualOffers: zone.actualOffers
  }))

  const COLORS = {
    forecast: '#3b82f6', // blue-500
    actual: '#10b981',   // emerald-500
    achievement: '#8b5cf6' // purple-500
  }

  return (
    <Card className="shadow-xl border-0 rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <MapPin className="h-5 w-5 text-blue-600" />
          Zone Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Value Comparison Chart */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Forecast vs Actual Value
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="zoneName" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
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
                  fill={COLORS.forecast} 
                  name="Forecast Value"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="actualValue" 
                  fill={COLORS.actual} 
                  name="Actual Value"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Achievement Chart */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Achievement Percentage
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="zoneName" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  domain={[0, 120]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  formatter={(value: any) => [formatPercent(value), 'Achievement']}
                />
                <Bar 
                  dataKey="achievement" 
                  name="Achievement %"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getAchievementColor(entry.achievement)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Performance Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zonePerformance.map((zone) => (
            <Card 
              key={zone.zoneId} 
              className="border border-gray-200 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">{zone.zoneName}</h4>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(zone.achievement)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Forecast:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(zone.forecastValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actual:</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(zone.actualValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Achievement:</span>
                    <span 
                      className={`font-medium px-2 py-1 rounded-full text-xs ${getAchievementColor(zone.achievement)}`}
                    >
                      {formatPercent(zone.achievement)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                    <span>{zone.forecastOffers} forecast offers</span>
                    <span>{zone.actualOffers} won offers</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
