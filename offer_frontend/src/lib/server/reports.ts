import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

async function makeServerRequest(endpoint: string) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const token = cookieStore.get('token')?.value;
  
  // Check for either accessToken or token
  const authToken = accessToken || token;
  
  if (!authToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Ensure fresh data
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }

  return response.json();
}

export interface Zone {
  id: number;
  name: string;
  shortForm?: string;
}

export interface Customer {
  id: number;
  companyName: string;
  location?: string;
  department?: string;
}

// Minimal shape for current user that we care about for zone scoping
export interface CurrentUserLike {
  id: number;
  role?: string;
  zoneId?: number | null;
  serviceZoneId?: number | null;
  // Some responses return nested serviceZones
  serviceZones?: Array<
    | { serviceZone?: { id: number; name?: string } }
    | { id: number; name?: string }
  >;
  [key: string]: any;
}

export async function getCurrentUser(): Promise<CurrentUserLike | null> {
  try {
    const response = await makeServerRequest('/auth/me');
    // Handle common response shapes
    if (response?.user) return response.user as CurrentUserLike;
    if (response?.data) return response.data as CurrentUserLike;
    return response as CurrentUserLike;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function getZones(): Promise<Zone[]> {
  try {
    const response = await makeServerRequest('/admin/zones');
    let zones: any[] = [];
    
    if (Array.isArray(response)) {
      zones = response;
    } else if (response?.data && Array.isArray(response.data)) {
      zones = response.data;
    } else if (response?.success && response?.data) {
      zones = Array.isArray(response.data) ? response.data : [];
    }
    
    // Extract only id and name fields
    return zones.map((zone: any) => ({
      id: zone.id,
      name: zone.name
    })).filter((zone: Zone) => zone.id && zone.name);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return [];
  }
}

export async function getCustomers(zoneId?: string): Promise<Customer[]> {
  try {
    const params = new URLSearchParams({ isActive: 'true', limit: '1000' });
    if (zoneId) {
      params.append('zoneId', zoneId);
    }
    
    const response = await makeServerRequest(`/customers?${params.toString()}`);
    
    // Handle different response structures
    if (Array.isArray(response)) {
      return response;
    }
    
    return response.customers || response.data || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

