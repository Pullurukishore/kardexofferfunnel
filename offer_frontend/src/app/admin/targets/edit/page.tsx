'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/services/api';
import { ArrowLeft, Target, Save, Package, TrendingUp } from 'lucide-react';

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
  const productTypes = ['RELOCATION', 'CONTRACT', 'SPP', 'UPGRADE_KIT', 'SOFTWARE'];
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
      alert(error.response?.data?.message || 'Failed to fetch targets');
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
          alert('Please enter at least one target value');
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
        alert(`Updated ${successCount} targets. Errors: ${errors.join(', ')}`);
      } else {
        alert(`Successfully updated ${successCount} target(s)!`);
      }

      // Navigate back to targets page
      setTimeout(() => {
        router.push(`/admin/targets?type=${targetType}&period=${targetPeriod}&periodType=${periodType}`);
      }, 1000);
      
    } catch (error: any) {
      alert('Failed to update targets: ' + (error.response?.data?.message || error.message));
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
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{isCreatingNew ? 'Set Target Values' : 'Update Target Values'}</h2>
                  <p className="text-sm text-slate-600">{isCreatingNew ? 'Set the yearly target values below' : 'Modify the yearly target values below'}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {isCreatingNew ? (
                // Create new target form
                <div className="space-y-6">
                  {/* Overall Target */}
                  <div className="border-2 border-slate-200 rounded-xl p-6 hover:border-green-300 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Overall Target</h3>
                        <p className="text-sm text-slate-500">Set target for all product types combined</p>
                      </div>
                    </div>

                    <div className="max-w-md">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Target Value (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-4 text-slate-400 font-medium">₹</span>
                          <input
                            type="number"
                            value={newTargetValue}
                            onChange={(e) => setNewTargetValue(e.target.value)}
                            className="w-full pl-10 pr-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold transition-all"
                            min="0"
                            step="0.01"
                            placeholder="50,00,000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product-Specific Targets Toggle */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowProductTypes(!showProductTypes)}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-semibold border border-blue-200"
                    >
                      {showProductTypes ? '- Hide Product-Specific Targets' : '+ Add Product-Specific Targets'}
                    </button>
                  </div>

                  {/* Product-Specific Targets */}
                  {showProductTypes && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-slate-700 mb-2">Product-Specific Targets</h4>
                        <p className="text-sm text-slate-500">Set individual targets for specific product types</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {productTypes.map((productType) => (
                          <div key={productType} className="border-2 border-slate-200 rounded-xl p-4 hover:border-purple-300 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                                <Package className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{productType}</h4>
                                <p className="text-xs text-slate-500">Target for {productType} products</p>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Target Value (₹)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-400 text-sm">₹</span>
                                <input
                                  type="number"
                                  value={productTargets[productType] || ''}
                                  onChange={(e) => setProductTargets({
                                    ...productTargets,
                                    [productType]: e.target.value
                                  })}
                                  className="w-full pl-8 pr-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold text-sm"
                                  min="0"
                                  step="0.01"
                                  placeholder="20,00,000"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Edit existing targets form
                <div className="space-y-6">
                  {/* Summary Section */}
                  {targets.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Total Summary</h3>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-600 mb-1">Total Target</div>
                          <div className="text-2xl font-bold text-blue-600">
                            ₹{targets.reduce((sum, t) => sum + t.targetValue, 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-600 mb-1">Total Actual</div>
                          <div className="text-2xl font-bold text-green-600">
                            ₹{targets.reduce((sum, t) => sum + (t.actualValue || 0), 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-600 mb-1">Overall Achievement</div>
                          <div className={`text-2xl font-bold ${
                            targets.reduce((sum, t) => sum + t.targetValue, 0) > 0 
                              ? (targets.reduce((sum, t) => sum + (t.actualValue || 0), 0) / targets.reduce((sum, t) => sum + t.targetValue, 0)) * 100 >= 75 
                                ? 'text-green-600' 
                                : 'text-orange-600'
                              : 'text-slate-400'
                          }`}>
                            {targets.reduce((sum, t) => sum + t.targetValue, 0) > 0 
                              ? ((targets.reduce((sum, t) => sum + (t.actualValue || 0), 0) / targets.reduce((sum, t) => sum + t.targetValue, 0)) * 100).toFixed(1)
                              : '0.0'
                            }%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Overall Target */}
                  {targets.filter(t => !t.productType).map((target, index) => {
                    const actualIndex = targets.findIndex(t => t.id === target.id);
                    return (
                      <div key={target.id} className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-br from-white to-green-50/30 hover:border-green-400 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">Overall Target</h3>
                            <p className="text-sm text-slate-500">Target for all product types combined</p>
                          </div>
                        </div>

                        <div className="max-w-md">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              Target Value (₹) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-4 text-slate-400 font-medium">₹</span>
                              <input
                                type="number"
                                value={target.targetValue}
                                onChange={(e) => updateTarget(actualIndex, 'targetValue', e.target.value)}
                                className="w-full pl-10 pr-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold transition-all"
                                required
                                min="0"
                                step="0.01"
                                placeholder="50,00,000"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Product-Specific Targets */}
                  {targets.filter(t => t.productType).length > 0 && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-slate-700 mb-2">Product-Specific Targets</h4>
                        <p className="text-sm text-slate-500">Edit individual targets for specific product types</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {targets.filter(t => t.productType).map((target, index) => {
                          const actualIndex = targets.findIndex(t => t.id === target.id);
                          return (
                            <div key={target.id} className="border-2 border-purple-200 rounded-xl p-4 bg-gradient-to-br from-white to-purple-50/30 hover:border-purple-400 transition-all">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                                  <Package className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900">{target.productType}</h4>
                                  <p className="text-xs text-slate-500">Target for {target.productType} products</p>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  Target Value (₹) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-3 text-slate-400 text-sm">₹</span>
                                  <input
                                    type="number"
                                    value={target.targetValue}
                                    onChange={(e) => updateTarget(actualIndex, 'targetValue', e.target.value)}
                                    className="w-full pl-8 pr-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold text-sm"
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="20,00,000"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

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
