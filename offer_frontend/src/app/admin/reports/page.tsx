import { Suspense } from 'react';
import ReportsClient from '@/components/reports/ReportsClient';
import type { ReportFilters } from '@/types/reports';
import { subDays } from 'date-fns';
import { getZones, getCustomers } from '@/lib/server/reports';

export default async function ReportsPage() {
  const [zones, customers] = await Promise.all([
    getZones(),
    getCustomers(),
  ]);

  const initialFilters: ReportFilters = {
    dateRange: {
      from: subDays(new Date(), 90),
      to: new Date(),
    },
    reportType: 'offer-summary', // Default, but user can change it
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Suspense fallback={<div>Loading reports...</div>}>
        <ReportsClient
          initialFilters={initialFilters}
          initialReportData={null}
          zones={zones}
          customers={customers}
          isZoneUser={false}
        />
      </Suspense>
    </div>
  );
}

