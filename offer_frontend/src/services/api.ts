import axios, { AxiosInstance } from 'axios';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

// Helper function to get cookie value (works in client-side)
const getTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'accessToken' || name === 'token') {
      return value;
    }
  }
  return null;
};

class ApiService {
  public api: AxiosInstance;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // Try multiple cookie names and methods to get the token
        let token = getCookie('accessToken') as string || 
                    getCookie('token') as string;
        
        if (!token) {
          token = getTokenFromCookie() || '';
        }
        
        // Also check localStorage in development mode
        if (!token && process.env.NODE_ENV === 'development') {
          token = localStorage.getItem('dev_accessToken') || '';
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ Token added to request:', config.url);
        } else {
          console.warn('⚠️ No token found for request:', config.url);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.isRefreshing) {
            // Queue the request until refresh completes
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push((newToken: string | null) => {
                if (newToken) {
                  originalRequest.headers = originalRequest.headers || {};
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                this.api(originalRequest).then(resolve).catch(reject);
              });
            });
          }

          this.isRefreshing = true;
          try {
            // Server reads httpOnly refresh cookie; just send credentials
            const response = await axios.post(
              `${API_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            );

            const { accessToken, token } = response.data || {};
            const tokenToUse = accessToken || token || null;

            // Update default header for subsequent requests
            if (tokenToUse) {
              this.api.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
            }

            // Process queued requests
            this.refreshSubscribers.forEach((cb) => cb(tokenToUse));
            this.refreshSubscribers = [];

            // Retry the original request
            if (tokenToUse) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${tokenToUse}`;
            }
            return this.api(originalRequest);
          } catch (refreshError) {
            // If refresh fails, clear any client-side tokens and redirect to login
            this.refreshSubscribers.forEach((cb) => cb(null));
            this.refreshSubscribers = [];
            deleteCookie('accessToken');
            deleteCookie('token');
            deleteCookie('refreshToken');
            
            // Prevent infinite redirect loops
            if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
              // Add flag to prevent multiple redirects
              if (!sessionStorage.getItem('auth_redirect_pending')) {
                sessionStorage.setItem('auth_redirect_pending', 'true');
                setTimeout(() => {
                  window.location.href = '/auth/login';
                }, 100);
              }
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  async getMe() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Offer endpoints
  async getOffers(params?: any) {
    const response = await this.api.get('/offers', { params });
    return response.data;
  }

  async getOffer(id: number) {
    const response = await this.api.get(`/offers/${id}`);
    return response.data;
  }

  async createOffer(data: any) {
    const response = await this.api.post('/offers', data);
    return response.data;
  }


  async updateOffer(id: number, data: any) {
    const response = await this.api.put(`/offers/${id}`, data);
    return response.data;
  }

  async updateOfferStatus(id: number, data: any) {
    const response = await this.api.patch(`/offers/${id}/status`, data);
    return response.data;
  }

  async deleteOffer(id: number) {
    const response = await this.api.delete(`/offers/${id}`);
    return response.data;
  }

  async addOfferNote(id: number, content: string) {
    const response = await this.api.post(`/offers/${id}/notes`, { content });
    return response.data;
  }

  async getOfferAuditLogs(offerReferenceNumber: string, params?: any) {
    const response = await this.api.get(`/audit-logs/offer/${offerReferenceNumber}`, { params });
    return response.data;
  }

  // Customer endpoints
  async getCustomers(params?: any) {
    const response = await this.api.get('/customers', { params });
    return response.data;
  }

  async getCustomer(id: number) {
    const response = await this.api.get(`/customers/${id}`);
    return response.data;
  }

  async createCustomer(data: any) {
    const response = await this.api.post('/customers', data);
    return response.data;
  }

  async updateCustomer(id: number, data: any) {
    const response = await this.api.put(`/customers/${id}`, data);
    return response.data;
  }

  async deleteCustomer(id: number) {
    const response = await this.api.delete(`/customers/${id}`);
    return response.data;
  }

  async getCustomerStats(id: number) {
    const response = await this.api.get(`/customers/${id}/stats`);
    return response.data;
  }

  // Customer Contact endpoints
  async getCustomerContacts(customerId: number) {
    const response = await this.api.get(`/customers/${customerId}/contacts`);
    return response.data;
  }

  async createCustomerContact(customerId: number, data: any) {
    const response = await this.api.post(`/customers/${customerId}/contacts`, data);
    return response.data;
  }

  async updateCustomerContact(customerId: number, contactId: number, data: any) {
    const response = await this.api.put(`/customers/${customerId}/contacts/${contactId}`, data);
    return response.data;
  }

  async deleteCustomerContact(customerId: number, contactId: number) {
    const response = await this.api.delete(`/customers/${customerId}/contacts/${contactId}`);
    return response.data;
  }

  // Customer Asset endpoints
  async getCustomerAssets(customerId: number, params?: any) {
    const response = await this.api.get(`/customers/${customerId}/assets`, { params });
    return response.data;
  }

  async createCustomerAsset(customerId: number, data: any) {
    const response = await this.api.post(`/customers/${customerId}/assets`, data);
    return response.data;
  }

  async updateCustomerAsset(customerId: number, assetId: number, data: any) {
    const response = await this.api.put(`/customers/${customerId}/assets/${assetId}`, data);
    return response.data;
  }

  async deleteCustomerAsset(customerId: number, assetId: number) {
    const response = await this.api.delete(`/customers/${customerId}/assets/${assetId}`);
    return response.data;
  }

  // Asset endpoints (standalone)
  async getAssets(params?: any) {
    const response = await this.api.get('/assets', { params });
    return response.data;
  }

  async getAsset(id: number) {
    const response = await this.api.get(`/assets/${id}`);
    return response.data;
  }

  async createAsset(data: any) {
    const response = await this.api.post('/assets', data);
    return response.data;
  }

  async updateAsset(id: number, data: any) {
    const response = await this.api.put(`/assets/${id}`, data);
    return response.data;
  }

  async deleteAsset(id: number) {
    const response = await this.api.delete(`/assets/${id}`);
    return response.data;
  }

  // Zone endpoints
  async getZones(params?: any) {
    const response = await this.api.get('/admin/zones', { params });
    return response.data;
  }

  async createZone(data: any) {
    const response = await this.api.post('/admin/zones', data);
    return response.data;
  }

  async updateZone(zoneId: number, data: any) {
    const response = await this.api.put(`/admin/zones/${zoneId}`, data);
    return response.data;
  }

  // Spare Parts endpoints
  async getSpareParts(params?: any) {
    const response = await this.api.get('/spare-parts', { params });
    return response.data;
  }

  async getSparePart(id: number) {
    const response = await this.api.get(`/spare-parts/${id}`);
    return response.data;
  }

  async createSparePart(data: any) {
    const response = await this.api.post('/spare-parts', data);
    return response.data;
  }

  async updateSparePart(id: number, data: any) {
    const response = await this.api.put(`/spare-parts/${id}`, data);
    return response.data;
  }

  async deleteSparePart(id: number) {
    const response = await this.api.delete(`/spare-parts/${id}`);
    return response.data;
  }

  async getSparePartCategories() {
    const response = await this.api.get('/spare-parts/categories');
    return response.data;
  }

  async bulkUpdateSparePartPrices(updates: any[]) {
    const response = await this.api.patch('/spare-parts/bulk/prices', { updates });
    return response.data;
  }

  // User endpoints
  async getUsers(params?: any) {
    const response = await this.api.get('/admin/users', { params });
    return response.data;
  }

  async getZoneUsers(params?: any) {
    const response = await this.api.get('/admin/zone-users', { params });
    return response.data;
  }

  // Dashboard endpoints
  async getAdminDashboard(params?: any) {
    const response = await this.api.get('/dashboard/admin', { params });
    return response.data;
  }

  async getZoneDashboard(params?: any) {
    const response = await this.api.get('/dashboard/zone', { params });
    return response.data;
  }

  async getZoneManagerDashboard(params?: any) {
    const response = await this.api.get('/dashboard/zone-manager', { params });
    return response.data;
  }

  async getSidebarStats() {
    const response = await this.api.get('/dashboard/sidebar-stats');
    return response.data;
  }

  // Reports endpoints
  async generateReport(params?: any) {
    const response = await this.api.get('/reports/generate', { params });
    return response.data;
  }

  async getOfferDetails(offerId: number) {
    const response = await this.api.get(`/reports/offers/${offerId}`);
    return response.data;
  }

  async getAnalyticsReport(params?: any) {
    const response = await this.api.get('/reports/analytics', { params });
    return response.data;
  }

  async exportReport(format: string) {
    const response = await this.api.post(`/reports/export/${format}`);
    return response.data;
  }

  // Activity endpoints
  async getAllActivities(params?: any) {
    const response = await this.api.get('/activities', { params });
    return response.data;
  }

  async getZoneActivities(params?: any) {
    const response = await this.api.get('/activities/zone', { params });
    return response.data;
  }

  async getActivityStats(params?: any) {
    const response = await this.api.get('/activities/stats', { params });
    return response.data;
  }

  async getOfferActivities(offerReferenceNumber: string, params?: any) {
    const response = await this.api.get(`/activities/offer/${offerReferenceNumber}`, { params });
    return response.data;
  }

  async getRealtimeActivities(params?: any) {
    const response = await this.api.get('/activities/realtime', { params });
    return response.data;
  }

  async getActivityHeatmap(params?: any) {
    const response = await this.api.get('/activities/heatmap', { params });
    return response.data;
  }

  async getActivityComparison(params?: any) {
    const response = await this.api.get('/activities/comparison', { params });
    return response.data;
  }

  async getActivityByEntity(params?: any) {
    const response = await this.api.get('/activities/by-entity', { params });
    return response.data;
  }

  async getUserLeaderboard(params?: any) {
    const response = await this.api.get('/activities/leaderboard', { params });
    return response.data;
  }

  async getSecurityAlerts(params?: any) {
    const response = await this.api.get('/activities/security-alerts', { params });
    return response.data;
  }

  async getWorkflowAnalysis(params?: any) {
    const response = await this.api.get('/activities/workflow-analysis', { params });
    return response.data;
  }

  async getComplianceReport(params?: any) {
    const response = await this.api.get('/activities/compliance-report', { params });
    return response.data;
  }

  // User management endpoints
  async getAllUsers(params?: any) {
    const response = await this.api.get('/users', { params });
    return response.data;
  }

  async getUserById(userId: number) {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async createUser(userData: any) {
    const response = await this.api.post('/users', userData);
    return response.data;
  }

  async updateUser(userId: number, userData: any) {
    const response = await this.api.put(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: number) {
    const response = await this.api.delete(`/users/${userId}`);
    return response.data;
  }

  async bulkUpdateUserStatus(userIds: number[], isActive: boolean) {
    const response = await this.api.post('/users/bulk/status', { userIds, isActive });
    return response.data;
  }

  async changeUserPassword(userId: number, newPassword: string) {
    const response = await this.api.post(`/users/${userId}/change-password`, { newPassword });
    return response.data;
  }

  async getUserStats() {
    const response = await this.api.get('/users/stats');
    return response.data;
  }

  // Target Management endpoints
  async setZoneTarget(data: any) {
    const response = await this.api.post('/targets/zones', data);
    return response.data;
  }

  async getZoneTargets(params?: any) {
    const response = await this.api.get('/targets/zones', { params });
    return response.data;
  }

  async updateZoneTarget(targetId: number, data: any) {
    const response = await this.api.put(`/targets/zones/${targetId}`, data);
    return response.data;
  }

  async deleteZoneTarget(targetId: number) {
    const response = await this.api.delete(`/targets/zones/${targetId}`);
    return response.data;
  }

  async setUserTarget(data: any) {
    const response = await this.api.post('/targets/users', data);
    return response.data;
  }

  async getUserTargets(params?: any) {
    const response = await this.api.get('/targets/users', { params });
    return response.data;
  }

  async updateUserTarget(targetId: number, data: any) {
    const response = await this.api.put(`/targets/users/${targetId}`, data);
    return response.data;
  }

  async deleteUserTarget(targetId: number) {
    const response = await this.api.delete(`/targets/users/${targetId}`);
    return response.data;
  }

  async setProductTypeTarget(data: any) {
    const response = await this.api.post('/targets/product-types', data);
    return response.data;
  }

  async getProductTypeTargets(params?: any) {
    const response = await this.api.get('/targets/product-types', { params });
    return response.data;
  }

  async deleteProductTypeTarget(targetId: number) {
    const response = await this.api.delete(`/targets/product-types/${targetId}`);
    return response.data;
  }

  async getTargetDashboard(params?: any) {
    const response = await this.api.get('/targets/dashboard', { params });
    return response.data;
  }

  async getTargetsSummary() {
    const response = await this.api.get('/targets/summary');
    return response.data;
  }

  async getZoneTargetDetails(zoneId: number, targetPeriod: string, periodType: string) {
    const response = await this.api.get(`/reports/targets/${zoneId}`, {
      params: { type: 'zone', targetPeriod, periodType }
    });
    return response.data;
  }

  async getUserTargetDetails(userId: number, targetPeriod: string, periodType: string) {
    const response = await this.api.get(`/reports/targets/${userId}`, {
      params: { type: 'user', targetPeriod, periodType }
    });
    return response.data;
  }

  // Product Type Analysis Report
  async getProductTypeAnalysis(params?: any) {
    const response = await this.api.get('/reports/product-type-analysis', { params });
    return response.data;
  }

  // Customer Performance Report
  async getCustomerPerformance(params?: any) {
    const response = await this.api.get('/reports/customer-performance', { params });
    return response.data;
  }

  // Forecast endpoints
  async getForecastSummary(params?: any) {
    const response = await this.api.get('/forecasts/summary', { params });
    return response.data;
  }

  async getForecastBreakdown(params?: any) {
    const response = await this.api.get('/forecasts/zone-user-breakdown', { params });
    return response.data;
  }

  async getForecastPoExpected(params?: any) {
    const response = await this.api.get('/forecasts/po-expected', { params });
    return response.data;
  }

  async getForecastHighlights(params?: any) {
    const response = await this.api.get('/forecasts/highlights', { params });
    return response.data;
  }
}

export const apiService = new ApiService();
