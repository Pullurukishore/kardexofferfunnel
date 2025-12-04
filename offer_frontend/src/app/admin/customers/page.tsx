import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CustomerClient from '@/components/customer/CustomerClient';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CustomersPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link href="/admin/customers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>
      <CustomerClient 
        initialCustomers={[]}
        initialStats={{
          total: 0,
          active: 0,
          inactive: 0,
          totalOffers: 0,
          totalContacts: 0,
          totalAssets: 0
        }}
        searchParams={{}}   />
    </div>
  );
}
