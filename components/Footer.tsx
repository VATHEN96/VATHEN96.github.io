"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Twitter, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-black dark:bg-white text-white dark:text-black py-20">
      <div className="w-full px-4">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-3xl font-bold mb-4">wowzarush</h3>
            <p className="text-gray-300 dark:text-gray-700 mb-6 max-w-sm">
              Empowering innovation through transparent, milestone-based crowdfunding on the blockchain.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="#" className="hover:text-gray-400 dark:hover:text-gray-600 transition-colors">
                <Twitter className="w-6 h-6" />
              </Link>
              <Link href="https://github.com/manovHacksaw/zugrama" className="hover:text-gray-400 dark:hover:text-gray-600 transition-colors">
                <Github className="w-6 h-6" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}


