import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './global.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

// ✅ Metadata
export const metadata: Metadata = {
  title: 'MAHE Facility Management',
  description: 'Facility inspection and issue reporting system for MAHE',
  manifest: '/manifest.json',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MAHE FM',
  },
}

// ✅ Viewport (ONLY viewport-related fields allowed here)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* ⚠️ REMOVED duplicate meta tags - viewport export handles these */}
      </head>
      <body className={inter.className}>
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#363636',
              border: '1px solid #e5e7eb',
            },
          }}
        />
      </body>
    </html>
  )
}