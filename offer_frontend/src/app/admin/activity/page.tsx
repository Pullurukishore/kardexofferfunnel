'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  TrendingUp, 
  Calendar,
  Shield,
  Users,
  Clock,
  Eye,
  Target,
  Package,
  Building,
  FileText,
  RefreshCw,
  Download,
  ChevronRight,
  X,
  Info,
  User,
  ArrowRight
} from 'lucide-react';
import { apiService } from '@/services/api';

interface ActivityLog {
  id: number
  action: string
  entityType: string
  entityId: string | null
  details: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  userId: number
  offerId?: number | null
  user: {
    id: number
    name: string
    email: string
    role: string
  }
}

export default function ActivityPage() {
  const [timeframe, setTimeframe] = useState('7');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [users, setUsers] = useState<Array<{id: number, name: string, email: string, role: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [renderKey, setRenderKey] = useState(0); // Force re-render for color updates

  useEffect(() => {
    // Reset and fetch when filters change
    setPage(1);
    fetchActivities(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, selectedUser, selectedAction]);

  useEffect(() => {
    // Fetch users on component mount
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiService.getUsers();
      console.log('ADMIN PAGE - getUsers response:', response); // Debug log
      // API returns { success: true, data: { users: [...] } }
      const usersData = response.data?.users || response.users || [];
      console.log('ADMIN PAGE - Total users fetched:', usersData.length); // Debug log
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]); // Set empty array on error
    }
  };

  const mapTimeframe = (tf: string) => `${tf}d`;

  const fetchActivities = async (targetPage = page, replace = false) => {
    try {
      if (replace) setLoading(true);
      const response = await apiService.getAllActivities({
        timeframe: mapTimeframe(timeframe),
        page: targetPage,
        limit: 50,
        userId: selectedUser !== 'all' ? parseInt(selectedUser) : undefined,
        action: selectedAction !== 'all' ? selectedAction : undefined,
      });
      const newItems: ActivityLog[] = response.activities || [];
      setActivities((prev) => (replace ? newItems : [...prev, ...newItems]));
      const pagination = response.pagination || {};
      const totalPages = pagination.pages || 1;
      setHasMore(targetPage < totalPages);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      if (replace) setLoading(false);
    }
  };

  const formatActivityDetails = (activity: ActivityLog) => {
    if (!activity.details) return '';
    
    const details = activity.details;
    
    // Handle offer updates with changes
    if (activity.action === 'OFFER_UPDATED' && details.changes) {
      const changeList = Object.entries(details.changes).map(([field, change]: [string, any]) => {
        // Special formatting for stage changes
        if (field === 'stage') {
          return `Stage: ${change.from} → ${change.to}`;
        }
        // Special formatting for status changes  
        if (field === 'status') {
          return `Status: ${change.from} → ${change.to}`;
        }
        // Format value changes
        if (field === 'offerValue' || field === 'poValue') {
          return `${field}: ₹${change.from?.toLocaleString() || 0} → ₹${change.to?.toLocaleString() || 0}`;
        }
        // Format date changes
        if (field.includes('Date') || field.includes('Month')) {
          return `${field}: ${change.from || 'N/A'} → ${change.to || 'N/A'}`;
        }
        // General field changes
        return `${field}: ${change.from || 'N/A'} → ${change.to || 'N/A'}`;
      });
      return changeList.join(', ');
    }
    
    // Handle offer creation
    if (activity.action === 'OFFER_CREATED') {
      const parts = [];
      if (details.title) parts.push(`"${details.title}"`);
      if (details.stage) parts.push(`Stage: ${details.stage}`);
      if (details.offerValue) parts.push(`Value: ₹${details.offerValue?.toLocaleString() || 0}`);
      if (details.productType) parts.push(`Type: ${details.productType}`);
      return parts.join(' • ');
    }
    
    // Handle offer status updates
    if (activity.action === 'OFFER_STATUS_UPDATED') {
      const parts = [] as string[];
      if (details.fromStatus || details.toStatus) {
        parts.push(`Status: ${details.fromStatus || 'N/A'} → ${details.toStatus || 'N/A'}`);
      }
      if (details.fromStage || details.toStage) {
        parts.push(`Stage: ${details.fromStage || 'N/A'} → ${details.toStage || 'N/A'}`);
      }
      if (details.notes) parts.push(`Notes: ${details.notes}`);
      return parts.join(' • ');
    }

    // Handle offer note added
    if (activity.action === 'OFFER_NOTE_ADDED') {
      if (details.content) return `Note: ${details.content}`;
    }

    // Handle offer deletion
    if (activity.action === 'OFFER_DELETED') {
      return `Offer ${activity.entityId || ''} deleted`;
    }
    
    // Handle user actions
    if (activity.action.includes('USER')) {
      if (activity.action === 'USER_LOGIN') {
        const ip = activity.ipAddress ? `IP ${activity.ipAddress}` : '';
        const agent = activity.userAgent ? `Device ${activity.userAgent}` : '';
        return ['Login', ip, agent].filter(Boolean).join(' • ');
      }
      if (activity.action === 'USER_LOGOUT') {
        return 'Logout';
      }
      if (details.role) return `Role: ${details.role}`;
      if (details.name) return `Name: ${details.name}`;
      if (details.email) return `Email: ${details.email}`;
    }
    
    // Handle customer actions
    if (activity.action.includes('CUSTOMER')) {
      if (details.companyName) return `"${details.companyName}"`;
      if (details.industry) return `Industry: ${details.industry}`;
      if (details.location) return `Location: ${details.location}`;
    }
    
    // Handle target actions
    if (activity.action.includes('TARGET')) {
      if (details.targetValue) return `Target: ₹${details.targetValue?.toLocaleString() || 0}`;
      if (details.productType) return `Type: ${details.productType}`;
    }
    
    return '';
  };

  const getActivityDescription = (activity: ActivityLog) => {
    const baseAction = activity.action.replace(/_/g, ' ').toLowerCase();
    const details = formatActivityDetails(activity);
    
    if (details) {
      return `${baseAction} • ${details}`;
    }
    
    return baseAction;
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getActionColor = (action: string) => {
    const a = (action || '').toUpperCase().trim();
    console.log('Color for action:', a); // Debug log
    
    // New vibrant color palette
    if (a === 'USER_LOGIN') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (a === 'USER_LOGOUT') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (a === 'OFFER_CREATED') return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    if (a === 'OFFER_UPDATED') return 'bg-violet-100 text-violet-800 border-violet-200';
    if (a === 'OFFER_DELETED') return 'bg-red-100 text-red-800 border-red-200';
    if (a === 'OFFER_STATUS_UPDATED') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (a === 'OFFER_NOTE_ADDED') return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (a === 'USER_CREATED') return 'bg-teal-100 text-teal-800 border-teal-200';
    if (a === 'USER_UPDATED') return 'bg-sky-100 text-sky-800 border-sky-200';
    if (a === 'USER_DELETED') return 'bg-pink-100 text-pink-800 border-pink-200';
    if (a === 'CUSTOMER_CREATED') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (a === 'CUSTOMER_UPDATED') return 'bg-lime-100 text-lime-800 border-lime-200';
    if (a === 'CUSTOMER_DELETED') return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200';
    if (a === 'TARGET_CREATED') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (a === 'TARGET_UPDATED') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (a === 'TARGET_DELETED') return 'bg-slate-100 text-slate-800 border-slate-200';
    
    // Pattern matching with new colors
    if (a.includes('LOGIN')) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (a.includes('LOGOUT')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (a.includes('CREATED')) return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    if (a.includes('UPDATED')) return 'bg-violet-100 text-violet-800 border-violet-200';
    if (a.includes('DELETED')) return 'bg-red-100 text-red-800 border-red-200';
    if (a.includes('STATUS')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (a.includes('NOTE')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (a.includes('FAILED')) return 'bg-red-100 text-red-800 border-red-200';
    if (a.includes('EXPORT') || a.includes('DOWNLOAD')) return 'bg-sky-100 text-sky-800 border-sky-200';
    if (a.includes('SECURITY') || a.includes('ALERT') || a.includes('SUSPICIOUS')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (a.includes('COMPLIANCE') || a.includes('AUDIT')) return 'bg-teal-100 text-teal-800 border-teal-200';
    
    // Default fallback
    console.log('Using default color for:', a);
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const getActivityColor = (action: string) => {
    const a = (action || '').toUpperCase().trim();
    
    // New vibrant hex colors
    if (a === 'USER_LOGIN') return '#f43f5e'; // rose-500
    if (a === 'USER_LOGOUT') return '#f59e0b'; // amber-500
    if (a === 'OFFER_CREATED') return '#06b6d4'; // cyan-500
    if (a === 'OFFER_UPDATED') return '#8b5cf6'; // violet-500
    if (a === 'OFFER_DELETED') return '#ef4444'; // red-500
    if (a === 'OFFER_STATUS_UPDATED') return '#10b981'; // emerald-500
    if (a === 'OFFER_NOTE_ADDED') return '#6366f1'; // indigo-500
    if (a === 'USER_CREATED') return '#14b8a6'; // teal-500
    if (a === 'USER_UPDATED') return '#0ea5e9'; // sky-500
    if (a === 'USER_DELETED') return '#ec4899'; // pink-500
    if (a === 'CUSTOMER_CREATED') return '#f97316'; // orange-500
    if (a === 'CUSTOMER_UPDATED') return '#84cc16'; // lime-500
    if (a === 'CUSTOMER_DELETED') return '#d946ef'; // fuchsia-500
    if (a === 'TARGET_CREATED') return '#a855f7'; // purple-500
    if (a === 'TARGET_UPDATED') return '#3b82f6'; // blue-500
    if (a === 'TARGET_DELETED') return '#64748b'; // slate-500
    
    // Pattern matching with new colors
    if (a.includes('LOGIN')) return '#f43f5e';
    if (a.includes('LOGOUT')) return '#f59e0b';
    if (a.includes('CREATED')) return '#06b6d4';
    if (a.includes('UPDATED')) return '#8b5cf6';
    if (a.includes('DELETED')) return '#ef4444';
    if (a.includes('STATUS')) return '#10b981';
    if (a.includes('NOTE')) return '#6366f1';
    if (a.includes('FAILED')) return '#ef4444';
    
    // Default
    return '#a855f7'; // purple
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'offer': return <Package className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      case 'customer': return <Building className="h-4 w-4" />;
      case 'target': return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Activity Monitor</h1>
            <p className="text-slate-600 mt-2">Real-time system activity and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 day</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActivities([]); // Clear existing activities
                setPage(1);
                setRenderKey(prev => prev + 1); // Force re-render
                fetchActivities(1, true);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Filter by User:</span>
              </div>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Users</SelectItem>
                  {Array.isArray(users) && users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 ml-6">
                <Activity className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Filter by Activity:</span>
              </div>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="OFFER_CREATED">Offer Created</SelectItem>
                  <SelectItem value="OFFER_UPDATED">Offer Updated</SelectItem>
                  <SelectItem value="OFFER_STATUS_UPDATED">Offer Status Changed</SelectItem>
                  <SelectItem value="OFFER_DELETED">Offer Deleted</SelectItem>
                  <SelectItem value="OFFER_NOTE_ADDED">Offer Note Added</SelectItem>
                  <SelectItem value="CUSTOMER_CREATED">Customer Created</SelectItem>
                  <SelectItem value="USER_LOGIN">User Login</SelectItem>
                  <SelectItem value="USER_LOGOUT">User Logout</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1"></div>
              
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="font-medium">{activities.length}</span>
                <span>activities found</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Activity Feed Only */}
        <div className="space-y-6">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {activities.map((activity) => (
                    <div key={`${activity.id}-${renderKey}`} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm flex-shrink-0">
                          {getEntityIcon(activity.entityType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{activity.user.name}</span>
                            <Badge 
                              className={getActionColor(activity.action)}
                              style={{
                                // Fallback inline styles if Tailwind classes don't work
                                backgroundColor: getActivityColor(activity.action),
                                color: 'white',
                                border: `2px solid ${getActivityColor(activity.action)}`,
                              }}
                            >
                              {activity.action.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-sm text-slate-600 capitalize">
                              {activity.entityType}
                            </span>
                          </div>
                          <div className="text-sm text-slate-700 mb-1">
                            {getActivityDescription(activity)}
                          </div>
                          <p className="text-xs text-slate-500">
                            {activity.user.email} • {formatTimeAgo(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        onClick={() => setSelectedActivity(activity)}
                        title="View details"
                      >
                        <ChevronRight className="h-4 w-4" />
                        View more
                      </button>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center py-16 text-slate-500">No activities in this period.</div>
                  )}
                </div>
                {/* Enhanced Activity Detail Modal */}
                {selectedActivity && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                      {/* Header with gradient background */}
                      <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur rounded-xl">
                              {getEntityIcon(selectedActivity.entityType)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg font-semibold">{selectedActivity.user.name}</span>
                                <Badge 
                                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                                >
                                  {selectedActivity.action.replace(/_/g, ' ')}
                                </Badge>
                                <Badge 
                                  className="bg-white/10 text-white border-white/20"
                                >
                                  {selectedActivity.entityType}
                                </Badge>
                              </div>
                              <p className="text-white/90 mb-1">
                                {getActivityDescription(selectedActivity)}
                              </p>
                              <p className="text-white/70 text-sm">
                                {selectedActivity.user.email} • {new Date(selectedActivity.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button
                            className="text-white/70 hover:text-white transition-colors"
                            onClick={() => setSelectedActivity(null)}
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                        {/* Key Information Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-5 w-5 text-blue-600" />
                              <span className="font-medium text-blue-900">User Information</span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-700">Name:</span>
                                <span className="font-medium text-blue-900">{selectedActivity.user.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Role:</span>
                                <span className="font-medium text-blue-900 capitalize">{selectedActivity.user.role}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Email:</span>
                                <span className="font-medium text-blue-900 text-xs">{selectedActivity.user.email}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="h-5 w-5 text-emerald-600" />
                              <span className="font-medium text-emerald-900">Activity Details</span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-emerald-700">Action:</span>
                                <span className="font-medium text-emerald-900 capitalize">{selectedActivity.action.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-emerald-700">Entity:</span>
                                <span className="font-medium text-emerald-900 capitalize">{selectedActivity.entityType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-emerald-700">Entity ID:</span>
                                <span className="font-medium text-emerald-900">{selectedActivity.entityId || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-4 border border-violet-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-5 w-5 text-violet-600" />
                              <span className="font-medium text-violet-900">Timestamp</span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-violet-700">Date:</span>
                                <span className="font-medium text-violet-900">{new Date(selectedActivity.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-violet-700">Time:</span>
                                <span className="font-medium text-violet-900">{new Date(selectedActivity.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-violet-700">Relative:</span>
                                <span className="font-medium text-violet-900">{formatTimeAgo(selectedActivity.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Changes */}
                        {selectedActivity.details && Object.keys(selectedActivity.details).length > 0 && (
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                              <FileText className="h-5 w-5 text-slate-600" />
                              Detailed Changes
                            </h3>
                            <div className="space-y-3">
                              {selectedActivity.action === 'OFFER_UPDATED' && selectedActivity.details.changes ? (
                                <div className="space-y-2">
                                  {Object.entries(selectedActivity.details.changes).map(([field, change]: [string, any]) => (
                                    <div key={field} className="bg-white rounded-lg p-3 border border-slate-200">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-slate-700 capitalize">{field}:</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-red-600 line-through text-sm">{change.from || 'N/A'}</span>
                                          <ArrowRight className="h-4 w-4 text-slate-400" />
                                          <span className="text-green-600 font-medium">{change.to || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-2">
                                  {Object.entries(selectedActivity.details).map(([key, value]) => (
                                    <div key={key} className="bg-white rounded-lg p-3 border border-slate-200">
                                      <div className="flex items-start justify-between">
                                        <span className="font-medium text-slate-700 capitalize">{key}:</span>
                                        <span className="text-slate-600 text-right max-w-md break-all">
                                          {typeof value === 'object' ? (
                                            <pre className="text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                              {JSON.stringify(value, null, 2)}
                                            </pre>
                                          ) : (
                                            <span className="font-medium">{String(value)}</span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-600">
                            Activity logged on {new Date(selectedActivity.createdAt).toLocaleString()}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedActivity(null)}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {hasMore && (
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const next = page + 1;
                        setPage(next);
                        fetchActivities(next);
                      }}
                    >
                      Load more
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
