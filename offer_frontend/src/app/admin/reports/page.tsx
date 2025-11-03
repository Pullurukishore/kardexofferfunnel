'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  AreaChart,
  Area,
  ComposedChart,
  Legend
} from 'recharts'
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Users, 
  Target,
  Filter,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { apiService } from '@/services/api'

interface ReportData {
  summary: {
    totalOffers: number
    activeOffers: number
    wonOffers: number
    lostOffers: number
    totalValue: number
    wonValue: number
    avgDealSize: number
    winRate: number
    offerGrowth: number
    valueGrowth: number
  }
  offersByStage: Array<{ name: string; value: number; color: string }>
  zonePerformance: Array<{ zone: string; offers: number; value: number; avgDeal: number }>
  monthlyTrends: Array<{ month: string; offers: number; value: number; won: number; lost: number }>
  userPerformance: Array<{ name: string; zoneName: string; offers: number; value: number; winRate: number }>
  conversionFunnel: Array<{ stage: string; count: number; percentage: number }>
}

export default function AnalyticsReports() {
  const [dateRange, setDateRange] = useState('last30days')
  const [selectedZone, setSelectedZone] = useState('all')
  const [selectedMetric, setSelectedMetric] = useState('offers')
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch report data
  useEffect(() => {
    fetchReportData()
  }, [dateRange, selectedZone])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {}
      if (selectedZone !== 'all') {
        params.zoneId = selectedZone
      }
      const data = await apiService.getAnalyticsReport(params)
      setReportData(data)
    } catch (err) {
      console.error('Failed to fetch report data:', err)
      setError('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
  }

  const handleExport = async (type: string) => {
    try {
      const result = await apiService.exportReport(type)
      console.log(`Exporting ${type} report...`, result)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const refreshData = () => {
    fetchReportData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading report data...</p>
        </div>
      </div>
    )
  }

  if (error || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-600 font-medium">{error || 'No data available'}</p>
          <Button onClick={refreshData} className="mt-4">Retry</Button>
        </div>
      </div>
    )
  }

  const { summary } = reportData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last90days">Last 90 Days</SelectItem>
                  <SelectItem value="thisyear">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Zone</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  <SelectItem value="north">North Zone</SelectItem>
                  <SelectItem value="south">South Zone</SelectItem>
                  <SelectItem value="east">East Zone</SelectItem>
                  <SelectItem value="west">West Zone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Primary Metric</Label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offers">Offer Count</SelectItem>
                  <SelectItem value="value">Offer Value</SelectItem>
                  <SelectItem value="winrate">Win Rate</SelectItem>
                  <SelectItem value="avgdeal">Avg Deal Size</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Date</Label>
              <Input type="date" disabled={dateRange !== 'custom'} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOffers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {summary.offerGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={summary.offerGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(summary.offerGrowth).toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {summary.valueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={summary.valueGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(summary.valueGrowth).toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.wonOffers} won, {summary.lostOffers} lost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.avgDealSize)}</div>
            <p className="text-xs text-muted-foreground">
              Average per offer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offer Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Offer Trends</CardTitle>
            <CardDescription>Monthly offer count and value over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={reportData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" tickFormatter={formatNumber} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'value' ? formatCurrency(Number(value)) : value,
                    name === 'offers' ? 'Offers' : name === 'value' ? 'Value' : name
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="offers" fill="#3B82F6" name="Offers" />
                <Line yAxisId="right" type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} name="Value" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Offer Status Distribution</CardTitle>
            <CardDescription>Current status breakdown of all offers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.offersByStage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.offersByStage.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Zone Performance</CardTitle>
            <CardDescription>Performance metrics by zone</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.zonePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Total Value']} />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win/Loss Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Trends</CardTitle>
            <CardDescription>Monthly win and loss tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="won" stackId="1" stroke="#10B981" fill="#10B981" name="Won" />
                <Area type="monotone" dataKey="lost" stackId="1" stroke="#EF4444" fill="#EF4444" name="Lost" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Conversion Funnel</CardTitle>
            <CardDescription>Offer progression through sales stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.conversionFunnel.map((stage: any, index: number) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{stage.count}</span>
                      <span className="text-xs text-gray-500">({stage.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                  {index < reportData.conversionFunnel.length - 1 && (
                    <div className="absolute right-0 top-8 text-xs text-red-500">
                      -{reportData.conversionFunnel[index].count - reportData.conversionFunnel[index + 1].count}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Best performing users by win rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.userPerformance
                .slice(0, 5)
                .map((user: any, index: number) => (
                <div key={user.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.zoneName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.winRate}%</p>
                    <p className="text-xs text-gray-500">{user.offers} offers</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Zone Performance</CardTitle>
          <CardDescription>Comprehensive metrics for each zone</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Zone</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Total Offers</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Total Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Avg Deal Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.zonePerformance.map((zone: any) => (
                  <tr key={zone.zone} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{zone.zone}</td>
                    <td className="px-4 py-3 text-gray-600">{zone.offers}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(zone.value)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(zone.avgDeal)}</td>
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
