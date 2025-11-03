'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  Download,
  Printer,
  Loader2,
  Edit,
  Save,
  Upload,
  X,
  FileText
} from 'lucide-react'
import { apiService } from '@/services/api'
import { toast } from 'sonner'
import { format } from 'date-fns'

// ==================== Types ====================
interface Customer {
  companyName?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}

interface OfferItem {
  id: number
  partNo: string
  description: string
  hsnCode: string
  unitPrice: string
  quantity: number
  total?: string
}

interface MachineDetails {
  model: string
  serialNumber: string
  owner: string
  department: string
}

interface Offer {
  offerReferenceNumber: string
  title?: string
  description?: string
  subject?: string
  introduction?: string
  offerValue?: string
  remarks?: string
  contactPersonName?: string
  contactPersonPhone?: string
  contactPersonEmail?: string
  contactNumber?: string
  email?: string
  company?: string
  productType?: string
  machineSerialNumber?: string
  customer?: Customer
  items?: OfferItem[]
  machineDetails?: MachineDetails
}

interface EditableData {
  companyName: string
  companyAddress: string
  companyCity: string
  companyPhone: string
  companyFax: string
  companyEmail: string
  companyWebsite: string
  gstNumber: string
  arnNumber: string
  title: string
  description: string
  subject: string
  introduction: string
  offerValue: string
  gstRate: number
  remarks: string
  contactPersonName: string
  contactPersonPhone: string
  contactPersonEmail: string
  signatureImage: string | null
  items: OfferItem[]
  machineDetails: MachineDetails
}

// ==================== Constants ====================
const DEFAULT_COMPANY_INFO = {
  companyName: 'Kardex India Pvt Ltd',
  companyAddress: 'Brigade Rubix, 602, 6th Floor, HMT Watch Factory Road',
  companyCity: 'Bengaluru, Karnataka – 560 022 (INDIA)',
  companyPhone: '+91 80 29724450',
  companyFax: '+91 80 29724460',
  companyEmail: 'info@kardex.com',
  companyWebsite: 'www.kardex.com',
  gstNumber: '29AADCK5377L1ZW',
  arnNumber: 'AA2903170325554',
} as const

const QUOTE_VALIDITY_DAYS = 30
const DEFAULT_GST_RATE = 18
const DEFAULT_ITEM: OfferItem = {
  id: 1,
  partNo: '',
  description: '',
  hsnCode: '',
  unitPrice: '',
  quantity: 1,
  total: ''
}

const DEFAULT_MACHINE_DETAILS: MachineDetails = {
  model: '',
  serialNumber: '',
  owner: '',
  department: ''
}

// ==================== Helper Functions ====================
const calculateItemTotal = (unitPrice: string, quantity: number): number => {
  const price = parseFloat(unitPrice) || 0
  return price * quantity
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

const getValidUntilDate = (): Date => {
  const date = new Date()
  date.setDate(date.getDate() + QUOTE_VALIDITY_DAYS)
  return date
}

// ==================== Sub-Components ====================
interface LogoProps {
  className?: string
}

const KardexLogo = ({ className = 'h-6' }: LogoProps) => (
  <div className="mb-4">
    <img 
      src="/kardex.png" 
      alt="Kardex Remstar" 
      className={className}
      onError={(e) => { 
        e.currentTarget.style.display = 'none'
        console.error('Logo not found')
      }}
    />
  </div>
)

interface PageFooterProps {
  pageNumber: number
  totalPages?: number
}

const PageFooter = ({ pageNumber, totalPages = 11 }: PageFooterProps) => (
  <div className="mt-12 pt-4 border-t border-gray-300 text-xs text-gray-600 flex justify-between print-footer">
    <span>{pageNumber} / {totalPages}</span>
    <span>Service Care Vertrag</span>
    <span>{format(new Date(), 'yyyy/MM/dd')}</span>
  </div>
)

interface ItemRowProps {
  item: OfferItem
  index: number
  isEditMode: boolean
  onUpdate: (id: number, field: keyof OfferItem, value: string | number) => void
  onRemove: (id: number) => void
  canRemove: boolean
}

const ItemRow = ({ item, index, isEditMode, onUpdate, onRemove, canRemove }: ItemRowProps) => (
  <tr>
    <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
    <td className="border border-gray-300 px-2 py-2">
      {isEditMode ? (
        <Input
          value={item.partNo}
          onChange={(e) => onUpdate(item.id, 'partNo', e.target.value)}
          placeholder="Part No"
          className="h-7 text-xs w-full"
          aria-label={`Part number for item ${index + 1}`}
        />
      ) : (
        item.partNo || '-'
      )}
    </td>
    <td className="border border-gray-300 px-2 py-2">
      {isEditMode ? (
        <Input
          value={item.description}
          onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
          placeholder="Description"
          className="h-7 text-xs w-full"
          aria-label={`Description for item ${index + 1}`}
        />
      ) : (
        item.description || '-'
      )}
    </td>
    <td className="border border-gray-300 px-2 py-2">
      {isEditMode ? (
        <Input
          value={item.hsnCode}
          onChange={(e) => onUpdate(item.id, 'hsnCode', e.target.value)}
          placeholder="HSN"
          className="h-7 text-xs w-full"
          aria-label={`HSN code for item ${index + 1}`}
        />
      ) : (
        item.hsnCode || '-'
      )}
    </td>
    <td className="border border-gray-300 px-2 py-2 text-right">
      {isEditMode ? (
        <Input
          type="number"
          value={item.unitPrice}
          onChange={(e) => onUpdate(item.id, 'unitPrice', e.target.value)}
          placeholder="0"
          className="h-7 text-xs w-full text-right"
          aria-label={`Unit price for item ${index + 1}`}
        />
      ) : (
        item.unitPrice ? parseFloat(item.unitPrice).toLocaleString('en-IN') : '-'
      )}
    </td>
    <td className="border border-gray-300 px-2 py-2 text-right">
      {isEditMode ? (
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, 'quantity', parseInt(e.target.value) || 1)}
          placeholder="1"
          min="1"
          className="h-7 text-xs w-full text-right"
          aria-label={`Quantity for item ${index + 1}`}
        />
      ) : (
        item.quantity
      )}
    </td>
    <td className="border border-gray-300 px-2 py-2 text-right font-medium">
      {formatCurrency(calculateItemTotal(item.unitPrice, item.quantity))}
    </td>
    {isEditMode && (
      <td className="border border-gray-300 px-2 py-2 text-center print:hidden">
        <Button
          onClick={() => onRemove(item.id)}
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          disabled={!canRemove}
          aria-label={`Remove item ${index + 1}`}
          title={canRemove ? 'Remove item' : 'Cannot remove last item'}
        >
          ×
        </Button>
      </td>
    )}
  </tr>
)

