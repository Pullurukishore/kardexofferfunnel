import { DashboardLayout } from '@/components/DashboardLayout';
import { getAdminDashboardData } from '@/lib/server/dashboard';
import AdminDashboardClient from '@/components/dashboard/AdminDashboardClient';

// Disable caching for this page to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard() {
  // Server-side data fetching
  const dashboardData = await getAdminDashboardData();

  return (
    <DashboardLayout title="Admin Dashboard" role="ADMIN">
      <AdminDashboardClient 
        initialStats={dashboardData.stats}
        initialRecentOffers={dashboardData.recentOffers || []}
      />
    </DashboardLayout>
  );
}
