'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Globe, 
  Activity,
  Eye,
  Clock,
  Ban,
  AlertCircle,
  TrendingUp,
  Wifi
} from 'lucide-react';
import { apiService } from '@/services/api';

interface SecurityAlert {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  suspiciousActivities: any[];
  failedLogins: any[];
  unusualIPs: any[];
  bulkOperations: any[];
  offHoursActivities: any[];
  summary: {
    totalAlerts: number;
    uniqueIPs: number;
    uniqueUsers: number;
  };
}

interface SecurityMonitorProps {
  className?: string;
}

const SecurityMonitor: React.FC<SecurityMonitorProps> = ({ className }) => {
  const [securityData, setSecurityData] = useState<SecurityAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('7');
  const [selectedAlertType, setSelectedAlertType] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurityData();
  }, [timeframe]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getSecurityAlerts({ timeframe });
      setSecurityData(response.securityAlerts);
    } catch (err) {
      console.error('Failed to fetch security data:', err);
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'from-red-500 to-red-600';
      case 'MEDIUM':
        return 'from-orange-500 to-orange-600';
      case 'LOW':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'bg-orange-50 border-orange-200';
      case 'LOW':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'suspicious':
        return <AlertTriangle className="h-4 w-4" />;
      case 'failed':
        return <Ban className="h-4 w-4" />;
      case 'ip':
        return <Globe className="h-4 w-4" />;
      case 'bulk':
        return <Activity className="h-4 w-4" />;
      case 'offhours':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertData = (type: string) => {
    if (!securityData) return [];
    
    switch (type) {
      case 'suspicious':
        return securityData.suspiciousActivities;
      case 'failed':
        return securityData.failedLogins;
      case 'ip':
        return securityData.unusualIPs;
      case 'bulk':
        return securityData.bulkOperations;
      case 'offhours':
        return securityData.offHoursActivities;
      default:
        return [];
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-600">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!securityData) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Security Monitor
          </CardTitle>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Risk Score Card */}
          <Card className={getRiskBgColor(securityData.riskLevel)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${getRiskColor(securityData.riskLevel)} text-white`}>
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Risk Assessment</h3>
                    <p className="text-sm opacity-75">Overall security risk level</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{securityData.riskScore}</div>
                  <Badge 
                    className={`bg-gradient-to-r ${getRiskColor(securityData.riskLevel)} text-white`}
                  >
                    {securityData.riskLevel}
                  </Badge>
                </div>
              </div>
              <Progress 
                value={securityData.riskScore} 
                className="mt-4 h-3"
              />
            </CardContent>
          </Card>

          {/* Alert Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-900">Total Alerts</span>
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {securityData.summary.totalAlerts}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">Unique IPs</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {securityData.summary.uniqueIPs}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Affected Users</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {securityData.summary.uniqueUsers}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert Type Selection */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'suspicious', label: 'Suspicious Activities', count: securityData.suspiciousActivities.length },
              { key: 'failed', label: 'Failed Logins', count: securityData.failedLogins.length },
              { key: 'ip', label: 'Unusual IPs', count: securityData.unusualIPs.length },
              { key: 'bulk', label: 'Bulk Operations', count: securityData.bulkOperations.length },
              { key: 'offhours', label: 'Off-Hours Activity', count: securityData.offHoursActivities.length }
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                variant={selectedAlertType === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedAlertType(selectedAlertType === key ? null : key)}
                className="flex items-center gap-2"
              >
                {getAlertIcon(key)}
                {label}
                <Badge variant="secondary">{count}</Badge>
              </Button>
            ))}
          </div>

          {/* Alert Details */}
          {selectedAlertType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                  {getAlertIcon(selectedAlertType)}
                  {selectedAlertType === 'suspicious' && 'Suspicious Activities'}
                  {selectedAlertType === 'failed' && 'Failed Login Attempts'}
                  {selectedAlertType === 'ip' && 'Unusual IP Addresses'}
                  {selectedAlertType === 'bulk' && 'Bulk Operations'}
                  {selectedAlertType === 'offhours' && 'Off-Hours Activities'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getAlertData(selectedAlertType).map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {alert.user && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{alert.user.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {alert.user.role}
                            </Badge>
                          </div>
                        )}
                        {selectedAlertType === 'ip' && (
                          <div className="flex items-center gap-2">
                            <Wifi className="h-4 w-4 text-gray-500" />
                            <span className="font-mono">{alert.ipAddress}</span>
                            <Badge variant="outline" className="text-xs">
                              {alert.count} requests
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {formatTimeAgo(alert.createdAt || alert.lastSeen)}
                      </div>
                    </div>
                  ))}
                  
                  {getAlertData(selectedAlertType).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No alerts of this type in the selected timeframe
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Recommendations */}
          {securityData.riskLevel === 'HIGH' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>High risk detected!</strong> Consider reviewing unusual activities, 
                implementing additional security measures, and monitoring affected user accounts.
              </AlertDescription>
            </Alert>
          )}

          {securityData.riskLevel === 'MEDIUM' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Moderate risk level.</strong> Some unusual activities detected. 
                Continue monitoring and consider security policy reviews.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityMonitor;
