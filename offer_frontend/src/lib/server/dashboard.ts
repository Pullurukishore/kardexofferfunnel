import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

async function getAuthToken() {
  const cookieStore = cookies();
  return cookieStore.get('token')?.value || 
         cookieStore.get('accessToken')?.value || 
         '';
}

export async function getAdminDashboardData(params?: any) {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_URL}/dashboard/admin`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch admin dashboard:', response.status);
      return {
        stats: {
          totalOffers: 0,
          openOffers: 0,
          wonOffers: 0,
          totalValue: 0,
          wonValue: 0,
          winRate: '0%',
        },
        recentOffers: [],
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return {
      stats: {
        totalOffers: 0,
        openOffers: 0,
        wonOffers: 0,
        totalValue: 0,
        wonValue: 0,
        winRate: '0%',
      },
      recentOffers: [],
    };
  }
}

export async function getZoneDashboardData(params?: any) {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_URL}/dashboard/zone`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch zone dashboard:', response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching zone dashboard:', error);
    return null;
  }
}

export async function getZoneManagerDashboardData(params?: any) {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_URL}/dashboard/zone-manager`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch zone manager dashboard:', response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching zone manager dashboard:', error);
    return null;
  }
}
