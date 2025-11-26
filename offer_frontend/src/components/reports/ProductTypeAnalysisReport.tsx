'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Package, Target, Award, BarChart3, Zap, Crown, ArrowUpRight, ArrowDownRight, Percent, DollarSign } from 'lucide-react';
import { formatCrLakh } from '@/lib/format';

interface ProductTypeMetric {
  productType: string;
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

interface ProductTypeAnalysisData {
  analysis: ProductTypeMetric[];
  totals: {
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

interface ProductTypeAnalysisReportProps {
  data: ProductTypeAnalysisData;
}

const ProductTypeAnalysisReport: React.FC<ProductTypeAnalysisReportProps> = ({ data }) => {
  const [sortBy, setSortBy] = useState<'offers' | 'value' | 'winRate'>('value');

  const getWinRateBadgeColor = (rate: number) => {
    if (rate >= 50) return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    if (rate >= 30) return 'bg-orange-100 text-orange-800 border border-orange-300';
    if (rate >= 10) return 'bg-amber-100 text-amber-800 border border-amber-300';
    return 'bg-rose-100 text-rose-800 border border-rose-300';
  };

  const getConversionBadgeColor = (rate: number) => {
    if (rate >= 80) return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    if (rate >= 50) return 'bg-orange-100 text-orange-800 border border-orange-300';
    if (rate >= 20) return 'bg-amber-100 text-amber-800 border border-amber-300';
    return 'bg-rose-100 text-rose-800 border border-rose-300';
  };

  const getPerformanceIndicator = (rate: number, threshold: number) => {
    if (rate >= threshold) return <ArrowUpRight className="h-3 w-3 inline" />;
    if (rate >= threshold * 0.8) return <Zap className="h-3 w-3 inline" />;
    return <ArrowDownRight className="h-3 w-3 inline" />;
  };

  const getSortedData = () => {
    const sorted = [...data.analysis];
    if (sortBy === 'offers') sorted.sort((a, b) => b.totalOffers - a.totalOffers);
    if (sortBy === 'value') sorted.sort((a, b) => b.totalValue - a.totalValue);
    if (sortBy === 'winRate') sorted.sort((a, b) => b.winRate - a.winRate);
    return sorted;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            Product Type Analysis
          </h2>
          <p className="text-gray-600 mt-1">Performance metrics across all product types</p>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Offers Card */}
        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-slate-50 to-slate-100 group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Offers</CardTitle>
              <div className="p-2 bg-slate-200 rounded-lg group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4 text-slate-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-gray-900">{data.totals.totalOffers}</div>
            <div className="flex gap-3 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-emerald-700 font-semibold">{data.totals.wonOffers}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                <span className="text-rose-700 font-semibold">{data.totals.lostOffers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Value Card */}
        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-emerald-50 to-teal-100 group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Value</CardTitle>
              <div className="p-2 bg-emerald-200 rounded-lg group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4 text-emerald-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-gray-900">{formatCrLakh(data.totals.totalValue)}</div>
            <p className="text-xs text-emerald-700 mt-2 font-semibold">Won: {formatCrLakh(data.totals.wonValue)}</p>
          </CardContent>
        </Card>

        {/* Win Rate Card */}
        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-orange-50 to-amber-100 group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Win Rate</CardTitle>
              <div className="p-2 bg-orange-200 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4 text-orange-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-gray-900">{data.totals.winRate.toFixed(1)}%</div>
            <Badge className={`mt-2 text-xs font-bold ${getWinRateBadgeColor(data.totals.winRate)}`}>
              {data.totals.winRate >= 50 ? '✓ Excellent' : data.totals.winRate >= 30 ? '→ Good' : '⚠ Improve'}
            </Badge>
          </CardContent>
        </Card>

        {/* Avg Deal Size Card */}
        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-violet-50 to-purple-100 group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Avg Deal</CardTitle>
              <div className="p-2 bg-violet-200 rounded-lg group-hover:scale-110 transition-transform">
                <Crown className="w-4 h-4 text-violet-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-gray-900">{formatCrLakh(data.totals.avgDealSize)}</div>
            <p className="text-xs text-violet-700 mt-2 font-semibold">Per offer</p>
          </CardContent>
        </Card>

        {/* Conversion Rate Card */}
        <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-rose-50 to-red-100 group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Conversion</CardTitle>
              <div className="p-2 bg-rose-200 rounded-lg group-hover:scale-110 transition-transform">
                <Percent className="w-4 h-4 text-rose-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-bold text-gray-900">{data.totals.conversionRate.toFixed(1)}%</div>
            <Badge className={`mt-2 text-xs font-bold ${getConversionBadgeColor(data.totals.conversionRate)}`}>
              {data.totals.conversionRate >= 80 ? '✓ Excellent' : data.totals.conversionRate >= 50 ? '→ Good' : '⚠ Improve'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Product Type Analytics Cards with Sorting */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              Product Type Performance
            </h3>
            <p className="text-sm text-gray-600 mt-1">Detailed breakdown by product type with key metrics</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('value')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                sortBy === 'value'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              By Value
            </button>
            <button
              onClick={() => setSortBy('winRate')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                sortBy === 'winRate'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              By Win Rate
            </button>
            <button
              onClick={() => setSortBy('offers')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                sortBy === 'offers'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              By Offers
            </button>
          </div>
        </div>

        {/* Product Type Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getSortedData().map((product, index) => (
            <Card 
              key={index}
              className={`border-0 shadow-sm hover:shadow-lg transition-all group ${
                product.totalOffers === 0 
                  ? 'bg-gray-50 opacity-60' 
                  : 'bg-white'
              }`}
            >
              {/* Header with Product Type and Performance Indicator */}
              <div className={`h-1 rounded-t-lg bg-gradient-to-r ${
                product.winRate >= 50 
                  ? 'from-emerald-500 to-teal-500' 
                  : product.winRate >= 30 
                  ? 'from-orange-500 to-amber-500' 
                  : 'from-rose-500 to-red-500'
              }`}></div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      {product.productType}
                    </CardTitle>
                    {product.totalOffers === 0 && (
                      <p className="text-xs text-gray-500 mt-1 italic">No offers</p>
                    )}
                  </div>
                  <Badge className={`font-bold ${
                    product.totalOffers === 0 
                      ? 'bg-gray-200 text-gray-600' 
                      : getWinRateBadgeColor(product.winRate)
                  }`}>
                    {product.winRate.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Offer Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 font-semibold">Total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{product.totalOffers}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-emerald-700 font-semibold">Won</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{product.wonOffers}</p>
                  </div>
                  <div className="bg-rose-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-rose-700 font-semibold">Lost</p>
                    <p className="text-2xl font-bold text-rose-700 mt-1">{product.lostOffers}</p>
                  </div>
                </div>

                {/* Value Metrics */}
                <div className="space-y-2 border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">Total Value</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCrLakh(product.totalValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">Avg Deal Size</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCrLakh(product.avgDealSize)}
                    </span>
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700">Conversion Rate</span>
                    <Badge className={`text-xs font-bold ${getConversionBadgeColor(product.conversionRate)}`}>
                      {product.conversionRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(product.conversionRate, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Win Rate Progress */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700">Win Rate</span>
                    <Badge className={`text-xs font-bold ${product.totalOffers === 0 ? 'bg-gray-200 text-gray-600' : getWinRateBadgeColor(product.winRate)}`}>
                      {product.winRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(product.winRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Top Performers & Insights Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          Key Insights & Top Performers
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Highest Win Rate */}
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-emerald-50 to-teal-100 border-l-4 border-l-emerald-500 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  Highest Win Rate
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {data.analysis.length > 0 ? (
                <>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {data.analysis.reduce((max, p) => p.winRate > max.winRate ? p : max).productType}
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                      <p className="text-sm text-emerald-700 font-bold">
                        {data.analysis.reduce((max, p) => p.winRate > max.winRate ? p : max).winRate.toFixed(1)}% win rate
                      </p>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        <span className="font-semibold">Offers:</span> {data.analysis.reduce((max, p) => p.winRate > max.winRate ? p : max).totalOffers}
                      </p>
                      <p>
                        <span className="font-semibold">Won:</span> {data.analysis.reduce((max, p) => p.winRate > max.winRate ? p : max).wonOffers}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-sm">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Highest Revenue */}
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-indigo-100 border-l-4 border-l-blue-500 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                    <Award className="w-4 h-4 text-blue-600" />
                  </div>
                  Highest Revenue
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {data.analysis.length > 0 ? (
                <>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {data.analysis.reduce((max, p) => p.totalValue > max.totalValue ? p : max).productType}
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-100 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 font-bold">
                        {formatCrLakh(data.analysis.reduce((max, p) => p.totalValue > max.totalValue ? p : max).totalValue)}
                      </p>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        <span className="font-semibold">Avg Deal:</span> {formatCrLakh(data.analysis.reduce((max, p) => p.totalValue > max.totalValue ? p : max).avgDealSize)}
                      </p>
                      <p>
                        <span className="font-semibold">Offers:</span> {data.analysis.reduce((max, p) => p.totalValue > max.totalValue ? p : max).totalOffers}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-sm">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Best Conversion */}
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-purple-50 to-pink-100 border-l-4 border-l-purple-500 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  Best Conversion
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {data.analysis.length > 0 ? (
                <>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {data.analysis.reduce((max, p) => p.conversionRate > max.conversionRate ? p : max).productType}
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-purple-100 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-700 font-bold">
                        {data.analysis.reduce((max, p) => p.conversionRate > max.conversionRate ? p : max).conversionRate.toFixed(1)}% conversion
                      </p>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        <span className="font-semibold">Total Value:</span> {formatCrLakh(data.analysis.reduce((max, p) => p.conversionRate > max.conversionRate ? p : max).totalValue)}
                      </p>
                      <p>
                        <span className="font-semibold">Offers:</span> {data.analysis.reduce((max, p) => p.conversionRate > max.conversionRate ? p : max).totalOffers}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-sm">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-semibold">Overall Performance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{data.totals.winRate.toFixed(1)}%</span>
                  <span className="text-xs text-gray-500">win rate</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(data.totals.winRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-semibold">Conversion Efficiency</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{data.totals.conversionRate.toFixed(1)}%</span>
                  <span className="text-xs text-gray-500">conversion</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(data.totals.conversionRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-semibold">Deal Success Rate</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{((data.totals.wonOffers / data.totals.totalOffers) * 100).toFixed(1)}%</span>
                  <span className="text-xs text-gray-500">success</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((data.totals.wonOffers / data.totals.totalOffers) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductTypeAnalysisReport;
