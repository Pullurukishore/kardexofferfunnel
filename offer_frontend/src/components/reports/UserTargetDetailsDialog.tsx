'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Users, DollarSign, TrendingUp, TrendingDown, Package, Mail } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { formatCrLakh, formatINRFull } from '@/lib/format';

interface UserTargetDetailsDialogProps {
  userId: number;
  targetPeriod: string;
  periodType: 'MONTHLY' | 'YEARLY';
  open: boolean;
  onClose: () => void;
}

interface UserTargetDetail {
  productType: string;
  targetValue: number;
  targetOfferCount: number;
  actualValue: number;
  actualOfferCount: number;
  achievement: number;
  variance: number;
  variancePercentage: number;
}

const UserTargetDetailsDialog: React.FC<UserTargetDetailsDialogProps> = ({
  userId,
  targetPeriod,
  periodType,
  open,
  onClose,
}) => {
  const [targets, setTargets] = useState<UserTargetDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (open && userId) {
      fetchUserTargetDetails();
    } else {
      setTargets([]);
      setSummary(null);
      setUser(null);
    }
  }, [open, userId, targetPeriod, periodType]);

  const fetchUserTargetDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching user target details for:', { userId, targetPeriod, periodType });
      
      const response = await apiService.getUserTargetDetails(
        userId,
        targetPeriod,
        periodType
      );

      console.log('User target details response:', response);

      if (response.success && response.data) {
        // Backend returns { user, targets, summary, period }
        const detailsData = response.data.targets || [];
        console.log('Setting targets:', detailsData);
        setTargets(detailsData);
        setUser(response.data.user);

        // Use summary from backend if available, otherwise calculate
        if (response.data.summary) {
          setSummary(response.data.summary);
        } else {
          const totalTarget = detailsData.reduce((sum: number, t: any) => sum + t.targetValue, 0);
          const totalActual = detailsData.reduce((sum: number, t: any) => sum + t.actualValue, 0);
          const totalOffers = detailsData.reduce((sum: number, t: any) => sum + (t.actualOfferCount || 0), 0);

          setSummary({
            totalTarget,
            totalActual,
            totalOffers,
            achievement: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0,
            variance: totalActual - totalTarget,
          });
        }
      } else {
        console.error('Invalid response:', response);
        toast.error('Failed to load user target details');
      }
    } catch (error: any) {
      console.error('Error fetching user target details:', error);
      toast.error(error?.response?.data?.error || 'Failed to load user target details');
    } finally {
      setLoading(false);
    }
  };

  const getAchievementColor = (achievement: number) => {
    if (achievement >= 100) return 'bg-green-100 text-green-800';
    if (achievement >= 80) return 'bg-blue-100 text-blue-800';
    if (achievement >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" />
            User Target Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="px-6 py-4 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : targets.length > 0 && summary && user ? (
              <>
                {/* User Header - No Zone Information */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600">User</div>
                      <div className="font-bold text-2xl text-gray-900">{user?.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                        <Mail className="h-4 w-4" />
                        {user?.email}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        📅 Period: {targetPeriod} ({periodType})
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">Overall Achievement</div>
                        <Badge className={getAchievementColor(summary.totalAchievement || 0)}>
                          {(summary.totalAchievement || 0).toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm font-medium text-gray-600 mb-2">Target Value</div>
                    <div className="text-2xl font-bold text-blue-600" title={formatINRFull(summary.totalTargetValue)}>
                      {formatCrLakh(summary.totalTargetValue)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm font-medium text-gray-600 mb-2">Actual Value</div>
                    <div className="text-2xl font-bold text-green-600" title={formatINRFull(summary.totalActualValue)}>
                      {formatCrLakh(summary.totalActualValue)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm font-medium text-gray-600 mb-2">Variance</div>
                    <div className={`text-2xl font-bold flex items-center gap-1 ${
                      (summary.totalActualValue - summary.totalTargetValue) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(summary.totalActualValue - summary.totalTargetValue) >= 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                      <span title={formatINRFull(Math.abs(summary.totalActualValue - summary.totalTargetValue))}>
                        {formatCrLakh(Math.abs(summary.totalActualValue - summary.totalTargetValue))}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm font-medium text-gray-600 mb-2">Total Targets</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {summary.totalTargets}
                    </div>
                  </div>
                </div>

                {/* Product Type Breakdown - Cards */}
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-purple-600" />
                    Product Type Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {targets.map((target, idx) => (
                      <div
                        key={`${target.productType}-${idx}`}
                        className="bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all p-4"
                      >
                        {/* Product Type Header */}
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="outline" className="text-sm">
                            {target.productType || 'All Products'}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {target.actualOfferCount || 0} offers
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {/* Target */}
                          <div className="bg-blue-50 rounded p-2">
                            <div className="text-xs text-blue-700 font-medium mb-1">Target</div>
                            <div className="text-sm font-bold text-blue-900" title={formatINRFull(target.targetValue)}>
                              {formatCrLakh(target.targetValue)}
                            </div>
                          </div>

                          {/* Actual */}
                          <div className="bg-green-50 rounded p-2">
                            <div className="text-xs text-green-700 font-medium mb-1">Actual</div>
                            <div className="text-sm font-bold text-green-900" title={formatINRFull(target.actualValue)}>
                              {formatCrLakh(target.actualValue)}
                            </div>
                          </div>
                        </div>

                        {/* Achievement and Variance */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Achievement */}
                          <div className="bg-purple-50 rounded p-2">
                            <div className="text-xs text-purple-700 font-medium mb-1">Achievement</div>
                            <Badge className={`${getAchievementColor(target.achievement)} text-xs`}>
                              {target.achievement.toFixed(2)}%
                            </Badge>
                          </div>

                          {/* Variance */}
                          <div className={`rounded p-2 ${
                            target.variance >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                          }`}>
                            <div className={`text-xs font-medium mb-1 ${
                              target.variance >= 0 ? 'text-emerald-700' : 'text-red-700'
                            }`}>Variance</div>
                            <div className={`text-xs font-bold flex items-center gap-1 ${
                              target.variance >= 0 ? 'text-emerald-900' : 'text-red-900'
                            }`}>
                              {target.variance >= 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {formatCrLakh(Math.abs(target.variance))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No target details found for this user
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default UserTargetDetailsDialog;
