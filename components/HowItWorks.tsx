"use client"

import { motion } from "framer-motion"
import { ArrowRight } from 'lucide-react'

const steps = [
  {
    number: "01",
    title: "Create Campaign",
    description: "Set up your funding campaign with clear milestones and goals"
  },
  {
    number: "02",
    title: "Community Verification",
    description: "Get verified through our decentralized identity system"
  },
  {
    number: "03",
    title: "Receive Funding",
    description: "Funds are released as you achieve your milestones"
  },
  {
    number: "04",
    title: "Build Reputation",
    description: "Grow your reputation for future funding opportunities"
  }
]

export default function HowItWorks() {
  return (
    <section className="py-20 bg-[#90EE90]">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-black"
        >
          How It Works
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all group"
            >
              <div className="text-6xl font-bold text-yellow-400 mb-4">{step.number}</div>
              <h3 className="text-2xl font-bold mb-2 text-black">{step.title}</h3>
              <p className="text-gray-600 mb-4">{step.description}</p>
              {index < steps.length - 1 && (
                <ArrowRight className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

