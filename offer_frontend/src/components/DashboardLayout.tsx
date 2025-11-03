'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from './ui/button';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  role?: 'ADMIN' | 'ZONE_USER';
}

export function DashboardLayout({ children, title, role }: DashboardLayoutProps) {
  const { user, isLoading, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }

    if (!isLoading && user && role && user.role !== role) {
      router.push('/');
    }
  }, [user, isLoading, isAuthenticated, router, role]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {title}
              </h1>
              {user.role === 'ZONE_USER' && user.zones && user.zones.length > 0 && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {user.zones[0].name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                <p className="text-xs text-gray-500">
                  {user.role === 'ADMIN' ? 'Administrator' : 'Zone User'}
                </p>
              </div>
              <Button onClick={logout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 h-12 items-center">
            <a
              href={user.role === 'ADMIN' ? '/admin' : '/zone-user/dashboard'}
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Dashboard
            </a>
            <a
              href={user.role === 'ADMIN' ? '/admin/offers' : '/zone-user/offers'}
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Offers
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
