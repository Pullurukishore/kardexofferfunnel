'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/services/api';
import { ArrowLeft, Target, Save, Package, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface Target {
  id: number;
  serviceZoneId?: number;
  userId?: number;
  targetPeriod: string;
  periodType: 'MONTHLY' | 'YEARLY';
  productType?: string;
  targetValue: number;
  targetOfferCount?: number;
  actualValue?: number;
  achievement?: number;
  serviceZone?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function EditTargetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const targetType = (searchParams.get('type') || 'ZONE') as 'ZONE' | 'USER';
  const entityId = searchParams.get('id');
  const targetPeriod = searchParams.get('period') || '';
  const periodType = (searchParams.get('periodType') || 'YEARLY') as 'MONTHLY' | 'YEARLY';
  const targetId = searchParams.get('targetId');

  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entityName, setEntityName] = useState('');
  
  // For creating new targets
  const [newTargetValue, setNewTargetValue] = useState('');
  const [showProductTypes, setShowProductTypes] = useState(false);
  
  // Product types from backend enum
  const productTypes = ['RELOCATION', 'CONTRACT', 'SPP', 'UPGRADE_KIT', 'SOFTWARE', 'BD_CHARGES', 'BD_SPARE', 'MIDLIFE_UPGRADE', 'RETROFIT_KIT'];
  const [productTargets, setProductTargets] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (entityId && targetPeriod) {
      fetchTargets();
    }
  }, [entityId, targetPeriod, targetType]);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const params = { 
        targetPeriod, 
        periodType: 'YEARLY', // Always fetch yearly targets for editing
        grouped: 'false' // Get individual targets, not grouped
      };
      
      let response;
      if (targetType === 'ZONE') {
        response = await apiService.getZoneTargets(params);
      } else {
        response = await apiService.getUserTargets(params);
      }
      
      const allTargets = response.targets || [];
      
      // Filter targets for the specific entity
      const entityTargets = allTargets.filter((target: Target) => 
        targetType === 'ZONE' 
          ? target.serviceZoneId === parseInt(entityId!)
          : target.userId === parseInt(entityId!)
      );
      
      // Only include targets that actually exist (have an ID)
      const existingTargets = entityTargets.filter((target: Target) => target.id);
      
      setTargets(existingTargets);
      
      // Set entity name
      if (existingTargets.length > 0) {
        const firstTarget = existingTargets[0];
        if (targetType === 'ZONE') {
          setEntityName(firstTarget.serviceZone?.name || 'Unknown Zone');
        } else {
          setEntityName(firstTarget.user?.name || firstTarget.user?.email || 'Unknown User');
        }
      } else {
        // If no targets exist, get entity name from the full list
        const entityData = allTargets.find((target: Target) => 
          targetType === 'ZONE' 
            ? target.serviceZoneId === parseInt(entityId!)
            : target.userId === parseInt(entityId!)
        );
        if (entityData) {
          if (targetType === 'ZONE') {
            setEntityName(entityData.serviceZone?.name || 'Unknown Zone');
          } else {
            setEntityName(entityData.user?.name || entityData.user?.email || 'Unknown User');
          }
        } else {
          // Fallback - fetch entity details directly
          setEntityName(targetType === 'ZONE' ? 'Zone' : 'User');
        }
      }
      
    } catch (error: any) {
      console.error('Failed to fetch targets:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch targets');
    } finally {
      setLoading(false);
    }
  };

  const updateTarget = (index: number, field: 'targetValue', value: string) => {
    const updated = [...targets];
    updated[index].targetValue = parseFloat(value) || 0;
    setTargets(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    let successCount = 0;
    const errors: string[] = [];

    try {
      if (isCreatingNew) {
        // Create new targets
        const targetsToCreate = [];

        // Add overall target if specified
        if (newTargetValue) {
          targetsToCreate.push({
            targetPeriod,
            periodType: 'YEARLY',
            targetValue: parseFloat(newTargetValue),
            targetOfferCount: null,
            productType: null,
            label: 'Overall'
          });
        }

        // Add product-specific targets
        Object.entries(productTargets).forEach(([productType, value]) => {
          if (value) {
            targetsToCreate.push({
              targetPeriod,
              periodType: 'YEARLY',
              targetValue: parseFloat(value),
              targetOfferCount: null,
              productType,
              label: productType
            });
          }
        });

        if (targetsToCreate.length === 0) {
          toast.error('Please enter at least one target value');
          setSaving(false);
          return;
        }

        // Create all targets
        for (const targetData of targetsToCreate) {
          try {
            const createData = {
              targetPeriod: targetData.targetPeriod,
              periodType: targetData.periodType,
              targetValue: targetData.targetValue,
              targetOfferCount: targetData.targetOfferCount,
              productType: targetData.productType
            };

            if (targetType === 'ZONE') {
              await apiService.setZoneTarget({
                ...createData,
                serviceZoneId: parseInt(entityId!)
              });
            } else {
              await apiService.setUserTarget({
                ...createData,
                userId: parseInt(entityId!)
              });
            }
            
            successCount++;
          } catch (error: any) {
            errors.push(`${targetData.label}: ${error.response?.data?.message || 'Failed'}`);
          }
        }
      } else {
        // Update existing targets
        for (const target of targets) {
          try {
            const updateData = {
              targetValue: Number(target.targetValue),
              targetOfferCount: target.targetOfferCount ? Number(target.targetOfferCount) : null
            };

            if (targetType === 'ZONE') {
              await apiService.updateZoneTarget(target.id, updateData);
            } else {
              await apiService.updateUserTarget(target.id, updateData);
            }
            
            successCount++;
          } catch (error: any) {
            const productLabel = target.productType || 'Overall';
            errors.push(`${productLabel}: ${error.response?.data?.message || 'Failed'}`);
          }
        }
      }

      if (errors.length > 0) {
        toast.warning(`Updated ${successCount} targets. Some errors occurred: ${errors.join(', ')}`);
      } else {
        toast.success(`Successfully ${isCreatingNew ? 'created' : 'updated'} ${successCount} target(s)!`);
      }

      // Navigate back to targets page
      setTimeout(() => {
        router.push(`/admin/targets?type=${targetType}&period=${targetPeriod}&periodType=${periodType}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Failed to update targets:', error);
      toast.error('Failed to update targets: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading targets...</p>
        </div>
      </div>
    );
  }

  // If no targets exist, we'll create a form to set new targets
  const isCreatingNew = targets.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-all hover:gap-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Targets</span>
          </button>
          
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-xl mb-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">{isCreatingNew ? 'Create Target' : 'Edit Targets'}</h1>
                <p className="text-green-100 mt-1 text-lg">
                  {isCreatingNew ? 'Set yearly target for' : 'Update yearly targets for'} {entityName}
                </p>
              </div>
            </div>
            <div className="flex gap-4 mt-6 text-sm">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-green-200">Type:</span>
                <span className="ml-2 font-semibold">{targetType === 'ZONE' ? 'Zone' : 'User'}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-green-200">Period:</span>
                <span className="ml-2 font-semibold">{targetPeriod}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-green-200">{isCreatingNew ? 'Action' : 'Targets'}:</span>
                <span className="ml-2 font-semibold">{isCreatingNew ? 'Create New' : targets.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {isCreatingNew ? (
            // Create new target form
            <>
              {/* Overall Target Card */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-200 overflow-hidden hover:shadow-2xl transition-all">
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Overall Target</h3>
                      <p className="text-emerald-50 text-sm">Combined target for all product types</p>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Target Value (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">₹</span>
                    <input
                      type="number"
                      value={newTargetValue}
                      onChange={(e) => setNewTargetValue(e.target.value)}
                      className="w-full pl-12 pr-6 py-5 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-2xl font-bold transition-all hover:border-emerald-400"
                      min="0"
                      step="0.01"
                      placeholder="50,00,000"
                    />
                  </div>
                </div>
              </div>

              {/* Product-Specific Targets Section */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Package className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Product-Specific Targets</h3>
                        <p className="text-violet-50 text-sm">Set targets for individual product types</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProductTypes(!showProductTypes)}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all font-semibold border border-white/30"
                    >
                      {showProductTypes ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                
                {showProductTypes && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {productTypes.map((productType) => (
                        <div key={productType} className="group relative bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-200 rounded-xl p-5 hover:border-purple-400 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-md">
                                <Package className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{productType}</h4>
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                            <input
                              type="number"
                              value={productTargets[productType] || ''}
                              onChange={(e) => setProductTargets({
                                ...productTargets,
                                [productType]: e.target.value
                              })}
                              className="w-full pl-8 pr-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold text-sm hover:border-purple-300 transition-all"
                              min="0"
                              step="0.01"
                              placeholder="Enter value"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Edit existing targets form
            <>
              {/* Summary Dashboard */}
              {targets.length > 0 && (
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6 text-white">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-7 h-7" />
                      </div>
                      <h3 className="text-2xl font-bold">Performance Summary</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                        <div className="text-blue-100 text-sm font-semibold mb-2">Total Target</div>
                        <div className="text-3xl font-bold text-white">
                          ₹{(targets.reduce((sum, t) => sum + t.targetValue, 0) / 10000000).toFixed(2)}Cr
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                        <div className="text-blue-100 text-sm font-semibold mb-2">Total Actual</div>
                        <div className="text-3xl font-bold text-white">
                          ₹{(targets.reduce((sum, t) => sum + (t.actualValue || 0), 0) / 10000000).toFixed(2)}Cr
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                        <div className="text-blue-100 text-sm font-semibold mb-2">Achievement</div>
                        <div className="text-3xl font-bold text-white">
                          {targets.reduce((sum, t) => sum + t.targetValue, 0) > 0 
                            ? ((targets.reduce((sum, t) => sum + (t.actualValue || 0), 0) / targets.reduce((sum, t) => sum + t.targetValue, 0)) * 100).toFixed(1)
                            : '0.0'
                          }%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Overall Target Card */}
              {targets.filter(t => !t.productType).map((target) => {
                const actualIndex = targets.findIndex(t => t.id === target.id);
                return (
                  <div key={target.id} className="bg-white rounded-2xl shadow-xl border-2 border-emerald-200 overflow-hidden hover:shadow-2xl transition-all">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-4">
                      <div className="flex items-center gap-3 text-white">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Overall Target</h3>
                          <p className="text-emerald-50 text-sm">Combined target for all product types</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-8">
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                        Target Value (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">₹</span>
                        <input
                          type="number"
                          value={target.targetValue}
                          onChange={(e) => updateTarget(actualIndex, 'targetValue', e.target.value)}
                          className="w-full pl-12 pr-6 py-5 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-2xl font-bold transition-all hover:border-emerald-400"
                          required
                          min="0"
                          step="0.01"
                          placeholder="50,00,000"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Product-Specific Targets - Show all product types */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Package className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Product-Specific Targets</h3>
                      <p className="text-violet-50 text-sm">Edit targets for individual product types</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productTypes.map((productType) => {
                      const existingTarget = targets.find(t => t.productType === productType);
                      const actualIndex = existingTarget ? targets.findIndex(t => t.id === existingTarget.id) : -1;
                      const targetValue = existingTarget?.targetValue || 0;
                      const hasTarget = !!existingTarget;
                      const actualValue = existingTarget?.actualValue || 0;
                      const achievement = targetValue > 0 ? (actualValue / targetValue) * 100 : 0;
                      
                      return (
                        <div key={productType} className={`group relative rounded-xl p-5 transition-all ${
                          hasTarget 
                            ? 'bg-gradient-to-br from-white to-purple-50/50 border-2 border-purple-300 hover:border-purple-500 hover:shadow-xl' 
                            : 'bg-gradient-to-br from-white to-slate-50/50 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg'
                        }`}>
                          {/* Header Section */}
                          <div className="flex items-start gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md ${
                              hasTarget 
                                ? 'bg-gradient-to-br from-purple-500 to-violet-500' 
                                : 'bg-gradient-to-br from-slate-400 to-slate-500'
                            }`}>
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-900 text-sm break-words">{productType}</h4>
                              {!hasTarget && (
                                <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                                  No Target
                                </span>
                              )}
                              {hasTarget && achievement > 0 && (
                                <span className={`inline-block mt-1 text-xs font-semibold ${
                                  achievement >= 100 ? 'text-green-600' :
                                  achievement >= 75 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {achievement.toFixed(0)}% achieved
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Input Section */}
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-700">
                              Target Value (₹) {hasTarget && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                              <input
                                type="number"
                                value={targetValue}
                                onChange={(e) => {
                                  if (hasTarget && actualIndex !== -1) {
                                    updateTarget(actualIndex, 'targetValue', e.target.value);
                                  }
                                }}
                                className={`w-full pl-8 pr-3 py-3 border-2 rounded-lg font-semibold text-sm transition-all ${
                                  hasTarget
                                    ? 'border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-300'
                                    : 'border-slate-200 bg-slate-50 cursor-not-allowed'
                                }`}
                                required={hasTarget}
                                min="0"
                                step="0.01"
                                placeholder={hasTarget ? "Enter value" : "Not set"}
                                disabled={!hasTarget}
                                title={!hasTarget ? "This product type has no target set. Create a new target to edit." : ""}
                              />
                            </div>
                            {!hasTarget && (
                              <p className="text-xs text-slate-500">
                                💡 No target set for this product
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-4 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-lg transition-all hover:border-slate-400"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                disabled={saving || (isCreatingNew && !newTargetValue && Object.values(productTargets).every(v => !v))}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    {isCreatingNew ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    {isCreatingNew ? 'Create Target' : `Update ${targets.length} Target${targets.length > 1 ? 's' : ''}`}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
