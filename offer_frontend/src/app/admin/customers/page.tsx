import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CustomerClient from '@/components/customer/CustomerClient';
import Link from 'next/link';
import { cookies } from 'next/headers';

async function getCustomers(searchParams: any) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('accessToken')?.value || cookieStore.get('token')?.value;
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    
    const queryParams = new URLSearchParams();
    queryParams.append('limit', '1000');
    
    if (searchParams.search) queryParams.append('search', searchParams.search);
    if (searchParams.status && searchParams.status !== 'all') queryParams.append('status', searchParams.status);
    
    const response = await fetch(`${API_URL}/customers?${queryParams.toString()}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch customers');
    }

    const data = await response.json();
    const allCustomers = data.customers || data.data || data || [];
    
    // Calculate stats
    const stats = {
      total: allCustomers.length,
      active: allCustomers.filter((c: any) => c.isActive !== false).length,
      inactive: allCustomers.filter((c: any) => c.isActive === false).length,
      totalOffers: allCustomers.reduce((sum: number, c: any) => sum + (c._count?.offers || 0), 0),
      totalContacts: allCustomers.reduce((sum: number, c: any) => sum + (c._count?.contacts || 0), 0),
      totalAssets: allCustomers.reduce((sum: number, c: any) => sum + (c._count?.assets || 0), 0)
    };
    
    return { customers: allCustomers, stats };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return { customers: [], stats: { total: 0, active: 0, inactive: 0, totalOffers: 0, totalContacts: 0, totalAssets: 0 } };
  }
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; page?: string }
}) {
  const search = searchParams.search || '';
  const status = searchParams.status || 'all';
  const page = searchParams.page || '1';

  const { customers, stats } = await getCustomers({ search, status, page });

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

      {/* Client Component for interactivity */}
      <CustomerClient 
        initialCustomers={customers}
        initialStats={stats}
        searchParams={{ search, status, page }}
      />
    </div>
  );
}
