export interface DateRange {
  from: Date;
  to: Date;
}

export interface ReportFilters {
  dateRange: DateRange | undefined;
  zoneId?: string;
  reportType: string;
  customerId?: string;
  productType?: string;
  stage?: string;
  search?: string;
  // Target report specific filters
  targetPeriod?: string;
  periodType?: 'MONTHLY' | 'YEARLY';
}

export interface ReportData {
  summary: any;
  statusDistribution?: Record<string, number>;
  stageDistribution?: Record<string, number>;
  priorityDistribution?: Record<string, number>;
  productTypeDistribution?: Record<string, number>;
  zonePerformance?: Array<{
    zoneId: number;
    zoneName: string;
    count: number;
    offerValue: number;
    poValue: number;
  }>;
  customerPerformance?: Array<{
    customerId: number;
    customerName: string;
    count: number;
    offerValue: number;
    poValue: number;
  }>;
  assigneePerformance?: Array<{
    assigneeId: number;
    assigneeName: string;
    count: number;
    offerValue: number;
  }>;
  dailyTrends?: Array<{
    date: string;
    created: number;
    won: number;
    lost: number;
    quoted: number;
  }>;
  recentOffers?: Array<{
    id: number;
    offerReferenceNumber: string;
    title: string | null;
    status: string;
    stage: string;
    priority: string | null;
    productType: string | null;
    offerValue: number;
    customerName: string;
    zoneName: string;
    assigneeName: string;
    createdAt: Date;
  }>;
  // Zone Performance Report
  zones?: Array<{
    zoneId: number;
    zoneName: string;
    totalOffers: number;
    activeOffers: number;
    wonOffers: number;
    lostOffers: number;
    totalValue: number;
    wonValue: number;
    avgOfferValue: number;
    winRate: number;
    totalUsers: number;
    totalCustomers: number;
  }>;
  // User Productivity Report
  users?: Array<{
    userId: number;
    userName: string;
    email: string;
    role: string;
    zones: string[];
    createdOffersCount: number;
    assignedOffersCount: number;
    totalOffers: number;
    wonOffers: number;
    lostOffers: number;
    totalValue: number;
    wonValue: number;
    winRate: number;
  }>;
  // Customer Analysis Report
  customers?: Array<{
    customerId: number;
    customerName: string;
    location: string | null;
    industry: string | null;
    zoneName: string;
    totalOffers: number;
    activeOffers: number;
    wonOffers: number;
    lostOffers: number;
    totalValue: number;
    wonValue: number;
    avgOfferValue: number;
    winRate: number;
  }>;
  // Product Type Analysis Report
  productTypes?: Array<{
    productType: string;
    totalOffers: number;
    activeOffers: number;
    wonOffers: number;
    lostOffers: number;
    totalValue: number;
    wonValue: number;
    avgOfferValue: number;
    winRate: number;
  }>;
  // Executive Summary Report
  offerSummary?: {
    totalOffers: number;
    wonOffers: number;
    lostOffers: number;
    activeOffers: number;
    totalValue: number;
    wonValue: number;
    winRate: number;
  };
  zoneSummary?: Array<{
    zoneName: string;
    offerCount: number;
    totalValue: number;
  }>;
  userSummary?: Array<{
    userName: string;
    offerCount: number;
    totalValue: number;
  }>;
  customerSummary?: Array<{
    customerName: string;
    offerCount: number;
    totalValue: number;
  }>;
  productSummary?: Array<{
    productType: string;
    offerCount: number;
    totalValue: number;
  }>;
  dateRange?: {
    from: string;
    to: string;
    days: number;
  };
}

export interface ReportType {
  value: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export interface Zone {
  id: number;
  name: string;
}

export interface Customer {
  id: number;
  companyName: string;
}

export const REPORT_TYPES: ReportType[] = [
  {
    value: 'offer-summary',
    label: 'Offer Summary Report',
    description: 'Comprehensive offer analytics with status, stage, priority trends, daily trends, top customers, and detailed offer information',
    icon: 'FileText',
    color: 'from-blue-500 to-blue-600',
  },
  {
    value: 'target-report',
    label: 'Target Report',
    description: 'Complete target performance analysis showing zone targets and user targets with actual performance, achievement rates, and variance analysis',
    icon: 'Target',
    color: 'from-orange-500 to-orange-600',
  },
  {
    value: 'product-type-analysis',
    label: 'Product Type Analysis',
    description: 'Performance metrics by product type including win rates, revenue, and conversion analysis',
    icon: 'Package',
    color: 'from-purple-500 to-purple-600',
  },
  {
    value: 'customer-performance',
    label: 'Customer Performance',
    description: 'Customer-wise performance analysis with revenue, win rates, and deal metrics',
    icon: 'Users',
    color: 'from-green-500 to-green-600',
  },
];

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

export const PRIORITY_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#7C3AED',
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#9CA3AF',
  OPEN: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  QUOTED: '#8B5CF6',
  NEGOTIATION: '#F97316',
  WON: '#10B981',
  LOST: '#EF4444',
  ON_HOLD: '#6B7280',
  CANCELLED: '#9CA3AF',
};

export const STAGE_COLORS: Record<string, string> = {
  INITIAL: '#3B82F6',
  PROPOSAL_SENT: '#8B5CF6',
  NEGOTIATION: '#F59E0B',
  FINAL_APPROVAL: '#F97316',
  PO_RECEIVED: '#06B6D4',
  ORDER_BOOKED: '#14B8A6',
  WON: '#10B981',
  LOST: '#EF4444',
};

export const PRODUCT_TYPE_COLORS: Record<string, string> = {
  RELOCATION: '#3B82F6',
  CONTRACT: '#10B981',
  SPP: '#F59E0B',
  UPGRADE_KIT: '#8B5CF6',
  SOFTWARE: '#06B6D4',
};

// Comprehensive Dashboard Types
export interface ComprehensiveDashboardData {
  summary: {
    totalOffers: number;
    totalOfferValue: number;
    totalOrdersReceived: number;
    totalOrderBooking: number;
    hitRate: number;
  };
  zoneData: Array<{
    zone: string;
    totalOffers: number;
    offerValue: number;
    ordersReceived: number;
    openFunnel: number;
    orderBooking: number;
    budgetFor2025: number;
    relativeRU: number;
    bookingPercentage: number;
  }>;
  monthData: Array<{
    monthName: string;
    totalOffers: number;
    offerValue: number;
    ordersReceived: number;
    orderBooking: number;
    ruTarget: number;
    devOnRuTarget: number;
    offerRuTarget: number;
    devOfferVsBooked: number;
    offerRuTarget2: number;
    devOfferVsBooked2: number;
  }>;
  productTypeData: Array<{
    productType: string;
    offerValue: number;
    count: number;
  }>;
  zoneOfferValues: Array<{
    zone: string;
    value: number;
  }>;
  monthZoneData: Array<{
    month: string;
    [key: string]: number | string;
  }>;
  filters: {
    zones: Array<{ id: number; name: string }>;
    users: Array<{ id: number; name: string }>;
    productTypes: string[];
  };
}
