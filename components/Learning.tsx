import { BookOpen, Shield, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Learning() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Learn as You Grow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-800 rounded-lg p-6">
            <BookOpen className="w-12 h-12 mb-4 text-purple-500" />
            <h3 className="text-xl font-semibold mb-2">DeFi Fundamentals</h3>
            <p className="text-gray-400 mb-4">Learn the basics of decentralized finance and how it's shaping the future of funding.</p>
            <Button variant="outline">Start Learning</Button>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <Shield className="w-12 h-12 mb-4 text-purple-500" />
            <h3 className="text-xl font-semibold mb-2">Scam Prevention</h3>
            <p className="text-gray-400 mb-4">Understand common scams in the crypto world and how to protect yourself and your investments.</p>
            <Button variant="outline">Explore Guide</Button>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <Coins className="w-12 h-12 mb-4 text-purple-500" />
            <h3 className="text-xl font-semibold mb-2">Tokenomics</h3>
            <p className="text-gray-400 mb-4">Dive into the economics of tokens and how they function within blockchain ecosystems.</p>
            <Button variant="outline">Discover More</Button>
          </div>
        </div>
        <div className="text-center">
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">Access Learning Platform</Button>
        </div>
      </div>
    </section>
  )
}

