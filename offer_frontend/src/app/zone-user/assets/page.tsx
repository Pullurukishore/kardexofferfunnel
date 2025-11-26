"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  HardDrive, 
  Search, 
  Filter,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  Building2,
  ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { format } from 'date-fns';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface Asset {
  id: number;
  machineId: string;
  model: string | null;
  serialNo: string | null;
  location: string | null;
  status: string;
  purchaseDate: string | null;
  warrantyEnd: string | null;
  customer: {
    id: number;
  	companyName: string;
  };
  _count?: {
    offers?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ZoneUserAssetsPage() {
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get('customerId');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadAssets = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 1000 };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (customerIdParam) params.customerId = customerIdParam;
      const response = await apiService.getAssets(params);
      const possible = Array.isArray(response)
        ? response
        : (response?.data ?? response?.assets ?? response?.items ?? response?.rows ?? []);
      setAssets(Array.isArray(possible) ? possible : []);
    } catch (error) {
      console.error('Error loading assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [searchTerm, statusFilter, customerIdParam]);

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading assets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="hidden md:block relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 p-6 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Assets</h1>
            <p className="text-purple-100">View customer assets (read-only)</p>
          </div>
          {customerIdParam && (
            <Link href={`/zone-user/customers/${customerIdParam}`}>
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customer
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="md:hidden">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Assets</h1>
              <p className="text-purple-100 text-sm mt-1">View-only</p>
            </div>
          </div>
          {customerIdParam && (
            <Link href={`/zone-user/customers/${customerIdParam}`}>
              <Button variant="outline" className="mb-2 w-full border-white/30 text-white hover:bg-white/10">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customer
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 sm:h-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-9">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {assets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {assets.map((asset) => (
            <Link key={asset.id} href={`/zone-user/assets/${asset.id}`} className="block">
              <Card className="border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md">
                <CardHeader className="pb-3 px-4 sm:px-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                        <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-base font-semibold truncate">
                          {asset.machineId}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {asset.model || 'No model specified'}
                        </p>
                      </div>
                    </div>
                    <span className={`${getStatusBadgeStyles(asset.status)} text-xs px-2 py-1 rounded-full font-medium flex-shrink-0`}>
                      {asset.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-4 sm:px-6">
                  <div className="space-y-2">
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">{asset.customer?.companyName || '—'}</span>
                    </div>
                    {asset.serialNo && (
                      <div className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">Serial:</span> <span className="break-all">{asset.serialNo}</span>
                      </div>
                    )}
                    {asset.location && (
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">{asset.location}</span>
                      </div>
                    )}
                    {asset.purchaseDate && (
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">Purchased: {format(new Date(asset.purchaseDate), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xs text-gray-500">
                        {(asset._count?.offers ?? 0)} offer{(asset._count?.offers ?? 0) !== 1 ? 's' : ''}
                      </span>
                      {asset.warrantyEnd && (
                        <span className="text-xs text-gray-500 truncate ml-2">
                          Warranty: {format(new Date(asset.warrantyEnd), 'MMM yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <HardDrive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium">No assets found</h3>
            <p className="mt-1 text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Assets will appear here once customers add them.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
