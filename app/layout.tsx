import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorker from '@/components/ServiceWorker'
import InstallPrompt from '@/components/InstallPrompt'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'XAtlas — Institutional Intelligence for Your iPhone',
  description: 'Real-time market scanning, macro regime detection, and AI-powered conviction scoring. Built for retail traders who demand institutional-grade intelligence.',
  metadataBase: new URL('https://xatlas.io'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'XAtlas',
  },
  openGraph: {
    title: 'XAtlas — Institutional Intelligence for Your iPhone',
    description: 'Real-time market scanning, macro regime detection, and AI-powered conviction scoring.',
    url: 'https://xatlas.io',
    siteName: 'XAtlas',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#1D9E75',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <ServiceWorker />
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  )
}
