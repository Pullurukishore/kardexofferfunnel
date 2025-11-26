'use client'

import ZoneManagerDashboardClient from './ZoneManagerDashboardClient'

interface ZoneUserDashboardClientProps {
  dashboardData: any;
}

// Zone user dashboard uses the same component as zone manager
// since they display the same data structure
export default function ZoneUserDashboardClient({ dashboardData }: ZoneUserDashboardClientProps) {
  return <ZoneManagerDashboardClient dashboardData={dashboardData} />
}
