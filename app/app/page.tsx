import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/components/AuthContext'
import PWAApp from './PWAApp'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'XAtlas',
  description: 'Institutional market intelligence',
}

export const viewport: Viewport = {
  themeColor: '#000000',
  viewportFit: 'cover',
}

export default function AppPage() {
  return (
    <AuthProvider>
      <PWAApp />
    </AuthProvider>
  )
}
