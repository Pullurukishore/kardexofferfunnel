'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useCallback,
  useRef,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getCookie, deleteCookie, setCookie } from 'cookies-next';
import { authService, isTokenExpired } from '@/services/auth.service';
import { UserRole, User } from '@/types';
import { isBrowser, safeLocalStorage, safeSessionStorage } from '@/lib/browser';

export type LoginResponse = {
  success: boolean;
  user?: User;
  error?: string;
};

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResponse>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyName?: string;
    zoneId?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  clearError: () => void;
};

// Manual cookie helpers as fallback
const manualGetCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
};

// Development localStorage token helper with expiration check
const getDevToken = (): string | null => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  const token = localStorage.getItem('dev_accessToken');
  const expiry = localStorage.getItem('dev_tokenExpiry');
  
  if (!token || !expiry) return null;
  
  const expiryTime = parseInt(expiry);
  const now = Date.now();
  
  if (now > expiryTime) {
    console.log('DevToken - Token expired, clearing localStorage');
    localStorage.removeItem('dev_accessToken');
    localStorage.removeItem('dev_userRole');
    localStorage.removeItem('dev_rememberMe');
    localStorage.removeItem('dev_tokenExpiry');
    return null;
  }
  
  return token;
};

const manualSetCookie = (name: string, value: string, options: any = {}) => {
  if (typeof document === 'undefined') return;
  
  const approaches = [
    () => {
      document.cookie = `${name}=${value}; path=/`;
    },
    () => {
      const expires = new Date(Date.now() + (options.maxAge || 86400) * 1000);
      document.cookie = `${name}=${value}; path=/; expires=${expires.toUTCString()}`;
    },
    () => {
      let cookieString = `${name}=${value}`;
      if (options.path) cookieString += `; path=${options.path}`;
      if (options.expires) cookieString += `; expires=${options.expires.toUTCString()}`;
      if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
      if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
      document.cookie = cookieString;
    }
  ];
  
  for (let i = 0; i < approaches.length; i++) {
    try {
      approaches[i]();
      setTimeout(() => {
        if (document.cookie.includes(`${name}=`)) {
          return;
        } else if (i === approaches.length - 1) {
          localStorage.setItem(`cookie_${name}`, value);
        }
      }, 10);
    } catch (error) {
      console.error(`ManualSetCookie - Approach ${i + 1} failed:`, error);
    }
  }
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const coerceOptionalNumber = (value: unknown): number | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const parsed = typeof value === 'string' ? Number(value) : (value as number);
    return Number.isNaN(parsed as number) ? undefined : (parsed as number);
  };

  const getRoleBasedRedirect = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.ZONE_USER:
        return '/zone-user/dashboard';
      default:
        return '/auth/login';
    }
  };

  const loadUser = useCallback(async (currentPath?: string): Promise<User | null> => {
    const pathToCheck = currentPath || pathname;
    if (pathToCheck.startsWith('/auth/')) {
      return null;
    }
    try {
      const token = getCookie('accessToken') || getCookie('token') || 
                   manualGetCookie('accessToken') || manualGetCookie('token') ||
                   localStorage.getItem('cookie_accessToken') ||
                   getDevToken();
      
      if (!token) {
        return null;
      }

      const userData = await authService.getCurrentUser();
      
      if (!userData || !userData.email) {
        return null;
      }

      let userName = userData.name?.trim();
      
      if (!userName || userName === '' || userName === 'null' || userName === 'undefined' || userName === 'User') {
        userName = userData.email?.split('@')[0] || 'User';
      }
      
      const safeUser: User = {
        ...userData,
        name: userName,
        isActive: userData.isActive ?? true,
        tokenVersion: userData.tokenVersion || '0',
        lastPasswordChange: userData.lastPasswordChange || new Date().toISOString(),
        zoneId: coerceOptionalNumber((userData as any).zoneId),
        customerId: coerceOptionalNumber((userData as any).customerId),
      };
      
      setUser(safeUser);
      setAccessToken(token as string);

      setCookie('userRole', safeUser.role, {
        path: '/',
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      return safeUser;
    } catch (err) {
      console.error('Failed to load user:', err);
      throw err;
    }
  }, [pathname]);

  const authCheckInProgress = useRef(false);
  const initialAuthCheck = useRef(false);
  const lastValidUser = useRef<User | null>(null);
  const isInitializing = useRef(true);

  useEffect(() => {
    const initializeAuth = () => {
      if (!isBrowser) {
        isInitializing.current = false;
        return;
      }
      
      const token = getCookie('accessToken') || getCookie('token') || 
                   manualGetCookie('accessToken') || manualGetCookie('token') ||
                   localStorage.getItem('cookie_accessToken') ||
                   getDevToken();
      const role = (getCookie('userRole') || manualGetCookie('userRole') || 
                   localStorage.getItem('cookie_userRole') ||
                   (process.env.NODE_ENV === 'development' ? localStorage.getItem('dev_userRole') : null)) as UserRole | undefined;
      
      if (token && role) {
        const cachedUser = safeSessionStorage.getItem('currentUser');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            if (parsedUser && parsedUser.email && parsedUser.role === role) {
              setUser(parsedUser);
              setAccessToken(token as string);
              lastValidUser.current = parsedUser;
              setIsLoading(false);
              isInitializing.current = false;
              return;
            }
          } catch (e) {
            console.error('InitAuth - Failed to parse cached user:', e);
          }
        }
        
        setAccessToken(token as string);
      }
      
      isInitializing.current = false;
    };
    
    initializeAuth();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (isInitializing.current) {
        return;
      }
      
      if (authCheckInProgress.current) {
        return;
      }
      
      try {
        authCheckInProgress.current = true;
        
        if (user && user.email && user.role && initialAuthCheck.current && !pathname.startsWith('/auth/')) {
          setIsLoading(false);
          return;
        }
        
        if (!pathname.startsWith('/auth/') && !user) {
          setIsLoading(true);
        }
        
        const token = getCookie('accessToken') || getCookie('token') || 
                     manualGetCookie('accessToken') || manualGetCookie('token') ||
                     localStorage.getItem('cookie_accessToken') ||
                     getDevToken();
        const role = (getCookie('userRole') || manualGetCookie('userRole') || 
                     localStorage.getItem('cookie_userRole') ||
                     (process.env.NODE_ENV === 'development' ? localStorage.getItem('dev_userRole') : null)) as UserRole | undefined;
        
        if (!token) {
          if (user || accessToken) {
            await clearAuthState();
          }
          setIsLoading(false);
          initialAuthCheck.current = true;
          return;
        }
        
        if (user && user.email && user.role === role && token) {
          setAccessToken(token as string);
          setIsLoading(false);
          initialAuthCheck.current = true;
          return;
        }
        
        try {
          const userData = await loadUser(pathname);
          if (userData) {
            setAccessToken(token as string);
            lastValidUser.current = userData;
            safeSessionStorage.setItem('currentUser', JSON.stringify(userData));
            initialAuthCheck.current = true;
            return;
          } else {
            if (lastValidUser.current && token && role) {
              setUser(lastValidUser.current);
              setAccessToken(token as string);
              return;
            }
            
            const cachedUser = safeSessionStorage.getItem('currentUser');
            if (cachedUser && token && role) {
              try {
                const parsedUser = JSON.parse(cachedUser);
                if (parsedUser && parsedUser.email && parsedUser.role === role) {
                  setUser(parsedUser);
                  setAccessToken(token as string);
                  lastValidUser.current = parsedUser;
                  return;
                }
              } catch (e) {
                console.error('CheckAuth - Failed to parse cached user:', e);
              }
            }
            
            await clearAuthState();
          }
        } catch (err) {
          console.error('CheckAuth - Failed to load user:', err);
          if (err && typeof err === 'object' && 'response' in err) {
            const response = (err as any).response;
            if (response?.status === 401 || response?.status === 403) {
              await clearAuthState();
            } else {
              if (lastValidUser.current && token && role) {
                setUser(lastValidUser.current);
                setAccessToken(token as string);
                return;
              }
            }
          }
        }
        
        initialAuthCheck.current = true;
      } catch (error) {
        console.error('Auth check error:', error);
        const token = getCookie('accessToken');
        if (lastValidUser.current && token) {
          setUser(lastValidUser.current);
          setAccessToken(token as string);
        } else {
          if (!user) {
            await clearAuthState();
          }
        }
        initialAuthCheck.current = true;
      } finally {
        setIsLoading(false);
        authCheckInProgress.current = false;
      }
    };
    
    let timeoutIds: NodeJS.Timeout[] = [];
    
    if (isBrowser && !pathname.startsWith('/auth/')) {
      if (isInitializing.current) {
        const initWaitTimeout = setTimeout(() => {
          if (!isInitializing.current) {
            checkAuth();
          }
        }, 50);
        timeoutIds.push(initWaitTimeout);
      } else {
        const checkAuthTimeout = setTimeout(checkAuth, 50);
        timeoutIds.push(checkAuthTimeout);
        
        const safetyTimeout = setTimeout(() => {
          setIsLoading(false);
          initialAuthCheck.current = true;
        }, 3000);
        timeoutIds.push(safetyTimeout);
      }
    } else {
      const authPageTimeout = setTimeout(() => {
        setIsLoading(false);
        initialAuthCheck.current = true;
      }, 0);
      timeoutIds.push(authPageTimeout);
    }
    
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      authCheckInProgress.current = false;
    };
  }, [pathname, loadUser]);

  const clearAuthState = async () => {
    setUser(null);
    setAccessToken(null);
    setError(null);
    lastValidUser.current = null;
    
    deleteCookie('accessToken');
    deleteCookie('token');
    deleteCookie('refreshToken');
    deleteCookie('userRole');
    
    safeLocalStorage.removeItem('auth_token');
    safeLocalStorage.removeItem('refresh_token');
    safeLocalStorage.removeItem('cookie_accessToken');
    safeLocalStorage.removeItem('cookie_refreshToken');
    safeLocalStorage.removeItem('cookie_userRole');
    safeSessionStorage.removeItem('currentUser');
    
    if (process.env.NODE_ENV === 'development') {
      safeLocalStorage.removeItem('dev_accessToken');
      safeLocalStorage.removeItem('dev_userRole');
      safeLocalStorage.removeItem('dev_rememberMe');
      safeLocalStorage.removeItem('dev_tokenExpiry');
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({ email, password });

      if (!response || !response.user || (!response.accessToken && !response.token)) {
        throw new Error('Invalid login response from server');
      }

      const tokenToUse = response.accessToken || response.token;

      let userName = response.user.name?.trim();
      
      if (!userName || userName === '' || userName === 'null' || userName === 'undefined' || userName === 'User') {
        userName = response.user.email?.split('@')[0] || email.split('@')[0] || 'User';
      }
      
      const safeUser: User = {
        id: response.user.id,
        email: response.user.email || email,
        name: userName,
        role: response.user.role,
        isActive: response.user.isActive ?? true,
        tokenVersion: response.user.tokenVersion || '0',
        lastPasswordChange: response.user.lastPasswordChange || new Date().toISOString(),
        ...(response.user.phone && { phone: response.user.phone }),
        ...(response.user.companyName && { companyName: response.user.companyName }),
        ...(response.user.zoneId !== undefined && { zoneId: coerceOptionalNumber((response.user as any).zoneId) }),
        ...(response.user.customerId !== undefined && { customerId: coerceOptionalNumber((response.user as any).customerId) }),
      };

      const cookieOptions = {
        path: '/',
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'lax' as const,
        httpOnly: false,
      };

      const tokenMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
      const roleMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
      
      const tokenOptions = { 
        ...cookieOptions, 
        maxAge: tokenMaxAge,
        expires: new Date(Date.now() + tokenMaxAge * 1000)
      };
      
      const roleOptions = { 
        ...cookieOptions, 
        maxAge: roleMaxAge,
        expires: new Date(Date.now() + roleMaxAge * 1000)
      };

      setCookie('accessToken', tokenToUse, tokenOptions);
      setCookie('token', tokenToUse, tokenOptions);
      setCookie('userRole', safeUser.role, roleOptions);
      
      if (response.refreshToken) {
        setCookie('refreshToken', response.refreshToken, roleOptions);
      }

      manualSetCookie('accessToken', tokenToUse, tokenOptions);
      manualSetCookie('token', tokenToUse, tokenOptions);
      manualSetCookie('userRole', safeUser.role, roleOptions);
      
      if (response.refreshToken) {
        manualSetCookie('refreshToken', response.refreshToken, roleOptions);
      }

      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('dev_accessToken', tokenToUse);
        localStorage.setItem('dev_userRole', safeUser.role);
        localStorage.setItem('dev_rememberMe', rememberMe.toString());
        localStorage.setItem('dev_tokenExpiry', (Date.now() + tokenMaxAge * 1000).toString());
      }
      
      setAccessToken(tokenToUse);
      setUser(safeUser);
      lastValidUser.current = safeUser;
      safeSessionStorage.setItem('currentUser', JSON.stringify(safeUser));

      const redirectPath = getRoleBasedRedirect(safeUser.role);
      router.replace(redirectPath);

      return { success: true, user: safeUser };
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      const errorMessage = error?.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      const clearAllCookies = () => {
        const cookies = document.cookie.split(';');
        const domain = window.location.hostname;
        
        cookies.forEach(cookie => {
          const [name] = cookie.split('=').map(c => c.trim());
          if (name) {
            document.cookie = `${name}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        });
      };

      try {
        const domains = [
          window.location.hostname,
          `.${window.location.hostname}`,
          window.location.hostname.split('.').slice(-2).join('.'),
          `.${window.location.hostname.split('.').slice(-2).join('.')}`
        ];

        ['accessToken', 'refreshToken', 'token', 'userRole', 'auth_token', 'refresh_token'].forEach(cookieName => {
          domains.forEach(domain => {
            document.cookie = `${cookieName}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          });
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });

        const cookieOptions = {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
        };

        ['accessToken', 'refreshToken', 'token', 'userRole', 'auth_token', 'refresh_token'].forEach(cookieName => {
          deleteCookie(cookieName, cookieOptions);
        });

        clearAllCookies();
      } catch (e) {
        console.error('Error clearing cookies:', e);
      }

      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      setUser(null);
      setAccessToken(null);
      setError(null);

      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyName?: string;
    zoneId?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(userData);
      const tokenToUse = response.accessToken || response.token;

      const cookieOptions = {
        path: '/',
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'lax' as const,
      };

      setCookie('accessToken', tokenToUse, cookieOptions);
      setCookie('token', tokenToUse, cookieOptions);
      setCookie('refreshToken', response.refreshToken, cookieOptions);

      const registeredUser: User = {
        ...response.user,
        zoneId: coerceOptionalNumber((response.user as any).zoneId),
        customerId: coerceOptionalNumber((response.user as any).customerId),
        tokenVersion: response.user.tokenVersion || '0',
        name: response.user.name || response.user.email?.split('@')[0] || 'User',
      };

      setUser(registeredUser);

      router.replace(getRoleBasedRedirect(response.user.role));
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    return Array.isArray(requiredRole) ? requiredRole.includes(user.role) : user.role === requiredRole;
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        hasPermission,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export { AuthProvider };
export default AuthProvider;
