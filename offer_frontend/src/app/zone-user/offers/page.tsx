'use client'

import { useState, useEffect } from 'react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Download, 
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
  DollarSign,
  Calendar,
  Sparkles,
  Home
} from 'lucide-react'
import { apiService } from '@/services/api'
import { toast } from 'sonner'

const stages = ['All Stage', 'INITIAL', 'PROPOSAL_SENT', 'NEGOTIATION', 'FINAL_APPROVAL', 'PO_RECEIVED', 'ORDER_BOOKED', 'WON', 'LOST']

export default function ZoneUserOffers() {
  const router = useRouter()
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStage, setSelectedStage] = useState('All Stage')

  useEffect(() => {
    fetchOffers()
  }, [searchTerm, selectedStage, pagination.page])

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        myOffers: true, // Only get offers created by current user
      }
      
      if (searchTerm) params.search = searchTerm
      if (selectedStage !== 'All Stage') params.stage = selectedStage

      const response = await apiService.getOffers(params)
      setOffers(response.offers || [])
      setPagination(response.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
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

  const handleExport = () => {
    console.log('Exporting offers:', offers)
    // Implement export functionality
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedStage('All Stage')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters = searchTerm || selectedStage !== 'All Stage'

  // Calculate statistics
  const stats = {
    total: pagination.total,
    active: offers.filter(o => !['WON', 'LOST'].includes(o.stage)).length,
    won: offers.filter(o => o.stage === 'WON').length,
    lost: offers.filter(o => o.stage === 'LOST').length,
    totalValue: offers.reduce((sum, o) => sum + (Number(o.offerValue) || 0), 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl shadow-2xl p-8 text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl ring-2 ring-white/30 shadow-lg">
                  <Sparkles className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">My Offers</h1>
                  <p className="text-blue-100 mt-2 text-lg">Manage your personal offers</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-blue-100 text-sm font-medium">Total Value</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalValue)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-blue-100 text-sm font-medium">Active Offers</p>
                  <p className="text-3xl font-bold mt-1">{stats.active}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleExport} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm hover:shadow-xl transition-all">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => router.push('/zone-user/offers/new')} className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Create New Offer
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-600">Total Offers</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
              <p className="text-xs text-slate-500 mt-2">
                <span className="text-blue-600 font-medium">{stats.active}</span> active offers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-600">Deals Won</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.won}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-600">Deals Lost</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <X className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.lost}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-600">Total Value</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Search & Filter</CardTitle>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">Active</Badge>
                )}
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-600" />
                  Search Offers
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by offer #, customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Stage Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Stage
                </Label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offers Table */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50 to-purple-50/30 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">My Offers</CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  {!loading && offers.length > 0 ? `Showing ${offers.length} of ${pagination.total} offers` : 'Manage your personal offers'}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchOffers}
                className="gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 via-blue-50 to-purple-50/50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Offer #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Customer
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Product Type
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Value
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Stage
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
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
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">No offers found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or create a new offer</p>
                        </div>
                        <Button onClick={() => router.push('/zone-user/offers/new')} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Offer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  offers.map((offer: any) => (
                  <tr key={offer.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-indigo-50/30 hover:to-purple-50/20 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/zone-user/offers/${offer.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                        >
                          {offer.offerReferenceNumber}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-blue-100 group-hover:scale-110 transition-transform">
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
                        'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-300 shadow-sm'
                      } font-semibold px-3 py-1`}>
                        {offer.productType}
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
                        <Badge variant="outline" className="text-gray-500 border-dashed">TBD</Badge>
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
                            onClick={() => router.push(`/zone-user/offers/${offer.id}`)}
                            className="cursor-pointer rounded-lg hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-2 text-blue-600" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => router.push(`/zone-user/offers/${offer.id}/edit`)}
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