// ==================== Main Component ====================
export default function QuoteGenerationPage() {
  const params = useParams()
  const router = useRouter()
  const offerId = params.id as string
  const printRef = useRef<HTMLDivElement>(null)

  // ==================== State Management ====================
  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editableData, setEditableData] = useState<EditableData>({
    ...DEFAULT_COMPANY_INFO,
    title: '',
    description: '',
    subject: '',
    introduction: '',
    offerValue: '',
    gstRate: DEFAULT_GST_RATE,
    remarks: '',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    signatureImage: null,
    items: [DEFAULT_ITEM],
    machineDetails: DEFAULT_MACHINE_DETAILS
  })

  // ==================== Data Fetching ====================
  const fetchOffer = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiService.api.get(`/offers/${offerId}`)
      const offerData: Offer = response.data.offer
      setOffer(offerData)
      
      // Initialize editable data
      setEditableData({
        ...DEFAULT_COMPANY_INFO,
        title: offerData.title || '',
        description: offerData.description || '',
        subject: offerData.subject || '',
        introduction: offerData.introduction || '',
        offerValue: offerData.offerValue || '',
        gstRate: DEFAULT_GST_RATE,
        remarks: offerData.remarks || '',
        contactPersonName: offerData.contactPersonName || '',
        contactPersonPhone: offerData.contactPersonPhone || '',
        contactPersonEmail: offerData.contactPersonEmail || '',
        signatureImage: null, // Will be loaded separately if exists
        items: offerData.items || [DEFAULT_ITEM],
        machineDetails: offerData.machineDetails || {
          ...DEFAULT_MACHINE_DETAILS,
          serialNumber: offerData.machineSerialNumber || '',
          owner: offerData.contactPersonName || ''
        }
      })
    } catch (error) {
      console.error('Failed to fetch offer:', error)
      toast.error('Failed to load offer details')
    } finally {
      setLoading(false)
    }
  }, [offerId])

  // ==================== Effects ====================
  useEffect(() => {
    fetchOffer()
  }, [fetchOffer])

  // ==================== Event Handlers ====================
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleDownloadPDF = useCallback(() => {
    window.print()
    toast.success('Use your browser\'s print dialog to save as PDF')
  }, [])

  const handleToggleEditMode = useCallback(() => {
    if (isEditMode) {
      toast.success('Changes saved!')
    }
    setIsEditMode(prev => !prev)
  }, [isEditMode])

  const handleExportWord = useCallback(() => {
    if (!offer) return

    // Calculate subtotal within this function
    const currentSubtotal = editableData.items.reduce((sum, item) => {
      return sum + calculateItemTotal(item.unitPrice, item.quantity)
    }, 0)

    // Create HTML content that mimics the quotation structure
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation - ${offer.offerReferenceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 20px; }
          .company-info { margin-bottom: 15px; }
          .customer-info { margin-bottom: 15px; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
          .table th { background-color: #4472C4; color: white; }
          .terms { margin-top: 20px; }
          .terms ul { padding-left: 20px; }
          .footer { margin-top: 30px; font-size: 12px; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Kardex Remstar Spare Parts Package</h1>
          <p>Ref: ${offer.offerReferenceNumber} | Dated: ${format(new Date(), 'dd/MM/yyyy')}</p>
        </div>
        
        <div class="company-info">
          <h3>Kardex India Pvt Ltd</h3>
          <p>Brigade Rubix, 602, 6th Floor, HMT Watch Factory Road<br>
          Bengaluru, Karnataka – 560 022 (INDIA)<br>
          Tel: +91 80 29724450 | Fax: +91 80 29724460<br>
          Website: www.kardex.com</p>
        </div>
        
        <div class="customer-info">
          <h3>M/s ${offer.customer?.companyName || offer.company || 'Customer Name'}</h3>
          <p>${offer.customer?.address || ''}<br>
          ${offer.customer?.city || ''} ${offer.customer?.state || ''}<br>
          ${offer.customer?.pincode || ''}</p>
          ${offer.contactPersonName ? `<p><strong>Kind Attn:</strong> ${offer.contactPersonName}</p>` : ''}
        </div>
        
        ${editableData.subject ? `<p><strong>Sub:</strong> ${editableData.subject}</p>` : ''}
        
        ${editableData.introduction ? `<p>${editableData.introduction}</p>` : ''}
        
        <h3>Machine Details:</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Sr. No</th>
              <th>Machine Model</th>
              <th>Machine Sr. No</th>
              <th>Machine Owner</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>${editableData.machineDetails.model || '-'}</td>
              <td>${editableData.machineDetails.serialNumber || '-'}</td>
              <td>${editableData.machineDetails.owner || '-'}</td>
              <td>${editableData.machineDetails.department || '-'}</td>
            </tr>
          </tbody>
        </table>
        
        <h3>Parts / Items:</h3>
        <table class="table">
          <thead>
            <tr>
              <th>S.N</th>
              <th>Part No</th>
              <th>Description</th>
              <th>HSN Code</th>
              <th>Unit Price</th>
              <th>Qty</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${editableData.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.partNo || '-'}</td>
                <td>${item.description || '-'}</td>
                <td>${item.hsnCode || '-'}</td>
                <td>${item.unitPrice ? parseFloat(item.unitPrice).toLocaleString('en-IN') : '-'}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(calculateItemTotal(item.unitPrice, item.quantity))}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #f0f0f0;">
              <td colspan="6" style="text-align: right;">TOTAL</td>
              <td>${formatCurrency(currentSubtotal)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="page-break"></div>
        
        <div class="terms">
          <h3>TERMS AND CONDITIONS</h3>
          <ul>
            <li>GST (${editableData.gstRate}%) to be paid extra</li>
            <li>Quotation validity up to 30 days</li>
            <li>Delivery - Ex-Works Bangalore, within 14 to 18 weeks from the date of Purchase Order, packing included.</li>
            <li>Warranty: 3 months from the date of delivery for Electronics parts only.</li>
            <li>Payment: N30. Within 30 days of delivery.</li>
          </ul>
        </div>
        
        <div class="footer">
          <p><strong>Contact Person:</strong></p>
          <p>${editableData.contactPersonName || ''}<br>
          ${editableData.contactPersonPhone || ''}<br>
          ${editableData.contactPersonEmail || ''}</p>
        </div>
      </body>
      </html>
    `

    // Create a blob with HTML content that can be opened in Word
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Quote_${offer.offerReferenceNumber}_${new Date().toISOString().split('T')[0]}.html`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Quotation exported to Word format! Open the HTML file in Microsoft Word.')
  }, [offer, editableData])


  // ==================== Computed Values ====================
  const quoteDate = useMemo(() => new Date(), [])
  const validUntil = useMemo(() => getValidUntilDate(), [])

  // ==================== Calculations ====================
  const subtotal = useMemo(() => {
    return editableData.items.reduce((sum, item) => {
      return sum + calculateItemTotal(item.unitPrice, item.quantity)
    }, 0)
  }, [editableData.items])

  // ==================== Signature Upload ====================
  const handleSignatureUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPG, PNG, GIF)')
        return
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size should be less than 2MB')
        return
      }
      
      // Convert to base64 for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        setEditableData(prev => ({
          ...prev,
          signatureImage: base64String
        }))
        toast.success('Signature uploaded successfully!')
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const removeSignature = useCallback(() => {
    setEditableData(prev => ({
      ...prev,
      signatureImage: null
    }))
    toast.success('Signature removed')
  }, [])

  // ==================== Item Management ====================
  const addNewItem = useCallback(() => {
    setEditableData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ...DEFAULT_ITEM,
          id: prev.items.length + 1
        }
      ]
    }))
  }, [])

  const removeItem = useCallback((id: number) => {
    setEditableData(prev => {
      if (prev.items.length <= 1) return prev
      return {
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }
    })
  }, [])

  const updateItem = useCallback((id: number, field: keyof OfferItem, value: string | number) => {
    setEditableData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }))
  }, [])

  // ==================== Render Helpers ====================
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading quotation...</p>
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-gray-600">Offer not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Action Buttons - Hidden on print */}
      <div className="container mx-auto py-4 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/offers/${offerId}`)}
            aria-label="Go back to offer details"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Offer
          </Button>

          <div className="flex gap-2">
            <Button 
              onClick={handleToggleEditMode}
              variant={isEditMode ? "default" : "outline"}
            >
              {isEditMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Quote
                </>
              )}
            </Button>
            <Button onClick={handlePrint} variant="outline" disabled={isEditMode}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" disabled={isEditMode}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleExportWord} variant="outline" disabled={isEditMode}>
              <FileText className="h-4 w-4 mr-2" />
              Export to Word
            </Button>
          </div>
        </div>
      </div>

      {/* Quotation Document */}
      <div ref={printRef} className="container mx-auto bg-white">
        <div className="max-w-4xl mx-auto p-8 print:p-12">
          {/* Logo */}
          <KardexLogo />

          {/* Title - Centered and Underlined */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-normal text-gray-600 inline-block border-b-2 border-gray-400 pb-1">Kardex Remstar Spare Parts Package</h1>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="text-center mb-6 hidden">
              {isEditMode ? (
                <Input
                  value={editableData.title}
                  onChange={(e) => setEditableData({...editableData, title: e.target.value})}
                  className="text-center text-2xl font-bold"
                  placeholder="Quotation Title"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{editableData.title || 'Quotation'}</h1>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <div className="flex gap-2 mb-1">
                  <span className="font-semibold">Ref:</span>
                  <span>{offer.offerReferenceNumber}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">Dated:</span>
                  <span>{format(quoteDate, 'dd/MM/yyyy')}</span>
                </div>
              </div>
              <div className="text-right">
                {isEditMode ? (
                  <div className="space-y-1">
                    <Input
                      value={editableData.gstNumber}
                      onChange={(e) => setEditableData({...editableData, gstNumber: e.target.value})}
                      className="text-right text-xs h-7"
                      placeholder="GST Number"
                    />
                    <Input
                      value={editableData.arnNumber}
                      onChange={(e) => setEditableData({...editableData, arnNumber: e.target.value})}
                      className="text-right text-xs h-7"
                      placeholder="ARN Number"
                    />
                  </div>
                ) : (
                  <>
                    <div>GST – {editableData.gstNumber}</div>
                    <div>ARN – {editableData.arnNumber}</div>
                  </>
                )}
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-4 text-sm">
              <div className="font-semibold text-gray-900">M/s {offer.customer?.companyName || offer.company}</div>
              {offer.customer?.address && <div className="text-gray-700">{offer.customer.address}</div>}
              {(offer.customer?.city || offer.customer?.state) && (
                <div className="text-gray-700">
                  {[offer.customer?.city, offer.customer?.state].filter(Boolean).join(' - ')}
                </div>
              )}
              {offer.contactPersonName && (
                <div className="text-gray-700 mt-2">
                  <span className="font-medium">Kind Attn:</span> {offer.contactPersonName}
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="mb-4 text-sm">
              {isEditMode ? (
                <Input
                  value={editableData.subject}
                  onChange={(e) => setEditableData({...editableData, subject: e.target.value})}
                  placeholder="Subject"
                  className="font-semibold"
                />
              ) : (
                editableData.subject && <div className="font-semibold">Sub: {editableData.subject}</div>
              )}
            </div>

            {/* Introduction */}
            <div className="mb-4 text-sm text-gray-700">
              {isEditMode ? (
                <Textarea
                  value={editableData.introduction}
                  onChange={(e) => setEditableData({...editableData, introduction: e.target.value})}
                  placeholder="Introduction paragraph"
                  rows={3}
                />
              ) : (
                editableData.introduction && <p>{editableData.introduction}</p>
              )}
            </div>
          </div>

          {/* Machine Details */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Machine Details:</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr style={{backgroundColor: '#4472C4'}}>
                  <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-white" style={{width: '60px'}}>Sr. No</th>
                  <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-white">Machine Model</th>
                  <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-white">Machine Sr. No</th>
                  <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-white">Machine Owner</th>
                  <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-white">Department</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-2">1</td>
                  <td className="border border-gray-300 px-2 py-2">
                    {isEditMode ? (
                      <Input
                        value={editableData.machineDetails.model}
                        onChange={(e) => setEditableData({...editableData, machineDetails: {...editableData.machineDetails, model: e.target.value}})}
                        placeholder="Machine Model"
                        className="h-7 text-xs"
                      />
                    ) : (
                      editableData.machineDetails.model || '-'
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    {isEditMode ? (
                      <Input
                        value={editableData.machineDetails.serialNumber}
                        onChange={(e) => setEditableData({...editableData, machineDetails: {...editableData.machineDetails, serialNumber: e.target.value}})}
                        placeholder="Serial Number"
                        className="h-7 text-xs"
                      />
                    ) : (
                      editableData.machineDetails.serialNumber || '-'
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    {isEditMode ? (
                      <Input
                        value={editableData.machineDetails.owner}
                        onChange={(e) => setEditableData({...editableData, machineDetails: {...editableData.machineDetails, owner: e.target.value}})}
                        placeholder="Owner"
                        className="h-7 text-xs"
                      />
                    ) : (
                      editableData.machineDetails.owner || '-'
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    {isEditMode ? (
                      <Input
                        value={editableData.machineDetails.department}
                        onChange={(e) => setEditableData({...editableData, machineDetails: {...editableData.machineDetails, department: e.target.value}})}
                        placeholder="Department"
                        className="h-7 text-xs"
                      />
                    ) : (
                      editableData.machineDetails.department || '-'
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Parts/Items Table */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Parts / Items:</h3>
              {isEditMode && (
                <Button onClick={addNewItem} size="sm" variant="outline" className="print:hidden">
                  Add Item
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr style={{backgroundColor: '#4472C4'}}>
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-white" style={{width: '40px'}}>S.N</th>
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-white" style={{width: '100px'}}>Part No</th>
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-white">Description</th>
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold text-white" style={{width: '80px'}}>HSN Code</th>
                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-white" style={{width: '90px'}}>Unit Price</th>
                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-white" style={{width: '50px'}}>Qty</th>
                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold text-white" style={{width: '100px'}}>Total Price</th>
                    {isEditMode && <th className="border border-gray-400 px-2 py-2 print:hidden text-white" style={{width: '60px'}}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {editableData.items.map((item, index) => (
                    <ItemRow
                      key={`${item.id}-${index}`}
                      item={item}
                      index={index}
                      isEditMode={isEditMode}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                      canRemove={editableData.items.length > 1}
                    />
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={6} className="border border-gray-300 px-2 py-2 text-right">TOTAL</td>
                    <td className="border border-gray-300 px-2 py-2 text-right">
                      {formatCurrency(subtotal)}
                    </td>
                    {isEditMode && <td className="border border-gray-300 print:hidden"></td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer - Page 1 */}
          <PageFooter pageNumber={1} />

          {/* Page Break - Page 2 */}
          <div className="page-break mt-12 mb-8 border-t-2 border-gray-300"></div>

          {/* Logo - Page 2 */}
          <KardexLogo />

          {/* Page 2 - Terms and Conditions */}
          <div className="mb-8">
            {/* TERMS AND CONDITIONS */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">TERMS AND CONDITIONS</h3>
              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>GST ({editableData.gstRate}%) to be paid extra</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Quotation validity up to 30 days</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Delivery - Ex-Works Bangalore, within 14 to 18 weeks from the date of Purchase Order, packing included.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Warranty: 3 months from the date of delivery for Electronics parts only.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Payment: N30. Within 30 days of delivery.</span>
                </li>
              </ul>
            </div>

            {/* OTHER TERMS & CONDITIONS */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-900 mb-2">OTHER TERMS & CONDITIONS AS PER THE ANNEXURE ATTACHED</p>
            </div>

            {/* Please Note Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Please Note: -</h3>
              <ul className="space-y-1 text-xs text-gray-700">
                <li>PO should contain Customer GST number of the place where delivery/services are requesting.</li>
                <li>If delivery address is different than the Invoice address, then we need Delivery address GST details, HSN codes</li>
                <li>PO should be on address as mentioned in quotation.</li>
                <li>PO should contain Quotation reference i.e, {offer.offerReferenceNumber}.</li>
                <li>PO should contain Kardex Ident Number as per the quotation</li>
                <li>PO should contain all line items mention in quotation, if more than one item.</li>
                <li>PO should contain delivery address and contact person's details.</li>
                <li>PO should have company seal signature.</li>
              </ul>
            </div>

            {/* Company Assurance */}
            <div className="mb-6 text-xs text-gray-700">
              <p className="mb-1">We assure you of our best services at all times and we shall not give you any room for Complaint on service.</p>
              <p className="mb-3">We shall spare no effort to ensure a professional first-class after-sales service.</p>
              
              <p className="mb-1">We request you kindly release the order on</p>
              <p className="font-semibold mb-1">M/s, {editableData.companyName.toUpperCase()}.</p>
              <p className="mb-0.5">{editableData.companyAddress},</p>
              <p className="mb-0.5">{editableData.companyCity}</p>
              <p className="mb-0.5">
                Tel   : {editableData.companyPhone} 
                {editableData.companyFax && <> Fax  : {editableData.companyFax}</>}
              </p>
              <p className="mb-3">Website : {editableData.companyWebsite}</p>
              
              <p className="mt-4 mb-2">If you need any clarifications/ information, please do contact the undersigned.</p>
              <p className="font-semibold mb-1">Yours faithfully</p>
            </div>

            {/* Signature Section - Contact Person */}
            <div className="mt-4 text-xs mb-8">
              {isEditMode ? (
                <div className="space-y-2">
                  <Input
                    value={editableData.contactPersonName}
                    onChange={(e) => setEditableData({...editableData, contactPersonName: e.target.value})}
                    placeholder="Contact Person Name"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={editableData.contactPersonPhone}
                    onChange={(e) => setEditableData({...editableData, contactPersonPhone: e.target.value})}
                    placeholder="Contact Person Phone"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={editableData.contactPersonEmail}
                    onChange={(e) => setEditableData({...editableData, contactPersonEmail: e.target.value})}
                    placeholder="Contact Person Email"
                    className="h-8 text-xs"
                  />
                  
                  {/* Signature Upload Section */}
                  <div className="space-y-2 mt-4 print:hidden">
                    <label className="text-xs font-medium text-gray-700">Signature Image</label>
                    
                    {editableData.signatureImage ? (
                      <div className="relative">
                        <img 
                          src={editableData.signatureImage} 
                          alt="Signature" 
                          className="w-32 h-16 object-contain border border-gray-300 rounded"
                        />
                        <Button
                          onClick={removeSignature}
                          size="sm"
                          variant="ghost"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden"
                          id="signature-upload"
                        />
                        <label
                          htmlFor="signature-upload"
                          className="cursor-pointer flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                        >
                          <Upload className="h-3 w-3" />
                          <span>Upload Signature</span>
                        </label>
                        <span className="text-gray-500 text-xs">Max 2MB (JPG, PNG, GIF)</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Signature Image Display */}
                  <div className="mb-2">
                    {editableData.signatureImage ? (
                      <img 
                        src={editableData.signatureImage} 
                        alt="Signature" 
                        className="w-32 h-16 object-contain"
                      />
                    ) : (
                      <div className="w-32 h-16 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">[Signature]</span>
                      </div>
                    )}
                  </div>
                  
                  {editableData.contactPersonName && (
                    <div>
                      <p className="font-semibold">{editableData.contactPersonName}</p>
                      {editableData.contactPersonPhone && <p>{editableData.contactPersonPhone}</p>}
                      {editableData.contactPersonEmail && (
                        <p className="text-blue-600 underline">{editableData.contactPersonEmail}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Page 2 */}
          <PageFooter pageNumber={2} />

          {/* Page Break - Page 3 */}
          <div className="page-break mt-12 mb-8 border-t-2 border-gray-300"></div>

          {/* Logo - Page 3 */}
          <KardexLogo />

          {/* KARDEX Service Products Section (Page 3) */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">KARDEX Service Products</h2>
            
            {/* 1) VLM Box */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">1) VLM Box</h3>
              
              {/* VLM Box Banner Image */}
              <div className="mb-3 rounded overflow-hidden service-product-image" style={{height: '150px'}}>
                <img 
                  src="/Picture1.jpg" 
                  alt="Kardex VLM Box - Industrial Storage Solutions" 
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    console.error('VLM Box image not found')
                  }}
                />
              </div>
              
              <p className="text-xs text-gray-700 mb-2">
                Are you looking forward to increasing your stock capacity by 20-25% by placing the things in tidy, clean and organized manner?
              </p>
              <p className="text-xs text-gray-700">
                Our Kardex VLM BOX can help. It's an adjustable bin system designed for the Vertical Lift Module Kardex Remstar XP. 
                It can increase the stock capacity by 20 – 25 %. The Kardex VLM BOX is flexible in height, width and depth to create 
                over 300 location types – from just one box.
              </p>
            </div>

            {/* 2) Relocations, Upgrades & Retrofits */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">2) Relocations, Upgrades & Retrofits</h3>
              
              {/* Relocations & Retrofits Banner Image */}
              <div className="mb-3 rounded overflow-hidden service-product-image" style={{height: '150px'}}>
                <img 
                  src="/Picture2.jpg" 
                  alt="Kardex Relocations, Upgrades & Retrofits Services" 
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    console.error('Relocations & Retrofits image not found')
                  }}
                />
              </div>
              
              <p className="text-xs text-gray-700 mb-3">
                Do you have a Kardex Storage and Retrieval system that is no longer used optimally or may be in need of modernization?
              </p>
              <p className="text-xs text-gray-700 mb-2">Here is an overview of the services we offer at Kardex:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                <div>
                  <p>• Height changes</p>
                  <p>• Improve storage capacity</p>
                  <p>• Replacement of picking devices</p>
                </div>
                <div>
                  <p>• Relocation of Kardex System</p>
                  <p>• Additional or relocation of existing work openings</p>
                  <p>• Security and component upgrades</p>
                </div>
              </div>
              <p className="text-xs text-gray-700 mt-2">• Modernizations</p>
            </div>

            {/* 3) Remote Support */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">3) Remote Support</h3>
              
              {/* Remote Support Banner Image */}
              <div className="mb-3 rounded overflow-hidden service-product-image" style={{height: '150px'}}>
                <img 
                  src="/Picture3.jpg" 
                  alt="Kardex Remote Support - Industrial Equipment Monitoring" 
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    console.error('Remote Support image not found')
                  }}
                />
              </div>
              
              <p className="text-xs text-gray-700 mb-2">
                How much equipment downtime is costing your workplace?
              </p>
              <p className="text-xs text-gray-700 mb-2">
                You can't afford to let unplanned equipment downtime cost your company money - especially if you can prevent it. 
                With our Remote Support solution, we can access machines and perform proactive maintenance and even resolve the breakdowns. 
                The operator can request technical help directly from the equipment's panel, send all the necessary information and get assistance.
              </p>
            </div>
          </div>

          {/* Footer - Page 3 */}
          <PageFooter pageNumber={3} />

          {/* Page Break - Page 4 */}
          <div className="page-break mt-12 mb-8 border-t-2 border-gray-300"></div>

          {/* Logo - Page 4 */}
          <KardexLogo />

          {/* Page 4 - Service Package */}
          <div className="mb-8">
            <h2 className="text-base font-normal text-gray-600 mb-4">Find the best service package for your requirements</h2>
            <p className="text-xs text-gray-700 mb-6">
              The following range of support services provide everything your business needs to make the most of your Kardex solution.
            </p>
            
            {/* Service Package Circular Diagram */}
            <div className="mb-3 rounded overflow-hidden service-product-image flex justify-center" style={{height: '350px'}}>
              <img 
                src="/Picture4.jpg" 
                alt="Kardex Service Package - Productivity, Reliability & Safety, Sustainability" 
                className="h-full object-contain rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  console.error('Service Package Diagram image not found')
                }}
              />
            </div>
          </div>

          {/* Footer - Page 4 */}
          <PageFooter pageNumber={4} />

          {/* Page Break - Page 5 */}
          <div className="page-break mt-12 mb-8 border-t-2 border-gray-300"></div>

          {/* Logo - Page 5 */}
          <KardexLogo />

          {/* General Terms and Conditions (Page 5) */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">General Terms and Conditions</h2>
            
            <div className="text-xs text-gray-700 space-y-4 two-column-layout">
              <p className="mb-4">These Terms and Conditions (T&C) are structured as follows:</p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Part A (general provisions) applies to all transactions, except where a provision of the applicable parts B and C contains deviating regulation (other than merely adding further details), which then takes precedence;</li>
                <li>Parts B and C contain the applicable specific provisions for supply of products and software programming services with or without installation (Part B), and individual service orders and service contracts (Part C);</li>
              </ul>
              
              <p className="mb-4">
                These T&C are provided in German, English and other languages. Only the German and English texts are legally binding and authoritative. 
                They are of equal status. Translations of these T&C into other languages are solely for convenience and are not legally binding.
              </p>

              {/* Part A: General Provisions */}
              <h3 className="text-sm font-bold text-gray-900 mt-6 mb-3">A. General Provisions</h3>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">1. Scope of the T&C</h4>
                <p className="mb-1">1.1. These T&C apply to all transactions between KARDEX INDIA STORAGE SOLUTIONS PRIVATE LIMITED and the customer, unless expressly otherwise agreed in writing.</p>
                <p className="mb-1">1.2. On placement of a purchase order by the customer, these T&C are deemed to be acknowledged, and will also apply for future transactions with the customer.</p>
                <p className="mb-1">1.3. Any deviating, contradictory or supplemental terms and conditions of the customer apply only if expressly accepted by KARDEX in writing.</p>
                <p className="mb-1">1.4. Any amendments of and additions to the contract must be made in writing. All agreements and legally binding declarations of the parties require written confirmation by KARDEX.</p>
                <p className="mb-1">1.5. KARDEX is entitled to amend the T&C at any time. The version current at the time of the purchase order applies. In the case of continuing contractual relationships, the draft of the amended T&C will be sent to the customer in writing no later than one month before the proposed date of their entry into force. The customer is deemed to have given its consent to the amendments if it has not rejected them by the planned date for entry into force. The amended T&C will then apply to any further transactions between the parties.</p>
                <p className="mb-1">1.6. The general provisions of these T&C (Part A) apply to all transactions and legal relations between the parties unless otherwise stated in the specific provisions (Parts B and C) or agreed in writing.</p>
                <p>1.7. The term "Product(s)" used in Part A is individually defined for each of Parts B and C. The meaning of this term in Part A shall therefore have the meaning as defined in the applicable Part B and C.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">2. Offers from KARDEX</h4>
                <p className="mb-1">2.1. Unless expressly otherwise agreed, offers from KARDEX are nonbinding; otherwise, the offers are valid for 60 days. A statement by the customer is deemed to be an acceptance only if it is fully consistent with the KARDEX offer.</p>
                <p className="mb-1">2.2. A contract is only validly concluded if KARDEX (i) confirms the order in writing or (ii) starts to perform the contract by delivering the Products or by rendering the service.</p>
                <p className="mb-1">2.3. Under no circumstances shall silence by KARDEX with respect to a counter-offer from the customer be construed as a declaration of acceptance.</p>
                <p>2.4. The documents relating to offers and order confirmations, such as illustrations, drawings, and weight and measurement details, are binding only if this has been expressly agreed in writing. Unless otherwise agreed in writing, brochures and catalogues are not binding.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">3. Provided Documents</h4>
                <p>Each party retains all rights to plans and technical documents that it has provided to the other party. The receiving party acknowledges these rights, and shall not make such documents available, in full or in part, to any third party without the prior written consent of the other party, or use them outside of the scope of the purpose for which they were provided for. This also applies after termination of the business relationship as well as in the event that no contract is concluded between the parties.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4. Prices and Payment Conditions</h4>
                <p className="mb-1">4.1. All prices are excluding GST</p>
                <p className="mb-1">4.2. Unless otherwise agreed in writing or specified in the subsequent specific provisions, invoices from KARDEX are payable within 30 days net from the invoice date, without any deduction. Advance and prepayments are payable within 10 days from the invoice date without any deduction.</p>
                <p className="mb-1">4.3. A customer failing to pay by the due date is in default without a reminder, and KARDEX is entitled to charge monthly default interest in the amount of 1%, except where a different default interest rate has been specified in the contract or in the offer.</p>
                <p className="mb-1">4.4. In the event of customer default, KARDEX is entitled to withdraw from the contract and claim back any Products already supplied and/or enter the site and render Products unusable. In addition, KARDEX is also entitled to claim direct damages and/or provide outstanding deliveries or services only against advance payment or the provision of collateral, or suspend the provision of services under other orders or service agreements for which payment has already been made.</p>
                <p>4.5. If KARDEX becomes aware of circumstances casting doubt on the solvency of the customer, KARDEX shall have the right to demand full payment in advance or the provision of collateral.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5. Set-off and Assignment</h4>
                <p className="mb-1">5.1. Set-off against any counterclaims of the customer is not permitted.</p>
                <p className="mb-1">5.2. Claims of the customer against KARDEX may be assigned only with consent from KARDEX.</p>
                <p>5.3. The transfer of any rights and obligations under or in connection with a contract between the parties is permitted only with the other contracting party's written consent.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">6. Liability</h4>
                <p className="mb-1">6.1. The contractual and non-contractual liability of KARDEX both for its own actions and for the actions of its auxiliary persons is limited, to the extent permitted by law, to immediate and direct damages and to a total of 20% of the contractually agreed remuneration per delivery or service concerned. In the case of continuing obligations (e.g. service contracts under Part C), liability is limited, to the extent legally permitted, per contract year, to immediate and direct damages and to the amount of 50% of the annual remuneration payable for the product or service affected by the damage. In case the liability cap in accordance with the above calculations is below EUR 10,000 in individual cases, a liability cap of EUR 10,000 applies.</p>
                <p className="mb-1">6.2. If KARDEX or its auxiliary persons unlawfully and culpably damage items owned by the customer, KARDEX's liability shall, in deviation from section A.6.1., be governed exclusively by the provisions of article 41 et seqq. of the Swiss Code of Obligations (CO) and shall be limited, to the extent permitted by law, to EUR 500,000 per claim. KARDEX's liability for damages to the product itself or to product accessories is exclusively governed by section A.6.1.</p>
                <p className="mb-1">6.3. Further claims not expressly mentioned in this provision and these T&C for any legal reason, in particular but not limited to claims for compensation of indirect and/or consequential damages not incurred on the product itself as well as damages due to loss of production, capacity and data including their consequences, loss of use, loss of orders, loss of profit, damage to reputation and punitive damages are excluded.</p>
                <p className="mb-1">6.4. The contractual and non-contractual liability of KARDEX is also excluded for damages which are due to (i) incorrect information about operational and technical conditions or about the chemical and physical conditions for the use of the products provided by the customer, auxiliary persons and/or its advisors, or (ii) other actions, omissions of the customer, his auxiliary persons, advisors or third parties or other circumstances within the responsibility of the customer.</p>
                <p className="mb-1">6.5. The above limitations and exclusions of liability do not apply (i) in cases of injury to life, body or health, (ii) in cases of intent or gross negligence on the part of KARDEX or its auxiliary persons, and (iii) for claims from product liability under product liability laws to the extent these laws are mandatory to the legal relationship between the parties.</p>
                <p>6.6. If third parties are injured by the customer's actions or omissions or if objects of third parties are damaged or third parties are otherwise damaged and KARDEX is held liable for this, KARDEX has a right of recourse to the customer.</p>
              </div>

              {/* Footer - Page 5 */}
              <PageFooter pageNumber={5} />
            </div>
          </div>

          {/* Page Break - Page 6 */}
          <div className="page-break mt-12 mb-8 border-t-2 border-gray-300"></div>

          {/* Logo - Page 6 */}
          <KardexLogo />

          {/* Page 6 - General Terms Continued */}
          <div className="mb-8">
            <div className="text-xs text-gray-700 space-y-4 two-column-layout">
              <div className="mb-4">
                <h4 className="font-semibold mb-2">7. Intellectual Property</h4>
                <p className="mb-1">7.1. The customer may not use the intellectual property of KARDEX (in particular technical protective rights, brands and other signs, designs, knowhow, copyright to software and other works) for any purposes other than those expressly agreed between the parties.</p>
                <p className="mb-1">7.2. Without the express permission of KARDEX, the customer may not transfer or otherwise provide KARDEX Products to third parties without the attached brands.</p>
                <p>7.3. Where KARDEX supplies software to the customer, the customer only acquires a simple, non-exclusive and non-transferrable right of use. The customer is not granted any right to edit the software.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">8. Data Protection</h4>
                <p className="mb-1">8.1. The protection of personal data is an important priority for KARDEX. KARDEX and the customer undertake to comply at all times with the applicable legal provisions on data protection. In particular, the customer assures that KARDEX is permitted to use personal data provided to them by the customer in accordance with this section A.8., and indemnifies and holds KARDEX fully harmless from any claims by the persons affected.</p>
                <p className="mb-1">8.2. KARDEX collects, processes and uses the customer's personal data for the performance of the contract. The customer's data will further be used for the purposes of future customer service, in which context the customer has the right to object in writing at any time. In addition, the customer's machines and operational data may be used and evaluated in anonymised form and user information on the customer's employees may be used in pseudonymized form for diagnosis and analysis purposes, and in anonymized form for the further development of KARDEX products and services (e.g. preventive maintenance). All data deriving from such analysis and diagnosis shall belong to KARDEX and may be freely used by KARDEX.</p>
                <p className="mb-1">8.3. The personal data of the customer will only be passed on to other companies (e.g. the transport company entrusted with the delivery) within the scope of contract processing and the provision of information technology and other administrative support activities. Otherwise, personal data will not be passed on to third parties. KARDEX ensures that companies that process personal data on behalf of KARDEX comply with the applicable legal provisions on data protection and that a comparable level of data protection is guaranteed, especially in the case of transfer abroad.</p>
                <p className="mb-1">8.4. The customer may contact KARDEX free of charge with any queries regarding the collection, processing or use of its personal data.</p>
                <p>8.5. When using web-based products of KARDEX (such as customer portal, remote portal) personal data will be recorded. The collection, processing and use of such data can, upon customer's request, be governed by a separate data processing agreement.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9. Confidentiality</h4>
                <p className="mb-1">9.1. Each of the parties undertakes to keep confidential all trade secrets and confidential information brought to their knowledge by the other party, in particular, all information on customer relationships and their details, other important information such as plans, service descriptions, product specifications, information on production processes and any other confidential information made available to it and/or otherwise disclosed by the other party in written or other form, and, in particular, not to make direct or indirect use thereof in business dealings and/or for competitive purposes, and/or pass it on to third parties in business dealings and/or for competitive purposes, and/or otherwise bring it directly or indirectly to the attention of third parties, either itself or through third parties.</p>
                <p className="mb-1">9.2. The confidentiality agreement does not apply where the information is publicly known, was already known to the other party when received, has been made available by third parties without any breach of a party's confidentiality obligation, or whose disclosure is mandatory under legal provisions, official orders or court orders, in particular judgments. The party wishing to invoke these exceptions bears the burden of proof in this regard.</p>
                <p>9.3. The parties will place all persons whose services they use for providing services or who otherwise come into contact with confidential information as per section A.9.1 under a confidentiality obligation in accordance with sections A.9.1. and A.9.2.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">10. Severability</h4>
                <p>If any provision of the contract, including these T&C, are or become fully or partially unenforceable or invalid under applicable law, such provision shall be ineffective only to the extent of such unenforceability or invalidity and the remaining provisions of the contract or the T&C, respectively, shall continue to be binding and in full force and effect. Such unenforceable or invalid provision shall be replaced by such a valid and enforceable provision, which the parties consider, in good faith, to match as closely as possible the invalid or unenforceable provision and attaining the same or a similar economic effect. The same applies in case a gap (Lücke) becomes evident.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">11. Office Hours</h4>
                <p>Office hours are the usual working hours Monday - Friday, 9:00 a.m. - 6:00 p.m., with the exception of the public holidays at the registered office of KARDEX.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">12. Governing Law and Jurisdiction</h4>
                <p className="mb-1">12.1. These T&C and the entire legal relationship between the parties shall be governed by, and construed in accordance with, Swiss law, with exclusion of the United Nations Convention on Contracts for the International Sale of Goods.</p>
                <p>12.2. Any dispute, controversy or claim arising out or in connection with the contract between the parties and/or these T&C, including their conclusion, validity, binding effect, breach, termination or rescission, shall be resolved by arbitration in accordance with the Swiss Rules of International Arbitration of the Swiss Chambers' Arbitration Institution. Regarding the time for service of initiation pleadings, the current text of the Rules of International Arbitration applies. The venue of the arbitration procedure is the city of Zurich, Switzerland. The language of the arbitration procedure is English or German.</p>
              </div>

              {/* Footer - Page 6 */}
              <PageFooter pageNumber={6} />
            </div>
          </div>

          {/* Page Break - Page 7 */}
          <div className="page-break mt-12 mb-8 border-t-2 border-gray-300"></div>

          {/* Logo - Page 7 */}
          <KardexLogo />

          {/* Page 7 - Part B */}
          <div className="mb-8">
            <div className="text-xs text-gray-700 space-y-4 two-column-layout">
              {/* Part B */}
              <h3 className="text-sm font-bold text-gray-900 mt-6 mb-3">B. Specific Provisions for Deliveries</h3>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">1. Delivery</h4>
                <p className="mb-1">1.1. The subject-matter of delivery contracts is the delivery of systems, machines and/or software products and individually customised software in accordance with the specifications in the order confirmation handed over to the customer by KARDEX (each individually or collectively "Product(s)").</p>
                <p className="mb-1">1.2. Only the characteristics listed in the order confirmation are guaranteed features. Public statements, promotions and advertisements do not constitute guaranteed features of the Products. It is the customer's responsibility to assess whether or not the ordered Products are suitable for their intended purpose.</p>
                <p className="mb-1">1.3. Any quality guarantees in addition to features guaranteed in the order confirmation must be confirmed by KARDEX in writing.</p>
                <p>1.4. KARDEX reserves the right to make design and/or shape changes to the Products if the Product thereafter deviates only insignificantly from the agreed quality and the changes are reasonable for the customer or if the customer agrees to the change of the agreed quality.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">2. Delivery Time</h4>
                <p className="mb-1">2.1. Delivery times are non-binding unless expressly confirmed as binding by KARDEX in writing.</p>
                <p className="mb-1">2.2. Delivery periods start with the dispatch of the order confirmation or receipt of the order in case there is no order confirmation, but not before the receipt of any advance payment or collateral to be provided by the customer.</p>
                <p className="mb-1">2.3. If subsequent change requests by the customer are accepted, the delivery period and delivery date are extended and postponed at least by the time required for implementation of the requested changes.</p>
                <p className="mb-1">2.4. Delivery periods and delivery dates are met if on their expiry the Product has left the factory or notification of readiness for dispatch has been given. In the case of installation of Products, the delivery period is met by timely handover or acceptance of the installed Product. Delays beyond the control of KARDEX (e.g. failure by the customer to provide ancillary services, such as the provision of documents, permits and/or clearances to be obtained by the customer, ensuring the availability of a suitable lifting platform or opening the building) will at least result in a corresponding extension of the delivery period. KARDEX has the right to charge incurred cost from such delays.</p>
                <p className="mb-1">2.5. Force majeure, strikes, lockouts and other impediments beyond the control of KARDEX will extend and postpone agreed delivery periods and delivery dates by no more than the duration of the impediment, to the extent that such impediments can be proven to have a significant impact on completion or delivery of the Products or associated services. The same applies where the impediments to performance occur in the operations of KARDEX' upstream suppliers. KARDEX will further not be accountable for the above circumstances if they arise during an already existing delay. KARDEX will notify the customer without delay of the beginning and end of such impediments.</p>
                <p className="mb-1">2.6. If the dispatch of the Products is delayed at the customer's request, the customer will be invoiced as from one month after the notification of readiness for shipment issued by KARDEX for the resulting storage costs; in the case of storage in the factory, KARDEX may claim a storage fee in accordance with normal local rates. KARDEX is, however, entitled, after setting a reasonable deadline that has expired without effect, to use the Product otherwise, and to supply the customer with a similar product within a new delivery period.</p>
                <p>2.7. Partial deliveries are permitted.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">3. Late Delivery</h4>
                <p className="mb-1">3.1. Damages for delay limited to 0.1% per week, maximum 5% of total consideration.</p>
                <p className="mb-1">3.2. Customer can withdraw only after two grace periods of 10 weeks each expire without success.</p>
                <p>3.3. Further claims due to delay are excluded except in cases of willful misconduct or gross negligence.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4. Place of Delivery; Transfer of Risk</h4>
                <p className="mb-1">4.1. Unless agreed otherwise, Product delivered "FCA KARDEX factory" (Incoterms 2010).</p>
                <p className="mb-1">4.2. If installation agreed, delivered "DDP customer's factory" (Incoterms 2010).</p>
                <p className="mb-1">4.3. Delayed shipment passes risk to customer when goods ready for dispatch.</p>
                <p>4.4. Customer must inspect for visible damage and provide documented report promptly.</p>
              </div>

              {/* Footer - Page 7 */}
              <PageFooter pageNumber={7} />
            </div>
          </div>

          {/* Page Break - Page 8 */}
          <div className="page-break mt-12 mb-8 border-t-2 border-gray-300"></div>

          {/* Logo - Page 8 */}
          <KardexLogo />

          {/* Page 8 - Part B Continued */}
          <div className="mb-8">
            <div className="text-xs text-gray-700 space-y-4 two-column-layout">
              <div className="mb-4">
                <h4 className="font-semibold mb-2">5. Inspection and Acceptance</h4>
                <p className="mb-1">5.1. Customer must inspect quality and quantity immediately. Defects reported within 10 days.</p>
                <p className="mb-1">5.2. If installation agreed, acceptance procedure required. Defects recorded in acceptance certificate.</p>
                <p className="mb-1">5.3. Product deemed accepted 14 days after receipt or notification of readiness.</p>
                <p className="mb-1">5.4. Minor defects do not permit refusal of acceptance.</p>
                <p>5.5. With acceptance, KARDEX no longer liable for defects discoverable on normal inspection.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">6. Warranty</h4>
                <p className="mb-1">6.1. KARDEX warrants delivery of Products free from defects.</p>
                <p className="mb-1">6.2. KARDEX has right and duty to rectify defect within reasonable deadline.</p>
                <p className="mb-1">6.3. KARDEX bears all costs necessary to rectify, repair or replace defective Product.</p>
                <p className="mb-1">6.4. If rectification fails, customer may claim price reduction or rescind contract.</p>
                <p className="mb-1">6.5. If shortfall in guaranteed performance less than or equal to 15%, no right to rescind or claim damages.</p>
                <p className="mb-1">6.6. Guaranteed values adjusted if customer changes device specification.</p>
                <p className="mb-1">6.7. Warranty rights expire 12 months after delivery.</p>
                <p>6.8. Warranty expires if repairs by untrained personnel or inappropriate operation.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">7. Prices and Payment Conditions</h4>
                <p className="mb-1">7.1. If legal requirements change, KARDEX may charge reasonable price increase.</p>
                <p className="mb-1">7.2. If installation undertaken: 50% on order, 40% on delivery, 10% within 30 days of acceptance.</p>
                <p>7.3. Currency effects may be additionally charged.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">8. Spare Parts; Maintenance Commitment</h4>
                <p className="mb-1">8.1. Non-electronic spare parts available for 10 years, electronic parts for 6 years.</p>
                <p>8.2. Software maintenance subject to maintenance contract.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">9. Technical Support by Customer</h4>
                <p className="mb-1">9.1. If installation agreed, customer obliged to provide technical support at own expense including:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Installation surface in well-swept condition</li>
                  <li>Necessary equipment and heavy tools</li>
                  <li>Heating, lighting, site energy supply, water</li>
                  <li>Suitable personnel and work rooms</li>
                  <li>Transport of installation parts</li>
                  <li>Materials for initial adjustment and testing</li>
                  <li>Floor load capacity, level installation surface</li>
                  <li>Energy supply, internet and data connection</li>
                  <li>Structural prerequisites for installation</li>
                </ul>
                <p className="mb-1 mt-2">9.2. Technical support must ensure work begins immediately on technician arrival.</p>
                <p className="mb-1">9.3. Customer provides assistance to KARDEX technician as needed.</p>
                <p>9.4. If customer fails obligations, KARDEX entitled to perform at customer's expense.</p>
              </div>

              {/* Footer - Page 8 */}
              <PageFooter pageNumber={8} />
            </div>
          </div>

          {/* Page Break - Page 9 */}
          <div className="page-break mt-12 mb-8 border-t-2 border-gray-300"></div>

          {/* Logo - Page 9 */}
          <KardexLogo />

          {/* Page 9 - Part C */}
          <div className="mb-8">
            <div className="text-xs text-gray-700 space-y-4 two-column-layout">
              {/* Part C */}
              <h3 className="text-sm font-bold text-gray-900 mt-6 mb-3">C. Provisions for Life Cycle Services</h3>
              
              <h4 className="font-semibold mb-2 mt-4">C1: General Definitions</h4>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">1. Individual Service Orders</h4>
                <p className="mb-1">1.1. Subject matter: repairs, installations, commissioning, relocation, maintenance, modifications, retrofits and upgrades.</p>
                <p>1.2. Scope determined in order confirmation specifying services, Products, place, times, remuneration.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">2. Service Contract</h4>
                <p className="mb-1">2.1. Subject matter: maintenance, repair work or services on Products over several years.</p>
                <p>2.2. Scope determined by service package (BASE, FLEX or FULL Care), Products, annual fee.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">3. Response Times</h4>
                <p>"Helpdesk Reaction Time": time from fault report to KARDEX Remote Support or telephone service begins. "OnSite Reaction Time": time to service technician arrival on site. Only reaction time during normal office hours relevant.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4. Fault Reports</h4>
                <p className="mb-1">4.1. All faults must be reported by telephone, online or Remote Help Request button.</p>
                <p className="mb-1">4.2. Elimination by telephone, Remote Support or on-site technician at KARDEX discretion.</p>
                <p className="mb-1">4.3. Reports outside agreed hours: KARDEX not obligated. If intervention occurs, double hourly rate.</p>
                <p className="mb-1">4.4. KARDEX investigates only if properly reported and fault reproducible.</p>
                <p>4.5. Software fault exists only if core functions impossible or severely impaired due to KARDEX software.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5. Timing / Agreement on Dates</h4>
                <p className="mb-1">5.1. Cancel/postpone less than 48 hours: customer bears costs.</p>
                <p>5.2. KARDEX may invoice unnecessary travel or waiting times exceeding 30 minutes.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">6. Liability</h4>
                <p className="mb-1">6.1. KARDEX not liable for damage from incorrect use, transmission failures, faulty execution of support instructions, attempted repairs by customer/third parties, untrained staff, delay in reaching technician, data loss.</p>
                <p>6.2. Liability for merchandise/goods stored in Products excluded.</p>
              </div>

              {/* Footer - Page 9 */}
              <PageFooter pageNumber={9} />
            </div>
          </div>

          {/* Page Break - Page 10 */}
          <div className="page-break mt-12 mb-8 border-t-2 border-gray-300"></div>

          {/* Logo - Page 10 */}
          <KardexLogo />

          {/* Page 10 - C2 Continued */}
          <div className="mb-8">
            <div className="text-xs text-gray-700 space-y-4 two-column-layout">
              <h4 className="font-semibold mb-2 mt-4">C2: Individual Services</h4>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">1. Individual Services Include:</h4>
                <p className="mb-1">1.1. Installation and Commissioning by skilled technicians.</p>
                <p className="mb-1">1.2. On-site support for repair after breakdown.</p>
                <p className="mb-1">1.3. Remote Support or telephone support to increase operating time.</p>
                <p className="mb-1">1.4. Relocation Service: dismantling, transport, installation at new location.</p>
                <p className="mb-1">1.5. Training services for customer staff.</p>
                <p className="mb-1">1.6. Maintenance and Safety Tests to ensure reliability.</p>
                <p className="mb-1">1.7. Modification services to adapt system to changes.</p>
                <p className="mb-1">1.8. Upgrade and Retrofit Services for latest technology.</p>
                <p>1.9. Spare Part Delivery Service for single parts or packages.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">2. Use of Third Party Sub-Contractors</h4>
                <p>KARDEX may use third party services. KARDEX ensures obligations fulfilled by third party.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">3. Unauthorized Intervention</h4>
                <p>Customer must inform KARDEX of external work before service. KARDEX may request inspection or decline service.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4. Technical Support by Customer</h4>
                <p>Customer obliged to provide technical support at own expense. Section B.10 applies for installation/relocation.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5. Acceptance</h4>
                <p className="mb-1">5.1. Customer must inspect upon completion. Results recorded in acceptance certificate.</p>
                <p className="mb-1">5.2. Deemed accepted 14 days after completion notification.</p>
                <p className="mb-1">5.3. Minor defects do not permit refusal.</p>
                <p>5.4. With acceptance, no liability for defects discoverable on normal inspection.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">6. Warranty</h4>
                <p className="mb-1">6.1. KARDEX warrants faultless provision per legal regulations and recognized rules.</p>
                <p className="mb-1">6.2. KARDEX has right and duty to rectify defect within reasonable deadline.</p>
                <p className="mb-1">6.3. Warranty expires 6 months after acceptance.</p>
                <p>6.4. Warranty voided by: improper use, faulty installation by customer/third party, modification/maintenance/repair/relocation by customer/third party, excessive wear, faulty operation, inappropriate materials, faulty construction, chemical/electronic effects not due to KARDEX fault, untrue indications by customer, force majeure.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">7. Remuneration</h4>
                <p className="mb-1">7.1. Charged on time and material basis per current price list unless lump sum agreed.</p>
                <p className="mb-1">7.2. KARDEX may charge costs for unnecessary travel.</p>
                <p>7.3. Waiting times caused by customer chargeable.</p>
              </div>

              {/* Footer - Page 10 */}
              <PageFooter pageNumber={10} />
            </div>
          </div>

          {/* Page Break - Page 11 */}
          <div className="page-break mt-12 mb-8 border-t-2 border-gray-300"></div>

          {/* Logo - Page 11 */}
          <KardexLogo />

          {/* Page 11 - C3 */}
          <div className="mb-8">
            <div className="text-xs text-gray-700 space-y-4 two-column-layout">
              <h4 className="font-semibold mb-2 mt-4">C3: Service Contracts</h4>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">1. Service Packages</h4>
                <p className="mb-1">1.1. Services determined by product descriptions, technical requirements, maintenance intervals, software upgrades.</p>
                <p className="mb-1">1.2. Maintenance during normal office hours. FLEX/FULL Care for extended hours.</p>
                <p className="mb-1">1.3. No warranty that Product remains defect-free or functions without interruption.</p>
                <p className="mb-1">1.4. Inclusion requires technically perfect condition. Expired warranty requires inspection first.</p>
                <p>1.5. KARDEX Remote Support monitors Product condition. No guarantee malfunction solvable remotely.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">2. Customer Obligations</h4>
                <p className="mb-1">2.1. Treat Product per KARDEX operating recommendations.</p>
                <p className="mb-1">2.2. Faults reported solely by authorized person to KARDEX service technician.</p>
                <p className="mb-1">2.3. Provide functional data transmission device for Remote Support.</p>
                <p className="mb-1">2.4. Support technician on site with own personnel as needed.</p>
                <p className="mb-1">2.5. Ensure Products available at agreed timeslot for service.</p>
                <p className="mb-1">2.6. All maintenance/repairs carried out solely by KARDEX or authorized subcontractor.</p>
                <p className="mb-1">2.7. Not change Product location without prior written notice. Upon request, KARDEX supervises relocation.</p>
                <p className="mb-1">2.8. Actively support KARDEX in fault diagnosis via Remote Support.</p>
                <p>2.9. Password required for Remote Support use.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">3. Remuneration for Service Contracts</h4>
                <p className="mb-1">3.1. Annual fee depends on service package (BASE, FLEX, FULL Care).</p>
                <p className="mb-1">3.2. First annual fee invoiced on signing, thereafter before each contract year.</p>
                <p className="mb-1">3.3. KARDEX may increase/decrease fee. If increase exceeds 5%, customer has extraordinary termination right.</p>
                <p className="mb-1">3.4. KARDEX may charge for unnecessary travel or if service cannot be performed due to customer.</p>
                <p>3.5. Additional inspections invoiced separately at applicable hourly rates.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">4. Warranty</h4>
                <p className="mb-1">4.1. KARDEX warrants faultless provision per relevant rules.</p>
                <p className="mb-1">4.2. KARDEX has right and duty to rectify defect within reasonable deadline.</p>
                <p className="mb-1">4.3. Customer must immediately inspect and notify defects. Warranty expires 6 months after acceptance.</p>
                <p className="mb-1">4.4. Warranty excluded if work by non-approved maintenance companies.</p>
                <p>4.5. No warrant for specific timeframe unless explicitly agreed. No warrant against unauthorized third-party access.</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">5. Term and Termination</h4>
                <p className="mb-1">5.1. Initial term 2 years.</p>
                <p className="mb-1">5.2. Extended by 1 year unless terminated with 3 months notice.</p>
                <p className="mb-1">5.3. May be terminated for cause with immediate effect if significant breach not remedied within 2 weeks.</p>
                <p>5.4. KARDEX may exclude individual Products after 3 months notice if no longer properly maintainable.</p>
              </div>

              {/* Footer - Page 11 */}
              <PageFooter pageNumber={11} />
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        /* Two-column layout for General Terms sections */
        .two-column-layout {
          column-count: 2;
          column-gap: 1.5rem;
          column-rule: none;
          text-align: justify;
        }
        
        .two-column-layout h3 {
          column-span: all;
          break-after: avoid;
          break-inside: avoid;
        }
        
        .two-column-layout h4 {
          break-after: avoid;
          break-inside: avoid;
        }
        
        .two-column-layout .mb-4 {
          break-inside: avoid;
        }
        
        .two-column-layout p {
          margin-bottom: 0.5rem;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-12 {
            padding: 2rem !important;
          }
          @page {
            margin: 0.75cm;
            size: A4;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          thead tr {
            background-color: #4472C4 !important;
            -webkit-print-color-adjust: exact !important;
          }
          thead th {
            color: white !important;
            background-color: #4472C4 !important;
            -webkit-print-color-adjust: exact !important;
          }
          .bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          .bg-gray-50 {
            background-color: #f9fafb !important;
          }
          .page-break {
            page-break-before: always;
            page-break-after: always;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 0 !important;
          }
          .print-footer {
            position: fixed;
            bottom: 0;
            width: 100%;
          }
          h2, h3, h4 {
            page-break-after: avoid;
          }
          p {
            orphans: 3;
            widows: 3;
          }
          
          /* Image placeholders - hide border in print but keep space */
          .bg-gray-200 {
            background-color: white !important;
            border: none !important;
          }
          
          /* Banner images - ensure proper print display */
          img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Service product images specific styling */
          .service-product-image {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          /* Two-column layout also in print */
          .two-column-layout {
            column-count: 2;
            column-gap: 1.5rem;
            column-rule: none;
            text-align: justify;
          }
          
          .two-column-layout h3 {
            column-span: all;
            break-after: avoid;
            break-inside: avoid;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          .two-column-layout h4 {
            break-after: avoid;
            break-inside: avoid;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          .two-column-layout .mb-4 {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          .two-column-layout p {
            margin-bottom: 0.5rem;
          }
          
          /* Hide page break labels in print */
          .page-break {
            page-break-before: always;
            break-before: page;
            display: block;
            height: 0;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .page-break::after {
            display: none !important;
            content: none !important;
          }
        }
        
        @media screen {
          .page-break {
            margin: 3rem 0;
            border-top: 2px dashed #e5e7eb;
            position: relative;
          }
          .page-break::after {
            content: "Page Break";
            position: absolute;
            top: -0.75rem;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 0 1rem;
            color: #9ca3af;
            font-size: 0.75rem;
            font-weight: 500;
          }
        }
      `}</style>
    </>
  )
}
