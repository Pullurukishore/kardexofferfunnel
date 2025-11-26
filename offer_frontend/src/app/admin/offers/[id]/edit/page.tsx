'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Building2, 
  MapPin, 
  FileText, 
  Calendar, 
  DollarSign, 
  Target, 
  MessageSquare,
  Package,
  TrendingUp,
  User,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react'
import { apiService } from '@/services/api'
import { toast } from 'sonner'

const PRODUCT_TYPES = ['RELOCATION', 'CONTRACT', 'SPP', 'UPGRADE_KIT', 'SOFTWARE', 'BD_CHARGES', 'BD_SPARE', 'MIDLIFE_UPGRADE', 'RETROFIT_KIT']
const STAGES = ['INITIAL', 'PROPOSAL_SENT', 'NEGOTIATION', 'FINAL_APPROVAL', 'PO_RECEIVED', 'ORDER_BOOKED', 'WON', 'LOST']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function EditOfferPage() {
  const router = useRouter()
  const params = useParams()
  const offerId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [offer, setOffer] = useState<any>(null)
  const [zones, setZones] = useState<any[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productType: '',
    lead: '',
    stage: '',
    priority: '',
    offerValue: '',
    offerMonth: '',
    poExpectedMonth: '',
    probabilityPercentage: '',
    poNumber: '',
    poDate: '',
    poValue: '',
    poReceivedMonth: '',
    remarks: '',
    openFunnel: false,
    company: '',
    location: '',
    department: '',
    contactPersonName: '',
    contactNumber: '',
    email: '',
    machineSerialNumber: ''
  })

  useEffect(() => {
    fetchOffer()
    fetchZones()
  }, [offerId])

  const fetchOffer = async () => {
    try {
      setLoading(true)
      const response = await apiService.api.get(`/offers/${offerId}`)
      const offerData = response.data.offer
      setOffer(offerData)
      
      // Populate form with existing data
      setFormData({
        title: offerData.title || '',
        description: offerData.description || '',
        productType: offerData.productType || '',
        lead: offerData.lead || '',
        stage: offerData.stage || '',
        priority: offerData.priority || '',
        offerValue: offerData.offerValue || '',
        offerMonth: offerData.offerMonth || '',
        poExpectedMonth: offerData.poExpectedMonth || '',
        probabilityPercentage: offerData.probabilityPercentage || '',
        poNumber: offerData.poNumber || '',
        poDate: offerData.poDate ? offerData.poDate.split('T')[0] : '',
        poValue: offerData.poValue || '',
        poReceivedMonth: offerData.poReceivedMonth || '',
        remarks: offerData.remarks || '',
        openFunnel: offerData.openFunnel || false,
        company: offerData.company || '',
        location: offerData.location || '',
        department: offerData.department || '',
        contactPersonName: offerData.contactPersonName || '',
        contactNumber: offerData.contactNumber || '',
        email: offerData.email || '',
        machineSerialNumber: offerData.machineSerialNumber || ''
      })
    } catch (error: any) {
      console.error('Failed to fetch offer:', error)
      toast.error('Failed to load offer details')
      router.push('/admin/offers')
    } finally {
      setLoading(false)
    }
  }

  const fetchZones = async () => {
    try {
      const response = await apiService.getZones()
      setZones(response.data || [])
    } catch (error) {
      console.error('Failed to fetch zones:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)

      // Check if stage has changed
      const stageChanged = offer && formData.stage !== offer.stage

      // If stage changed, use updateOfferStatus endpoint for proper audit trail
      if (stageChanged) {
        await apiService.updateOfferStatus(parseInt(offerId), {
          stage: formData.stage || null,
          notes: formData.remarks || `Stage updated to ${formData.stage}`
        })
      }

      // Update all other fields (excluding stage to avoid duplication)
      const updateData: any = {
        title: formData.title || null,
        description: formData.description || null,
        productType: formData.productType || null,
        lead: formData.lead || null,
        priority: formData.priority || null,
        offerValue: formData.offerValue ? parseFloat(formData.offerValue) : null,
        offerMonth: formData.offerMonth || null,
        poExpectedMonth: formData.poExpectedMonth || null,
        probabilityPercentage: formData.probabilityPercentage ? parseFloat(formData.probabilityPercentage) : null,
        poNumber: formData.poNumber || null,
        poDate: formData.poDate || null,
        poValue: formData.poValue ? parseFloat(formData.poValue) : null,
        poReceivedMonth: formData.poReceivedMonth || null,
        remarks: formData.remarks || null,
        openFunnel: formData.openFunnel,
        company: formData.company || null,
        location: formData.location || null,
        department: formData.department || null,
        contactPersonName: formData.contactPersonName || null,
        contactNumber: formData.contactNumber || null,
        email: formData.email || null,
        machineSerialNumber: formData.machineSerialNumber || null
      }

      // Only include stage in general update if it hasn't changed
      if (!stageChanged) {
        updateData.stage = formData.stage || null
      }

      await apiService.updateOffer(parseInt(offerId), updateData)
      toast.success('Offer updated successfully!')
      router.push(`/admin/offers/${offerId}`)
    } catch (error: any) {
      console.error('Failed to update offer:', error)
      toast.error(error.response?.data?.error || 'Failed to update offer')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading offer details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/offers/${offerId}`)}
            className="mb-4 hover:bg-white/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Offer Details
          </Button>

          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl shadow-2xl p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl ring-2 ring-white/30">
                <FileText className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Edit Offer</h1>
                <p className="text-blue-100 mt-2 text-lg">
                  {offer?.offerReferenceNumber} - Update offer details
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Basic Information
              </CardTitle>
              <CardDescription>Core offer details and classification</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Offer title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type *</Label>
                  <Select value={formData.productType} onValueChange={(value) => handleInputChange('productType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead">Lead Status</Label>
                  <Select value={formData.lead} onValueChange={(value) => handleInputChange('lead', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YES">Yes</SelectItem>
                      <SelectItem value="NO">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(priority => (
                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detailed offer description"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stage */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Stage
              </CardTitle>
              <CardDescription>Current pipeline stage</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map(stage => (
                        <SelectItem key={stage} value={stage}>{stage.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Financial Information
              </CardTitle>
              <CardDescription>Pricing and value details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offerValue">Offer Value (₹)</Label>
                  <Input
                    id="offerValue"
                    type="number"
                    value={formData.offerValue}
                    onChange={(e) => handleInputChange('offerValue', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poValue">PO Value (₹)</Label>
                  <Input
                    id="poValue"
                    type="number"
                    value={formData.poValue}
                    onChange={(e) => handleInputChange('poValue', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="probabilityPercentage">Win Probability (%)</Label>
                  <Input
                    id="probabilityPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probabilityPercentage}
                    onChange={(e) => handleInputChange('probabilityPercentage', e.target.value)}
                    placeholder="0-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poNumber">PO Number</Label>
                  <Input
                    id="poNumber"
                    value={formData.poNumber}
                    onChange={(e) => handleInputChange('poNumber', e.target.value)}
                    placeholder="Purchase order number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poDate">PO Date</Label>
                  <Input
                    id="poDate"
                    type="date"
                    value={formData.poDate}
                    onChange={(e) => handleInputChange('poDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offerMonth">Offer Month</Label>
                  <Input
                    id="offerMonth"
                    value={formData.offerMonth}
                    onChange={(e) => handleInputChange('offerMonth', e.target.value)}
                    placeholder="e.g., Jan-2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poExpectedMonth">PO Expected Month</Label>
                  <Input
                    id="poExpectedMonth"
                    value={formData.poExpectedMonth}
                    onChange={(e) => handleInputChange('poExpectedMonth', e.target.value)}
                    placeholder="e.g., Feb-2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poReceivedMonth">PO Received Month</Label>
                  <Input
                    id="poReceivedMonth"
                    value={formData.poReceivedMonth}
                    onChange={(e) => handleInputChange('poReceivedMonth', e.target.value)}
                    placeholder="e.g., Mar-2025"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-600" />
                Customer Information
              </CardTitle>
              <CardDescription>Customer and contact details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Department"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPersonName">Contact Person</Label>
                  <Input
                    id="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                    placeholder="Contact person name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="machineSerialNumber">Machine Serial Number</Label>
                  <Input
                    id="machineSerialNumber"
                    value={formData.machineSerialNumber}
                    onChange={(e) => handleInputChange('machineSerialNumber', e.target.value)}
                    placeholder="Serial number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                Notes
              </CardTitle>
              <CardDescription>Add remarks and funnel settings</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.openFunnel}
                      onChange={(e) => handleInputChange('openFunnel', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Open Funnel
                  </Label>
                  <p className="text-xs text-gray-500">Mark this offer as part of the open funnel</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    placeholder="Additional notes or remarks"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end sticky bottom-4 bg-white p-4 rounded-xl shadow-xl border">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/offers/${offerId}`)}
              disabled={saving}
              className="min-w-[120px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="min-w-[120px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
