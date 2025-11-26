'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Search,
  Filter,
  Loader2,
  Package,
  DollarSign,
  Tag,
  Grid3x3,
  List,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { apiService } from '@/services/api'
import { toast } from 'sonner'

const statuses = ['All Status', 'ACTIVE', 'INACTIVE', 'DISCONTINUED']
const categories = ['All Categories', 'Hardware', 'Software', 'Consumables', 'Tools', 'Accessories']

interface SparePartsListProps {
  defaultView?: 'grid' | 'list'
}

export default function SparePartsList({ defaultView = 'list' }: SparePartsListProps) {
  const [spareParts, setSpareParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView)
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, pages: 0 })
  const [pageSize, setPageSize] = useState(100)
  const [showAll, setShowAll] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')

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
        limit: showAll ? 10000 : pageSize,
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

  const clearFilters = () => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setSelectedStatus('All Status')
    setSelectedCategory('All Categories')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageSizeChange = (newSize: number) => {
    if (newSize === 9999) {
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
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalActive = useMemo(() => spareParts.filter(p => p.status === 'ACTIVE').length, [spareParts])
  const avgPrice = useMemo(() => {
    return spareParts.length > 0
      ? formatCurrency(spareParts.reduce((sum, p) => sum + Number(p.basePrice || 0), 0) / spareParts.length)
      : '₹0'
  }, [spareParts])
  const totalCategories = useMemo(() => new Set(spareParts.map(p => p.category).filter(Boolean)).size, [spareParts])

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
                <h1 className="text-3xl font-bold text-gray-900">Spare Parts</h1>
                <p className="text-gray-600 mt-1">Browse spare parts inventory and pricing for SSP offers</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow" onClick={fetchSpareParts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalActive}</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">{avgPrice}</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalCategories}</p>
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
                <Select value={showAll ? '9999' : pageSize.toString()} onValueChange={(val) => handlePageSizeChange(Number(val))}>
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
              <p className="text-gray-600 mb-2">Try adjusting your filters</p>
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
                        <div className={`w-2 h-2 rounded-full ${
                          part.status === 'ACTIVE' ? 'bg-green-600' :
                          part.status === 'INACTIVE' ? 'bg-gray-600' :
                          'bg-red-600'
                        }`} />
                        {part.status}
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                        {part.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                        #{part.partNumber}
                      </p>
                    </div>

                    {part.category && (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${getCategoryColor(part.category)}`}>
                        <Tag className="h-3 w-3" />
                        {part.category}
                      </div>
                    )}

                    {part.description && part.description !== part.name && (
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{part.description}</p>
                    )}

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
                    <Button variant="outline" size="sm" onClick={() => goToPage(1)} disabled={pagination.page === 1}>First</Button>
                    <Button variant="outline" size="sm" onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page === 1}>Previous</Button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum
                        if (pagination.pages <= 5) pageNum = i + 1
                        else if (pagination.page <= 3) pageNum = i + 1
                        else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i
                        else pageNum = pagination.page - 2 + i
                        return (
                          <Button key={pageNum} variant={pagination.page === pageNum ? 'default' : 'outline'} size="sm" onClick={() => goToPage(pageNum)} className="w-10">
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page === pagination.pages}>Next</Button>
                    <Button variant="outline" size="sm" onClick={() => goToPage(pagination.pages)} disabled={pagination.page === pagination.pages}>Last</Button>
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Image</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Part Details</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Base Price</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {spareParts.map((part: any) => (
                    <tr key={part.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">
                        {part.imageUrl ? (
                          <img src={part.imageUrl} alt={part.name} className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow-sm" />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-gray-200 flex items-center justify-center shadow-sm">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">{part.name}</p>
                          <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block">#{part.partNumber}</p>
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
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(Number(part.basePrice))}</span>
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
                        {new Date(part.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                  <Button variant="outline" size="sm" onClick={() => goToPage(1)} disabled={pagination.page === 1}>First</Button>
                  <Button variant="outline" size="sm" onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page === 1}>Previous</Button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum
                      if (pagination.pages <= 5) pageNum = i + 1
                      else if (pagination.page <= 3) pageNum = i + 1
                      else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i
                      else pageNum = pagination.page - 2 + i
                      return (
                        <Button key={pageNum} variant={pagination.page === pageNum ? 'default' : 'outline'} size="sm" onClick={() => goToPage(pageNum)} className="w-10">
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page === pagination.pages}>Next</Button>
                  <Button variant="outline" size="sm" onClick={() => goToPage(pagination.pages)} disabled={pagination.page === pagination.pages}>Last</Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
