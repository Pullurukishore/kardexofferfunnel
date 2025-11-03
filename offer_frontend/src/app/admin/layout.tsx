'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/contexts/AuthContext'


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <Sidebar 
            userRole={user?.role}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          userRole={user?.role}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-out",
        collapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Top navbar */}
        <Navbar 
          onMenuClick={() => setSidebarOpen(true)}
          collapsed={collapsed}
        />

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
