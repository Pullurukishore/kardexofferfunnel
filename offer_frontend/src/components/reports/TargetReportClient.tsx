'use client';

import React, { useState, useCallback } from 'react';
import { RefreshCw, Target, Eye, TrendingUp, TrendingDown, Users, MapPin, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import UserTargetDetailsDialog from './UserTargetDetailsDialog';
import ZoneTargetDetailsDialog from './ZoneTargetDetailsDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ZoneTarget {
  id: number;
  serviceZoneId: number;
  targetPeriod: string;
  periodType: string;
  productType: string | null;
  targetValue: number;
  targetOfferCount: number | null;
  actualValue: number;
  actualOfferCount: number;
  totalOffers: number;
  achievement: number;
  variance: number;
  variancePercentage: number;
  serviceZone: {
    id: number;
    name: string;
    shortForm: string;
  };
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  updatedBy: {
    id: number;
    name: string;
    email: string;
  };
}

interface UserTarget {
  id: number;
  userId: number;
  targetPeriod: string;
  periodType: string;
  productType: string | null;
  targetValue: number;
  targetOfferCount: number | null;
  actualValue: number;
  actualOfferCount: number;
  totalOffers: number;
  achievement: number;
  variance: number;
  variancePercentage: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    serviceZones: Array<{
      serviceZone: {
        id: number;
        name: string;
      };
    }>;
  };
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  updatedBy: {
    id: number;
    name: string;
    email: string;
  };
}

interface TargetReportClientProps {
  zones: Array<{ id: number; name: string }>;
  isZoneUser: boolean;
}

