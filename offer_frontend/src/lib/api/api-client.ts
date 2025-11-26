import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

// Cookie helper (no external deps to avoid SSR issues)
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Token helper aligned with KardexCare
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // Prefer cookies set by backend, fallback to localStorage for dev
    const cookieToken = getCookie('accessToken') || getCookie('token') || localStorage.getItem('cookie_accessToken');
    if (cookieToken) return cookieToken;
    // Dev fallback
    const lsToken = localStorage.getItem('dev_accessToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (lsToken) return lsToken;
  }
  return null;
};

class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private refreshSubscribers: ((token: string | null) => void)[] = [];

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api',
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        const url = (originalRequest?.url || '') as string;
        const isAuthRefreshCall = url.includes('/auth/refresh');
        const isAuthLoginCall = url.includes('/auth/login');

        // Do not try to refresh for refresh/login calls or if already retried
        if (error.response?.status !== 401 || originalRequest._retry || isAuthRefreshCall || isAuthLoginCall) {
          return Promise.reject(error);
        }

        // If already refreshing, queue this request
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.refreshSubscribers.push((newToken: string | null) => {
              if (newToken) originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              this.client(originalRequest).then(resolve).catch(reject);
            });
          });
        }

        originalRequest._retry = true;
        this.isRefreshing = true;

        try {
          // Call backend refresh; server reads httpOnly refresh cookie
          const { data } = await this.client.post<{ accessToken?: string; token?: string }>(
            '/auth/refresh',
            {},
            { withCredentials: true }
          );
          const newToken = data?.accessToken || data?.token || null;
          if (newToken) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          }
          // Resolve queued requests
          this.refreshSubscribers.forEach((cb) => cb(newToken));
          this.refreshSubscribers = [];
          if (newToken) originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return this.client(originalRequest);
        } catch (refreshError) {
          this.refreshSubscribers.forEach((cb) => cb(null));
          this.refreshSubscribers = [];
          return Promise.reject(refreshError);
        } finally {
          this.isRefreshing = false;
        }
      }
    );
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }
}

export const apiClient = ApiClient.getInstance();
export default apiClient;
