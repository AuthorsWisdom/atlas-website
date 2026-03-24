cat > /Users/sevenswords/projects/atlas-website/app/page.tsx << 'EOF'
import Nav from '@/components/Nav'
import Ticker from '@/components/Ticker'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Nav />
      <Ticker />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </main>
  )
}
EOF