import ReportsClient from '@/components/reports/ReportsClient';
import type { ReportFilters } from '@/types/reports';
import { subDays } from 'date-fns';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  const initialFilters: ReportFilters = {
    dateRange: {
      from: subDays(new Date(), 90),
      to: new Date(),
    },
    reportType: 'offer-summary', // Default, but user can change it
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <ReportsClient
        initialFilters={initialFilters}
        initialReportData={null}
        zones={[]}
        customers={[]}
        isZoneUser={false}
      />
    </div>
  );
}

