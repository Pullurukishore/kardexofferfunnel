"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Mail, 
  Users, 
  AlertCircle,
  Loader2,
  HardDrive,
  Calendar,
  ExternalLink,
  Globe,
  Phone,
  TrendingUp
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ZoneManagerCustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCustomer(Number(id));
      const customerData = data?.customer || data;
      setCustomer(customerData);
    } catch (error) {
      console.error('Error loading customer:', error);
      toast.error('Failed to load customer details');
      router.push('/zone-manager/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadCustomer();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading customer details...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">Customer not found</h3>
        <p className="mt-1 text-muted-foreground">The customer you're looking for doesn't exist or was deleted.</p>
        <Button className="mt-4" onClick={() => router.push('/zone-manager/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/zone-manager/customers')} 
            className="p-2"
            title="Back to Customers"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.companyName}</h1>
            <p className="text-sm text-muted-foreground">Customer Details • ID: {customer.id}</p>
          </div>
        </div>
      </div>

      <div className={`rounded-lg border p-4 ${customer.isActive !== false ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${customer.isActive !== false ? 'bg-green-100' : 'bg-gray-100'}`}>
              <TrendingUp className={`h-5 w-5 ${customer.isActive !== false ? 'text-green-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Customer Status: {customer.isActive !== false ? 'Active' : 'Inactive'}</h3>
              <p className="text-sm text-muted-foreground">{customer.isActive !== false ? 'This customer is currently active and receiving services' : 'This customer is inactive'}</p>
            </div>
          </div>
          <Badge className={`${customer.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} font-medium`} variant="outline">
            {customer.isActive !== false ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">{customer.companyName}</CardTitle>
                    <CardDescription className="mt-1 flex items-center text-base">
                      <MapPin className="h-4 w-4 mr-1" />
                      {customer.zone?.name || customer.location || 'No location specified'}
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
                      <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                      Address Information
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="font-medium text-gray-900">{customer.address || 'N/A'}</p>
                      {customer.city && customer.state && (
                        <p>{customer.city}, {customer.state} {customer.pincode}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-blue-600" />
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      {customer.contacts && customer.contacts.length > 0 && customer.contacts[0].email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a href={`mailto:${customer.contacts[0].email}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
                            {customer.contacts[0].email}
                          </a>
                        </div>
                      )}
                      {customer.contacts && customer.contacts.length > 0 && customer.contacts[0].phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${customer.contacts[0].phone}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
                            {customer.contacts[0].phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-green-600" />
                      Business Information
                    </h3>
                    <div className="space-y-3 text-sm">
                      {customer.industry && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Industry:</span>
                          <span className="font-medium text-gray-900">{customer.industry}</span>
                        </div>
                      )}
                      {customer.department && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Department:</span>
                          <span className="font-medium text-gray-900">{customer.department}</span>
                        </div>
                      )}
                      {customer.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center">
                            {customer.website}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <HardDrive className="h-5 w-5 mr-2 text-purple-600" />
                  Assets
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{customer.assets?.length || 0} asset{customer.assets?.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {customer.assets && customer.assets.length > 0 ? (
                <div className="space-y-4">
                  {customer.assets.slice(0, 3).map((asset: any) => (
                    <Link key={asset.id} href={`/zone-manager/assets/${asset.id}`} className="block border border-gray-200 rounded-lg p-4 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <HardDrive className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-base truncate">{asset.assetName || asset.machineSerialNumber || 'N/A'}</p>
                            <p className="text-sm text-gray-600 mt-1">{asset.model || 'No model specified'}</p>
                            {asset.location && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {asset.location}
                              </p>
                            )}
                            {asset.installationDate && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Installed: {format(new Date(asset.installationDate), 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {customer.assets.length > 3 && (
                    <Link href={`/zone-manager/assets?customerId=${customer.id}`}>
                      <Button variant="ghost" className="w-full mt-2">View all {customer.assets.length} assets</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <HardDrive className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No assets found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">No assets available for this customer.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Contacts
                </CardTitle>
                <span className="text-sm text-gray-600">{customer.contacts?.length || 0} contact{customer.contacts?.length !== 1 ? 's' : ''}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {customer.contacts?.length > 0 ? (
                <div className="space-y-4">
                  {customer.contacts.map((contact: any) => (
                    <div key={contact.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      {contact.email && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No contacts found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">No contacts available for this customer.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <HardDrive className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Assets</span>
                      <p className="text-xs text-gray-600">Total equipment</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 text-lg font-bold px-3 py-1">{customer.assets?.length || 0}</Badge>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Offers</span>
                      <p className="text-xs text-gray-600">Total proposals</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 text-lg font-bold px-3 py-1">{customer.offers?.length || 0}</Badge>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Contacts</span>
                      <p className="text-xs text-gray-600">People</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-lg font-bold px-3 py-1">{customer.contacts?.length || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

