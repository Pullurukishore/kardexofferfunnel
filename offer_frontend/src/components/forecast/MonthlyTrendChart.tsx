'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  BarChart,
  Legend
} from 'recharts'
import { Calendar, TrendingUp, Activity, BarChart3 } from 'lucide-react'

interface MonthlyData {
  month: number
  monthName: string
  forecast: number
  euro: number
  mtdActual: number
  variance: number
  achievement: number
  byZone: Record<string, number>
}

interface MonthlyTrendChartProps {
  monthlyData: MonthlyData[]
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
            {entry.name}: {entry.name.includes('%') ? formatPercent(entry.value) : formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function MonthlyTrendChart({ monthlyData }: MonthlyTrendChartProps) {
  const trendData = monthlyData.map(month => ({
    month: month.monthName,
    forecast: month.forecast,
    actual: month.mtdActual,
    achievement: month.achievement,
    variance: month.variance,
    offers: month.euro
  }))

  const COLORS = {
    forecast: '#3b82f6',    // blue-500
    actual: '#10b981',      // emerald-500
    achievement: '#8b5cf6', // purple-500
    variance: '#f59e0b',     // amber-500
    offers: '#ef4444'       // rose-500
  }

  return (
    <div className="space-y-6">
      {/* Forecast vs Actual Trend */}
      <Card className="shadow-xl border-0 rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-emerald-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Monthly Forecast vs Actual Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => value >= 10000000 ? `${value/10000000}Cr` : value >= 100000 ? `${value/100000}L` : value}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="forecast" 
                fill={COLORS.forecast} 
                name="Forecast"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="actual" 
                stroke={COLORS.actual} 
                strokeWidth={3}
                name="Actual"
                dot={{ fill: COLORS.actual, strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="achievement" 
                stroke={COLORS.achievement} 
                strokeWidth={2}
                name="Achievement %"
                strokeDasharray="5 5"
                dot={{ fill: COLORS.achievement, strokeWidth: 2, r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Achievement and Variance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-amber-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Activity className="h-5 w-5 text-purple-600" />
              Achievement Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
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
                <Area 
                  type="monotone" 
                  dataKey="achievement" 
                  stroke={COLORS.achievement} 
                  fill={COLORS.achievement}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Achievement %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-rose-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <BarChart3 className="h-5 w-5 text-amber-600" />
              Monthly Offers Count
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  formatter={(value: any) => [value, 'Number of Offers']}
                />
                <Bar 
                  dataKey="offers" 
                  fill={COLORS.offers} 
                  name="Offers Count"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary Stats */}
      <Card className="shadow-xl border-0 rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Calendar className="h-5 w-5 text-gray-600" />
            Monthly Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {monthlyData.map((month) => (
              <div 
                key={month.month} 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{month.monthName}</h4>
                  <div className={`w-2 h-2 rounded-full ${
                    month.achievement >= 100 ? 'bg-emerald-500' :
                    month.achievement >= 80 ? 'bg-blue-500' :
                    month.achievement >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Forecast:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(month.forecast)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Actual:</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(month.mtdActual)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ach:</span>
                    <span className={`font-medium text-xs px-2 py-1 rounded-full ${
                      month.achievement >= 100 ? 'bg-emerald-50 text-emerald-700' :
                      month.achievement >= 80 ? 'bg-blue-50 text-blue-700' :
                      month.achievement >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {formatPercent(month.achievement)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
