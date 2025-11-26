"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, HardDrive } from 'lucide-react';
import { apiService } from '@/services/api';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Asset {
  id: number;
  machineId: string | null;
  model: string | null;
  serialNo: string | null;
  location?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';
  notes?: string | null;
  purchaseDate?: string | null;
  warrantyEnd?: string | null;
  amcEnd?: string | null;
  customerId: number;
  customer: {
    id: number;
    companyName: string;
  };
}

export default function EditAssetPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAsset, setIsLoadingAsset] = useState(true);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    machineId: '',
    model: '',
    serialNo: '',
    location: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED',
    notes: '',
    purchaseDate: '',
    warrantyEnd: '',
    amcEnd: '',
  });

  const loadAsset = async () => {
    try {
      setIsLoadingAsset(true);
      const assetData = await apiService.getAsset(Number(id));
      
      if (!assetData || !assetData.id) {
        throw new Error('No asset data received');
      }

      setFormData({
        machineId: assetData.machineId || '',
        model: assetData.model || '',
        serialNo: assetData.serialNo || '',
        location: assetData.location || '',
        status: assetData.status,
        notes: assetData.notes || '',
        purchaseDate: assetData.purchaseDate ? new Date(assetData.purchaseDate).toISOString().split('T')[0] : '',
        warrantyEnd: assetData.warrantyEnd ? new Date(assetData.warrantyEnd).toISOString().split('T')[0] : '',
        amcEnd: assetData.amcEnd ? new Date(assetData.amcEnd).toISOString().split('T')[0] : '',
      });
      
      setAsset(assetData);
    } catch (error) {
      console.error('Error loading asset:', error);
      toast.error('Failed to load asset data');
      router.push('/admin/assets');
    } finally {
      setIsLoadingAsset(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.machineId || !formData.model || !formData.serialNo) {
      toast.error('Machine ID, Model, and Serial Number are required');
      return;
    }

    try {
      setFormError(null);
      setIsLoading(true);
      
      const payload = {
        ...formData,
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : null,
        warrantyEnd: formData.warrantyEnd ? new Date(formData.warrantyEnd).toISOString() : null,
        amcEnd: formData.amcEnd ? new Date(formData.amcEnd).toISOString() : null,
      };

      await apiService.updateAsset(Number(id), payload);
      
      toast.success('Asset updated successfully');
      
      if (asset?.customer?.id) {
        router.push(`/admin/assets?customerId=${asset.customer.id}`);
      } else {
        router.push(`/admin/assets/${id}`);
      }
    } catch (error: any) {
      console.error('Error updating asset:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update asset';
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadAsset();
    }
  }, [id]);

  if (isLoadingAsset) {
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
        <h3 className="mt-2 text-lg font-medium">Asset not found</h3>
        <p className="mt-1 text-muted-foreground">The asset you're looking for doesn't exist or was deleted.</p>
        <Button className="mt-4" onClick={() => router.push('/admin/assets')}>
          Back to Assets
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => {
                if (asset?.customer?.id) {
                  router.push(`/admin/assets?customerId=${asset.customer.id}`);
                } else {
                  router.back();
                }
              }}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold">Edit Asset</h2>
                <p className="text-sm text-muted-foreground">
                  Update asset details for {asset.customer.companyName}
                </p>
              </div>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error Updating Asset</h3>
                    <p className="text-sm text-red-700 mt-1">{formError}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="overflow-hidden border-0 shadow-lg">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b p-6">
                  <div className="flex items-center space-x-2 text-purple-800">
                    <HardDrive className="h-5 w-5" />
                    <h3 className="font-semibold">Asset Information</h3>
                  </div>
                  <p className="text-purple-600 text-sm mt-1">
                    Update the asset details
                  </p>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Machine ID *</label>
                      <Input
                        placeholder="Enter machine ID"
                        value={formData.machineId}
                        onChange={(e) => handleInputChange('machineId', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Model *</label>
                      <Input
                        placeholder="Enter model"
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Serial Number *</label>
                      <Input
                        placeholder="Enter serial number"
                        value={formData.serialNo}
                        onChange={(e) => handleInputChange('serialNo', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        placeholder="Enter location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Purchase Date</label>
                      <Input
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Warranty End</label>
                      <Input
                        type="date"
                        value={formData.warrantyEnd}
                        onChange={(e) => handleInputChange('warrantyEnd', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">AMC End</label>
                      <Input
                        type="date"
                        value={formData.amcEnd}
                        onChange={(e) => handleInputChange('amcEnd', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      placeholder="Enter any additional notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    if (asset?.customer?.id) {
                      router.push(`/admin/assets?customerId=${asset.customer.id}`);
                    } else {
                      router.back();
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="min-w-[140px] bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Update Asset
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
