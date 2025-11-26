'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Grid3X3, 
  Users, 
  Building, 
  Target, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { apiService } from '@/services/api';

interface EntityStats {
  entityType: string;
  total: number;
  actions: Record<string, number>;
}

interface EntityPerformanceMatrixProps {
  className?: string;
}

const EntityPerformanceMatrix: React.FC<EntityPerformanceMatrixProps> = ({ className }) => {
  const [entityData, setEntityData] = useState<EntityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('30');

  useEffect(() => {
    fetchEntityData();
  }, [timeframe]);

  const fetchEntityData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getActivityByEntity({ timeframe });
      setEntityData(
        Object.entries(response.entityStats || {}).map(([entityType, stats]: [string, any]) => ({
          entityType,
          total: stats.total,
          actions: stats.actions
        }))
      );
    } catch (err) {
      console.error('Failed to fetch entity data:', err);
      setError('Failed to load entity performance data');
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'offer':
        return <Package className="h-5 w-5" />;
      case 'user':
        return <Users className="h-5 w-5" />;
      case 'customer':
        return <Building className="h-5 w-5" />;
      case 'target':
        return <Target className="h-5 w-5" />;
      default:
        return <Grid3X3 className="h-5 w-5" />;
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'offer':
        return 'from-blue-500 to-blue-600';
      case 'user':
        return 'from-purple-500 to-purple-600';
      case 'customer':
        return 'from-green-500 to-green-600';
      case 'target':
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('CREATED')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE') || action.includes('UPDATED')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE') || action.includes('DELETED')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const getPerformanceLevel = (total: number) => {
    if (total >= 1000) return { level: 'Very High', color: 'bg-green-500', textColor: 'text-green-700' };
    if (total >= 500) return { level: 'High', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (total >= 100) return { level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: 'Low', color: 'bg-gray-400', textColor: 'text-gray-700' };
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-purple-600" />
            Entity Performance Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
            <Grid3X3 className="h-5 w-5 text-purple-600" />
            Entity Performance Matrix
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

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-purple-600" />
            Entity Performance Matrix
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
          {/* Entity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {entityData.map((entity) => {
              const performance = getPerformanceLevel(entity.total);
              const isSelected = selectedEntity === entity.entityType;
              
              return (
                <Card
                  key={entity.entityType}
                  className={`
                    cursor-pointer transition-all duration-200 hover:shadow-lg
                    ${isSelected ? 'ring-2 ring-purple-500' : ''}
                  `}
                  onClick={() => setSelectedEntity(isSelected ? null : entity.entityType)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${getEntityColor(entity.entityType)} text-white`}>
                        {getEntityIcon(entity.entityType)}
                      </div>
                      <Badge variant="secondary" className={performance.textColor}>
                        {performance.level}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-lg capitalize mb-2">
                      {entity.entityType}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Activities</span>
                        <span className="font-bold text-lg">{entity.total.toLocaleString()}</span>
                      </div>
                      
                      <Progress 
                        value={Math.min((entity.total / 1000) * 100, 100)} 
                        className="h-2"
                      />
                      
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {Object.entries(entity.actions)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 3)
                            .map(([action]) => (
                              <div
                                key={action}
                                className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${getActionColor(action)}`}
                                title={action}
                              >
                                {action[0]}
                              </div>
                            ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {Object.keys(entity.actions).length} actions
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Selected Entity Details */}
          {selectedEntity && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    {getEntityIcon(selectedEntity)}
                    <span className="capitalize">{selectedEntity} Details</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEntity(null)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const entity = entityData.find(e => e.entityType === selectedEntity);
                  if (!entity) return null;
                  
                  return (
                    <div className="space-y-4">
                      {/* Action Breakdown */}
                      <div>
                        <h4 className="font-semibold text-purple-900 mb-3">Action Breakdown</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(entity.actions)
                            .sort(([,a], [,b]) => b - a)
                            .map(([action, count]) => (
                              <div
                                key={action}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge className={getActionColor(action)}>
                                    {action}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{count.toLocaleString()}</span>
                                  <div className="text-xs text-gray-500">
                                    {((count / entity.total) * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div>
                        <h4 className="font-semibold text-purple-900 mb-3">Performance Metrics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {entity.total.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">Total Activities</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {Object.keys(entity.actions).length}
                            </div>
                            <div className="text-sm text-gray-600">Action Types</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {Math.round(entity.total / parseInt(timeframe))}
                            </div>
                            <div className="text-sm text-gray-600">Daily Average</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                              {Math.max(...Object.values(entity.actions))}
                            </div>
                            <div className="text-sm text-gray-600">Peak Action</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">Most Active Entity</span>
                </div>
                <div className="text-2xl font-bold text-purple-700 capitalize">
                  {entityData.reduce((max, entity) => 
                    entity.total > max.total ? entity : max, 
                    entityData[0]
                  )?.entityType || 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Total Activities</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {entityData.reduce((sum, entity) => sum + entity.total, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">Entities Tracked</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {entityData.length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntityPerformanceMatrix;
