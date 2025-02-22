"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import Link from "next/link"

export default function CTA() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-yellow-400 p-12 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-black">
            Join our community of innovators and get the funding you need to bring your ideas to life.
          </p>
          <Button 
            className="bg-black hover:bg-gray-800 text-white font-bold text-xl px-8 py-6 border-4 border-black group"
          >
           <Link  href="/campaigns" > Launch Your Campaign</Link>
            <ArrowRight className="ml-2 w-6 h-6 transform group-hover:translate-x-2 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

