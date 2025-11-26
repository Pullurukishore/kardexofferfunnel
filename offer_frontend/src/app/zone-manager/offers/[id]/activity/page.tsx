'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Activity,
  Clock,
  User,
  FileText,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Package,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Globe,
  Monitor,
  Filter,
  Download
} from 'lucide-react'
import { apiService } from '@/services/api'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface AuditLog {
  id: number
  entityType: string
  entityId: string
  action: string
  details: any
  userId: number
  ipAddress: string | null
  userAgent: string | null
  offerId: number | null
  createdAt: string
  user: {
    id: number
    name: string | null
    email: string
  } | null
}

interface Activity extends AuditLog {}

// Activity action configuration with icons and colors
const ACTION_CONFIG: Record<string, { 
  label: string
  icon: any
  color: string
  bgColor: string
  description: string
}> = {
  'OFFER_CREATED': {
    label: 'Offer Created',
    icon: Plus,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'New offer was created'
  },
  'OFFER_UPDATED': {
    label: 'Offer Updated',
    icon: Edit,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Offer details were modified'
  },
  'OFFER_STATUS_UPDATED': {
    label: 'Status Changed',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Offer status or stage was changed'
  },
  'OFFER_DELETED': {
    label: 'Offer Deleted',
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Offer was deleted'
  },
  'OFFER_NOTE_ADDED': {
    label: 'Note Added',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'A note was added to the offer'
  },
  'USER_LOGIN': {
    label: 'User Login',
    icon: User,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'User logged into the system'
  },
  'USER_LOGOUT': {
    label: 'User Logout',
    icon: User,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'User logged out of the system'
  }
}

// Stage colors for visual distinction
const STAGE_COLORS: Record<string, string> = {
  'INITIAL': 'bg-blue-600 hover:bg-blue-700',
  'PROPOSAL_SENT': 'bg-indigo-600 hover:bg-indigo-700',
  'NEGOTIATION': 'bg-amber-600 hover:bg-amber-700',
  'FINAL_APPROVAL': 'bg-purple-600 hover:bg-purple-700',
  'PO_RECEIVED': 'bg-green-600 hover:bg-green-700',
  'ORDER_BOOKED': 'bg-teal-600 hover:bg-teal-700',
  'WON': 'bg-emerald-600 hover:bg-emerald-700',
  'LOST': 'bg-red-600 hover:bg-red-700',
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
  'DRAFT': 'bg-gray-600 hover:bg-gray-700',
  'OPEN': 'bg-blue-600 hover:bg-blue-700',
  'IN_PROGRESS': 'bg-indigo-600 hover:bg-indigo-700',
  'QUOTED': 'bg-purple-600 hover:bg-purple-700',
  'NEGOTIATION': 'bg-amber-600 hover:bg-amber-700',
  'WON': 'bg-green-600 hover:bg-green-700',
  'LOST': 'bg-red-600 hover:bg-red-700',
  'ON_HOLD': 'bg-orange-600 hover:bg-orange-700',
  'CANCELLED': 'bg-gray-600 hover:bg-gray-700',
}

// Field labels and descriptions for better display
const FIELD_CONFIG: Record<string, { label: string; description: string; icon?: any }> = {
  title: { label: 'Title', description: 'Offer title or name', icon: FileText },
  description: { label: 'Description', description: 'Detailed offer description', icon: FileText },
  productType: { label: 'Product Type', description: 'Type of product or service', icon: Package },
  lead: { label: 'Lead Status', description: 'Whether this is a lead opportunity', icon: TrendingUp },
  status: { label: 'Status', description: 'Current offer status', icon: CheckCircle },
  stage: { label: 'Stage', description: 'Current stage in the sales pipeline', icon: TrendingUp },
  priority: { label: 'Priority', description: 'Offer priority level', icon: AlertTriangle },
  offerValue: { label: 'Offer Value', description: 'Total value of the offer', icon: TrendingUp },
  offerMonth: { label: 'Offer Month', description: 'Month when offer was created', icon: Calendar },
  poExpectedMonth: { label: 'PO Expected Month', description: 'Expected month for PO receipt', icon: Calendar },
  probabilityPercentage: { label: 'Win Probability', description: 'Likelihood of winning this offer', icon: TrendingUp },
  poNumber: { label: 'PO Number', description: 'Purchase Order number', icon: FileText },
  poDate: { label: 'PO Date', description: 'Date when PO was received', icon: Calendar },
  poValue: { label: 'PO Value', description: 'Value of the Purchase Order', icon: TrendingUp },
  poReceivedMonth: { label: 'PO Received Month', description: 'Month when PO was received', icon: Calendar },
  assignedToId: { label: 'Assigned To', description: 'User responsible for this offer', icon: User },
  remarks: { label: 'Remarks', description: 'Additional notes or comments', icon: FileText },
  openFunnel: { label: 'Open Funnel', description: 'Whether offer is in open funnel', icon: CheckCircle },
  company: { label: 'Company', description: 'Customer company name', icon: User },
  location: { label: 'Location', description: 'Customer location', icon: Globe },
  department: { label: 'Department', description: 'Customer department', icon: User },
  contactPersonName: { label: 'Contact Person', description: 'Primary contact person', icon: User },
  contactNumber: { label: 'Contact Number', description: 'Contact phone number', icon: User },
  email: { label: 'Email', description: 'Contact email address', icon: User },
  machineSerialNumber: { label: 'Machine Serial Number', description: 'Serial number of the machine', icon: Package }
}

