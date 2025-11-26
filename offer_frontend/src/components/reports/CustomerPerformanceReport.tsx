'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Users, MapPin, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCrLakh } from '@/lib/format';

interface CustomerMetric {
  customerId: number;
  companyName: string;
  location: string | null;
  industry: string | null;
  zone: { id: number; name: string } | null;
  totalOffers: number;
  wonOffers: number;
  lostOffers: number;
  totalValue: number;
  wonValue: number;
  totalPoValue: number;
  wonPoValue: number;
  winRate: number;
  avgDealSize: number;
  conversionRate: number;
}

interface CustomerPerformanceData {
  topCustomers: CustomerMetric[];
  allCustomers: CustomerMetric[];
  totals: {
    totalCustomers: number;
    totalOffers: number;
    wonOffers: number;
    lostOffers: number;
    totalValue: number;
    wonValue: number;
    totalPoValue: number;
    wonPoValue: number;
    winRate: number;
    avgDealSize: number;
    conversionRate: number;
  };
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

interface CustomerPerformanceReportProps {
  data: CustomerPerformanceData;
}

const CustomerPerformanceReport: React.FC<CustomerPerformanceReportProps> = ({ data }) => {
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(new Set());
  const [showAllCustomers, setShowAllCustomers] = useState(false);

  const toggleExpand = (customerId: number) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const getWinRateBadgeColor = (rate: number) => {
    if (rate >= 50) return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    if (rate >= 30) return 'bg-orange-100 text-orange-800 border border-orange-300';
    if (rate >= 10) return 'bg-amber-100 text-amber-800 border border-amber-300';
    return 'bg-rose-100 text-rose-800 border border-rose-300';
  };

  // Filter out customers with 0 offers
  const customersWithOffers = data.allCustomers.filter(c => c.totalOffers > 0);
  const displayCustomers = showAllCustomers ? customersWithOffers : data.topCustomers;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-slate-50 to-slate-100 group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Customers</CardTitle>
              <div className="p-2 bg-slate-200 rounded-lg group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4 text-slate-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-gray-900">{data.totals.totalCustomers}</div>
            <p className="text-xs text-gray-600 mt-2 font-semibold">Active customers</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-emerald-50 to-teal-100 group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Revenue</CardTitle>
              <div className="p-2 bg-emerald-200 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-gray-900">{formatCrLakh(data.totals.totalValue)}</div>
            <p className="text-xs text-emerald-700 mt-2 font-semibold">{data.totals.totalOffers} offers</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-orange-50 to-amber-100 group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Avg Deal Size</CardTitle>
              <div className="p-2 bg-orange-200 rounded-lg group-hover:scale-110 transition-transform">
                <Building2 className="w-4 h-4 text-orange-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-gray-900">{formatCrLakh(data.totals.avgDealSize)}</div>
            <p className="text-xs text-orange-700 mt-2 font-semibold">Per offer</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-violet-50 to-purple-100 group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Win Rate</CardTitle>
              <div className="p-2 bg-violet-200 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4 text-violet-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-gray-900">{data.totals.winRate.toFixed(1)}%</div>
            <Badge className={`mt-2 text-xs font-bold ${getWinRateBadgeColor(data.totals.winRate)}`}>
              {data.totals.winRate >= 50 ? '✓ Strong' : data.totals.winRate >= 30 ? '→ Fair' : '⚠ Low'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Customer Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              {showAllCustomers ? 'All Customers' : 'Top Customers'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {showAllCustomers 
                ? `Showing all ${customersWithOffers.length} customers with offers` 
                : `Top ${data.topCustomers.length} customers by revenue`}
            </p>
          </div>
          {customersWithOffers.length > data.topCustomers.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllCustomers(!showAllCustomers)}
              className="font-semibold"
            >
              {showAllCustomers ? 'Show Top Only' : `Show All (${customersWithOffers.length})`}
            </Button>
          )}
        </div>

        {/* Customer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCustomers.map((customer) => (
            <Card 
              key={customer.customerId}
              className="border-0 shadow-sm hover:shadow-lg transition-all group bg-white"
            >
              {/* Header with Color Indicator */}
              <div className={`h-1 rounded-t-lg bg-gradient-to-r ${
                customer.winRate >= 50 
                  ? 'from-emerald-500 to-teal-500' 
                  : customer.winRate >= 30 
                  ? 'from-orange-500 to-amber-500' 
                  : 'from-rose-500 to-red-500'
              }`}></div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <CardTitle className="text-lg font-bold text-gray-900 truncate">
                        {customer.companyName}
                      </CardTitle>
                    </div>
                    {customer.zone && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>{customer.zone.name}</span>
                        {customer.location && <span>• {customer.location}</span>}
                      </div>
                    )}
                  </div>
                  <Badge className={`font-bold flex-shrink-0 ${getWinRateBadgeColor(customer.winRate)}`}>
                    {customer.winRate.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Offer Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 font-semibold">Total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{customer.totalOffers}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-emerald-700 font-semibold">Won</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{customer.wonOffers}</p>
                  </div>
                  <div className="bg-rose-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-rose-700 font-semibold">Lost</p>
                    <p className="text-2xl font-bold text-rose-700 mt-1">{customer.lostOffers}</p>
                  </div>
                </div>

                {/* Revenue Metrics */}
                <div className="space-y-2 border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">Total Value</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCrLakh(customer.totalValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">Avg Deal Size</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCrLakh(customer.avgDealSize)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">Won Value</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {formatCrLakh(customer.wonValue)}
                    </span>
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700">Conversion Rate</span>
                    <span className="text-sm font-bold text-orange-700">
                      {customer.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(customer.conversionRate, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Additional Info */}
                {customer.industry && (
                  <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                    <span className="font-semibold">Industry:</span> {customer.industry}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-emerald-50 to-teal-100 border-l-4 border-l-emerald-500 group">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              Best Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.allCustomers.length > 0 ? (
              <>
                <div className="text-xl font-bold truncate text-gray-900">
                  {data.allCustomers[0].companyName}
                </div>
                <div className="text-sm text-emerald-700 mt-2 font-semibold">
                  {formatCrLakh(data.allCustomers[0].totalValue)} revenue
                </div>
              </>
            ) : (
              <div className="text-gray-500">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-orange-50 to-amber-100 border-l-4 border-l-orange-500 group">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              Most Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.allCustomers.length > 0 ? (
              <>
                <div className="text-xl font-bold truncate text-gray-900">
                  {data.allCustomers.reduce((max, c) => c.totalOffers > max.totalOffers ? c : max).companyName}
                </div>
                <div className="text-sm text-orange-700 mt-2 font-semibold">
                  {data.allCustomers.reduce((max, c) => c.totalOffers > max.totalOffers ? c : max).totalOffers} offers
                </div>
              </>
            ) : (
              <div className="text-gray-500">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-violet-50 to-purple-100 border-l-4 border-l-violet-500 group">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <div className="p-2 bg-violet-100 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4 text-violet-600" />
              </div>
              Highest Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.allCustomers.length > 0 ? (
              <>
                <div className="text-xl font-bold truncate text-gray-900">
                  {data.allCustomers.reduce((max, c) => c.winRate > max.winRate ? c : max).companyName}
                </div>
                <div className="text-sm text-violet-700 mt-2 font-semibold">
                  {data.allCustomers.reduce((max, c) => c.winRate > max.winRate ? c : max).winRate.toFixed(1)}% win rate
                </div>
              </>
            ) : (
              <div className="text-gray-500">No data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerPerformanceReport;
