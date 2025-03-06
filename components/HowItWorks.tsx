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
    <section className="py-20 bg-white dark:bg-black">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-black dark:text-white"
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
              className="bg-white dark:bg-black p-6 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all group"
            >
              <div className="text-6xl font-bold text-black dark:text-white mb-4">{step.number}</div>
              <h3 className="text-2xl font-bold mb-2 text-black dark:text-white">{step.title}</h3>
              <p className="text-black dark:text-white mb-4">{step.description}</p>
              {index < steps.length - 1 && (
                <ArrowRight className="w-6 h-6 text-black dark:text-white transform group-hover:translate-x-2 transition-transform" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


