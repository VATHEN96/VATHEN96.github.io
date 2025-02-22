"use client"

import { motion } from "framer-motion"
import { ArrowRight, Rocket, Shield, Zap, Coins } from 'lucide-react'
import { useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Hero() {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section className="pt-32 pb-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-[#4455d4] p-8 border-8 border-black shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] "
          >
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl font-bold mb-6 text-white"
            >
              Unlock the power of {"Web3"} Crowdfunding
            </motion.h1>
            <motion.p
              className="text-xl max-w-lg border-4 border-gray-800 bg-white p-4 shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] text-gray-700 mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ease: "easeOut" }}
            >
              Secure funding with milestone-based rewards powered by the decentralized and transparent nature of Web3 technology.
            </motion.p>


            <motion.div
              className="flex gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, ease: "easeOut" }}
            >
              <Link href="/campaigns">
                <motion.button
                  className="bg-green-500 text-white px-8 py-4 text-xl font-bold border-4 border-gray-800 shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Rocket className="w-6 h-6" /> Explore Campaigns
                </motion.button>
              </Link>
              <Link href="/create-campaign">
                <motion.button
                  className="bg-red-500 text-white px-8 py-4 text-xl font-bold border-4 border-gray-800 shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create Campaign <ArrowRight className="w-6 h-6" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column - Animated Picture */}
          <motion.div
            ref={targetRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ opacity }}
            className="relative"
          >
            <motion.div
              className="relative z-10"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="bg-white border-8 border-black p-8 shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] max-w-md mx-auto">
                <div className="aspect-square bg-blue-500 rounded-full border-4 border-black flex items-center justify-center">
                  <Coins className="w-1/2 h-1/2 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              className="absolute top-0 right-0 bg-red-500 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] rounded"
              animate={{ rotate: [-8, 8, -8], y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>

            <motion.div
              className="absolute bottom-12 left-0 bg-yellow-400 p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] rounded"
              animate={{ rotate: [8, -8, 8], x: [0, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap className="w-8 h-8 text-gray-800" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}