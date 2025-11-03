'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft, 
  Edit, 
  CheckCircle, 
  Clock, 
  FileText, 
  DollarSign,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  TrendingUp,
  AlertCircle,
  Loader2,
  Wrench,
  IndianRupee,
  ImageIcon
} from 'lucide-react'
import { apiService } from '@/services/api'
import { toast } from 'sonner'

// Main progression stages (excludes LOST as it's a separate outcome)
const STAGES = [
  { key: 'INITIAL', label: 'Initial', icon: FileText },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent', icon: FileText },
  { key: 'NEGOTIATION', label: 'Negotiation', icon: TrendingUp },
  { key: 'FINAL_APPROVAL', label: 'Final Approval', icon: CheckCircle },
  { key: 'PO_RECEIVED', label: 'PO Received', icon: Package },
  { key: 'ORDER_BOOKED', label: 'Order Booked', icon: CheckCircle },
  { key: 'WON', label: 'Won', icon: CheckCircle }
]

// LOST is a separate outcome, not part of linear progression
const LOST_STAGE = { key: 'LOST', label: 'Lost', icon: AlertCircle }

// All stages for selection dropdown
const ALL_STAGES = [...STAGES, LOST_STAGE]

// Stage-specific context and requirements
const STAGE_INFO: Record<string, { description: string; color: string; icon: string; requiresAllFields: boolean }> = {
  'INITIAL': {
    description: 'Initial stage - Basic offer information setup',
    color: 'blue',
    icon: '📝',
    requiresAllFields: false
  },
  'PROPOSAL_SENT': {
    description: 'Proposal has been sent to customer - Ensure all offer details are finalized before sending',
    color: 'indigo',
    icon: '📨',
    requiresAllFields: true
  },
  'NEGOTIATION': {
    description: 'In active negotiations - Document key discussion points, pricing changes, objections, and customer concerns',
    color: 'amber',
    icon: '💬',
    requiresAllFields: true
  },
  'FINAL_APPROVAL': {
    description: 'Awaiting final sign-off - Document decision makers, approval timeline, and any final conditions or commitments',
    color: 'purple',
    icon: '✅',
    requiresAllFields: true
  },
  'PO_RECEIVED': {
    description: 'Purchase Order received - Capture PO details including PO number, date, and value for order processing',
    color: 'green',
    icon: '📄',
    requiresAllFields: true
  },
  'ORDER_BOOKED': {
    description: 'Order booked in SAP system - Capture booking date and finalize order processing',
    color: 'teal',
    icon: '📦',
    requiresAllFields: true
  },
  'WON': {
    description: 'Deal successfully closed! Ensure all PO and order details are complete',
    color: 'green',
    icon: '🎉',
    requiresAllFields: true
  },
  'LOST': {
    description: 'Deal lost - Document the reason for loss to improve future proposals',
    color: 'red',
    icon: '❌',
    requiresAllFields: false
  }
}

