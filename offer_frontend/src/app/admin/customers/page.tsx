'use client';

import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CustomerClient from '@/components/customer/CustomerClient';
import Link from 'next/link';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const page = searchParams.get('page') || '1';

  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    active: 0,
    inactive: 0,
    totalOffers: 0,
    totalContacts: 0,
    totalAssets: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const queryParams: any = {
          limit: 1000 // High limit to get all customers
        };
        
        if (search) queryParams.search = search;
        if (status && status !== 'all') queryParams.status = status;
        
        const response = await apiService.getCustomers(queryParams);
        const allCustomers = response.customers || response.data || response || [];
        
        setCustomers(allCustomers);
        
        // Calculate stats
        const newStats = {
          total: allCustomers.length,
          active: allCustomers.filter((c: any) => c.isActive !== false).length,
          inactive: allCustomers.filter((c: any) => c.isActive === false).length,
          totalOffers: allCustomers.reduce((sum: number, c: any) => sum + (c._count?.offers || 0), 0),
          totalContacts: allCustomers.reduce((sum: number, c: any) => sum + (c._count?.contacts || 0), 0),
          totalAssets: allCustomers.reduce((sum: number, c: any) => sum + (c._count?.assets || 0), 0)
        };
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching customers:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [search, status, page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading customers...</span>
      </div>
    );
  }

  if (error) {

    return (
      <div>
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-red-100 to-red-100 flex items-center justify-center mb-4">
            <div className="h-12 w-12 text-red-500">⚠️</div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading customers</h3>
          <p className="text-gray-500 mb-6">
            Failed to load customers. Please try again later.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desktop Header with Gradient */}
      <div className="hidden md:block relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 p-6 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Customers</h1>
            <p className="text-blue-100">
              Manage your organization's customers and their business relationships
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/admin/customers/new">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Customers</h1>
              <p className="text-blue-100 text-sm mt-1">
                Manage customers and relationships
              </p>
            </div>
          </div>
          <Link href="/admin/customers/new">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Client Component for API calls */}
      <CustomerClient 
        initialCustomers={customers}
        initialStats={stats}
        searchParams={{ search, status, page }}
      />
    </div>
  );
}
