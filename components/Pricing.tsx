import { Check } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function Pricing() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto bg-[#90EE90] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-4xl font-bold mb-2">Professional</h2>
          <div className="text-6xl font-bold mb-4">$45</div>
          <div className="text-lg mb-8">Billed annually or $15 month-to-month</div>
          
          <div className="space-y-4 mb-8">
            {[
              "Unlimited projects",
              "Unlimited version history",
              "Sharing permissions",
              "Shared and private projects",
              "Team libraries",
              "Audio conversations"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-6 h-6" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <Button 
            className="w-full bg-black hover:bg-gray-800 text-white font-bold text-xl py-6 border-4 border-black"
          >
            Select Plan
          </Button>
        </div>
      </div>
    </section>
  )
}

