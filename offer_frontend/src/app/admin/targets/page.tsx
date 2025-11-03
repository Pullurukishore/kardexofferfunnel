'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/services/api';
import { Plus, Target, TrendingUp, Users, Package, Building2, Edit2, Eye } from 'lucide-react';

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

  // Calculate monthly targets from yearly targets
  const calculateMonthlyTargets = (targets: any[]) => {
    if (periodType === 'YEARLY') return targets;
    
    return targets.map(target => ({
      ...target,
      targetValue: Math.round(target.targetValue / 12),
      actualValue: target.actualValue, // Keep actual as is for the specific month
      achievement: target.targetValue > 0 ? (target.actualValue / (target.targetValue / 12)) * 100 : 0,
      isDerived: true // Flag to indicate this is calculated from yearly
    }));
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
      alert(error.response?.data?.message || 'Failed to fetch targets');
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
                <h1 className="text-4xl font-bold mb-1">Target Management</h1>
                <p className="text-blue-100 text-lg">Monitor and manage performance targets</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {currentTargets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200">
              <div className="text-sm font-semibold text-slate-600 mb-1">Total Targets</div>
              <div className="text-3xl font-bold text-slate-900">{currentTargets.length}</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200">
              <div className="text-sm font-semibold text-slate-600 mb-1">Target Value</div>
              <div className="text-3xl font-bold text-blue-600">₹{(totalTargetValue / 10000000).toFixed(2)}Cr</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200">
              <div className="text-sm font-semibold text-slate-600 mb-1">Actual Value</div>
              <div className="text-3xl font-bold text-green-600">₹{(totalActualValue / 10000000).toFixed(2)}Cr</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200">
              <div className="text-sm font-semibold text-slate-600 mb-1">Achievement</div>
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
                  <option value="MONTHLY">📅 Monthly View</option>
                  <option value="YEARLY">📆 Yearly Target</option>
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
               Zone User Targets
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
                      📊 Achievement
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {activeTab === 'ZONE' && zoneTargets.map((target: any, index: number) => (
                    <tr key={target.serviceZoneId} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} ${!target.id ? 'border-l-4 border-l-orange-300' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{target.serviceZone.name}</div>
                        {target.targetCount > 1 && (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                            📊 {target.targetCount} Targets Combined
                          </div>
                        )}
                        {target.isDerived && (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                            📊 Monthly (Yearly ÷ 12)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-600">₹{target.targetValue.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-green-600">₹{target.actualValue.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${getAchievementColor(target.achievement)}`}>
                          {target.achievement.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/targets/view?type=ZONE&id=${target.serviceZoneId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY`)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all hover:text-blue-700"
                            title="View all targets"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {target.id && (
                            <button
                              onClick={() => router.push(`/admin/targets/edit?type=ZONE&id=${target.serviceZoneId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY&targetId=${target.id}`)}
                              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all hover:text-green-700"
                              title="Edit target"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          )}
                          {!target.id && (
                            <button
                              onClick={() => router.push(`/admin/targets/edit?type=ZONE&id=${target.serviceZoneId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY`)}
                              className="text-xs text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 font-semibold transition-all"
                              title="Create target"
                            >
                              + Create Target
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'USER' && userTargets.map((target: any, index: number) => (
                    <tr key={target.userId} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} ${!target.id ? 'border-l-4 border-l-orange-300' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{target.user.name || 'N/A'}</div>
                        <div className="text-sm text-slate-500">{target.user.email}</div>
                        {target.targetCount > 1 && (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                            📊 {target.targetCount} Targets Combined
                          </div>
                        )}
                        {target.isDerived && (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                            📊 Monthly (Yearly ÷ 12)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-600">₹{target.targetValue.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-green-600">₹{target.actualValue.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${getAchievementColor(target.achievement)}`}>
                          {target.achievement.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/targets/view?type=USER&id=${target.userId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY`)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all hover:text-blue-700"
                            title="View all targets"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {target.id && (
                            <button
                              onClick={() => router.push(`/admin/targets/edit?type=USER&id=${target.userId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY&targetId=${target.id}`)}
                              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all hover:text-green-700"
                              title="Edit target"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          )}
                          {!target.id && (
                            <button
                              onClick={() => router.push(`/admin/targets/edit?type=USER&id=${target.userId}&period=${periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod}&periodType=YEARLY`)}
                              className="text-xs text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 font-semibold transition-all"
                              title="Create target"
                            >
                              + Create Target
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {((activeTab === 'ZONE' && zoneTargets.length === 0) ||
                    (activeTab === 'USER' && userTargets.length === 0)) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                            <Target className="w-10 h-10 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-slate-700 mb-1">No Targets Found</p>
                            <p className="text-slate-500">Click "Set New Target" button to create your first target</p>
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

