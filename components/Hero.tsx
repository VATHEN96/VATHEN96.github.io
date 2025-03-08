"use client"

import { motion } from "framer-motion"
import { ArrowRight, Rocket, Shield, Zap, Coins } from 'lucide-react'
import { useScroll, useTransform } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ClientImage from './ClientImage'

export default function Hero() {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <section className="pt-32 pb-16">
      <div className="w-full px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-black dark:bg-white p-8 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
          >
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl font-bold mb-6 text-white dark:text-black"
            >
              Unlock the power of {"Web3"} Crowdfunding
            </motion.h1>
            <motion.p
              className="text-xl max-w-lg border-2 border-white dark:border-black bg-black dark:bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.5)] text-white dark:text-black mb-5"
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
                  className="bg-white text-black px-8 py-4 text-xl font-bold border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2 dark:bg-black dark:text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Rocket className="w-6 h-6" /> Explore Campaigns
                </motion.button>
              </Link>
              <Link href="/create-campaign">
                <motion.button
                  className="bg-black text-white px-8 py-4 text-xl font-bold border-2 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.5)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2 dark:bg-white dark:text-black dark:border-black dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]"
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
              <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] max-w-xl mx-auto relative overflow-hidden">
                <div className="flex items-center justify-center">
                  <ClientImage 
                    src="/hero-logo.svg" 
                    alt="WowzaRush Logo" 
                    width={500}
                    height={180} 
                    priority 
                    className="transform group-hover:scale-105 transition-all duration-500 logo-glow" 
                  />
                </div>
              </div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              className="absolute top-0 right-0 bg-black dark:bg-white p-4 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded"
              animate={{ rotate: [-8, 8, -8], y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield className="w-8 h-8 text-white dark:text-black" />
            </motion.div>

            <motion.div
              className="absolute bottom-12 left-0 bg-white dark:bg-black p-4 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded"
              animate={{ rotate: [8, -8, 8], x: [0, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap className="w-8 h-8 text-black dark:text-white" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

