import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Offer Funnel - Sales Management System',
  description: 'Manage sales offers and track funnel progression',
  icons: {
    icon: [
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/kardex.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/kardex.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
