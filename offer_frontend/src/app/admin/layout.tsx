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
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden print:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden print:hidden">
          <Sidebar 
            userRole={user?.role}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block print:hidden">
        <Sidebar 
          userRole={user?.role}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-out print:!pl-0",
        collapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Top navbar */}
        <div className="print:hidden">
          <Navbar 
            onMenuClick={() => setSidebarOpen(true)}
            collapsed={collapsed}
          />
        </div>

        {/* Page content */}
        <main className="py-8 print:py-0">
          <div className="px-4 sm:px-6 lg:px-8 print:px-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