export default function OfferDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [offer, setOffer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateData, setUpdateData] = useState({
    offerReferenceDate: '',
    title: '',
    offerValue: '',
    offerMonth: '',
    probabilityPercentage: '',
    poExpectedMonth: '',
    stage: '',
    remarks: '',
    poNumber: '',
    poDate: '',
    poValue: '',
    bookingDateInSap: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchOffer()
    }
  }, [params.id])

  const fetchOffer = async () => {
    try {
      setLoading(true)
      const response = await apiService.getOffer(parseInt(params.id as string))
      setOffer(response.offer)
      // Initialize update data
      setUpdateData({
        offerReferenceDate: response.offer.offerReferenceDate ? new Date(response.offer.offerReferenceDate).toISOString().split('T')[0] : '',
        title: response.offer.title || '',
        offerValue: response.offer.offerValue || '',
        offerMonth: response.offer.offerMonth || '',
        probabilityPercentage: response.offer.probabilityPercentage || '',
        poExpectedMonth: response.offer.poExpectedMonth || '',
        stage: response.offer.stage,
        remarks: response.offer.remarks || '',
        poNumber: response.offer.poNumber || '',
        poDate: response.offer.poDate ? new Date(response.offer.poDate).toISOString().split('T')[0] : '',
        poValue: response.offer.poValue || '',
        bookingDateInSap: response.offer.bookingDateInSap ? new Date(response.offer.bookingDateInSap).toISOString().split('T')[0] : ''
      })
    } catch (error: any) {
      console.error('Failed to fetch offer:', error)
      toast.error('Failed to load offer details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOffer = async () => {
    try {
      // Validation
      if (!updateData.stage) {
        toast.error('Stage is required')
        return
      }

      if (!updateData.title || !updateData.title.trim()) {
        toast.error('Offer title is required')
        return
      }

      if (updateData.probabilityPercentage) {
        const prob = parseInt(updateData.probabilityPercentage)
        if (prob < 1 || prob > 100) {
          toast.error('Win probability must be between 1 and 100')
          return
        }
      }

      if (updateData.offerValue && parseFloat(updateData.offerValue) < 0) {
        toast.error('Offer value cannot be negative')
        return
      }

      // Check if stage requires all fields
      const stageInfo = STAGE_INFO[updateData.stage]
      if (stageInfo && stageInfo.requiresAllFields) {
        const fieldLabels: Record<string, string> = {
          offerReferenceDate: 'Offer Reference Date',
          offerValue: 'Offer Value',
          offerMonth: 'Offer Month',
          probabilityPercentage: 'Win Probability',
          poExpectedMonth: 'PO Expected Month'
        }
        
        const requiredFields = ['offerReferenceDate', 'offerValue', 'offerMonth', 'probabilityPercentage', 'poExpectedMonth']
        
        for (const field of requiredFields) {
          const value = updateData[field as keyof typeof updateData]
          if (!value || (typeof value === 'string' && !value.trim())) {
            toast.error(`${fieldLabels[field]} is required for ${ALL_STAGES.find(s => s.key === updateData.stage)?.label} stage`)
            return
          }
        }
      }

      // PO_RECEIVED stage specific validations (skip for LOST)
      if ((updateData.stage === 'PO_RECEIVED' || updateData.stage === 'ORDER_BOOKED' || updateData.stage === 'WON')) {
        if (!updateData.poNumber || !updateData.poNumber.trim()) {
          toast.error('PO Number is required for this stage')
          return
        }
        if (!updateData.poDate) {
          toast.error('PO Date is required for this stage')
          return
        }
        if (!updateData.poValue) {
          toast.error('PO Value is required for this stage')
          return
        }
        if (parseFloat(updateData.poValue) <= 0) {
          toast.error('PO Value must be greater than zero')
          return
        }
      }

      // ORDER_BOOKED stage specific validations (skip for LOST)
      if ((updateData.stage === 'ORDER_BOOKED' || updateData.stage === 'WON')) {
        if (!updateData.bookingDateInSap) {
          toast.error('Booking Date in SAP is required for this stage')
          return
        }
      }

      // LOST stage specific validation - require reason for loss
      if (updateData.stage === 'LOST') {
        if (!updateData.remarks || !updateData.remarks.trim()) {
          toast.error('Please provide a reason for losing this deal')
          return
        }
      }

      setUpdating(true)
      const payload: any = {
        offerReferenceDate: updateData.offerReferenceDate ? new Date(updateData.offerReferenceDate).toISOString() : null,
        title: updateData.title.trim(),
        offerValue: updateData.offerValue ? parseFloat(updateData.offerValue) : null,
        offerMonth: updateData.offerMonth || null,
        probabilityPercentage: updateData.probabilityPercentage ? parseInt(updateData.probabilityPercentage) : null,
        poExpectedMonth: updateData.poExpectedMonth || null,
        stage: updateData.stage,
        remarks: updateData.remarks?.trim() || null,
        poNumber: updateData.poNumber?.trim() || null,
        poDate: updateData.poDate ? new Date(updateData.poDate).toISOString() : null,
        poValue: updateData.poValue ? parseFloat(updateData.poValue) : null,
        bookingDateInSap: updateData.bookingDateInSap ? new Date(updateData.bookingDateInSap).toISOString() : null
      }

      await apiService.updateOffer(offer.id, payload)
      toast.success('Offer updated successfully')
      setShowUpdateDialog(false)
      fetchOffer()
    } catch (error: any) {
      console.error('Failed to update offer:', error)
      toast.error(error.response?.data?.message || 'Failed to update offer')
    } finally {
      setUpdating(false)
    }
  }

  const handleMoveToStage = (stage: string) => {
    setUpdateData(prev => ({ ...prev, stage }))
    setShowUpdateDialog(true)
  }

  const getCurrentStageIndex = () => {
    return STAGES.findIndex(s => s.key === offer?.stage)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading offer details...</p>
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Offer not found</p>
          <Button onClick={() => router.push('/admin/offers')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const currentStageIndex = getCurrentStageIndex()

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/offers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{offer.offerReferenceNumber}</h1>
            <p className="text-gray-600 mt-1">{offer.title || offer.customer?.companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push(`/admin/offers/${offer.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Offer
          </Button>
        </div>
      </div>

      {/* Stage Progress */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle>Offer Progress</CardTitle>
          <CardDescription>Track your offer through each stage - WON or LOST outcomes after Final Approval</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          {/* Check if current stage is LOST */}
          {offer.stage === 'LOST' ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 rounded-full bg-red-100 border-4 border-red-500 flex items-center justify-center mb-4">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">Deal Lost</h3>
              <p className="text-gray-600 text-center max-w-md">
                This offer did not convert into a sale
              </p>
              <Badge className="mt-4 bg-red-100 text-red-800 border-red-300 border text-base px-4 py-2">
                ❌ Lost
              </Badge>
            </div>
          ) : (
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200" style={{ zIndex: 0 }}></div>
              <div 
                className={`absolute top-6 left-0 h-0.5 transition-all duration-500 ${offer.stage === 'WON' ? 'bg-green-600' : 'bg-blue-600'}`}
                style={{ 
                  width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%`,
                  zIndex: 0 
                }}
              ></div>
              
              {/* Stage Steps */}
              <div className="relative flex justify-between" style={{ zIndex: 1 }}>
                {STAGES.map((stage, index) => {
                  const isPast = index < currentStageIndex
                  const isCurrent = index === currentStageIndex
                  const isWon = stage.key === 'WON' && offer.stage === 'WON'
                  const Icon = stage.icon
                  
                  return (
                    <div key={stage.key} className="flex flex-col items-center" style={{ flex: 1 }}>
                      <div 
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all bg-white
                          ${isPast && !isWon ? 'border-blue-600 bg-blue-600' : ''}
                          ${isCurrent && !isWon ? 'border-blue-600 bg-blue-600 ring-4 ring-blue-200' : ''}
                          ${isWon ? 'border-green-600 bg-green-600 ring-4 ring-green-200' : ''}
                          ${!isPast && !isCurrent && !isWon ? 'border-gray-300' : ''}
                        `}
                      >
                        <Icon 
                          className={`h-5 w-5 ${(isPast || isCurrent || isWon) ? 'text-white' : 'text-gray-400'}`} 
                        />
                      </div>
                      <p className={`
                        mt-3 text-sm font-medium text-center max-w-[100px]
                        ${isCurrent && !isWon ? 'text-blue-600' : ''}
                        ${isWon ? 'text-green-600' : 'text-gray-600'}
                      `}>
                        {stage.label}
                      </p>
                      {isCurrent && !isWon && (
                        <Badge className="mt-2 bg-blue-100 text-blue-800 border-blue-300 border">
                          Current
                        </Badge>
                      )}
                      {isWon && (
                        <Badge className="mt-2 bg-green-100 text-green-800 border-green-300 border">
                          🎉 Success!
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Alternative outcome indicator */}
              {currentStageIndex >= 3 && offer.stage !== 'WON' && (
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    <AlertCircle className="inline h-4 w-4 mr-1 text-amber-500" />
                    Can move to <span className="font-semibold text-red-600">LOST</span> at any stage if deal doesn't close
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Contact Info */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Customer & Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Details
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">Company Name</dt>
                      <dd className="text-base font-medium">{offer.customer?.companyName || offer.company}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Location</dt>
                      <dd className="text-base flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {offer.location || offer.customer?.city}
                      </dd>
                    </div>
                    {offer.department && (
                      <div>
                        <dt className="text-sm text-gray-500">Department</dt>
                        <dd className="text-base">{offer.department}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm text-gray-500">Zone</dt>
                      <dd className="text-base">{offer.zone?.name}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Person
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">Name</dt>
                      <dd className="text-base font-medium">{offer.contactPersonName || offer.contact?.contactPersonName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Phone</dt>
                      <dd className="text-base flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {offer.contactNumber || offer.contact?.contactNumber}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Email</dt>
                      <dd className="text-base flex items-center gap-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {offer.email || offer.contact?.email}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Offer Value</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {offer.offerValue ? formatCurrency(Number(offer.offerValue)) : 'TBD'}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">PO Value</p>
                  <p className="text-2xl font-bold text-green-900">
                    {offer.poValue ? formatCurrency(Number(offer.poValue)) : '-'}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Probability</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {offer.probabilityPercentage ? `${offer.probabilityPercentage}%` : '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Offer Month</dt>
                  <dd className="text-base font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {offer.offerMonth || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 mb-1">PO Expected Month</dt>
                  <dd className="text-base font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {offer.poExpectedMonth || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 mb-1">PO Number</dt>
                  <dd className="text-base font-medium">{offer.poNumber || '-'}</dd>
                </div>
              </div>

              {offer.poDate && (
                <div className="mt-4">
                  <dt className="text-sm text-gray-500 mb-1">PO Date</dt>
                  <dd className="text-base font-medium">
                    {new Date(offer.poDate).toLocaleDateString('en-IN')}
                  </dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product & Assets */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product & Asset Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Product Type</dt>
                  <dd>
                    <Badge className={`
                      ${offer.productType === 'SPP' ? 'bg-orange-100 text-orange-800 border-orange-300' : ''}
                      ${offer.productType === 'CONTRACT' ? 'bg-green-100 text-green-800 border-green-300' : ''}
                      ${offer.productType === 'RELOCATION' ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
                      ${offer.productType === 'UPGRADE_KIT' ? 'bg-purple-100 text-purple-800 border-purple-300' : ''}
                      ${offer.productType === 'SOFTWARE' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : ''}
                      border
                    `}>
                      {offer.productType}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Machine Serial Number</dt>
                  <dd className="text-base font-medium">{offer.machineSerialNumber || '-'}</dd>
                </div>
                {offer.title && (
                  <div className="md:col-span-2">
                    <dt className="text-sm text-gray-500 mb-1">Title</dt>
                    <dd className="text-base font-medium">{offer.title}</dd>
                  </div>
                )}
                {offer.description && (
                  <div className="md:col-span-2">
                    <dt className="text-sm text-gray-500 mb-2">Description</dt>
                    <dd className="text-base bg-gray-50 p-3 rounded-lg">
                      {offer.description}
                    </dd>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spare Parts - Show for SPP or if parts exist */}
          {(offer.productType === 'SPP' || (offer.offerSpareParts && offer.offerSpareParts.length > 0)) && (
            <Card className={`shadow-lg ${offer.productType === 'SPP' ? 'ring-2 ring-amber-200' : ''}`}>
              <CardHeader className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-amber-600" />
                      Spare Parts
                      {offer.offerSpareParts && offer.offerSpareParts.length > 0 && (
                        <Badge className="bg-amber-600 text-white">
                          {offer.offerSpareParts.length} {offer.offerSpareParts.length === 1 ? 'Item' : 'Items'}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {offer.productType === 'SPP' 
                        ? 'Spare parts configured for this SPP offer' 
                        : 'Items included in this offer'}
                    </CardDescription>
                  </div>
                  {offer.productType === 'SPP' && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                      SPP Product
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {(!offer.offerSpareParts || offer.offerSpareParts.length === 0) && offer.productType === 'SPP' ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                      <Wrench className="h-8 w-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Spare Parts Added Yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      This is an SPP (Spare Parts) offer. Add spare parts to complete the offer details.
                    </p>
                    <Button 
                      onClick={() => router.push(`/admin/offers/${offer.id}/edit`)}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Add Spare Parts
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {offer.offerSpareParts?.map((offerPart: any, index: number) => {
                        const part = offerPart.sparePart;
                        return (
                          <div 
                            key={offerPart.id || index} 
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                          >
                        {/* Image */}
                        <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {part?.imageUrl ? (
                            <img 
                              src={part.imageUrl} 
                              alt={part.name || 'Spare Part'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={part?.imageUrl ? 'hidden' : 'flex flex-col items-center justify-center text-gray-400'}>
                            <ImageIcon className="h-12 w-12 mb-2" />
                            <span className="text-xs">No Image</span>
                          </div>
                        </div>

                        {/* Part Details */}
                        <div className="space-y-2">
                          {/* Part Name */}
                          <h4 className="font-semibold text-gray-900 text-base line-clamp-2">
                            {part?.name || 'Unnamed Part'}
                          </h4>

                          {/* Part Number */}
                          {part?.partNumber && (
                            <p className="text-xs text-gray-500">
                              Part #: {part.partNumber}
                            </p>
                          )}

                          {/* Category */}
                          {part?.category && (
                            <Badge variant="outline" className="text-xs">
                              {part.category}
                            </Badge>
                          )}

                          {/* Quantity */}
                          {offerPart.quantity && (
                            <p className="text-sm text-gray-600">
                              Qty: <span className="font-medium">{offerPart.quantity}</span>
                            </p>
                          )}

                          {/* Price */}
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Unit Price</span>
                              <div className="flex items-center gap-1">
                                <IndianRupee className="h-4 w-4 text-green-600" />
                                <span className="text-lg font-bold text-green-600">
                                  {offerPart.unitPrice ? 
                                    formatCurrency(Number(offerPart.unitPrice)) : 
                                    <span className="text-sm text-gray-400">TBD</span>
                                  }
                                </span>
                              </div>
                            </div>
                            
                            {/* Total Price */}
                            {offerPart.totalPrice && (
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-500">Total</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(Number(offerPart.totalPrice))}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Notes if available */}
                          {offerPart.notes && (
                            <p className="text-xs text-gray-600 line-clamp-2 pt-2">
                              {offerPart.notes}
                            </p>
                          )}

                          {/* Description if available */}
                          {part?.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 pt-1">
                              {part.description}
                            </p>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>

                    {/* Total Summary */}
                    {offer.offerSpareParts && offer.offerSpareParts.some((op: any) => op.totalPrice) && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Total Parts Value</span>
                          <span className="text-xl font-bold text-green-700">
                            {formatCurrency(
                              offer.offerSpareParts.reduce((sum: number, offerPart: any) => {
                                return sum + Number(offerPart.totalPrice || 0);
                              }, 0)
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Remarks */}
          {offer.remarks && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Remarks & Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {offer.remarks}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Priority</p>
                <Badge className={`
                  ${offer.priority === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-300' : ''}
                  ${offer.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-300' : ''}
                  ${offer.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : ''}
                  ${offer.priority === 'LOW' ? 'bg-green-100 text-green-800 border-green-300' : ''}
                  border
                `}>
                  {offer.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Lead Status</p>
                <Badge className={offer.lead === 'YES' ? 'bg-green-100 text-green-800 border-green-300 border' : 'bg-gray-100 text-gray-800 border-gray-300 border'}>
                  {offer.lead}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Open Funnel</p>
                <Badge className={offer.openFunnel ? 'bg-blue-100 text-blue-800 border-blue-300 border' : 'bg-gray-100 text-gray-800 border-gray-300 border'}>
                  {offer.openFunnel ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-base font-medium">
                  {new Date(offer.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
                {offer.createdBy?.name && (
                  <p className="text-xs text-gray-500">by {offer.createdBy.name}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-base font-medium">
                  {new Date(offer.updatedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              {offer.offerReferenceDate && (
                <div>
                  <p className="text-sm text-gray-500">Offer Reference Date</p>
                  <p className="text-base font-medium">
                    {new Date(offer.offerReferenceDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              )}
              {offer.registrationDate && (
                <div>
                  <p className="text-sm text-gray-500">Registration Date</p>
                  <p className="text-base font-medium">
                    {new Date(offer.registrationDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                variant="default"
                onClick={() => {
                  const nextStageIndex = currentStageIndex + 1
                  if (nextStageIndex < STAGES.length) {
                    handleMoveToStage(STAGES[nextStageIndex].key)
                  }
                }}
                disabled={currentStageIndex >= STAGES.length - 1}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Move to Next Stage
              </Button>
              <Button className="w-full" variant="outline" onClick={() => setShowUpdateDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Update Stage Details
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push(`/admin/offers/${params.id}/quote`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Quote
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push(`/admin/offers/${params.id}/activity`)}
              >
                <Clock className="h-4 w-4 mr-2" />
                View Activity History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Offer Details</DialogTitle>
            <DialogDescription>
              Update offer information for {offer?.offerReferenceNumber}
            </DialogDescription>
          </DialogHeader>
          
          {/* Stage-specific context banner */}
          {updateData.stage && STAGE_INFO[updateData.stage] && (
            <div className={`
              p-4 rounded-lg border-l-4 mb-4
              ${STAGE_INFO[updateData.stage].color === 'blue' ? 'bg-blue-50 border-blue-500' : ''}
              ${STAGE_INFO[updateData.stage].color === 'indigo' ? 'bg-indigo-50 border-indigo-500' : ''}
              ${STAGE_INFO[updateData.stage].color === 'amber' ? 'bg-amber-50 border-amber-500' : ''}
              ${STAGE_INFO[updateData.stage].color === 'purple' ? 'bg-purple-50 border-purple-500' : ''}
              ${STAGE_INFO[updateData.stage].color === 'green' ? 'bg-green-50 border-green-500' : ''}
              ${STAGE_INFO[updateData.stage].color === 'teal' ? 'bg-teal-50 border-teal-500' : ''}
              ${STAGE_INFO[updateData.stage].color === 'red' ? 'bg-red-50 border-red-500' : ''}
            `}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{STAGE_INFO[updateData.stage].icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {STAGES.find(s => s.key === updateData.stage)?.label} Stage
                  </h4>
                  <p className="text-sm text-gray-700">
                    {STAGE_INFO[updateData.stage].description}
                  </p>
                  {STAGE_INFO[updateData.stage].requiresAllFields && (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      ⚠️ All fields marked with * are required for this stage
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Stage */}
            <div className="space-y-2">
              <Label className="text-red-600">Stage *</Label>
              <Select 
                value={updateData.stage} 
                onValueChange={(value) => setUpdateData(prev => ({ ...prev, stage: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STAGES.map(stage => (
                    <SelectItem key={stage.key} value={stage.key}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Offer Title */}
            <div className="space-y-2">
              <Label className="text-red-600">Offer Title *</Label>
              <Input 
                value={updateData.title}
                onChange={(e) => setUpdateData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter offer title"
              />
            </div>

            {/* Offer Reference Date */}
            <div className="space-y-2">
              <Label className={updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields ? 'text-red-600' : ''}>
                Offer Reference Date {updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields && '*'}
              </Label>
              <Input 
                type="date"
                value={updateData.offerReferenceDate}
                onChange={(e) => setUpdateData(prev => ({ ...prev, offerReferenceDate: e.target.value }))}
                className={updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields && !updateData.offerReferenceDate ? 'border-red-300' : ''}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Offer Value */}
              <div className="space-y-2">
                <Label className={updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields ? 'text-red-600' : ''}>
                  Offer Value (₹) {updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields && '*'}
                </Label>
                <Input 
                  type="number"
                  value={updateData.offerValue}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, offerValue: e.target.value }))}
                  placeholder="Enter amount"
                  className={updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields && !updateData.offerValue ? 'border-red-300' : ''}
                />
              </div>

              {/* Win Probability */}
              <div className="space-y-2">
                <Label className={updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields ? 'text-red-600' : ''}>
                  Win Probability (%) {updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields && '*'}
                </Label>
                <Input 
                  type="number"
                  min="1"
                  max="100"
                  value={updateData.probabilityPercentage}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, probabilityPercentage: e.target.value }))}
                  placeholder="1-100"
                  className={updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields && !updateData.probabilityPercentage ? 'border-red-300' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Offer Month */}
              <div className="space-y-2">
                <Label className={updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields ? 'text-red-600' : ''}>
                  Offer Month {updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields && '*'}
                </Label>
                <Input 
                  type="month"
                  value={updateData.offerMonth}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, offerMonth: e.target.value }))}
                  className={updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields && !updateData.offerMonth ? 'border-red-300' : ''}
                />
              </div>

              {/* PO Expected Month */}
              <div className="space-y-2">
                <Label className={updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields ? 'text-red-600' : ''}>
                  PO Expected Month {updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields && '*'}
                </Label>
                <Input 
                  type="month"
                  value={updateData.poExpectedMonth}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, poExpectedMonth: e.target.value }))}
                  className={updateData.stage && STAGE_INFO[updateData.stage]?.requiresAllFields && !updateData.poExpectedMonth ? 'border-red-300' : ''}
                />
              </div>
            </div>
            
            {/* PO Details Section - For PO_RECEIVED, ORDER_BOOKED, WON stages */}
            {(updateData.stage === 'PO_RECEIVED' || updateData.stage === 'ORDER_BOOKED' || updateData.stage === 'WON') && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Purchase Order Details</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* PO Number */}
                  <div className="space-y-2">
                    <Label className="text-red-600">PO Number *</Label>
                    <Input 
                      value={updateData.poNumber}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, poNumber: e.target.value }))}
                      placeholder="Enter PO number"
                      className={!updateData.poNumber ? 'border-red-300' : ''}
                    />
                  </div>

                  {/* PO Date */}
                  <div className="space-y-2">
                    <Label className="text-red-600">PO Date *</Label>
                    <Input 
                      type="date"
                      value={updateData.poDate}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, poDate: e.target.value }))}
                      className={!updateData.poDate ? 'border-red-300' : ''}
                    />
                  </div>
                </div>

                {/* PO Value */}
                <div className="space-y-2">
                  <Label className="text-red-600">PO Value (₹) *</Label>
                  <Input 
                    type="number"
                    value={updateData.poValue}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, poValue: e.target.value }))}
                    placeholder="Enter PO value"
                    className={!updateData.poValue ? 'border-red-300' : ''}
                  />
                  <p className="text-xs text-gray-500">
                    Actual purchase order value received from customer
                  </p>
                </div>
              </div>
            )}
            
            {/* Order Booking Details Section - For ORDER_BOOKED and WON stages */}
            {(updateData.stage === 'ORDER_BOOKED' || updateData.stage === 'WON') && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-teal-600" />
                  <h3 className="font-semibold text-gray-900">Order Booking Details</h3>
                </div>
                
                {/* Booking Date in SAP */}
                <div className="space-y-2">
                  <Label className="text-red-600">Booking Date in SAP *</Label>
                  <Input 
                    type="date"
                    value={updateData.bookingDateInSap}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, bookingDateInSap: e.target.value }))}
                    className={!updateData.bookingDateInSap ? 'border-red-300' : ''}
                  />
                  <p className="text-xs text-gray-500">
                    Date when the order was booked in SAP system
                  </p>
                </div>
              </div>
            )}
            
            {/* Loss Reason Section - For LOST stage */}
            {updateData.stage === 'LOST' && (
              <div className="space-y-3 pt-4 border-t-4 border-red-300 bg-red-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-red-700 font-semibold text-base">
                      ❌ Reason for Loss *
                    </Label>
                    <p className="text-xs text-red-600 mt-1">
                      This deal can be marked as LOST from any stage (Proposal Sent, Negotiation, Final Approval) if PO is not received
                    </p>
                  </div>
                </div>
                <Textarea
                  value={updateData.remarks}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Document why the deal was lost: competitor won, pricing issues, customer delayed, requirements changed, budget constraints, etc."
                  rows={5}
                  className="resize-none border-red-300 focus:border-red-500"
                />
                <p className="text-xs text-red-700 font-medium bg-red-100 p-2 rounded">
                  ⚠️ Important: Documenting loss reasons helps improve future proposals and understand customer objections
                </p>
              </div>
            )}
            
            {/* Remarks/Notes Section - Especially for Negotiation and Final Approval */}
            {(updateData.stage === 'NEGOTIATION' || updateData.stage === 'FINAL_APPROVAL' || updateData.stage === 'PROPOSAL_SENT') && (
              <div className="space-y-2 pt-4 border-t">
                <Label className={updateData.stage === 'NEGOTIATION' || updateData.stage === 'FINAL_APPROVAL' ? 'text-blue-600 font-semibold' : ''}>
                  {updateData.stage === 'NEGOTIATION' && '💬 Negotiation Notes'}
                  {updateData.stage === 'FINAL_APPROVAL' && '✅ Approval Notes & Conditions'}
                  {updateData.stage === 'PROPOSAL_SENT' && '📋 Proposal Notes'}
                </Label>
                <Textarea
                  value={updateData.remarks}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder={
                    updateData.stage === 'NEGOTIATION' 
                      ? 'Document discussion points, pricing negotiations, customer objections, competitor info, etc.'
                      : updateData.stage === 'FINAL_APPROVAL'
                      ? 'Document decision makers, approval timeline, final terms, conditions, commitments, etc.'
                      : 'Add any notes about this stage...'
                  }
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  {updateData.stage === 'NEGOTIATION' && 'Keep track of all negotiation details for future reference'}
                  {updateData.stage === 'FINAL_APPROVAL' && 'Document the approval process and any final commitments made'}
                  {updateData.stage === 'PROPOSAL_SENT' && 'Optional notes about the proposal'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)} disabled={updating}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOffer} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Offer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
