'use client'

import { useState, useEffect, useRef } from 'react'
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
  Activity,
  BarChart3,
  Bell, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  User, 
  FileText, 
  Edit, 
  Trash2, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Info,
  Eye,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Zap,
  Shield,
  Globe,
  Monitor,
  Users,
  Target,
  Timer,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts'
import { apiService } from '@/services/api'

interface ActivityLog {
  id: number
  action: string
  entityType: string
  entityId: string | null
  details: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  userId: number | null
  offerId: number | null
  user: {
    id: number
    name: string | null
    email: string
    role?: string
  } | null
}

interface ActivityResponse {
  success: boolean
  activities: ActivityLog[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: {
    total: number
    todayCount: number
    yesterdayCount: number
    weekCount: number
    monthCount: number
    todayVsYesterday: number
    uniqueUsersCount: number
    actionCounts: Record<string, number>
    entityTypeStats: Record<string, number>
  }
  analytics: {
    hourlyActivity: Array<{ hour: string; count: number }>
    topUsers: Array<{ id: number; name: string; email: string; role: string; activityCount: number }>
    entityTypes: Array<{ entityType: string; _count: number }>
    ipAddresses: Array<{ ipAddress: string; _count: number }>
  }
  uniqueUsers: Array<{ id: number; name: string; email: string; role: string; activityCount: number }>
}

interface ActivityStats {
  totalActivities: number
  offerCreated: number
  offerUpdated: number
  offerDeleted: number
  statusChanged: number
  avgActivitiesPerDay: number
  topUsers: Array<{ userId: number; userName: string; userEmail: string; userRole: string; activityCount: number }>
  dailyTrend: Array<{ date: string; count: number; unique_users: number }>
  peakHours: Array<{ hour: number; count: number }>
  riskActivities: number
  timeframeAnalysis: {
    period: number
    velocity: number
    efficiency: number
  }
}

const actionTypes = [
  'All Actions',
  'OFFER_CREATED',
  'OFFER_UPDATED',
  'OFFER_DELETED',
  'OFFER_STATUS_UPDATED',
  'OFFER_NOTE_ADDED',
  'USER_LOGIN',
  'USER_LOGOUT',
  'TARGET_CREATED',
  'TARGET_UPDATED'
]

const timeframeOptions = [
  { label: 'Last 24 Hours', value: '1d' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Last Year', value: '1y' }
]

const viewModes = [
  { label: 'Timeline', value: 'timeline' },
  { label: 'Analytics', value: 'analytics' },
  { label: 'Real-time', value: 'realtime' }
]

export default function ActivityLogs() {
  const [activityData, setActivityData] = useState<ActivityResponse | null>(null)
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState('All Actions')
  const [selectedUser, setSelectedUser] = useState('All Users')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [timeframe, setTimeframe] = useState('7d')
  const [viewMode, setViewMode] = useState('timeline')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [realtimeActivities, setRealtimeActivities] = useState<ActivityLog[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchActivities()
    if (viewMode === 'analytics') {
      fetchActivityStats()
    }
  }, [searchTerm, selectedAction, selectedUser, dateFrom, dateTo, currentPage, timeframe, viewMode])

  useEffect(() => {
    if (autoRefresh && viewMode === 'realtime') {
      intervalRef.current = setInterval(() => {
        fetchRealtimeActivities()
      }, 5000) // Refresh every 5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, viewMode])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {
        page: currentPage,
        limit: 50,
        timeframe
      }
      if (searchTerm) params.search = searchTerm
      if (selectedAction !== 'All Actions') params.action = selectedAction
      if (selectedUser !== 'All Users') params.userId = selectedUser
      if (dateFrom) params.startDate = new Date(dateFrom).toISOString()
      if (dateTo) params.endDate = new Date(dateTo).toISOString()

      const data = await apiService.getAllActivities(params)
      setActivityData(data)
    } catch (err) {
      console.error('Failed to fetch activities:', err)
      setError('Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivityStats = async () => {
    try {
      const data = await apiService.getActivityStats({ timeframe })
      setActivityStats(data.stats)
    } catch (err) {
      console.error('Failed to fetch activity stats:', err)
    }
  }

  const fetchRealtimeActivities = async () => {
    try {
      const lastActivity = realtimeActivities[0]
      const since = lastActivity ? lastActivity.createdAt : new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const data = await apiService.getRealtimeActivities({ since })
      if (data.activities.length > 0) {
        setRealtimeActivities(prev => [...data.activities, ...prev].slice(0, 100))
      }
    } catch (err) {
      console.error('Failed to fetch realtime activities:', err)
    }
  }

  const getSeverity = (action: string) => {
    if (action.includes('CREATED')) return 'success'
    if (action.includes('DELETED') || action.includes('FAILED')) return 'error'
    if (action.includes('UPDATED') || action.includes('STATUS')) return 'info'
    return 'info'
  }

  const getSeverityIcon = (action: string) => {
    const severity = getSeverity(action)
    switch (severity) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityColor = (action: string) => {
    const severity = getSeverity(action)
    switch (severity) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('OFFER')) return <FileText className="h-4 w-4" />
    if (action.includes('USER')) return <User className="h-4 w-4" />
    if (action.includes('LOGIN')) return <User className="h-4 w-4" />
    return <Bell className="h-4 w-4" />
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleExport = async () => {
    try {
      const params = {
        search: searchTerm,
        action: selectedAction !== 'All Actions' ? selectedAction : undefined,
        userId: selectedUser !== 'All Users' ? selectedUser : undefined,
        startDate: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        endDate: dateTo ? new Date(dateTo).toISOString() : undefined,
        format: 'csv'
      }
      
      // Create CSV content
      const activities = activityData?.activities || []
      const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address']
      const csvContent = [
        headers.join(','),
        ...activities.map(activity => [
          new Date(activity.createdAt).toLocaleString(),
          activity.user?.name || activity.user?.email || 'System',
          activity.action,
          activity.entityType,
          activity.entityId || '',
          activity.ipAddress || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n')
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const refreshLogs = () => {
    fetchActivities()
    if (viewMode === 'analytics') {
      fetchActivityStats()
    }
    if (viewMode === 'realtime') {
      fetchRealtimeActivities()
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedAction('All Actions')
    setSelectedUser('All Users')
    setDateFrom('')
    setDateTo('')
    setTimeframe('7d')
    setCurrentPage(1)
  }

  const getActionDescription = (log: ActivityLog): string => {
    const actionMap: Record<string, string> = {
      'OFFER_CREATED': `Created offer ${log.entityId}`,
      'OFFER_UPDATED': `Updated offer ${log.entityId}`,
      'OFFER_DELETED': `Deleted offer ${log.entityId}`,
      'OFFER_STATUS_UPDATED': `Changed status for ${log.entityId}`,
      'OFFER_NOTE_ADDED': `Added note to ${log.entityId}`,
      'USER_LOGIN': 'User logged in',
      'USER_LOGOUT': 'User logged out',
      'TARGET_CREATED': `Created target ${log.entityId}`,
      'TARGET_UPDATED': `Updated target ${log.entityId}`
    }
    return actionMap[log.action] || log.action
  }

  const uniqueUsers = activityData 
    ? ['All Users', ...activityData.uniqueUsers.map(u => String(u.id))]
    : ['All Users']

  const getUserName = (userId: string) => {
    if (!activityData || userId === 'All Users') return userId
    const user = activityData.uniqueUsers.find(u => String(u.id) === userId)
    return user ? (user.name || user.email) : userId
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'ADMIN': 'bg-purple-100 text-purple-800',
      'ZONE_USER': 'bg-blue-100 text-blue-800',
      'USER': 'bg-green-100 text-green-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date().getTime()
    const activityTime = new Date(timestamp).getTime()
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading && !activityData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading activity logs...</p>
        </div>
      </div>
    )
  }

  if (error && !activityData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">{error}</p>
          <Button onClick={refreshLogs} className="mt-4">Retry</Button>
        </div>
      </div>
    )
  }

  const activities = viewMode === 'realtime' ? realtimeActivities : (activityData?.activities || [])
  const stats = activityData?.stats || { 
    total: 0, 
    todayCount: 0, 
    yesterdayCount: 0, 
    weekCount: 0, 
    monthCount: 0, 
    todayVsYesterday: 0,
    uniqueUsersCount: 0, 
    actionCounts: {},
    entityTypeStats: {}
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">Track all system activities and user actions</p>
        </div>
        <div className="flex gap-3">
          {/* View Mode Selector */}
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {viewModes.map(mode => (
                <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Real-time Toggle */}
          {viewMode === 'realtime' && (
            <Button 
              variant={autoRefresh ? "default" : "outline"} 
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
          )}

          <Button variant="outline" onClick={refreshLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {viewMode !== 'realtime' && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Advanced Filters
              </CardTitle>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Filter */}
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueUsers.map(userId => (
                    <SelectItem key={userId} value={userId}>{getUserName(userId)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="datetime-local"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="datetime-local"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={clearFilters}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <p className="text-sm text-gray-600">
              Showing {activities.length} of {stats.total} logs
            </p>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Activity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
              {stats.todayVsYesterday !== undefined && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${stats.todayVsYesterday >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.todayVsYesterday >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {Math.abs(stats.todayVsYesterday).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Total Activities</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.total.toLocaleString()}</h3>
              <p className="text-xs text-slate-500">All time</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-600 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Today's Activity</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.todayCount}</h3>
              <p className="text-xs text-slate-500">vs {stats.yesterdayCount || 0} yesterday</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Offer Actions</p>
              <h3 className="text-3xl font-bold text-slate-900">
                {(stats.actionCounts['OFFER_CREATED'] || 0) + (stats.actionCounts['OFFER_UPDATED'] || 0)}
              </h3>
              <p className="text-xs text-slate-500">Created + Updated</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Active Users</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.uniqueUsersCount}</h3>
              <p className="text-xs text-slate-500">This period</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Activity Timeline */}
      {viewMode === 'timeline' && (
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-indigo-600" />
                Activity Timeline
              </CardTitle>
              {activities.length > 0 && (
                <span className="text-sm text-slate-500">
                  Last updated: {formatTimeAgo(activities[0].createdAt)}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {activities.map((log) => (
              <div key={log.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icon and Severity */}
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full ${getSeverityColor(log.action).replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 text-')}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getSeverityColor(log.action)}`}>
                        {getSeverityIcon(log.action)}
                        {getSeverity(log.action).toUpperCase()}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">{getActionDescription(log)}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.user?.name || log.user?.email || 'System'}
                        </span>
                        {log.entityType && (
                          <span className="flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            {log.entityType}
                          </span>
                        )}
                        {log.entityId && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {log.entityId}
                          </span>
                        )}
                        {log.ipAddress && <span>{log.ipAddress}</span>}
                      </div>

                      {/* Additional Details */}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <details>
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                              View Details
                            </summary>
                            <div className="mt-1 space-y-1">
                              {Object.entries(log.details).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium text-gray-600">{key}:</span>
                                  <span className="text-gray-900">
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {formatTimestamp(log.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>

            {activities.length === 0 && (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activity logs found matching your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && activityStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Trend</CardTitle>
              <CardDescription>Daily activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityStats.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Peak Hours Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Activity Hours</CardTitle>
              <CardDescription>Activity distribution by hour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityStats.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time View */}
      {viewMode === 'realtime' && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-green-600" />
                Real-time Activity Monitor
                {autoRefresh && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2" />}
              </CardTitle>
              <div className="text-sm text-slate-500">
                {realtimeActivities.length} recent activities
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {realtimeActivities.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border-l-4 border-l-blue-400">
                  <div className={`p-2 rounded-full ${getSeverityColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{getActionDescription(log)}</span>
                      {log.user?.role && (
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getRoleColor(log.user.role)}`}>
                          {log.user.role}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {log.user?.name || log.user?.email || 'System'} • {formatTimeAgo(log.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              
              {realtimeActivities.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No recent activity</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {autoRefresh ? 'Monitoring for new activities...' : 'Click the Live button to start monitoring'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

