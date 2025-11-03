'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Target, TrendingUp, Users, Building2, Eye, Loader2, BarChart3, Award, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ZoneTarget {
  id: number;
  serviceZoneId: number;
  targetPeriod: string;
  periodType: 'MONTHLY' | 'YEARLY';
  productType?: string;
  targetValue: number;
  targetOfferCount?: number;
  actualValue: number;
  actualOfferCount: number;
  achievement: number;
  serviceZone: {
    id: number;
    name: string;
  };
}

interface UserTarget {
  id: number;
  userId: number;
  targetPeriod: string;
  periodType: 'MONTHLY' | 'YEARLY';
  targetValue: number;
  targetOfferCount?: number;
  productType?: string;
  actualValue: number;
  actualOfferCount: number;
  achievement: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

type TargetType = 'ZONE' | 'USER';

export default function ZoneUserTargetsPage() {
  const [activeTab, setActiveTab] = useState<TargetType>('ZONE');
  const [periodType, setPeriodType] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [targetPeriod, setTargetPeriod] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [zoneTargets, setZoneTargets] = useState<ZoneTarget[]>([]);
  const [userTargets, setUserTargets] = useState<UserTarget[]>([]);

  // Initialize with current period
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const currentPeriod = periodType === 'MONTHLY' ? `${year}-${month}` : `${year}`;
    setTargetPeriod(currentPeriod);
  }, [periodType]);

  // Fetch data
  useEffect(() => {
    if (targetPeriod) {
      fetchTargets();
    }
  }, [activeTab, targetPeriod, periodType]);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const params = { targetPeriod, periodType, grouped: 'true' }; // Backend now handles zone filtering automatically
      
      console.log('🎯 Fetching targets with params:', params, 'activeTab:', activeTab);
      
      if (activeTab === 'ZONE') {
        const response = await apiService.getZoneTargets(params);
        console.log('🏢 Zone targets response:', response);
        setZoneTargets(response.targets || []);
      } else if (activeTab === 'USER') {
        const response = await apiService.getUserTargets(params);
        console.log('👤 User targets response:', response);
        setUserTargets(response.targets || []);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementColor = (achievement: number) => {
    if (achievement >= 100) return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
    if (achievement >= 75) return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
    return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Backend already returns grouped data when grouped=true
  const currentTargets = activeTab === 'ZONE' ? zoneTargets : userTargets;
  const totalTargetValue = currentTargets.reduce((sum, t) => sum + t.targetValue, 0);
  const totalActualValue = currentTargets.reduce((sum, t) => sum + t.actualValue, 0);
  const overallAchievement = totalTargetValue > 0 ? (totalActualValue / totalTargetValue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <Target className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-1">My Zone Targets</h1>
                <p className="text-blue-100 text-lg">Monitor performance targets in your zone</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-blue-100 text-sm font-medium">View Only</p>
              <p className="text-white text-lg font-bold">Read Access</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {currentTargets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200">
              <div className="text-sm font-semibold text-slate-600 mb-1 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total Targets
              </div>
              <div className="text-3xl font-bold text-slate-900">{currentTargets.length}</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200">
              <div className="text-sm font-semibold text-slate-600 mb-1 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Target Value
              </div>
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(totalTargetValue)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200">
              <div className="text-sm font-semibold text-slate-600 mb-1 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Actual Value
              </div>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(totalActualValue)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200">
              <div className="text-sm font-semibold text-slate-600 mb-1 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Achievement
              </div>
              <div className={`text-3xl font-bold ${overallAchievement >= 75 ? 'text-green-600' : 'text-orange-600'}`}>
                {overallAchievement.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Period Selector & Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-900">Filter & View</span>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as 'MONTHLY' | 'YEARLY')}
                  className="px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                >
                  <option value="MONTHLY">📅 Monthly</option>
                  <option value="YEARLY">📆 Yearly</option>
                </select>
                <input
                  type={periodType === 'MONTHLY' ? 'month' : 'number'}
                  value={targetPeriod}
                  onChange={(e) => setTargetPeriod(e.target.value)}
                  className="px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                  min={periodType === 'YEARLY' ? '2020' : undefined}
                  max={periodType === 'YEARLY' ? '2030' : undefined}
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 pb-0 flex gap-2">
            <button
              onClick={() => setActiveTab('ZONE')}
              className={`px-6 py-3 font-bold rounded-t-xl transition-all flex items-center gap-2 ${
                activeTab === 'ZONE'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Zone Targets
              {activeTab === 'ZONE' && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{zoneTargets.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('USER')}
              className={`px-6 py-3 font-bold rounded-t-xl transition-all flex items-center gap-2 ${
                activeTab === 'USER'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-5 h-5" />
              User Targets
              {activeTab === 'USER' && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{userTargets.length}</span>}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600 font-semibold">Loading targets...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {activeTab === 'ZONE' ? '🏢 Zone' : '👤 User'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      🎯 Target Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      💰 Actual Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      📋 Offers
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      📊 Achievement
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      📅 Period
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {activeTab === 'ZONE' && zoneTargets.map((target: any, index: number) => (
                    <tr key={target.serviceZoneId} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{target.serviceZone.name}</div>
                        {target.targetCount > 1 && (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                            📊 {target.targetCount} Targets Combined
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-600">{formatCurrency(target.targetValue)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-green-600">{formatCurrency(target.actualValue)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700">
                          {target.actualOfferCount}{target.targetOfferCount ? <span className="text-slate-400"> / {target.targetOfferCount}</span> : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${getAchievementColor(target.achievement)}`}>
                          {target.achievement.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium">{target.targetPeriod}</span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'USER' && userTargets.map((target: any, index: number) => (
                    <tr key={target.userId} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{target.user.name || 'N/A'}</div>
                        <div className="text-sm text-slate-500">{target.user.email}</div>
                        {target.targetCount > 1 && (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                            📊 {target.targetCount} Targets Combined
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-600">{formatCurrency(target.targetValue)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-green-600">{formatCurrency(target.actualValue)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700">
                          {target.actualOfferCount}{target.targetOfferCount ? <span className="text-slate-400"> / {target.targetOfferCount}</span> : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${getAchievementColor(target.achievement)}`}>
                          {target.achievement.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium">{target.targetPeriod}</span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {((activeTab === 'ZONE' && zoneTargets.length === 0) ||
                    (activeTab === 'USER' && userTargets.length === 0)) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                            <Target className="w-10 h-10 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-slate-700 mb-1">No Targets Found</p>
                            <p className="text-slate-500">No targets set for the selected period in your zone</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
