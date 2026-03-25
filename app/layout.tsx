import type { Metadata } from 'next'
import './globals.css'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
