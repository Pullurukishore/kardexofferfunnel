import React from 'react'
import UnifiedDashboardClient from '@/components/dashboard/UnifiedDashboardClient'

// Disable caching for this page to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ZoneUserDashboard() {
  return <UnifiedDashboardClient mode="zoneUser" />
}
