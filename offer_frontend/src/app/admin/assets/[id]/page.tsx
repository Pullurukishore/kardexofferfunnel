"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, 
  HardDrive, 
  Pencil, 
  MapPin, 
  Calendar,
  AlertCircle,
  Loader2,
  Trash2,
  Building2,
  Activity,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { apiService } from '@/services/api';

interface Asset {
  id: number;
  machineId: string;
  model: string | null;
  serialNo: string | null;
  purchaseDate: string | null;
  warrantyStart: string | null;
  warrantyEnd: string | null;
  amcEnd: string | null;
  location: string | null;
  status: string;
  notes?: string | null;
  customer: {
    id: number;
    companyName: string;
  };
  _count?: {
    tickets?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadAsset = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAsset(Number(id));
      setAsset(data);
    } catch (error) {
      console.error('Error loading asset:', error);
      toast.error('Failed to load asset details');
      router.push('/admin/assets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!asset) return;
    
    if (!confirm(`Are you sure you want to delete asset ${asset.machineId}?`)) {
      return;
    }

    try {
      setDeleting(true);
      await apiService.deleteAsset(asset.id);
      
      toast.success(`Asset ${asset.machineId} has been deleted successfully`);
      router.push(`/admin/customers/${asset.customer.id}`);
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadAsset();
    }
  }, [id]);

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
        <span className="ml-2">Loading asset details...</span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">Asset not found</h3>
        <p className="mt-1 text-muted-foreground">The asset you're looking for doesn't exist or was deleted.</p>
        <Button className="mt-4" onClick={() => router.push('/admin/assets')}>
          Back to Assets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/admin/customers/${asset.customer.id}`)} 
            className="p-2 flex-shrink-0"
            title="Back to Customer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{asset.machineId}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Asset Details • ID: {asset.id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/admin/assets/${id}/edit`)}
            className="bg-white hover:bg-gray-50 flex-1 sm:flex-none"
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className={`rounded-lg border p-4 ${asset.status === 'ACTIVE' ? 'bg-green-50 border-green-200' : asset.status === 'MAINTENANCE' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${asset.status === 'ACTIVE' ? 'bg-green-100' : asset.status === 'MAINTENANCE' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <Activity className={`h-5 w-5 ${asset.status === 'ACTIVE' ? 'text-green-600' : asset.status === 'MAINTENANCE' ? 'text-yellow-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Asset Status: {asset.status}
              </h3>
              <p className="text-sm text-muted-foreground">
                {asset.status === 'ACTIVE' ? 'This asset is currently active and operational' : 
                 asset.status === 'MAINTENANCE' ? 'This asset is under maintenance' : 
                 'This asset is inactive'}
              </p>
            </div>
          </div>
          <span className={`${getStatusBadgeStyles(asset.status)} px-3 py-1 rounded-full text-xs font-medium`}>
            {asset.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Asset Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm">
                    <HardDrive className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">{asset.machineId}</CardTitle>
                    <CardDescription className="mt-1 flex items-center text-base">
                      <Building2 className="h-4 w-4 mr-1" />
                      {asset.customer.companyName}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <HardDrive className="h-4 w-4 mr-2 text-purple-600" />
                      Asset Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Model:</span>
                        <span className="font-medium text-gray-900">{asset.model || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Serial No:</span>
                        <span className="font-medium text-gray-900 break-all">{asset.serialNo || 'N/A'}</span>
                      </div>
                      {asset.location && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-gray-900">{asset.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      Dates
                    </h3>
                    <div className="space-y-2 text-sm">
                      {asset.purchaseDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Purchase Date:</span>
                          <span className="font-medium text-gray-900">{format(new Date(asset.purchaseDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {asset.warrantyEnd && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Warranty End:</span>
                          <span className="font-medium text-gray-900">{format(new Date(asset.warrantyEnd), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {asset.amcEnd && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">AMC End:</span>
                          <span className="font-medium text-gray-900">{format(new Date(asset.amcEnd), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium text-gray-900">{format(new Date(asset.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  {asset.notes && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Notes
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {asset.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-lg flex items-center">
                <Activity className="h-5 w-5 mr-2 text-purple-600" />
                Quick Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <Link href={`/admin/customers/${asset.customer.id}`}>
                <div className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">Customer</span>
                        <p className="text-xs text-gray-600 truncate max-w-[150px]">{asset.customer.companyName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Status</span>
                      <p className="text-xs text-gray-600">{asset.status}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Tickets</span>
                      <p className="text-xs text-gray-600">{asset._count?.tickets || 0} total</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
