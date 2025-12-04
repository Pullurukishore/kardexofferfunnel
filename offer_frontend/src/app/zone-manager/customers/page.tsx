import CustomerClient from '@/components/customer/CustomerClient';
import { cookies } from 'next/headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

export default async function ZoneManagerCustomersPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  const search = searchParams.search || '';
  const status = searchParams.status || 'all';

  const { customers, stats } = await getCustomers({ search, status });

  return (
    <div className="space-y-6">
      <div className="hidden md:block relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 p-6 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Customers</h1>
            <p className="text-blue-100">View customers assigned to your zone</p>
          </div>
        </div>
      </div>
      <div className="md:hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold">Customers</h1>
              <p className="text-blue-100 text-sm mt-1">View-only</p>
            </div>
          </div>
        </div>
      </div>

      <CustomerClient 
        initialCustomers={customers}
        initialStats={stats}
        searchParams={{ search, status }}
        readOnly
        viewBasePath="/zone-manager/customers"
      />
    </div>
  );
}

