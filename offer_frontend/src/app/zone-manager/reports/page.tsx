import { Suspense } from 'react';
import ReportsClient from '@/components/reports/ReportsClient';
import type { ReportFilters } from '@/types/reports';
import { subDays } from 'date-fns';
import { getCurrentUser, getZones, getCustomers } from '@/lib/server/reports';

export default async function ZoneManagerReportsPage() {
  const user = await getCurrentUser();

  let zoneId: number | null = null;
  if (user?.zoneId) zoneId = Number(user.zoneId);
  if (!zoneId && typeof user?.serviceZoneId === 'number') zoneId = user?.serviceZoneId ?? null;
  if (!zoneId && Array.isArray(user?.serviceZones) && user!.serviceZones.length > 0) {
    for (const sz of user!.serviceZones) {
      const nestedId = (sz as any)?.serviceZone?.id as number | undefined;
      const flatId = (sz as any)?.id as number | undefined;
      if (nestedId) { zoneId = nestedId; break; }
      if (flatId) { zoneId = flatId; break; }
    }
  }

  const allZones = await getZones();
  let myZone = zoneId ? allZones.find(z => z.id === zoneId || z.id?.toString() === zoneId?.toString()) : undefined;
  
  // If zone not found in allZones, try to get it from user's serviceZones first
  if (!myZone && user?.serviceZones && Array.isArray(user.serviceZones)) {
    for (const sz of user.serviceZones) {
      const zone = (sz as any)?.serviceZone;
      if (zone?.id === zoneId || zone?.id?.toString() === zoneId?.toString()) {
        myZone = { id: zone.id, name: zone.name || `Zone ${zoneId}` };
        break;
      }
    }
  }
  
  // If still not found, try to get zone name from user's zones array (if it exists)
  if (!myZone && user?.zones && Array.isArray(user.zones)) {
    for (const zone of user.zones) {
      if (zone?.id === zoneId || zone?.id?.toString() === zoneId?.toString()) {
        myZone = { id: zone.id, name: zone.name || `Zone ${zoneId}` };
        break;
      }
    }
  }
  
  const zones = myZone ? [myZone] : (zoneId ? [{ id: zoneId, name: `Zone ${zoneId}` }] : []);

  const customers = await getCustomers(zoneId ? String(zoneId) : undefined);

  if (!zoneId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Zone not assigned to your account. Please contact admin to assign a service zone to view reports.
        </div>
      </div>
    );
  }

  const initialFilters: ReportFilters = {
    dateRange: {
      from: subDays(new Date(), 90),
      to: new Date(),
    },
    reportType: 'offer-summary',
    zoneId: zoneId ? String(zoneId) : undefined,
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Suspense fallback={<div>Loading reports...</div>}>
        <ReportsClient
          initialFilters={initialFilters}
          initialReportData={null}
          zones={zones}
          customers={customers}
          isZoneUser={true}
        />
      </Suspense>
    </div>
  );
}

