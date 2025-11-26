'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/services/api';
import { Plus, Target, TrendingUp, Users, Package, Building2, Edit2, Eye, RefreshCw, Download, Filter, Award, BarChart3, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

export default function TargetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<TargetType>(
    (searchParams.get('type') as TargetType) || 'ZONE'
  );
  const [periodType, setPeriodType] = useState<'MONTHLY' | 'YEARLY'>(
    (searchParams.get('periodType') as 'MONTHLY' | 'YEARLY') || 'YEARLY'
  );
  const [targetPeriod, setTargetPeriod] = useState<string>(
    searchParams.get('period') || ''
  );
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

  // Backend already handles monthly division when actualValuePeriod is provided
  // No need to divide again on frontend
  const calculateMonthlyTargets = (targets: any[]) => {
    // Just return targets as-is since backend already divided by 12 for monthly view
    return targets;
  };

  // Fetch data
  useEffect(() => {
    if (targetPeriod) {
      fetchTargets();
    }
  }, [activeTab, targetPeriod, periodType]);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      // For monthly view, fetch yearly targets and calculate monthly values
      const fetchPeriodType = periodType === 'MONTHLY' ? 'YEARLY' : 'YEARLY';
      const fetchTargetPeriod = periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod;
      
      const params = { 
        targetPeriod: fetchTargetPeriod, 
        periodType: fetchPeriodType, 
        grouped: 'true',
        // For monthly view, we need actual values for the specific month
        ...(periodType === 'MONTHLY' && { actualValuePeriod: targetPeriod })
      };
      
      if (activeTab === 'ZONE') {
        const response = await apiService.getZoneTargets(params);
        const targets = response.targets || [];
        setZoneTargets(calculateMonthlyTargets(targets));
      } else if (activeTab === 'USER') {
        const response = await apiService.getUserTargets(params);
        const targets = response.targets || [];
        setUserTargets(calculateMonthlyTargets(targets));
      }
    } catch (error: any) {
      console.error('Failed to fetch targets:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch targets');
    } finally {
      setLoading(false);
    }
  };



  const getAchievementColor = (achievement: number) => {
    if (achievement >= 100) return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
    if (achievement >= 75) return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
    return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
  };

  // Backend already returns grouped data when grouped=true
  const currentTargets = activeTab === 'ZONE' ? zoneTargets : userTargets;
  const totalTargetValue = currentTargets.reduce((sum, t) => sum + t.targetValue, 0);
  const totalActualValue = currentTargets.reduce((sum, t) => sum + t.actualValue, 0);
  const overallAchievement = totalTargetValue > 0 ? (totalActualValue / totalTargetValue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl shadow-lg">
                <Target className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                  Target Management
                  <Sparkles className="w-8 h-8 text-yellow-300" />
                </h1>
                <p className="text-blue-100 text-lg">Monitor and manage performance targets across zones and users</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={fetchTargets}
                variant="outline"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white hover:text-white"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {currentTargets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Targets Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-blue-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Total Targets</p>
                    <p className="text-4xl font-black text-blue-900 mt-2">{currentTargets.length}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" />
              </div>
            </div>

            {/* Target Value Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-indigo-200">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Target Value</p>
                    <p className="text-4xl font-black text-indigo-900 mt-2">₹{(totalTargetValue / 10000000).toFixed(2)}Cr</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full" />
              </div>
            </div>

            {/* Actual Value Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-emerald-200">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Actual Value (Won)</p>
                    <p className="text-4xl font-black text-emerald-900 mt-2">₹{(totalActualValue / 10000000).toFixed(2)}Cr</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full" />
              </div>
            </div>

            {/* Achievement Card */}
            <div className={`group relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border ${
              overallAchievement >= 100 ? 'bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200' :
              overallAchievement >= 75 ? 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200' :
              'bg-gradient-to-br from-rose-50 to-red-100 border-rose-200'
            }`}>
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                overallAchievement >= 100 ? 'bg-gradient-to-br from-emerald-400/10 to-teal-400/10' :
                overallAchievement >= 75 ? 'bg-gradient-to-br from-amber-400/10 to-orange-400/10' :
                'bg-gradient-to-br from-rose-400/10 to-red-400/10'
              }`} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-widest ${
                      overallAchievement >= 100 ? 'text-emerald-600' :
                      overallAchievement >= 75 ? 'text-amber-600' : 'text-rose-600'
                    }`}>Achievement</p>
                    <p className={`text-4xl font-black mt-2 ${
                      overallAchievement >= 100 ? 'text-emerald-900' :
                      overallAchievement >= 75 ? 'text-amber-900' : 'text-rose-900'
                    }`}>
                      {overallAchievement.toFixed(1)}%
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow ${
                    overallAchievement >= 100 ? 'bg-gradient-to-br from-emerald-400 to-teal-600' :
                    overallAchievement >= 75 ? 'bg-gradient-to-br from-amber-400 to-orange-600' :
                    'bg-gradient-to-br from-rose-400 to-red-600'
                  }`}>
                    <Award className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className={`h-1 rounded-full ${
                  overallAchievement >= 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' :
                  overallAchievement >= 75 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                  'bg-gradient-to-r from-rose-400 to-red-400'
                }`} />
              </div>
            </div>
          </div>
        )}

        {/* Period Selector & Tabs */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Filter & View Options</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <select
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value as 'MONTHLY' | 'YEARLY')}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold bg-white hover:border-blue-400 transition-colors"
                  >
                    <option value="MONTHLY">📅 Monthly View</option>
                    <option value="YEARLY">📆 Yearly Target</option>
                  </select>
                </div>
                <input
                  type={periodType === 'MONTHLY' ? 'month' : 'number'}
                  value={targetPeriod}
                  onChange={(e) => setTargetPeriod(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold bg-white hover:border-blue-400 transition-colors"
                  min={periodType === 'YEARLY' ? '2020' : undefined}
                  max={periodType === 'YEARLY' ? '2030' : undefined}
                />
              </div>
            </div>
          </CardHeader>

          {/* Tabs */}
          <div className="px-6 pt-4 pb-0 flex gap-3">
            <Button
              onClick={() => setActiveTab('ZONE')}
              variant={activeTab === 'ZONE' ? 'default' : 'outline'}
              className={`px-6 py-6 font-bold rounded-t-xl transition-all flex items-center gap-2 ${
                activeTab === 'ZONE'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Zone Targets
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'ZONE' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
              }`}>
                {zoneTargets.length}
              </span>
            </Button>
            <Button
              onClick={() => setActiveTab('USER')}
              variant={activeTab === 'USER' ? 'default' : 'outline'}
              className={`px-6 py-6 font-bold rounded-t-xl transition-all flex items-center gap-2 ${
                activeTab === 'USER'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2'
              }`}
            >
              <Users className="w-5 h-5" />
              Zone User Targets
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'USER' ? 'bg-white/20' : 'bg-purple-100 text-purple-700'
              }`}>
                {userTargets.length}
              </span>
            </Button>
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <Card className="shadow-xl border-0">
            <CardContent className="py-20">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
                <p className="text-gray-700 font-semibold text-xl">Loading targets...</p>
                <p className="text-gray-500 text-sm mt-2">Please wait while we fetch the data</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="sticky top-0 z-20">
                  <tr className={`bg-gradient-to-r ${activeTab === 'ZONE' ? 'from-blue-600 to-blue-500' : 'from-purple-600 to-purple-500'} text-white shadow-lg`}>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-2">
                        {activeTab === 'ZONE' ? '🏢' : '👤'} {activeTab === 'ZONE' ? 'Zone' : 'User'}
                      </span>
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-2">🎯 Target Value</span>
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-2">💰 Actual Value</span>
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-2">📊 Achievement</span>
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-2">⚙️ Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {activeTab === 'ZONE' && zoneTargets.map((target: any, index: number) => (
                    <tr key={target.serviceZoneId} className={`group hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-25 transition-all duration-300 border-l-4 ${!target.id ? 'border-l-orange-500 bg-orange-50/30' : 'border-l-blue-400 hover:border-l-blue-600'}`}>
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-900 text-base">{target.serviceZone?.name}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {target.targetCount > 1 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
                              📊 {target.targetCount} Combined
                            </span>
                          )}
                          {target.isDerived && (
                            <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 px-3 py-1 rounded-full font-semibold border border-orange-200">
                              📅 Monthly (÷12)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-blue-700 text-lg">₹{Number(target?.targetValue || 0).toLocaleString()}</div>
                        <p className="text-xs text-gray-500 mt-1">Target</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-emerald-700 text-lg">₹{Number(target?.actualValue || 0).toLocaleString()}</div>
                        <p className="text-xs text-gray-500 mt-1">Actual</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <span className={`px-4 py-2 rounded-lg text-sm font-bold shadow-md w-fit ${getAchievementColor(target.achievement)}`}>
                            {Number(target?.achievement || 0).toFixed(1)}%
                          </span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${
                                target.achievement >= 100 ? 'from-green-500 to-emerald-500' :
                                target.achievement >= 75 ? 'from-yellow-500 to-orange-500' :
                                'from-red-500 to-pink-500'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, target.achievement))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => router.push(`/admin/targets/view?type=ZONE&id=${target.serviceZoneId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY`)}
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                            title="View all targets"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {target.id && (
                            <Button
                              onClick={() => router.push(`/admin/targets/edit?type=ZONE&id=${target.serviceZoneId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY&targetId=${target.id}`)}
                              size="sm"
                              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all"
                              title="Edit target"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {!target.id && (
                            <Button
                              onClick={() => router.push(`/admin/targets/edit?type=ZONE&id=${target.serviceZoneId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY`)}
                              size="sm"
                              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                              title="Create target"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Create
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'USER' && userTargets.map((target: any, index: number) => (
                    <tr key={target.userId} className={`group hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-25 transition-all duration-300 border-l-4 ${!target.id ? 'border-l-orange-500 bg-orange-50/30' : 'border-l-purple-400 hover:border-l-purple-600'}`}>
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-900 text-base">{target.user?.name || 'N/A'}</div>
                        <div className="text-sm text-slate-500 mt-1">{target.user?.email}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {target.targetCount > 1 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 px-3 py-1 rounded-full font-semibold border border-purple-200">
                              📊 {target.targetCount} Combined
                            </span>
                          )}
                          {target.isDerived && (
                            <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 px-3 py-1 rounded-full font-semibold border border-orange-200">
                              📅 Monthly (÷12)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-blue-700 text-lg">₹{Number(target?.targetValue || 0).toLocaleString()}</div>
                        <p className="text-xs text-gray-500 mt-1">Target</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-emerald-700 text-lg">₹{Number(target?.actualValue || 0).toLocaleString()}</div>
                        <p className="text-xs text-gray-500 mt-1">Actual</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <span className={`px-4 py-2 rounded-lg text-sm font-bold shadow-md w-fit ${getAchievementColor(target.achievement)}`}>
                            {Number(target?.achievement || 0).toFixed(1)}%
                          </span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${
                                target.achievement >= 100 ? 'from-green-500 to-emerald-500' :
                                target.achievement >= 75 ? 'from-yellow-500 to-orange-500' :
                                'from-red-500 to-pink-500'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, target.achievement))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => router.push(`/admin/targets/view?type=USER&id=${target.userId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY`)}
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                            title="View all targets"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {target.id && (
                            <Button
                              onClick={() => router.push(`/admin/targets/edit?type=USER&id=${target.userId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY&targetId=${target.id}`)}
                              size="sm"
                              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all"
                              title="Edit target"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {!target.id && (
                            <Button
                              onClick={() => router.push(`/admin/targets/edit?type=USER&id=${target.userId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY`)}
                              size="sm"
                              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                              title="Create target"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Create
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {((activeTab === 'ZONE' && zoneTargets.length === 0) ||
                    (activeTab === 'USER' && userTargets.length === 0)) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-lg">
                            <Target className="w-12 h-12 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 mb-2">No Targets Found</p>
                            <p className="text-gray-600 text-lg">
                              {activeTab === 'ZONE' ? 'No zone targets set for this period' : 'No user targets set for this period'}
                            </p>
                            <p className="text-gray-500 text-sm mt-2">Create targets by clicking on the "Create" button for each {activeTab === 'ZONE' ? 'zone' : 'user'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