export default function OfferActivityPage() {
  const params = useParams()
  const router = useRouter()
  const offerId = params.id as string

  const [offerReferenceNumber, setOfferReferenceNumber] = useState<string>('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set())
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    pages: 0
  })

  // Fetch offer to get reference number
  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const response = await apiService.api.get(`/offers/${offerId}`)
        const offer = response.data.offer
        setOfferReferenceNumber(offer.offerReferenceNumber)
      } catch (error) {
        console.error('Failed to fetch offer:', error)
        toast.error('Failed to load offer details')
      }
    }

    if (offerId) {
      fetchOffer()
    }
  }, [offerId])

  const fetchActivities = async (showLoadingState = true) => {
    if (!offerReferenceNumber) return

    try {
      if (showLoadingState) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      console.log('Fetching activities for offer:', offerReferenceNumber)
      const encodedReference = encodeURIComponent(offerReferenceNumber)
      const response = await apiService.api.get(
        `/activities/offer/${encodedReference}?page=${pagination.page}&limit=${pagination.limit}`
      )
      const data = response.data
      console.log('Activities response:', data)

      if (data.success) {
        setActivities(data.activities || [])
        setPagination(data.pagination || pagination)
        console.log('Activities loaded:', data.activities?.length || 0)
      } else {
        console.error('Failed to fetch activities:', data.message)
        toast.error(data.message || 'Failed to fetch activities')
      }
    } catch (error: any) {
      console.error('Fetch activities error:', error)
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch activities')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (offerReferenceNumber) {
      fetchActivities()
    }
  }, [offerReferenceNumber, pagination.page])

  const handleRefresh = () => {
    fetchActivities(false)
  }

  const toggleActivity = (activityId: number) => {
    const newExpanded = new Set(expandedActivities)
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId)
    } else {
      newExpanded.add(activityId)
    }
    setExpandedActivities(newExpanded)
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A'
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (typeof value === 'number') {
      return value.toLocaleString('en-IN')
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return format(new Date(value), 'dd MMM yyyy')
      } catch {
        return value
      }
    }
    return String(value)
  }

  const getActivitySummary = (activity: Activity): string => {
    switch (activity.action) {
      case 'OFFER_CREATED':
        return `Created new offer ${activity.details?.title ? `"${activity.details.title}"` : ''} ${activity.details?.company ? `for ${activity.details.company}` : ''}`
      case 'OFFER_UPDATED':
        const changeCount = Object.keys(activity.details?.changes || {}).length
        return `Updated ${changeCount} field${changeCount !== 1 ? 's' : ''}`
      case 'OFFER_STATUS_UPDATED':
        return `Changed from ${activity.details?.fromStatus || 'N/A'} to ${activity.details?.toStatus || 'N/A'}`
      case 'OFFER_DELETED':
        return `Deleted offer ${activity.details?.offerReferenceNumber || ''}`
      case 'OFFER_NOTE_ADDED':
        return 'Added a note to the offer'
      default:
        return activity.action.replace(/_/g, ' ').toLowerCase()
    }
  }

  const renderActivityDetails = (activity: Activity) => {
    const config = ACTION_CONFIG[activity.action] || {
      label: activity.action.replace(/_/g, ' '),
      icon: Activity,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      description: ''
    }

    const isExpanded = expandedActivities.has(activity.id)
    const hasDetails = activity.details && Object.keys(activity.details).length > 0
    const summary = getActivitySummary(activity)

    return (
      <div className="group">
        <div 
          className={`flex items-start gap-4 p-4 rounded-lg border bg-white hover:shadow-md hover:border-gray-400 transition-all ${
            hasDetails ? 'cursor-pointer' : ''
          }`}
          onClick={() => hasDetails && toggleActivity(activity.id)}
        >
          {/* Icon */}
          <div className={`${config.bgColor} ${config.color} p-3 rounded-lg shrink-0`}>
            <config.icon className="h-5 w-5" />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{config.label}</h3>
                  <Badge variant="outline" className="text-xs font-mono">
                    {activity.action}
                  </Badge>
                </div>
                
                {/* Activity Summary */}
                <p className="text-sm text-gray-700 mb-2">{summary}</p>

                {/* Show Stage Changes Inline (Collapsed View) */}
                {activity.action === 'OFFER_UPDATED' && activity.details?.changes?.stage && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 font-medium">Stage:</span>
                      <Badge variant="outline" className="text-xs">
                        {activity.details.changes.stage.from}
                      </Badge>
                      <ArrowLeft className="h-3 w-3 text-gray-400 rotate-180" />
                      <Badge variant="default" className={`text-xs ${STAGE_COLORS[activity.details.changes.stage.to] || 'bg-purple-600'}`}>
                        {activity.details.changes.stage.to}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Show Stage for OFFER_STATUS_UPDATED */}
                {activity.action === 'OFFER_STATUS_UPDATED' && activity.details?.fromStage && activity.details?.toStage && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 font-medium">Stage:</span>
                      <Badge variant="outline" className="text-xs">
                        {activity.details.fromStage}
                      </Badge>
                      <ArrowLeft className="h-3 w-3 text-gray-400 rotate-180" />
                      <Badge variant="default" className={`text-xs ${STAGE_COLORS[activity.details.toStage] || 'bg-purple-600'}`}>
                        {activity.details.toStage}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Show Initial Stage for OFFER_CREATED */}
                {activity.action === 'OFFER_CREATED' && activity.details?.stage && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 font-medium">Initial Stage:</span>
                      <Badge variant="default" className={`text-xs ${STAGE_COLORS[activity.details.stage] || 'bg-blue-600'}`}>
                        {activity.details.stage}
                      </Badge>
                    </div>
                  </div>
                )}

                {activity.user && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                        {(activity.user.name || activity.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.user.name || activity.user.email}</p>
                        <p className="text-xs text-gray-500">{activity.user.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(activity.createdAt), 'dd MMM yyyy, hh:mm a')}
                  </span>
                </div>
              </div>

              {hasDetails && (
                <Button variant="ghost" size="sm" className="shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Expanded Details */}
            {isExpanded && hasDetails && (
              <div className="mt-4 pt-4 border-t">
                {/* Status/Stage Changes */}
                {(activity.action === 'OFFER_STATUS_UPDATED' || activity.action === 'OFFER_STATUS_CHANGED') && (
                  <div className="space-y-3">
                    {activity.details.fromStatus && activity.details.toStatus && (
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <span className="text-gray-600 font-medium">Status:</span>
                          <Badge variant="outline" className="ml-2">
                            {activity.details.fromStatus}
                          </Badge>
                          <span className="mx-2 text-gray-400">→</span>
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            {activity.details.toStatus}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {activity.details.fromStage && activity.details.toStage && (
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <span className="text-gray-600 font-medium">Stage:</span>
                          <Badge variant="outline" className="ml-2">
                            {activity.details.fromStage}
                          </Badge>
                          <span className="mx-2 text-gray-400">→</span>
                          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                            {activity.details.toStage}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {activity.details.notes && (
                      <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
                        <p className="text-gray-600 font-medium mb-1">Notes:</p>
                        <p className="text-gray-800">{activity.details.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Field Changes */}
                {activity.action === 'OFFER_UPDATED' && activity.details.changes && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Changes Made ({Object.keys(activity.details.changes).length})
                      </p>
                    </div>

                    {/* All Field Changes (including status/stage) */}
                    <div className="space-y-3">
                      {Object.entries(activity.details.changes)
                        .map(([field, change]: [string, any]) => {
                          const fieldConfig = FIELD_CONFIG[field] || { label: field, description: '', icon: FileText }
                          const FieldIcon = fieldConfig.icon
                          return (
                            <div key={field} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  <FieldIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-gray-900">
                                      {fieldConfig.label}
                                    </p>
                                    {fieldConfig.description && (
                                      <span className="text-xs text-gray-500">• {fieldConfig.description}</span>
                                    )}
                                  </div>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-start gap-3">
                                      <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Previous Value</p>
                                        <div className="px-3 py-2 bg-red-50 rounded border border-red-200 text-sm">
                                          <span className="text-red-700 line-through">
                                            {formatValue(change.from)}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center pt-6">
                                        <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">New Value</p>
                                        <div className="px-3 py-2 bg-green-50 rounded border border-green-200 text-sm">
                                          <span className="text-green-700 font-medium">
                                            {formatValue(change.to)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Offer Created Details */}
                {activity.action === 'OFFER_CREATED' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Offer Creation Details
                      </p>
                      <p className="text-xs text-green-700">Initial values set when the offer was created</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {activity.details.title && (
                        <div className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <p className="text-gray-600 font-medium">Title</p>
                          </div>
                          <p className="font-semibold text-gray-900">{activity.details.title}</p>
                        </div>
                      )}
                      {activity.details.productType && (
                        <div className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-purple-600" />
                            <p className="text-gray-600 font-medium">Product Type</p>
                          </div>
                          <Badge variant="default" className="bg-purple-600">{activity.details.productType}</Badge>
                        </div>
                      )}
                      {activity.details.company && (
                        <div className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-indigo-600" />
                            <p className="text-gray-600 font-medium">Company</p>
                          </div>
                          <p className="font-semibold text-gray-900">{activity.details.company}</p>
                        </div>
                      )}
                      {activity.details.offerValue && (
                        <div className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <p className="text-gray-600 font-medium">Offer Value</p>
                          </div>
                          <p className="font-semibold text-gray-900 text-lg">₹{formatValue(activity.details.offerValue)}</p>
                        </div>
                      )}
                      {activity.details.stage && (
                        <div className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-amber-600" />
                            <p className="text-gray-600 font-medium">Initial Stage</p>
                          </div>
                          <Badge variant="default" className={`text-sm ${STAGE_COLORS[activity.details.stage] || 'bg-purple-600'}`}>{activity.details.stage}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Note Content */}
                {activity.action === 'OFFER_NOTE_ADDED' && activity.details.content && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-sm">
                    <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Note Content:
                    </p>
                    <p className="text-gray-800 leading-relaxed">{activity.details.content}</p>
                  </div>
                )}

                {/* Generic Details Display */}
                {!['OFFER_STATUS_UPDATED', 'OFFER_UPDATED', 'OFFER_CREATED', 'OFFER_NOTE_ADDED'].includes(activity.action) && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(activity.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading activity timeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/offers/${offerId}`)}
          className="mb-4 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Offer
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              Activity Timeline
            </h1>
            <p className="text-gray-600 mt-2">
              Complete activity history for offer <span className="font-mono font-semibold text-gray-900">{offerReferenceNumber}</span>
            </p>
          </div>

          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
            className="hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Activities</p>
                <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Updates</p>
                <p className="text-3xl font-bold text-gray-900">
                  {activities.filter(a => a.action === 'OFFER_UPDATED').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Edit className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Stage Changes</p>
                <p className="text-2xl font-bold">
                  {activities.filter(a => 
                    (a.action === 'OFFER_UPDATED' && a.details?.changes?.stage) || 
                    (a.action === 'OFFER_STATUS_UPDATED' && a.details?.fromStage && a.details?.toStage)
                  ).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Contributors</p>
                <p className="text-3xl font-bold text-gray-900">
                  {new Set(activities.map(a => a.userId).filter(Boolean)).size}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <User className="h-8 w-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            Showing {activities.length} of {pagination.total} activities
            {activities.length > 0 && ` • Click on any activity to view detailed changes`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {activities.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Activity history will appear here as changes are made to this offer. All updates, status changes, and modifications will be tracked.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={activity.id} className="relative">
                  {/* Timeline connector */}
                  {index !== activities.length - 1 && (
                    <div className="absolute left-[26px] top-[60px] w-0.5 h-full bg-gray-200 -z-10" />
                  )}
                  {renderActivityDetails(activity)}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <p className="text-sm text-gray-600">
                Page <span className="font-semibold">{pagination.page}</span> of <span className="font-semibold">{pagination.pages}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