const TargetReportClient: React.FC<TargetReportClientProps> = ({
  zones,
  isZoneUser,
}) => {
  const [targetPeriod, setTargetPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [periodType, setPeriodType] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [zoneId, setZoneId] = useState<string>('');
  const [zoneTargets, setZoneTargets] = useState<ZoneTarget[]>([]);
  const [userTargets, setUserTargets] = useState<UserTarget[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<{ userId: number; targetPeriod: string; periodType: string } | null>(null);
  const [isZoneDetailsOpen, setIsZoneDetailsOpen] = useState(false);
  const [selectedZoneDetails, setSelectedZoneDetails] = useState<{ zoneId: number; targetPeriod: string; periodType: string } | null>(null);


  const fetchTargetReport = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use same API methods as target pages for consistency
      const params = { 
        targetPeriod: periodType === 'MONTHLY' ? targetPeriod.split('-')[0] : targetPeriod,
        periodType: 'YEARLY', // Always fetch yearly targets
        grouped: 'true',
        ...(periodType === 'MONTHLY' && { actualValuePeriod: targetPeriod })
      };

      // Fetch zone targets
      const zoneResponse = await apiService.getZoneTargets(params);
      let zoneTargetsData = Array.isArray(zoneResponse) ? zoneResponse : (zoneResponse?.targets || []);
      
      // Filter by zone if selected
      if (zoneId && zoneId !== 'all') {
        zoneTargetsData = zoneTargetsData.filter((t: any) => t.serviceZoneId === parseInt(zoneId));
      }

      // Fetch user targets
      const userResponse = await apiService.getUserTargets(params);
      let userTargetsData = Array.isArray(userResponse) ? userResponse : (userResponse?.targets || []);
      
      // Filter by zone if selected
      if (zoneId && zoneId !== 'all') {
        userTargetsData = userTargetsData.filter((t: any) => 
          t.user?.serviceZones?.some?.((sz: any) => sz?.serviceZone?.id === parseInt(zoneId))
        );
      }

      // Backend now handles all monthly calculations when actualValuePeriod is provided
      // No need to apply monthly calculations on frontend

      // Calculate summary - ensure all values are numbers
      const totalZoneTargetValue = zoneTargetsData.reduce((sum: number, t: any) => sum + (Number(t.targetValue) || 0), 0);
      const totalZoneActualValue = zoneTargetsData.reduce((sum: number, t: any) => sum + (Number(t.actualValue) || 0), 0);
      const totalUserTargetValue = userTargetsData.reduce((sum: number, t: any) => sum + (Number(t.targetValue) || 0), 0);
      const totalUserActualValue = userTargetsData.reduce((sum: number, t: any) => sum + (Number(t.actualValue) || 0), 0);

      const summary = {
        totalZoneTargets: zoneTargetsData.length,
        totalZoneTargetValue,
        totalZoneActualValue,
        totalZoneAchievement: totalZoneTargetValue > 0 ? (totalZoneActualValue / totalZoneTargetValue) * 100 : 0,
        totalUserTargets: userTargetsData.length,
        totalUserTargetValue,
        totalUserActualValue,
        totalUserAchievement: totalUserTargetValue > 0 ? (totalUserActualValue / totalUserTargetValue) * 100 : 0,
      };

      setZoneTargets(zoneTargetsData);
      setUserTargets(userTargetsData);
      setSummary(summary);
    } catch (error: any) {
      console.error('Error fetching target report:', error);
      toast.error(error?.response?.data?.error || 'Failed to load target report');
    } finally {
      setLoading(false);
    }
  }, [targetPeriod, periodType, zoneId]);

  // Update filters and auto-generate report
  const handleFilterChange = useCallback((field: 'targetPeriod' | 'periodType' | 'zoneId', value: any) => {
    // Update the specific filter
    if (field === 'targetPeriod') {
      setTargetPeriod(value);
    } else if (field === 'periodType') {
      setPeriodType(value);
      // Reset target period when period type changes
      if (value === 'YEARLY') {
        setTargetPeriod(new Date().getFullYear().toString());
      } else {
        const now = new Date();
        setTargetPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      }
    } else if (field === 'zoneId') {
      setZoneId(value === 'all' ? '' : value);
    }
  }, []);

  // Auto-generate report when filters change
  React.useEffect(() => {
    if (targetPeriod && periodType) {
      fetchTargetReport();
    }
  }, [targetPeriod, periodType, zoneId, fetchTargetReport]);

  const getAchievementColor = (achievement: number) => {
    if (achievement >= 100) return 'bg-green-100 text-green-800';
    if (achievement >= 80) return 'bg-blue-100 text-blue-800';
    if (achievement >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleOpenZoneDetails = useCallback((target: ZoneTarget) => {
    const details = {
      zoneId: target.serviceZoneId,
      targetPeriod: targetPeriod,
      periodType: periodType as 'MONTHLY' | 'YEARLY',
    };
    console.log('Opening Zone Details Dialog with:', details);
    setSelectedZoneDetails(details);
    setIsZoneDetailsOpen(true);
  }, [periodType, targetPeriod]);

  const handleOpenUserDetails = useCallback((target: UserTarget) => {
    const details = {
      userId: target.userId,
      targetPeriod: targetPeriod, // Pass the original period
      periodType: periodType as 'MONTHLY' | 'YEARLY',
    };
    console.log('Opening User Details Dialog with:', details);
    setSelectedUserDetails(details);
    setIsUserDetailsOpen(true);
  }, [periodType, targetPeriod]);

  return (
    <>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Target className="h-8 w-8 text-orange-600" />
              Target Report
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Zone and user target performance analysis
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              Report Type: <span className="font-medium">Target Report</span>
            </div>
            {summary && (
              <div className="text-xs sm:text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                ✓ Generated
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Generation Controls */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Report Filters</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1">
                Configure your target report parameters
              </CardDescription>
            </div>
            <Button 
              onClick={fetchTargetReport} 
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              <BarChart3 className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Target Period</Label>
              <input
                type={periodType === 'MONTHLY' ? 'month' : 'number'}
                value={periodType === 'MONTHLY' ? targetPeriod : targetPeriod.split('-')[0]}
                onChange={(e) => {
                  const value = e.target.value;
                  if (periodType === 'MONTHLY') {
                    handleFilterChange('targetPeriod', value);
                  } else {
                    handleFilterChange('targetPeriod', value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label>Period Type</Label>
              <Select value={periodType} onValueChange={(v: 'MONTHLY' | 'YEARLY') => {
                handleFilterChange('periodType', v);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isZoneUser && (
              <div className="space-y-2">
                <Label>Zone</Label>
                <Select value={zoneId || 'all'} onValueChange={(value) => handleFilterChange('zoneId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Zones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id.toString()}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {summary && (zoneTargets.length > 0 || userTargets.length > 0) ? (
        <div className="space-y-6">
          {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Zone Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{summary.totalZoneTargets || 0}</div>
              <div className="text-sm text-gray-500 mt-1">
                Achievement: {summary.totalZoneAchievement?.toFixed(2) || 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Zone Target Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ₹{((summary.totalZoneTargetValue || 0) / 100000).toFixed(2)}L
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Actual: ₹{((summary.totalZoneActualValue || 0) / 100000).toFixed(2)}L
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">User Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{summary.totalUserTargets || 0}</div>
              <div className="text-sm text-gray-500 mt-1">
                Achievement: {summary.totalUserAchievement?.toFixed(2) || 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">User Target Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ₹{((summary.totalUserTargetValue || 0) / 100000).toFixed(2)}L
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Actual: ₹{((summary.totalUserActualValue || 0) / 100000).toFixed(2)}L
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone Targets Table */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Zone Targets ({zoneTargets.length})</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Zone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product Type</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Target</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actual</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Achievement</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Expected Ach %</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Variance</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {zoneTargets.map((target: any, idx: number) => (
                    <tr key={`zone-${target.serviceZoneId}-${idx}`} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                          <span className="font-semibold text-gray-900">{target.serviceZone?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{target.productType || 'Overall'}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">₹{(target.targetValue / 100000).toFixed(2)}L</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-700">₹{(target.actualValue / 100000).toFixed(2)}L</td>
                      <td className="px-4 py-3 text-right">
                        <Badge className={`${getAchievementColor(target.achievement)} text-xs font-bold`}>
                          {target.achievement.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge className={`${getAchievementColor(target.expectedAchievement)} text-xs font-bold`}>
                          {target.expectedAchievement?.toFixed(1) || 0}%
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold flex items-center justify-end gap-1 ${
                        target.variance >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {target.variance >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        ₹{(Math.abs(target.variance) / 100000).toFixed(2)}L
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleOpenZoneDetails(target)}
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded inline-flex items-center justify-center"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {zoneTargets.length === 0 && (
              <div className="px-6 py-12 text-center">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No zone targets found</p>
              </div>
            )}
          </div>
        </div>

        {/* User Targets Table */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Zone User Targets ({userTargets.length})</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-pink-100 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Zone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product Type</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Target</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actual</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Achievement</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Expected Ach %</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Variance</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userTargets.map((target: any, idx: number) => (
                    <tr key={`user-${target.userId}-${idx}`} className="hover:bg-purple-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                          <div>
                            <div className="font-semibold text-gray-900">{target.user?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{target.user?.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {target.user?.serviceZones?.length > 0 
                          ? target.user.serviceZones.map((sz: any) => sz.serviceZone?.name).join(', ')
                          : 'N/A'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{target.productType || 'Overall'}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">₹{(target.targetValue / 100000).toFixed(2)}L</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-700">₹{(target.actualValue / 100000).toFixed(2)}L</td>
                      <td className="px-4 py-3 text-right">
                        <Badge className={`${getAchievementColor(target.achievement)} text-xs font-bold`}>
                          {target.achievement.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge className={`${getAchievementColor(target.expectedAchievement)} text-xs font-bold`}>
                          {target.expectedAchievement?.toFixed(1) || 0}%
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold flex items-center justify-end gap-1 ${
                        target.variance >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {target.variance >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        ₹{(Math.abs(target.variance) / 100000).toFixed(2)}L
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleOpenUserDetails(target)}
                          className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-100 hover:text-purple-700 rounded inline-flex items-center justify-center"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {userTargets.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No user targets found</p>
              </div>
            )}
          </div>
        </div>

        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-500 mb-4">
              Select your target report parameters and click "Generate Report" to view analytics
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {selectedUserDetails && (
        <UserTargetDetailsDialog
          open={isUserDetailsOpen}
          onClose={() => {
            setIsUserDetailsOpen(false);
            setSelectedUserDetails(null);
          }}
          userId={selectedUserDetails.userId}
          targetPeriod={selectedUserDetails.targetPeriod}
          periodType={selectedUserDetails.periodType as 'MONTHLY' | 'YEARLY'}
        />
      )}
      {selectedZoneDetails && (
        <ZoneTargetDetailsDialog
          open={isZoneDetailsOpen}
          onClose={() => {
            setIsZoneDetailsOpen(false);
            setSelectedZoneDetails(null);
          }}
          zoneId={selectedZoneDetails.zoneId}
          targetPeriod={selectedZoneDetails.targetPeriod}
          periodType={selectedZoneDetails.periodType as 'MONTHLY' | 'YEARLY'}
        />
      )}
    </>
  );
};

export default TargetReportClient;

