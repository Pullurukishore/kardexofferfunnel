'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatsCard } from '@/components/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DashboardStats, Offer } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOffers, setRecentOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await apiService.getAdminDashboard();
      setStats(data.stats);
      setRecentOffers(data.recentOffers || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      WON: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
      ON_HOLD: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" role="ADMIN">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard" role="ADMIN">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Offers"
          value={stats?.totalOffers || 0}
          description="All time"
        />
        <StatsCard
          title="Open Offers"
          value={stats?.openOffers || 0}
          description="Currently active"
        />
        <StatsCard
          title="Won Offers"
          value={stats?.wonOffers || 0}
          description={`Win rate: ${stats?.winRate || '0%'}`}
        />
        <StatsCard
          title="Total Value"
          value={formatCurrency(stats?.totalValue || 0)}
          description={`Won: ${formatCurrency(stats?.wonValue || 0)}`}
        />
      </div>

      {/* Recent Offers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Offers</CardTitle>
          <CardDescription>Latest offers across all zones</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOffers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No offers yet</p>
          ) : (
            <div className="space-y-4">
              {recentOffers.map((offer) => (
                <a
                  key={offer.id}
                  href={`/admin/offers/${offer.id}`}
                  className="block border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {offer.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            offer.status
                          )}`}
                        >
                          {offer.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {offer.customer.companyName} • {offer.zone.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {offer.offerNumber} • {formatDate(offer.createdAt)}
                      </p>
                    </div>
                    {offer.estimatedValue && (
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(offer.estimatedValue, offer.currency)}
                        </p>
                        <p className="text-xs text-gray-500">Estimated Value</p>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
