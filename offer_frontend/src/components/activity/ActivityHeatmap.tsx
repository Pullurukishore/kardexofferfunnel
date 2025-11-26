'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';

interface HeatmapData {
  date: string;
  hour: number;
  activity_count: number;
}

interface ActivityHeatmapProps {
  className?: string;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ className }) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('30');
  const [view, setView] = useState<'calendar' | 'hourly'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchHeatmapData();
  }, [timeframe]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getActivityHeatmap({ days: timeframe });
      setHeatmapData(response.heatmap || []);
    } catch (err) {
      console.error('Failed to fetch heatmap data:', err);
      setError('Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  };

  // Process data for calendar view
  const getCalendarData = () => {
    const dataMap = new Map<string, number>();
    
    heatmapData.forEach(item => {
      const date = new Date(item.date).toISOString().split('T')[0];
      const currentCount = dataMap.get(date) || 0;
      dataMap.set(date, currentCount + item.activity_count);
    });

    return dataMap;
  };

  // Get color intensity based on activity count
  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count <= 5) return 'bg-green-200';
    if (count <= 10) return 'bg-green-300';
    if (count <= 20) return 'bg-yellow-300';
    if (count <= 50) return 'bg-orange-400';
    return 'bg-red-500';
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const daysBack = parseInt(timeframe);
    const startDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    return days;
  };

  // Get hourly data for selected date
  const getHourlyData = (date: string) => {
    return heatmapData
      .filter(item => new Date(item.date).toISOString().split('T')[0] === date)
      .sort((a, b) => a.hour - b.hour);
  };

  const calendarData = getCalendarData();
  const calendarDays = generateCalendarDays();
  const maxActivity = Math.max(...Array.from(calendarData.values()), 0);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
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
            <Calendar className="h-5 w-5 text-orange-600" />
            Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
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
            <Calendar className="h-5 w-5 text-orange-600" />
            Activity Heatmap
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={view === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('calendar')}
            >
              Calendar
            </Button>
            <Button
              variant={view === 'hourly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('hourly')}
            >
              Hourly
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {view === 'calendar' ? (
          <div className="space-y-4">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((date, index) => {
                const dateStr = date.toISOString().split('T')[0];
                const count = calendarData.get(dateStr) || 0;
                const isSelected = selectedDate === dateStr;
                
                return (
                  <div
                    key={dateStr}
                    className={`
                      aspect-square rounded-sm cursor-pointer transition-all duration-200 hover:scale-110
                      ${getIntensityColor(count)}
                      ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    `}
                    onClick={() => setSelectedDate(dateStr)}
                    title={`${dateStr}: ${count} activities`}
                  >
                    <div className="p-1">
                      <div className="text-xs font-medium">
                        {date.getDate()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
                  <div className="w-3 h-3 bg-yellow-300 rounded-sm"></div>
                  <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                </div>
                <span className="text-xs text-gray-600">More</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Max: {maxActivity} activities
              </Badge>
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-900">
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h4>
                  <Badge variant="outline" className="text-blue-700">
                    {calendarData.get(selectedDate) || 0} activities
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {getHourlyData(selectedDate).map(item => (
                    <div key={item.hour} className="text-center p-2 bg-white rounded border">
                      <div className="text-xs text-gray-600">{item.hour}:00</div>
                      <div className="text-sm font-semibold text-blue-700">{item.activity_count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hourly Activity Chart */}
            <div className="grid grid-cols-12 gap-1">
              {Array.from({ length: 24 }, (_, i) => {
                const hourData = heatmapData.filter(item => item.hour === i);
                const total = hourData.reduce((sum, item) => sum + item.activity_count, 0);
                
                return (
                  <div key={i} className="text-center">
                    <div
                      className={`
                        h-20 rounded-sm transition-all duration-200 hover:scale-105
                        ${getIntensityColor(total)}
                      `}
                      title={`${i}:00 - ${total} activities`}
                    >
                      <div className="flex items-end justify-center h-full pb-1">
                        <span className="text-xs font-medium">
                          {total > 0 ? total : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{i}</div>
                  </div>
                );
              })}
            </div>

            {/* Peak Hours Summary */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-900">Peak Activity Hours</span>
              </div>
              <div className="flex gap-2">
                {heatmapData
                  .reduce((acc: any[], item) => {
                    const existing = acc.find(a => a.hour === item.hour);
                    if (existing) {
                      existing.count += item.activity_count;
                    } else {
                      acc.push({ hour: item.hour, count: item.activity_count });
                    }
                    return acc;
                  }, [])
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 3)
                  .map(item => (
                    <Badge key={item.hour} variant="secondary" className="bg-orange-100 text-orange-800">
                      {item.hour}:00 ({item.count})
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityHeatmap;
