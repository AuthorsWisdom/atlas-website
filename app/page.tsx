import Nav from '@/components/Nav'
import Ticker from '@/components/Ticker'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import LiveDemo from '@/components/LiveDemo'
import AppDemo from '@/components/AppDemo'
import Pricing from '@/components/Pricing'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/components/AuthContext'

export default function Home() {
  return (
    <AuthProvider>
      <main>
        <Nav />
        <Ticker />
        <Hero />
        <Features />
        <LiveDemo />
        <AppDemo />
        <Pricing />
        <Footer />
      </main>
    </AuthProvider>
  )
}
