"use client"

import { motion } from "framer-motion"

const partners = [
  "Ethereum", "Polygon", "Chainlink", "The Graph", "IPFS", "Filecoin"
]

export default function Partners() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-16"
        >
          Powered By
        </motion.h2>

        <div className="flex flex-wrap justify-center gap-8">
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-900 px-8 py-4 rounded-full border border-gray-800"
            >
              <span className="text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                {partner}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

