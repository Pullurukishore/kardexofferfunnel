'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Plus,
  RefreshCw,
  Loader2,
  Eye,
  Building2,
  TrendingUp,
  Package,
  MapPin,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Award,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Percent,
  Calendar,
  Sparkles,
  Users
} from 'lucide-react'
import { apiService } from '@/services/api'
import { toast } from 'sonner'

const stages = ['All Stage', 'INITIAL', 'PROPOSAL_SENT', 'NEGOTIATION', 'FINAL_APPROVAL', 'PO_RECEIVED', 'ORDER_BOOKED', 'WON', 'LOST']
const productTypes = ['All Product Types', 'RELOCATION', 'CONTRACT', 'SPP', 'UPGRADE_KIT', 'SOFTWARE', 'BD_CHARGES', 'BD_SPARE', 'MIDLIFE_UPGRADE', 'RETROFIT_KIT']

export default function ZoneManagerOffers() {
  const router = useRouter()
  const [offers, setOffers] = useState<any[]>([])
  const [userZone, setUserZone] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, pages: 0 })

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStage, setSelectedStage] = useState('All Stage')
  const [selectedProductType, setSelectedProductType] = useState('All Product Types')
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Initialize: Get zone manager's zone
  useEffect(() => {
    const initZone = async () => {
      try {
        const me = await apiService.getMe()
        const zoneId = me?.user?.zoneId || me?.zoneId
        if (zoneId) {
          setUserZone({ id: zoneId })
        }
      } catch (error: any) {
        console.error('Failed to get user zone:', error)
        toast.error('Failed to load your zone')
      }
    }
    initZone()
  }, [])

  // Debounce search to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOffers()
    }, searchTerm ? 500 : 0) // 500ms delay for search, immediate for other filters

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedStage, selectedProductType, pagination.page])


  const fetchOffers = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      
      // Auto-filter to zone manager's zone
      if (userZone?.id) {
        params.zoneId = userZone.id
      }
      
      if (searchTerm) params.search = searchTerm
      if (selectedStage !== 'All Stage') params.stage = selectedStage
      if (selectedProductType !== 'All Product Types') params.productType = selectedProductType

      const response = await apiService.getOffers(params)
      setOffers(response.offers || [])
      setPagination(response.pagination || { page: 1, limit: 100, total: 0, pages: 0 })
    } catch (error: any) {
      console.error('Failed to fetch offers:', error)
      toast.error(error.response?.data?.error || 'Failed to fetch offers')
      setOffers([])
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

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedStage('All Stage')
    setSelectedProductType('All Product Types')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters = searchTerm || selectedStage !== 'All Stage' || selectedProductType !== 'All Product Types'

  // Sort offers
  const sortedOffers = useMemo(() => {
    if (!sortField) return offers
    
    return [...offers].sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      // Handle nested properties
      if (sortField === 'customer') {
        aValue = a.customer?.companyName || a.company || ''
        bValue = b.customer?.companyName || b.company || ''
      } else if (sortField === 'zone') {
        aValue = a.zone?.name || ''
        bValue = b.zone?.name || ''
      } else if (sortField === 'createdBy') {
        aValue = a.createdBy?.name || ''
        bValue = b.createdBy?.name || ''
      } else if (sortField === 'offerValue') {
        aValue = Number(a.offerValue || 0)
        bValue = Number(b.offerValue || 0)
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [offers, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Calculate statistics
  const stats = {
    total: pagination.total,
    active: offers.filter(o => !['WON', 'LOST'].includes(o.stage)).length,
    won: offers.filter(o => o.stage === 'WON').length,
    lost: offers.filter(o => o.stage === 'LOST').length,
    totalValue: offers.reduce((sum, o) => sum + (Number(o.offerValue) || 0), 0),
    avgValue: offers.length > 0 ? offers.reduce((sum, o) => sum + (Number(o.offerValue) || 0), 0) / offers.filter(o => o.offerValue).length : 0,
    conversionRate: pagination.total > 0 ? ((offers.filter(o => o.stage === 'WON').length / pagination.total) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Compact Header with Stats */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl shadow-xl p-6 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl ring-2 ring-white/30">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Zone Offers</h1>
                <p className="text-emerald-100 mt-1">View and manage offers in your zone</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20 text-center">
                  <p className="text-emerald-100 text-xs font-medium">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20 text-center">
                  <p className="text-emerald-100 text-xs font-medium">Won</p>
                  <p className="text-2xl font-bold">{stats.won}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20 text-center">
                  <p className="text-emerald-100 text-xs font-medium">Win Rate</p>
                  <p className="text-2xl font-bold">{stats.conversionRate.toFixed(0)}%</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20 text-center">
                  <p className="text-emerald-100 text-xs font-medium">Value</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalValue).replace('₹', '₹')}</p>
                </div>
              </div>
              <Button onClick={() => router.push('/zone-manager/offers/new')} className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg bg-white" style={{backgroundColor: 'white'}}>
          <CardHeader className="bg-white border-b border-slate-200" style={{backgroundColor: 'white'}}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg">Search & Filter</CardTitle>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">Active</Badge>
                )}
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 bg-white" style={{backgroundColor: 'white'}}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Search className="h-4 w-4 text-emerald-600" />
                  Search Offers
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by offer #, customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={loading}
                    className="pl-10 h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Stage Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Stage
                </Label>
                <Select value={selectedStage} onValueChange={setSelectedStage} disabled={loading}>
                  <SelectTrigger className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {stages.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Package className="h-4 w-4 text-pink-600" />
                  Product Type
                </Label>
                <Select value={selectedProductType} onValueChange={setSelectedProductType} disabled={loading}>
                  <SelectTrigger className="h-11 border-gray-200 focus:border-pink-500 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {productTypes.map(type => (
                      <SelectItem key={type} value={type}>{type === 'All Product Types' ? type : type.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offers Table */}
        <Card className="border-0 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 via-blue-50 to-purple-50/50 border-b-2 border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('offerReferenceNumber')}>
                    <div className="flex items-center gap-2">
                      Offer #
                      {sortField === 'offerReferenceNumber' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('customer')}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Customer
                      {sortField === 'customer' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('productType')}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Product Type
                      {sortField === 'productType' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('offerValue')}>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Value
                      {sortField === 'offerValue' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('stage')}>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Stage
                      {sortField === 'stage' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-2">
                      Date
                      {sortField === 'createdAt' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">Loading offers...</p>
                          <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the data</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : offers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">No offers found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or create a new offer</p>
                        </div>
                        <Button onClick={() => router.push('/zone-manager/offers/new')} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Offer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedOffers.map((offer: any) => (
                  <tr key={offer.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-indigo-50/30 hover:to-purple-50/20 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/zone-manager/offers/${offer.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                        >
                          {offer.offerReferenceNumber}
                        </button>
                        {offer.stage === 'INITIAL' && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                            Initial
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-emerald-100 group-hover:scale-110 transition-transform">
                          {(offer.customer?.companyName || offer.company || 'U')?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{offer.customer?.companyName || offer.company}</p>
                          <p className="text-xs text-gray-500">{offer.customer?.contactPerson || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${
                        offer.productType === 'SPP' ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border-orange-300 shadow-sm' :
                        offer.productType === 'CONTRACT' ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border-emerald-300 shadow-sm' :
                        offer.productType === 'RELOCATION' ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-300 shadow-sm' :
                        offer.productType === 'UPGRADE_KIT' ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-purple-300 shadow-sm' :
                        offer.productType === 'SOFTWARE' ? 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border-indigo-300 shadow-sm' :
                        offer.productType === 'BD_CHARGES' ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border-amber-300 shadow-sm' :
                        offer.productType === 'BD_SPARE' ? 'bg-gradient-to-r from-rose-100 to-rose-50 text-rose-800 border-rose-300 shadow-sm' :
                        offer.productType === 'MIDLIFE_UPGRADE' ? 'bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-800 border-cyan-300 shadow-sm' :
                        offer.productType === 'RETROFIT_KIT' ? 'bg-gradient-to-r from-teal-100 to-teal-50 text-teal-800 border-teal-300 shadow-sm' :
                        'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-300 shadow-sm'
                      } font-semibold px-3 py-1`}>
                        {offer.productType?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {offer.offerValue ? (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <IndianRupee className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="text-gray-900 font-bold text-lg">{formatCurrency(Number(offer.offerValue))}</span>
                        </div>
                      ) : (
                        offer.stage === 'INITIAL' ? (
                          <Badge variant="outline" className="text-gray-500 border-dashed">TBD</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${
                        offer.stage === 'INITIAL' ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-300 shadow-sm' :
                        offer.stage === 'WON' ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border-emerald-300 shadow-sm' :
                        offer.stage === 'LOST' ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-300 shadow-sm' :
                        offer.stage === 'PROPOSAL_SENT' ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-purple-300 shadow-sm' :
                        offer.stage === 'NEGOTIATION' ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border-amber-300 shadow-sm' :
                        offer.stage === 'PO_RECEIVED' ? 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border-indigo-300 shadow-sm' :
                        'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-800 border-slate-300 shadow-sm'
                      } font-semibold px-3 py-1.5`}>
                        {offer.stage?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">{new Date(offer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all rounded-xl">
                            <MoreHorizontal className="h-4 w-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-200">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => router.push(`/zone-manager/offers/${offer.id}`)}
                            className="cursor-pointer rounded-lg hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-2 text-blue-600" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => router.push(`/zone-manager/offers/${offer.id}/edit`)}
                            className="cursor-pointer rounded-lg hover:bg-purple-50"
                          >
                            <Edit className="h-4 w-4 mr-2 text-purple-600" />
                            Edit
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
          
          {/* Pagination */}
          {!loading && offers.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-purple-50/30 px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 font-medium">
                  Showing <span className="font-bold text-slate-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold">{pagination.total}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 rounded-xl transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-700 font-medium px-3">
                    Page <span className="font-bold text-slate-900">{pagination.page}</span> of <span className="font-semibold">{pagination.pages}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 rounded-xl transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  )
}
