'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/services/api';
import { ArrowLeft, Target, TrendingUp, Package, Building2, User } from 'lucide-react';

interface TargetDetail {
  id: number;
  productType: string | null;
  targetValue: number;
  actualValue: number;
  achievement: number;
}

export default function TargetViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const type = (searchParams.get('type') || 'ZONE') as 'ZONE' | 'USER';
  const entityId = searchParams.get('id') || '';
  const period = searchParams.get('period') || '';
  const periodType = searchParams.get('periodType') || 'MONTHLY';

  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState<TargetDetail[]>([]);
  const [entityName, setEntityName] = useState('');

  useEffect(() => {
    if (entityId && period) {
      fetchTargets();
    }
  }, [entityId, period, periodType, type]);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const params = { targetPeriod: period, periodType };
      
      if (type === 'ZONE') {
        const response = await apiService.getZoneTargets(params);
        const zoneTargets = response.targets.filter((t: any) => t.serviceZoneId === parseInt(entityId));
        setTargets(zoneTargets.map((t: any) => ({
          id: t.id,
          productType: t.productType,
          targetValue: t.targetValue,
          actualValue: t.actualValue,
          achievement: t.achievement
        })));
        if (zoneTargets.length > 0) {
          setEntityName(zoneTargets[0].serviceZone.name);
        }
      } else {
        const response = await apiService.getUserTargets(params);
        const userTargets = response.targets.filter((t: any) => t.userId === parseInt(entityId));
        setTargets(userTargets.map((t: any) => ({
          id: t.id,
          productType: t.productType,
          targetValue: t.targetValue,
          actualValue: t.actualValue,
          achievement: t.achievement
        })));
        if (userTargets.length > 0) {
          setEntityName(userTargets[0].user.name || userTargets[0].user.email);
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to fetch targets');
    } finally {
      setLoading(false);
    }
  };

  const getAchievementColor = (achievement: number) => {
    if (achievement >= 100) return 'from-green-500 to-emerald-500';
    if (achievement >= 75) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const overallTarget = targets.find(t => !t.productType);
  const productTargets = targets.filter(t => t.productType);
  const totalTarget = targets.reduce((sum, t) => sum + t.targetValue, 0);
  const totalActual = targets.reduce((sum, t) => sum + t.actualValue, 0);
  const overallAchievement = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-all hover:gap-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Targets</span>
          </button>
          
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                {type === 'ZONE' ? <Building2 className="w-10 h-10" /> : <User className="w-10 h-10" />}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-1">{entityName}</h1>
                <p className="text-blue-100 text-lg">
                  {type === 'ZONE' ? 'Zone' : 'User'} Target Breakdown • {period} ({periodType})
                </p>
              </div>
            </div>
            
            {/* Overall Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-blue-200 text-sm font-semibold mb-1">Total Target</div>
                <div className="text-2xl font-bold">₹{(totalTarget / 10000000).toFixed(2)}Cr</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-blue-200 text-sm font-semibold mb-1">Total Actual</div>
                <div className="text-2xl font-bold">₹{(totalActual / 10000000).toFixed(2)}Cr</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-blue-200 text-sm font-semibold mb-1">Overall Achievement</div>
                <div className="text-2xl font-bold">{overallAchievement.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600 font-semibold">Loading target details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Target */}
            {overallTarget && (
              <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <h2 className="text-xl font-bold text-slate-900">Overall Target (All Products)</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm font-semibold text-slate-600 mb-1">Target Value</div>
                      <div className="text-2xl font-bold text-blue-600">₹{overallTarget.targetValue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-600 mb-1">Actual Value</div>
                      <div className="text-2xl font-bold text-green-600">₹{overallTarget.actualValue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-600 mb-1">Achievement</div>
                      <div className={`inline-block px-6 py-2 rounded-xl text-2xl font-bold text-white bg-gradient-to-r ${getAchievementColor(overallTarget.achievement)} shadow-lg`}>
                        {overallTarget.achievement.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product-Specific Targets */}
            {productTargets.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-purple-100">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-bold text-slate-900">Product-Specific Targets</h2>
                    <span className="ml-auto bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {productTargets.length} Products
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productTargets.map((target) => (
                      <div key={target.id} className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-white to-purple-50/30 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{target.productType}</h3>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-lg font-bold text-white bg-gradient-to-r ${getAchievementColor(target.achievement)} shadow-md`}>
                            {target.achievement.toFixed(1)}%
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-slate-600 mb-1">Target</div>
                            <div className="text-lg font-bold text-blue-600">₹{target.targetValue.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-600 mb-1">Actual</div>
                            <div className="text-lg font-bold text-green-600">₹{target.actualValue.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-600 mb-1">Gap</div>
                            <div className={`text-lg font-bold ${target.actualValue >= target.targetValue ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{Math.abs(target.actualValue - target.targetValue).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No Targets */}
            {targets.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-700 mb-1">No Targets Found</p>
                <p className="text-slate-500">No targets have been set for this {type.toLowerCase()} in the selected period.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
