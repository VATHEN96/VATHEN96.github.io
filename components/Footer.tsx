"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Twitter, Github, DiscIcon as Discord } from 'lucide-react'

export default function Footer() {
  const links = {
    Product: ['Features', 'Security', 'Team', 'Enterprise'],
    Support: ['Documentation', 'Guides', 'API Status', 'Forums'],
    Company: ['About', 'Blog', 'Careers', 'Press'],
    Legal: ['Privacy', 'Terms', 'Cookie Policy', 'License']
  }

  return (
    <footer className="bg-black text-white py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold mb-4">GoalZilla</h3>
              <p className="text-gray-400 mb-6 max-w-sm">
                Empowering innovation through transparent, milestone-based crowdfunding on the blockchain.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="hover:text-[#3498db] transition-colors">
                  <Twitter className="w-6 h-6" />
                </Link>
                <Link href="https://github.com/manovHacksaw/zugrama" className="hover:text-[#3498db] transition-colors">
                  <Github className="w-6 h-6" />
                </Link>
                
              </div>
            </motion.div>
          </div>

          {Object.entries(links).map(([category, items], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <h4 className="text-lg font-bold mb-4">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <Link 
                      href="#" 
                      className="text-gray-400 hover:text-[#3498db] transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>© 2024 GoalZilla. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

