import Nav from '@/components/Nav'
import Ticker from '@/components/Ticker'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import LiveDemo from '@/components/LiveDemo'
import Pricing from '@/components/Pricing'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Nav />
      <Ticker />
      <Hero />
      <Features />
      <LiveDemo />
      <Pricing />
      <Footer />
    </main>
  )
}
