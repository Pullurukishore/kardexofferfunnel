'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
  X,
  Sparkles,
  Grid3x3,
  List,
  TrendingUp
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
  const [showBulkPriceDialog, setShowBulkPriceDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, pages: 0 })
  const [pageSize, setPageSize] = useState(100)
  const [showAll, setShowAll] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
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

  // Bulk price update states
  const [bulkPriceType, setBulkPriceType] = useState<'percentage' | 'fixed' | 'individual'>('percentage')
  const [bulkPriceValue, setBulkPriceValue] = useState('')
  const [bulkPriceOperation, setBulkPriceOperation] = useState<'increase' | 'decrease' | 'set'>('increase')
  const [individualPrices, setIndividualPrices] = useState<Record<number, string>>({})
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchSpareParts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, selectedStatus, selectedCategory, pagination.page, pageSize, showAll])

  const fetchSpareParts = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        page: showAll ? 1 : pagination.page,
        limit: showAll ? 10000 : pageSize, // Large number to get all items
      }
      
      if (debouncedSearchTerm) params.search = debouncedSearchTerm
      if (selectedStatus !== 'All Status') params.status = selectedStatus
      if (selectedCategory !== 'All Categories') params.category = selectedCategory

      const response = await apiService.getSpareParts(params)
      setSpareParts(response.spareParts || [])
      setPagination(response.pagination || { page: 1, limit: showAll ? 10000 : pageSize, total: 0, pages: 0 })
    } catch (error: any) {
      console.error('Failed to fetch spare parts:', error)
      toast.error(error.response?.data?.error || 'Failed to fetch spare parts')
      setSpareParts([])
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pageSize, debouncedSearchTerm, selectedStatus, selectedCategory, showAll])

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
    if (selectedParts.length === spareParts.length && spareParts.length > 0) {
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
    console.log('Bulk price update clicked, selected parts:', selectedParts.length)
    
    if (selectedParts.length === 0) {
      toast.error('Please select at least one spare part')
      return
    }
    
    // Initialize individual prices with current prices
    const prices: Record<number, string> = {}
    selectedParts.forEach(partId => {
      const part = spareParts.find(p => p.id === partId)
      if (part) {
        prices[partId] = part.basePrice.toString()
      }
    })
    setIndividualPrices(prices)
    setBulkPriceType('percentage')
    setBulkPriceValue('')
    setBulkPriceOperation('increase')
    setShowBulkPriceDialog(true)
    console.log('Dialog should open now, showBulkPriceDialog set to true')
  }

  const calculateNewPrice = (currentPrice: number): number => {
    const value = parseFloat(bulkPriceValue)
    if (isNaN(value)) return currentPrice

    if (bulkPriceType === 'percentage') {
      if (bulkPriceOperation === 'increase') {
        return currentPrice * (1 + value / 100)
      } else if (bulkPriceOperation === 'decrease') {
        return currentPrice * (1 - value / 100)
      } else {
        return currentPrice
      }
    } else if (bulkPriceType === 'fixed') {
      if (bulkPriceOperation === 'increase') {
        return currentPrice + value
      } else if (bulkPriceOperation === 'decrease') {
        return currentPrice - value
      } else {
        return value
      }
    }
    return currentPrice
  }

  const handleBulkPriceSubmit = async () => {
    setBulkUpdateLoading(true)
    try {
      let updates: any[] = []

      if (bulkPriceType === 'individual') {
        // Use individual prices
        updates = Object.entries(individualPrices).map(([id, price]) => ({
          id: parseInt(id),
          basePrice: parseFloat(price)
        }))
      } else {
        // Calculate prices based on percentage or fixed amount
        updates = selectedParts.map(partId => {
          const part = spareParts.find(p => p.id === partId)
          if (!part) return null
          
          const newPrice = calculateNewPrice(part.basePrice)
          return {
            id: partId,
            basePrice: Math.max(0, newPrice) // Ensure price is not negative
          }
        }).filter(Boolean)
      }

      if (updates.length === 0) {
        toast.error('No valid price updates to apply')
        return
      }

      await apiService.bulkUpdateSparePartPrices(updates)
      toast.success(`Successfully updated prices for ${updates.length} spare parts`)
      setShowBulkPriceDialog(false)
      setSelectedParts([])
      fetchSpareParts()
    } catch (error: any) {
      console.error('Bulk price update error:', error)
      toast.error(error.response?.data?.error || 'Failed to update prices')
    } finally {
      setBulkUpdateLoading(false)
    }
  }

  const handleIndividualPriceChange = (partId: number, price: string) => {
    setIndividualPrices(prev => ({
      ...prev,
      [partId]: price
    }))
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setSelectedStatus('All Status')
    setSelectedCategory('All Categories')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageSizeChange = (newSize: number) => {
    if (newSize === 9999) {
      // Show All option
      setShowAll(true)
      setPagination(prev => ({ ...prev, page: 1 }))
    } else {
      setShowAll(false)
      setPageSize(newSize)
      setPagination(prev => ({ ...prev, page: 1, limit: newSize }))
    }
  }

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header Section with Stats */}
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Spare Parts Management</h1>
                <p className="text-gray-600 mt-1">Manage spare parts inventory and pricing for SSP offers</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleBulkPriceUpdate} 
              variant="outline" 
              className="shadow-sm hover:shadow-md transition-shadow"
              disabled={selectedParts.length === 0}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Bulk Price Update {selectedParts.length > 0 && `(${selectedParts.length})`}
            </Button>
            <Button onClick={handleCreatePart} className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-blue-600 to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Spare Part
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Parts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{pagination.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Parts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {spareParts.filter(p => p.status === 'ACTIVE').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {spareParts.length > 0 
                      ? formatCurrency(spareParts.reduce((sum, p) => sum + Number(p.basePrice), 0) / spareParts.length)
                      : '₹0'}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {new Set(spareParts.map(p => p.category).filter(Boolean)).size}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Tag className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Search & Filters</CardTitle>
            </div>
            {(searchTerm || selectedStatus !== 'All Status' || selectedCategory !== 'All Categories') && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-blue-600 hover:text-blue-700">
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-semibold text-gray-700">Search Parts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or part number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        {status !== 'All Status' && (
                          <div className={`w-2 h-2 rounded-full ${
                            status === 'ACTIVE' ? 'bg-green-500' :
                            status === 'INACTIVE' ? 'bg-gray-500' :
                            status === 'DISCONTINUED' ? 'bg-red-500' : ''
                          }`} />
                        )}
                        {status}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${showAll ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                {showAll ? `Showing all ${spareParts.length} parts` : `Showing ${((pagination.page - 1) * pageSize) + 1}-${Math.min(pagination.page * pageSize, pagination.total)} of ${pagination.total} parts`}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-600">Per page:</Label>
                <Select value={showAll ? "9999" : pageSize.toString()} onValueChange={(val) => handlePageSizeChange(Number(val))}>
                  <SelectTrigger className="h-9 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="9999">✨ Show All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex gap-1 border-2 border-gray-200 rounded-lg p-1 bg-white">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-9 px-4"
                >
                  <Grid3x3 className="h-4 w-4 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-9 px-4"
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </Button>
              </div>
              <Button variant="outline" onClick={clearFilters} className="shadow-sm hover:shadow-md transition-shadow">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedParts.length > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    {selectedParts.length} spare part(s) selected
                  </p>
                  <p className="text-xs text-blue-700">Perform bulk actions on selected items</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleBulkPriceUpdate} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Update Prices
                </Button>
                <Button size="sm" variant="destructive" className="shadow-md">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spare Parts Display */}
      {loading ? (
        <Card className="shadow-lg border-0">
          <CardContent className="py-20">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-4" />
              <p className="text-xl font-semibold text-gray-700">Loading spare parts...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the data</p>
            </div>
          </CardContent>
        </Card>
      ) : spareParts.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="py-20">
            <div className="flex flex-col items-center justify-center">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl mb-6">
                <Package className="h-20 w-20 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No spare parts found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or add a new spare part to get started</p>
              <Button onClick={handleCreatePart} size="lg" className="shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Spare Part
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {spareParts.map((part: any) => (
            <Card key={part.id} className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 hover:border-blue-400 bg-white">
              <CardContent className="p-0">
                {/* Image Section */}
                <div className="relative h-52 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 overflow-hidden">
                  {part.imageUrl ? (
                    <img 
                      src={part.imageUrl} 
                      alt={part.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-24 w-24 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-lg backdrop-blur-sm ${getStatusColor(part.status)}`}>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        part.status === 'ACTIVE' ? 'bg-green-600' :
                        part.status === 'INACTIVE' ? 'bg-gray-600' :
                        'bg-red-600'
                      }`} />
                      {part.status}
                    </div>
                  </div>
                  
                  {/* Checkbox Overlay */}
                  <div className="absolute top-3 left-3">
                    <div className="p-1 bg-white rounded-lg shadow-lg">
                      <Checkbox
                        checked={selectedParts.includes(part.id)}
                        onCheckedChange={() => handleSelectPart(part.id)}
                      />
                    </div>
                  </div>
                  
                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditPart(part)}
                      className="shadow-xl backdrop-blur-sm"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePart(part.id)}
                      className="shadow-xl"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-5 space-y-3">
                  {/* Part Name */}
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                      {part.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                      #{part.partNumber}
                    </p>
                  </div>
                  
                  {/* Category */}
                  {part.category && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${getCategoryColor(part.category)}`}>
                      <Tag className="h-3 w-3" />
                      {part.category}
                    </div>
                  )}
                  
                  {/* Description */}
                  {part.description && part.description !== part.name && (
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{part.description}</p>
                  )}
                  
                  {/* Price */}
                  <div className="pt-3 border-t-2 border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Price</span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(Number(part.basePrice))}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                      Added {new Date(part.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Pagination for Grid View */}
        {!showAll && pagination.pages > 1 && (
          <Card className="shadow-lg border-0 mt-6">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(1)}
                    disabled={pagination.page === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.pages)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </>
      ) : (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Spare Parts Inventory
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <Checkbox
                      checked={selectedParts.length === spareParts.length && spareParts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Part Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Base Price</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {spareParts.map((part: any) => (
                  <tr key={part.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedParts.includes(part.id)}
                        onCheckedChange={() => handleSelectPart(part.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {part.imageUrl ? (
                        <img 
                          src={part.imageUrl} 
                          alt={part.name}
                          className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-gray-200 flex items-center justify-center shadow-sm">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">{part.name}</p>
                        <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block">
                          #{part.partNumber}
                        </p>
                        {part.description && (
                          <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">{part.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {part.category && (
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${getCategoryColor(part.category)}`}>
                          {part.category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(Number(part.basePrice))}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 shadow-sm ${getStatusColor(part.status)}`}>
                        <div className={`w-2 h-2 rounded-full ${
                          part.status === 'ACTIVE' ? 'bg-green-600' :
                          part.status === 'INACTIVE' ? 'bg-gray-600' :
                          'bg-red-600'
                        }`} />
                        {part.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(part.createdAt).toLocaleDateString('en-IN', { 
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditPart(part)} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="font-medium">Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeletePart(part.id)}
                            className="text-red-600 cursor-pointer focus:text-red-700 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span className="font-medium">Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        {/* Pagination for List View */}
        {!showAll && pagination.pages > 1 && (
          <CardContent className="border-t py-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages} • {pagination.total} total parts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(1)}
                  disabled={pagination.page === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.pages)}
                  disabled={pagination.page === pagination.pages}
                >
                  Last
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              Add New Spare Part
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Create a new spare part for SSP offers. Fill in the required details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            {/* Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-600" />
                Spare Part Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Motor Bearing 6201-2RS"
                className="text-base h-12 border-2 focus:border-blue-500"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Image className="h-4 w-4 text-blue-600" />
                Product Image
              </Label>
              <div className="flex items-start gap-6 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <div className="relative w-32 h-32 rounded-xl border-2 border-blue-300 overflow-hidden shadow-lg">
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
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-400 flex items-center justify-center bg-white">
                      <div className="text-center">
                        <Image className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No image</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer h-11"
                  />
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="font-medium">Supported formats:</span> PNG, JPG, GIF
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="font-medium">Max size:</span> 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-3">
              <Label htmlFor="basePrice" className="text-base font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Base Price (₹) *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-500 font-semibold">₹</span>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', e.target.value)}
                  placeholder="450.00"
                  className="text-base h-14 text-xl font-bold pl-10 border-2 focus:border-green-500"
                />
              </div>
              {formData.basePrice && (
                <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                  <p className="text-sm font-semibold text-green-800">
                    Display Price: ₹{parseFloat(formData.basePrice).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={formLoading}
              className="h-11 px-6"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={formLoading || uploading}
              className="h-11 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
            >
              {formLoading || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading Image...' : 'Creating Part...'}
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
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                <Edit className="h-6 w-6 text-white" />
              </div>
              Edit Spare Part
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Update spare part details and pricing information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            {/* Name */}
            <div className="space-y-3">
              <Label htmlFor="editName" className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-600" />
                Spare Part Name *
              </Label>
              <Input
                id="editName"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Motor Bearing 6201-2RS"
                className="text-base h-12 border-2 focus:border-blue-500"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Image className="h-4 w-4 text-blue-600" />
                Product Image
              </Label>
              <div className="flex items-start gap-6 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <div className="relative w-32 h-32 rounded-xl border-2 border-blue-300 overflow-hidden shadow-lg">
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
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-400 flex items-center justify-center bg-white">
                      <div className="text-center">
                        <Image className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No image</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer h-11"
                  />
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="font-medium">Supported formats:</span> PNG, JPG, GIF
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="font-medium">Max size:</span> 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-3">
              <Label htmlFor="editBasePrice" className="text-base font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Base Price (₹) *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-500 font-semibold">₹</span>
                <Input
                  id="editBasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', e.target.value)}
                  placeholder="450.00"
                  className="text-base h-14 text-xl font-bold pl-10 border-2 focus:border-green-500"
                />
              </div>
              {formData.basePrice && (
                <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                  <p className="text-sm font-semibold text-green-800">
                    Display Price: ₹{parseFloat(formData.basePrice).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={formLoading}
              className="h-11 px-6"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={formLoading || uploading}
              className="h-11 px-6 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg"
            >
              {formLoading || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading Image...' : 'Updating Part...'}
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

      {/* Bulk Price Update Dialog */}
      <Dialog open={showBulkPriceDialog} onOpenChange={(open) => {
        console.log('Dialog open state changed to:', open)
        setShowBulkPriceDialog(open)
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              Bulk Price Update
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Update prices for {selectedParts.length} selected spare part(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Update Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-bold text-gray-800">Update Method</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={bulkPriceType === 'percentage' ? 'default' : 'outline'}
                  onClick={() => setBulkPriceType('percentage')}
                  className="h-20 flex-col gap-2"
                >
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm font-semibold">Percentage</span>
                </Button>
                <Button
                  type="button"
                  variant={bulkPriceType === 'fixed' ? 'default' : 'outline'}
                  onClick={() => setBulkPriceType('fixed')}
                  className="h-20 flex-col gap-2"
                >
                  <DollarSign className="h-6 w-6" />
                  <span className="text-sm font-semibold">Fixed Amount</span>
                </Button>
                <Button
                  type="button"
                  variant={bulkPriceType === 'individual' ? 'default' : 'outline'}
                  onClick={() => setBulkPriceType('individual')}
                  className="h-20 flex-col gap-2"
                >
                  <Edit className="h-6 w-6" />
                  <span className="text-sm font-semibold">Individual</span>
                </Button>
              </div>
            </div>

            {/* Percentage/Fixed Amount Controls */}
            {bulkPriceType !== 'individual' && (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-bold text-gray-800">Operation</Label>
                  <Select value={bulkPriceOperation} onValueChange={(val: any) => setBulkPriceOperation(val)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Increase by
                        </div>
                      </SelectItem>
                      <SelectItem value="decrease">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                          Decrease by
                        </div>
                      </SelectItem>
                      <SelectItem value="set">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          Set to (Fixed only)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-bold text-gray-800">
                    {bulkPriceType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step={bulkPriceType === 'percentage' ? '0.1' : '1'}
                    value={bulkPriceValue}
                    onChange={(e) => setBulkPriceValue(e.target.value)}
                    placeholder={bulkPriceType === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 100'}
                    className="h-12 text-lg"
                  />
                </div>

                {/* Preview */}
                {bulkPriceValue && (
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <h4 className="font-bold text-blue-900 mb-3">Price Preview</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedParts.slice(0, 5).map(partId => {
                        const part = spareParts.find(p => p.id === partId)
                        if (!part) return null
                        const newPrice = calculateNewPrice(part.basePrice)
                        return (
                          <div key={partId} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                            <span className="font-medium text-gray-700">{part.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{formatCurrency(part.basePrice)}</span>
                              <span className="text-blue-600 font-bold">→</span>
                              <span className="text-green-600 font-bold">{formatCurrency(newPrice)}</span>
                            </div>
                          </div>
                        )
                      })}
                      {selectedParts.length > 5 && (
                        <p className="text-xs text-gray-500 text-center pt-2">
                          + {selectedParts.length - 5} more items
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Individual Price Editing */}
            {bulkPriceType === 'individual' && (
              <div className="space-y-3">
                <Label className="text-base font-bold text-gray-800">Edit Individual Prices</Label>
                <div className="border-2 border-gray-200 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                  {selectedParts.map(partId => {
                    const part = spareParts.find(p => p.id === partId)
                    if (!part) return null
                    return (
                      <div key={partId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{part.name}</p>
                          <p className="text-xs text-gray-500">Current: {formatCurrency(part.basePrice)}</p>
                        </div>
                        <div className="w-40">
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500">₹</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={individualPrices[partId] || ''}
                              onChange={(e) => handleIndividualPriceChange(partId, e.target.value)}
                              className="pl-8 h-10"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkPriceDialog(false)}
              disabled={bulkUpdateLoading}
              className="h-11 px-6"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBulkPriceSubmit}
              disabled={bulkUpdateLoading || (bulkPriceType !== 'individual' && !bulkPriceValue)}
              className="h-11 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
            >
              {bulkUpdateLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Prices...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update {selectedParts.length} Price(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
