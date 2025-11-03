'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

interface CustomerFiltersProps {
  search?: string;
  status?: string;
  totalResults: number;
  filteredResults: number;
}

export default function CustomerFilters({
  search = '',
  status = 'all',
  totalResults,
  filteredResults
}: CustomerFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search);
  const [statusValue, setStatusValue] = useState(status);

  // Custom debounce hook
  const useDebounce = (callback: Function, delay: number) => {
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const debouncedCallback = useCallback((...args: any[]) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      const newTimer = setTimeout(() => {
        callback(...args);
      }, delay);
      setDebounceTimer(newTimer);
    }, [callback, delay, debounceTimer]);

    return debouncedCallback;
  };

  // Function to update URL parameters
  const updateFilters = useCallback((newSearch: string, newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update search parameter
    if (newSearch.trim()) {
      params.set('search', newSearch.trim());
    } else {
      params.delete('search');
    }
    
    // Update status parameter
    if (newStatus && newStatus !== 'all') {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    
    // Reset to page 1 when filters change
    params.delete('page');
    
    // Navigate with new parameters
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.push(`/admin/customers${newUrl}`, { scroll: false });
  }, [router, searchParams]);

  // Debounced search function
  const debouncedSearch = useDebounce((searchTerm: string) => {
    updateFilters(searchTerm, statusValue);
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  // Handle status change (immediate)
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusValue(value);
    updateFilters(searchValue, value);
  };

  // Update local state when props change (for browser back/forward)
  useEffect(() => {
    setSearchValue(search);
    setStatusValue(status);
  }, [search, status]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
        <CardTitle className="text-gray-800">Search & Filter</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search customers..."
                value={searchValue}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={statusValue}
              onChange={handleStatusChange}
              className="w-full sm:w-[140px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredResults > 0 && (
              <span>
                Showing <span className="font-semibold">{filteredResults}</span> of{' '}
                <span className="font-semibold">{totalResults}</span> customers
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
