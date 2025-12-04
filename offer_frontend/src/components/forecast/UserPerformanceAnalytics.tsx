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
import { Users, TrendingUp, Award, Mail, MapPin } from 'lucide-react'

interface UserPerformanceAnalytics {
  userId: number
  userName: string
  userEmail: string
  zoneName: string
  forecastOffers: number
  forecastValue: number
  actualOffers: number
  actualValue: number
  achievement: number
  productTypes: Record<string, { forecast: number; actual: number }>
}

interface UserAnalyticsProps {
  userPerformance: UserPerformanceAnalytics[]
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

export function UserPerformanceAnalytics({ userPerformance }: UserAnalyticsProps) {
  // Calculate totals
  const totalUsers = userPerformance.length
  const totalForecastValue = userPerformance.reduce((sum, user) => sum + user.forecastValue, 0)
  const totalActualValue = userPerformance.reduce((sum, user) => sum + user.actualValue, 0)
  const avgAchievement = userPerformance.reduce((sum, user) => sum + user.achievement, 0) / totalUsers

  // Top performers
  const topByValue = [...userPerformance].sort((a, b) => b.actualValue - a.actualValue)[0]
  const topByAchievement = [...userPerformance].sort((a, b) => b.achievement - a.achievement)[0]

  // Prepare data for charts
  const performanceData = userPerformance.map(user => ({
    userName: user.userName.length > 15 ? user.userName.substring(0, 15) + '...' : user.userName,
    forecastValue: user.forecastValue,
    actualValue: user.actualValue,
    achievement: user.achievement
  }))

  const achievementDistribution = [
    { name: '≥100%', count: userPerformance.filter(u => u.achievement >= 100).length },
    { name: '80-99%', count: userPerformance.filter(u => u.achievement >= 80 && u.achievement < 100).length },
    { name: '60-79%', count: userPerformance.filter(u => u.achievement >= 60 && u.achievement < 80).length },
    { name: '<60%', count: userPerformance.filter(u => u.achievement < 60).length }
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-700">Total Users</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
            <p className="text-sm text-gray-500">Active users</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-700">Total Value</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalActualValue)}</p>
            <p className="text-sm text-gray-500">Won value</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-700">Avg Achievement</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatPercent(avgAchievement)}</p>
            <p className="text-sm text-gray-500">Across all users</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-gray-700">Top Performer</h3>
            </div>
            <p className="text-lg font-bold text-amber-600">{topByValue?.userName || 'N/A'}</p>
            <p className="text-sm text-gray-500">{formatCurrency(topByValue?.actualValue || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Performance Bar Chart */}
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Users className="h-5 w-5 text-blue-600" />
              User Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="userName" 
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

        {/* Achievement Distribution Pie Chart */}
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-amber-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Award className="h-5 w-5 text-purple-600" />
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
                <Tooltip formatter={(value: any) => [value, 'Users']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed User Performance Table */}
      <Card className="shadow-xl border-0 rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Users className="h-5 w-5 text-gray-600" />
            User Performance Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Forecast Offers</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Forecast Value</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actual Offers</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actual Value</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Achievement</th>
                </tr>
              </thead>
              <tbody>
                {userPerformance.map((user) => (
                  <tr key={user.userId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.userName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.userEmail}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {user.zoneName}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">{user.forecastOffers}</td>
                    <td className="text-right py-3 px-4 font-medium text-blue-600">{formatCurrency(user.forecastValue)}</td>
                    <td className="text-right py-3 px-4 text-gray-600">{user.actualOffers}</td>
                    <td className="text-right py-3 px-4 font-medium text-emerald-600">{formatCurrency(user.actualValue)}</td>
                    <td className="text-right py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.achievement >= 100 ? 'bg-emerald-50 text-emerald-700' :
                        user.achievement >= 80 ? 'bg-blue-50 text-blue-700' :
                        user.achievement >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {formatPercent(user.achievement)}
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
