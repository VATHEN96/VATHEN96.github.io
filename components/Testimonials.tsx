"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Blockchain Developer",
    quote: "The milestone-based funding helped us maintain transparency and trust with our investors.",
    image: "/placeholder.svg"
  },
  {
    name: "Alex Rivera",
    role: "Project Lead",
    quote: "Community verification gave us the credibility we needed to launch successfully.",
    image: "/placeholder.svg"
  },
  {
    name: "Maria Kim",
    role: "DeFi Founder",
    quote: "The platform's reputation system helped us build long-term relationships.",
    image: "/placeholder.svg"
  }
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-[#2c3e50]">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-black"
        >
          Success Stories
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-[#FFB6C1] p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full border-4 border-black overflow-hidden">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={64}
                    height={64}
                  />
                </div>
                <div>
                  <div className="font-bold text-xl text-black">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.role}</div>
                </div>
              </div>
              <blockquote className="text-lg text-black">"{testimonial.quote}"</blockquote>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

