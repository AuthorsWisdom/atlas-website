import type { Metadata, Viewport } from 'next'
import { AppContent } from '@/components/AppDemo'

export const metadata: Metadata = {
  title: 'XAtlas',
  description: 'Institutional market intelligence',
}

export const viewport: Viewport = {
  themeColor: '#000000',
  viewportFit: 'cover',
}

export default function AppPage() {
  return <AppContent fullscreen />
}
