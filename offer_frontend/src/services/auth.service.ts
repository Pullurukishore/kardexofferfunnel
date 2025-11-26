import { UserRole, User } from '@/types';
import { apiService } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role: UserRole;
  companyName?: string;
  zoneId?: string;
}

export interface AuthResponseUser {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  phone?: string | null;
  zoneId?: string | null;
  customerId?: string | null;
  companyName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  isActive?: boolean;
  refreshToken?: string | null;
  refreshTokenExpires?: string | null;
  tokenVersion?: string;
  lastPasswordChange?: string;
  token?: string;
  accessToken?: string;
}

export interface AuthResponse {
  user: AuthResponseUser;
  accessToken?: string;
  token: string;
  refreshToken: string;
}

// Check if token is expired or about to expire (within 5 minutes)
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    const buffer = 300; // 5 minutes in seconds
    return payload.exp < (now + buffer);
  } catch (e) {
    return true; // If we can't parse the token, assume it's expired
  }
};

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiService.login(credentials.email, credentials.password);
    return response;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await apiService.api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiService.logout();
  },

  getCurrentUser: async (): Promise<AuthResponseUser> => {
    const { user } = await apiService.getMe();

    console.log('AuthService - getCurrentUser - Raw data from server:', user);

    // Ensure consistent name handling with better validation
    let userName = user.name?.trim();
    
    // Check if name is valid and not a placeholder
    if (!userName || userName === '' || userName === 'null' || userName === 'undefined' || userName === 'User') {
      userName = user.email?.split('@')[0] || 'User';
    }

    console.log('AuthService - getCurrentUser - Processed name:', userName);

    const processedUser = {
      ...user,
      name: userName,
      isActive: user.isActive ?? true,
      tokenVersion: user.tokenVersion || '0',
      lastPasswordChange: user.lastPasswordChange || new Date().toISOString()
    };

    console.log('AuthService - getCurrentUser - Final user data:', processedUser);
    return processedUser;
  },

  refreshToken: (): Promise<{ accessToken: string }> => {
    return new Promise((resolve, reject) => {
      apiService.api
        .post<{ accessToken: string; token?: string }>('/auth/refresh', {}, { withCredentials: true })
        .then((response) => {
          const token = response.data?.accessToken || (response.data as any)?.token;
          if (token) {
            resolve({ accessToken: token });
          } else {
            throw new Error('No access token in response');
          }
        })
        .catch((error) => {
          if (typeof window !== 'undefined') {
            // Clear cookies
            document.cookie = 'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            document.cookie = 'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            
            // Prevent infinite redirect loops
            if (window.location.pathname !== '/auth/login') {
              if (!sessionStorage.getItem('auth_redirect_pending')) {
                sessionStorage.setItem('auth_redirect_pending', 'true');
                setTimeout(() => {
                  window.location.href = '/auth/login';
                }, 100);
              }
            }
          }
          reject(error);
        });
    });
  },
};

export default authService;
