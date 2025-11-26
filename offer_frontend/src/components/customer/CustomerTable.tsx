import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Eye, 
  Pencil, 
  Users,
  Plus,
  HardDrive
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: number;
  companyName: string;
  location?: string;
  industry?: string;
  address?: string;
  _count?: {
    offers?: number;
    contacts?: number;
    assets?: number;
  };
  zone?: {
    name: string;
  };
  contacts?: Array<{
    id: number;
    name: string;
    email?: string;
    phone?: string;
  }>;
}

interface CustomerTableProps {
  customers: Customer[];
  readOnly?: boolean;
  basePath?: string;
}

// Memoized customer row component
const CustomerRow = memo(({ customer, readOnly, basePath }: { customer: Customer; readOnly?: boolean; basePath?: string }) => {
  const primaryContact = useMemo(() => {
    return customer.contacts && customer.contacts.length > 0 ? customer.contacts[0] : null;
  }, [customer.contacts]);

  const companyInitial = useMemo(() => {
    return customer.companyName.charAt(0).toUpperCase();
  }, [customer.companyName]);

  return (
    <tr className="hover:bg-blue-50/30 transition-colors duration-150">
      <td className="py-3 px-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {companyInitial}
          </div>
          <div className="min-w-0 flex-1">
            <Link 
              href={`${basePath || '/admin/customers'}/${customer.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 transition-colors block break-words leading-tight"
              style={{ wordBreak: 'break-word', hyphens: 'auto' }}
            >
              {customer.companyName}
            </Link>
            {customer.zone?.name && (
              <div className="text-xs text-gray-500 flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="break-words">{customer.zone.name}</span>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-start text-sm text-gray-500 min-w-0">
          <MapPin className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
          <span className="break-words leading-tight">{customer.location || customer.address || 'No location'}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="min-w-0">
          {primaryContact ? (
            <div className="space-y-1">
              {primaryContact.name && (
                <div className="font-medium text-gray-900 text-sm break-words leading-tight">{primaryContact.name}</div>
              )}
              {primaryContact.email && (
                <div className="flex items-start text-xs text-gray-500 min-w-0">
                  <Mail className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                  <a 
                    href={`mailto:${primaryContact.email}`} 
                    className="hover:underline break-all hover:text-blue-600 leading-tight"
                  >
                    {primaryContact.email}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 flex items-center">
              <Users className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="break-words">
                {customer._count?.contacts ? `${customer._count.contacts} contacts` : 'No contacts'}
              </span>
            </div>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
          {customer._count?.offers || 0}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
          {customer._count?.assets || 0}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Link 
            href={`${basePath || '/admin/customers'}/${customer.id}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-blue-50 transition-colors"
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </Link>
          {!readOnly && (
            <Link 
              href={`/admin/customers/${customer.id}/edit`}
              className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-green-50 transition-colors"
            >
              <Pencil className="h-4 w-4 text-gray-600" />
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
});

CustomerRow.displayName = 'CustomerRow';

// Mobile customer card component
const CustomerMobileCard = memo(({ customer, readOnly, basePath }: { customer: Customer; readOnly?: boolean; basePath?: string }) => {
  const primaryContact = useMemo(() => {
    return customer.contacts && customer.contacts.length > 0 ? customer.contacts[0] : null;
  }, [customer.contacts]);

  const companyInitial = useMemo(() => {
    return customer.companyName.charAt(0).toUpperCase();
  }, [customer.companyName]);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
              {companyInitial}
            </div>
            <div className="min-w-0 flex-1">
              <Link 
                href={`${basePath || '/admin/customers'}/${customer.id}`}
                className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors block leading-tight"
              >
                {customer.companyName}
              </Link>
              {customer.zone?.name && (
                <div className="text-sm text-gray-500 flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{customer.zone.name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Link 
                href={`${basePath || '/admin/customers'}/${customer.id}`}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Eye className="h-4 w-4 text-gray-600" />
              </Link>
              {!readOnly && (
                <Link 
                  href={`/admin/customers/${customer.id}/edit`}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <Pencil className="h-4 w-4 text-gray-600" />
                </Link>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{customer.location || customer.address || 'No location'}</span>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            {primaryContact ? (
              <div className="space-y-1">
                {primaryContact.name && (
                  <div className="font-medium text-gray-900">{primaryContact.name}</div>
                )}
                {primaryContact.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <a 
                      href={`mailto:${primaryContact.email}`} 
                      className="hover:underline hover:text-blue-600 break-all"
                    >
                      {primaryContact.email}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 flex items-center">
                <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>
                  {customer._count?.contacts ? `${customer._count.contacts} contacts` : 'No contacts'}
                </span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">{customer._count?.offers || 0}</div>
              <div className="text-xs text-gray-500">Offers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-indigo-600">{customer._count?.assets || 0}</div>
              <div className="text-xs text-gray-500">Assets</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">{customer._count?.contacts || 0}</div>
              <div className="text-xs text-gray-500">Contacts</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CustomerMobileCard.displayName = 'CustomerMobileCard';

const CustomerTable = memo(function CustomerTable({ customers, readOnly = false, basePath }: CustomerTableProps) {
  const customerCount = useMemo(() => customers.length, [customers.length]);

  if (!customerCount) {
    return (
      <>
        {/* Desktop Empty State */}
        <Card className="shadow-lg hidden md:block">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Customers (0)
            </CardTitle>
            <CardDescription>
              Manage customer relationships and business data
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                <Building2 className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first customer.
              </p>
              {!readOnly && (
                <Link href="/admin/customers/new">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mobile Empty State */}
        <div className="md:hidden">
          <Card className="text-center py-8">
            <CardContent>
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                <Building2 className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Get started by adding your first customer.
              </p>
              {!readOnly && (
                <Link href="/admin/customers/new">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <Card className="shadow-lg hidden md:block">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Customers ({customerCount})
          </CardTitle>
          <CardDescription>
            Manage customer relationships and business data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm min-w-[200px]">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm min-w-[180px]">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm min-w-[180px]">Contact</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 text-sm w-20">Offers</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 text-sm w-20">Assets</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} readOnly={readOnly} basePath={basePath} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            Customers ({customerCount})
          </h2>
        </div>
        <div className="space-y-4">
          {customers.map((customer) => (
            <CustomerMobileCard key={customer.id} customer={customer} readOnly={readOnly} basePath={basePath} />
          ))}
        </div>
      </div>
    </>
  );
});

CustomerTable.displayName = 'CustomerTable';

export default CustomerTable;
