import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'XAtlas — Institutional Intelligence for Your iPhone',
  description: 'Real-time market scanning, macro regime detection, and AI-powered conviction scoring. Built for retail traders who demand institutional-grade intelligence.',
  metadataBase: new URL('https://xatlas.io'),
  openGraph: {
    title: 'XAtlas — Institutional Intelligence for Your iPhone',
    description: 'Real-time market scanning, macro regime detection, and AI-powered conviction scoring.',
    url: 'https://xatlas.io',
    siteName: 'XAtlas',
    type: 'website',
  },
}

export const viewport: Viewport = {
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
