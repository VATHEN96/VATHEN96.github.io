import Navbar from '@/components/navbar'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Stats from '@/components/Stats'
import HowItWorks from '@/components/HowItWorks'
import Testimonials from '@/components/Testimonials'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFFDF6] text-[#ecf0f1]">
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  )
}

