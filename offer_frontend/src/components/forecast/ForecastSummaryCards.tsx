'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Percent, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react'

interface ForecastAnalytics {
  totalForecastOffers: number
  totalActualOffers: number
  forecastValue: number
  actualValue: number
  winRate: number
  conversionRate: number
  avgDealSize: number
}

interface ForecastSummaryCardsProps {
  analytics: ForecastAnalytics
  totals: {
    annualForecast: number
    annualActual: number
    variance: number
    achievement: number
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`
}

const getAchievementColor = (value: number) => {
  if (value >= 100) return 'text-emerald-700 bg-emerald-50'
  if (value >= 80) return 'text-blue-700 bg-blue-50'
  if (value >= 60) return 'text-amber-700 bg-amber-50'
  return 'text-rose-700 bg-rose-50'
}

const getTrendIcon = (value: number) => {
  if (value > 0) return <ArrowUpRight className="h-4 w-4 text-emerald-600" />
  if (value < 0) return <ArrowDownRight className="h-4 w-4 text-rose-600" />
  return null
}

export function ForecastSummaryCards({ analytics, totals }: ForecastSummaryCardsProps) {
  const cards = [
    {
      title: 'Forecast Value',
      value: formatCurrency(analytics.forecastValue),
      subtitle: `${analytics.totalForecastOffers} offers`,
      icon: Target,
      color: 'from-blue-50 to-blue-100',
      iconColor: 'from-blue-400 to-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Actual Value',
      value: formatCurrency(analytics.actualValue),
      subtitle: `${analytics.totalActualOffers} won`,
      icon: DollarSign,
      color: 'from-emerald-50 to-emerald-100',
      iconColor: 'from-emerald-400 to-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Win Rate',
      value: formatPercent(analytics.winRate),
      subtitle: 'Forecast to Actual',
      icon: Percent,
      color: 'from-purple-50 to-purple-100',
      iconColor: 'from-purple-400 to-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Conversion Rate',
      value: formatPercent(analytics.conversionRate),
      subtitle: 'Value conversion',
      icon: TrendingUp,
      color: 'from-amber-50 to-amber-100',
      iconColor: 'from-amber-400 to-amber-600',
      borderColor: 'border-amber-200'
    },
    {
      title: 'Avg Deal Size',
      value: formatCurrency(analytics.avgDealSize),
      subtitle: 'Per won offer',
      icon: BarChart3,
      color: 'from-rose-50 to-rose-100',
      iconColor: 'from-rose-400 to-rose-600',
      borderColor: 'border-rose-200'
    },
    {
      title: 'Annual Achievement',
      value: formatPercent(totals.achievement),
      subtitle: `Variance: ${formatCurrency(totals.variance)}`,
      icon: Activity,
      color: getAchievementColor(totals.achievement).includes('emerald') ? 'from-emerald-50 to-emerald-100' :
            getAchievementColor(totals.achievement).includes('blue') ? 'from-blue-50 to-blue-100' :
            getAchievementColor(totals.achievement).includes('amber') ? 'from-amber-50 to-amber-100' :
            'from-rose-50 to-rose-100',
      iconColor: getAchievementColor(totals.achievement).includes('emerald') ? 'from-emerald-400 to-emerald-600' :
                getAchievementColor(totals.achievement).includes('blue') ? 'from-blue-400 to-blue-600' :
                getAchievementColor(totals.achievement).includes('amber') ? 'from-amber-400 to-amber-600' :
                'from-rose-400 to-rose-600',
      borderColor: getAchievementColor(totals.achievement).includes('emerald') ? 'border-emerald-200' :
                getAchievementColor(totals.achievement).includes('blue') ? 'border-blue-200' :
                getAchievementColor(totals.achievement).includes('amber') ? 'border-amber-200' :
                'border-rose-200'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card 
            key={index} 
            className={`relative overflow-hidden border-2 ${card.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-50 group-hover:opacity-75 transition-opacity`} />
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.iconColor} shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                {card.title === 'Annual Achievement' && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon(totals.variance)}
                  </div>
                )}
              </div>
              <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="space-y-1">
                <p className="text-2xl font-black text-gray-900 leading-tight">
                  {card.value}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  {card.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
