'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NewCustomerPage() {
  const router = useRouter();
  const [zones, setZones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    location: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    website: '',
    department: '',
    zoneId: '',
  });

  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await apiService.getZones();
        setZones(response.data || []);
      } catch (error) {
        console.error('Failed to load zones:', error);
        toast.error('Failed to load zones');
      }
    };

    loadZones();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.companyName) {
      toast.error('Company Name is required');
      return;
    }
    try {
      setFormError(null);
      setIsLoading(true);
      
      const payload = {
        ...formData,
        zoneId: formData.zoneId ? parseInt(formData.zoneId) : undefined,
      };

      await apiService.createCustomer(payload);
      
      toast.success('Customer created successfully');
      router.push('/admin/customers');
    } catch (error: any) {
      console.error('Error creating customer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create customer. Please try again.';
      
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold">Add New Customer</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the customer details below
                </p>
              </div>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error Creating Customer</h3>
                    <p className="text-sm text-red-700 mt-1">{formError}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="overflow-hidden border-0 shadow-lg">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-6">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <Building2 className="h-5 w-5" />
                      <h3 className="font-semibold">Company Information</h3>
                    </div>
                    <p className="text-blue-600 text-sm mt-1">
                      Enter the basic company details
                    </p>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Name *</Label>
                        <Input 
                          placeholder="Enter company name" 
                          value={formData.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Industry</Label>
                        <Input 
                          placeholder="e.g., Technology, Healthcare" 
                          value={formData.industry}
                          onChange={(e) => handleInputChange('industry', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input 
                          placeholder="Mumbai" 
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Input 
                          placeholder="Sales" 
                          value={formData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea 
                        placeholder="Enter complete address" 
                        value={formData.address}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('address', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input 
                          placeholder="Mumbai" 
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input 
                          placeholder="Maharashtra" 
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pincode</Label>
                        <Input 
                          placeholder="400001" 
                          value={formData.pincode}
                          onChange={(e) => handleInputChange('pincode', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input 
                          type="url" 
                          placeholder="https://example.com" 
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Zone</Label>
                        <Select value={formData.zoneId} onValueChange={(value) => handleInputChange('zoneId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select zone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {zones.map(zone => (
                              <SelectItem key={zone.id} value={zone.id.toString()}>
                                {zone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="min-w-[140px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Create Customer
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
