"use client";

import { motion } from "framer-motion";

export default function Stats() {
  const stats = [
    {
      title: "Milestone-Based Funding",
      description:
        "Ensure funds are used effectively by releasing them in stages, tied to specific project milestones.",
    },
    {
      title: "Peer-to-Peer Review System",
      description:
        "Build trust with transparent feedback from a community-driven review process.",
    },
    {
      title: "Skip Gas Fees, Watch Ads",
      description:
        "Fund projects without incurring gas fees by opting to watch ads.",
    },
    {
      title: "Platform Fees",
      description:
        "For every funding withdrawal, only 2% will be retained as platform fees.",
    },
  ];

  return (
    <section className="py-20 bg-black dark:bg-white border-y-2 border-black dark:border-white text-white dark:text-black">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-white dark:text-black"
        >
          Key Features
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-white dark:bg-black p-6 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all"
            >
              <h3 className="text-2xl font-bold mb-4 text-black dark:text-white">
                {stat.title}
              </h3>
              <p className="text-black dark:text-white">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

