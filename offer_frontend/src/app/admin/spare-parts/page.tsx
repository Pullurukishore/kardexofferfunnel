'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Plus,
  RefreshCw,
  Loader2,
  Package,
  DollarSign,
  Tag,
  Image,
  Save,
  X
} from 'lucide-react'
import { apiService } from '@/services/api'
import { toast } from 'sonner'

const statuses = ['All Status', 'ACTIVE', 'INACTIVE', 'DISCONTINUED']
const categories = ['All Categories', 'Hardware', 'Software', 'Consumables', 'Tools', 'Accessories']

export default function SparePartsManagement() {
  const router = useRouter()
  const [spareParts, setSpareParts] = useState<any[]>([])
  const [selectedParts, setSelectedParts] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPart, setEditingPart] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '', // Auto-generated
    basePrice: '',
    imageUrl: '',
    status: 'ACTIVE'
  })
  const [formLoading, setFormLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  useEffect(() => {
    fetchSpareParts()
  }, [searchTerm, selectedStatus, selectedCategory, pagination.page])

  const fetchSpareParts = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      
      if (searchTerm) params.search = searchTerm
      if (selectedStatus !== 'All Status') params.status = selectedStatus
      if (selectedCategory !== 'All Categories') params.category = selectedCategory

      const response = await apiService.getSpareParts(params)
      setSpareParts(response.spareParts || [])
      setPagination(response.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
    } catch (error: any) {
      console.error('Failed to fetch spare parts:', error)
      toast.error(error.response?.data?.error || 'Failed to fetch spare parts')
      setSpareParts([])
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'INACTIVE':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'DISCONTINUED':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Hardware':
        return 'text-blue-700 bg-blue-100'
      case 'Software':
        return 'text-purple-700 bg-purple-100'
      case 'Consumables':
        return 'text-orange-700 bg-orange-100'
      case 'Tools':
        return 'text-green-700 bg-green-100'
      case 'Accessories':
        return 'text-indigo-700 bg-indigo-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  const handleSelectPart = (partId: number) => {
    setSelectedParts(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    )
  }

  const handleSelectAll = () => {
    if (selectedParts.length === spareParts.length) {
      setSelectedParts([])
    } else {
      setSelectedParts(spareParts.map((part: any) => part.id))
    }
  }

  const handleEditPart = (part: any) => {
    setEditingPart(part)
    setFormData({
      name: part.name || '',
      partNumber: part.partNumber || '',
      basePrice: part.basePrice?.toString() || '',
      imageUrl: part.imageUrl || '',
      status: 'ACTIVE'
    })
    setImagePreview(part.imageUrl || '')
    setImageFile(null)
    setShowEditDialog(true)
  }

  const handleCreatePart = () => {
    setEditingPart(null)
    setFormData({
      name: '',
      partNumber: '',
      basePrice: '',
      imageUrl: '',
      status: 'ACTIVE'
    })
    setImagePreview('')
    setImageFile(null)
    setShowCreateDialog(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    // In a real app, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll use base64 encoding
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.basePrice) {
      toast.error('Name and price are required')
      return
    }

    setFormLoading(true)
    try {
      let imageUrl = formData.imageUrl
      
      // Upload image if a new file is selected
      if (imageFile) {
        setUploading(true)
        imageUrl = await uploadImage(imageFile)
      }

      // Auto-generate part number if creating new
      let partNumber = formData.partNumber
      if (!editingPart) {
        partNumber = `SP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      }

      const submitData = {
        ...formData,
        partNumber,
        imageUrl,
        category: 'General', // Default category
        description: formData.name, // Use name as description
      }

      if (editingPart) {
        await apiService.updateSparePart(editingPart.id, submitData)
        toast.success('Spare part updated successfully')
        setShowEditDialog(false)
      } else {
        await apiService.createSparePart(submitData)
        toast.success('Spare part created successfully')
        setShowCreateDialog(false)
      }
      fetchSpareParts()
    } catch (error: any) {
      console.error('Failed to save spare part:', error)
      toast.error(error.response?.data?.error || 'Failed to save spare part')
    } finally {
      setFormLoading(false)
      setUploading(false)
    }
  }

  const handleDeletePart = async (partId: number) => {
    if (confirm('Are you sure you want to delete this spare part?')) {
      try {
        await apiService.deleteSparePart(partId)
        toast.success('Spare part deleted successfully')
        fetchSpareParts()
      } catch (error: any) {
        console.error('Failed to delete spare part:', error)
        toast.error(error.response?.data?.error || 'Failed to delete spare part')
      }
    }
  }

  const handleBulkPriceUpdate = () => {
    // TODO: Implement bulk price update functionality
    toast.info('Bulk price update feature coming soon')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedStatus('All Status')
    setSelectedCategory('All Categories')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spare Parts Management</h1>
          <p className="text-gray-600">Manage spare parts inventory and pricing for SSP offers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleBulkPriceUpdate} variant="outline">
            <DollarSign className="h-4 w-4 mr-2" />
            Bulk Price Update
          </Button>
          <Button onClick={handleCreatePart}>
            <Plus className="h-4 w-4 mr-2" />
            Add Spare Part
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Search spare parts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={clearFilters}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <p className="text-sm text-gray-600">
              Showing {spareParts.length} of {pagination.total} spare parts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedParts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedParts.length} spare part(s) selected
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleBulkPriceUpdate}>
                  Update Prices
                </Button>
                <Button size="sm" variant="destructive">
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spare Parts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={selectedParts.length === spareParts.length && spareParts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Image</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Part Details</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Base Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Loading spare parts...</p>
                    </td>
                  </tr>
                ) : spareParts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No spare parts found
                    </td>
                  </tr>
                ) : (
                  spareParts.map((part: any) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedParts.includes(part.id)}
                        onCheckedChange={() => handleSelectPart(part.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {part.imageUrl ? (
                        <img 
                          src={part.imageUrl} 
                          alt={part.name}
                          className="w-12 h-12 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{part.name}</p>
                        <p className="text-sm text-gray-500">#{part.partNumber}</p>
                        {part.description && (
                          <p className="text-xs text-gray-400 mt-1 max-w-xs truncate">{part.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {part.category && (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(part.category)}`}>
                          {part.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(Number(part.basePrice))}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(part.status)}`}>
                        {part.status}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(part.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditPart(part)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeletePart(part.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Add New Spare Part
            </DialogTitle>
            <DialogDescription>
              Create a new spare part for SSP offers
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold">Spare Part Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Motor Bearing 6201-2RS"
                className="text-base"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Image</Label>
              <div className="flex items-center gap-4">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('')
                          setImageFile(null)
                          handleInputChange('imageUrl', '')
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="basePrice" className="text-base font-semibold">Price (₹) *</Label>
              <Input
                id="basePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => handleInputChange('basePrice', e.target.value)}
                placeholder="e.g., 450.00"
                className="text-base text-lg font-semibold"
              />
              {formData.basePrice && (
                <p className="text-sm text-gray-600">
                  Formatted: ₹{parseFloat(formData.basePrice).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={formLoading || uploading}
            >
              {formLoading || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Spare Part
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Spare Part
            </DialogTitle>
            <DialogDescription>
              Update spare part details and pricing
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="editName" className="text-base font-semibold">Spare Part Name *</Label>
              <Input
                id="editName"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Motor Bearing 6201-2RS"
                className="text-base"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Image</Label>
              <div className="flex items-center gap-4">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('')
                          setImageFile(null)
                          handleInputChange('imageUrl', '')
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="editBasePrice" className="text-base font-semibold">Price (₹) *</Label>
              <Input
                id="editBasePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => handleInputChange('basePrice', e.target.value)}
                placeholder="e.g., 450.00"
                className="text-base text-lg font-semibold"
              />
              {formData.basePrice && (
                <p className="text-sm text-gray-600">
                  Formatted: ₹{parseFloat(formData.basePrice).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={formLoading || uploading}
            >
              {formLoading || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Spare Part
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
