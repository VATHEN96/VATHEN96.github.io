"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { ArrowRight, BarChart2, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
// Since Navbar is exported as default, use default import:
import Navbar from "@/components/navbar"

export default function LandingPage() {
    const targetRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"],
    })

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

    return (
        <div className="min-h-screen bg-[#0D0D0D] text-white selection:bg-purple-500/30">
            <Navbar />

            {/* Hero Section */}
            <section ref={targetRef} className="relative overflow-hidden px-4 pt-32 pb-20 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ y, opacity }}
                    className="relative mx-auto max-w-7xl"
                >
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-4xl font-light tracking-tight sm:text-6xl mb-6"
                            >
                                Your Gateway to{" "}
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                    Web3 & Blockchain
                                </span>{" "}
                                Innovation.
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="text-lg text-gray-400 mb-8 max-w-xl"
                            >
                                As the digital landscape continues to evolve, our mission is to empower individuals and businesses alike with decentralized solutions that revolutionize.
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="flex flex-wrap gap-4"
                            >
                                <Button
                                    className="bg-[#6C3CE9] hover:bg-[#5B2ED9] text-white rounded-full px-6 group relative overflow-hidden"
                                >
                                    <span className="relative z-10">Get Started for free</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-full px-6 border-gray-700 text-white hover:bg-gray-800 group"
                                >
                                    See All Services
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </motion.div>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="relative"
                        >
                            <div className="relative z-10">
                                <Image
                                    // Use a Cloudinary URL instead of a local image path.
                                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_400,c_fill/wowzarush/placeholder.svg`}
                                    alt="Hero illustration"
                                    width={400}
                                    height={400}
                                    className="w-full"
                                />
                            </div>
                            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl animate-pulse" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Floating Elements */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-500 rounded-full animate-float" />
                <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-pink-500 rounded-full animate-float-delayed" />
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-500 rounded-full animate-float" />
            </section>

            {/* Partners Section */}
            <PartnersSection />

            {/* Features Section */}
            <FeaturesSection />

            {/* Case Studies Section */}
            <CaseStudiesSection />

            {/* Integration Section */}
            <IntegrationSection />
        </div>
    )
}

function PartnersSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    return (
        <section ref={ref} className="py-12 border-t border-gray-800">
            <div className="container mx-auto px-4">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="text-center text-gray-500 mb-8"
                >
                    Powering tools and integrations from companies all around the world
                </motion.p>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 0.7 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center"
                >
                    {["Rippling", "Glasspass", "Hotjar", "Squarespace", "Gumroad", "Hopin"].map((partner, i) => (
                        <motion.div
                            key={partner}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                            className="text-gray-400 font-medium hover:text-white transition-colors cursor-pointer"
                        >
                            {partner}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}

function FeaturesSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    return (
        <section ref={ref} className="py-24">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <Image
                            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_400,c_fill/wowzarush/placeholder.svg`}
                            alt="3D Blockchain illustration"
                            width={400}
                            height={400}
                            className="w-full relative z-10"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl" />
                    </motion.div>
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8 }}
                            className="text-3xl font-light mb-8"
                        >
                            Developing Blockchain Solutions for Your Needs
                        </motion.h2>
                        <div className="grid gap-8">
                            {[
                                {
                                    icon: <BarChart2 className="h-6 w-6 text-purple-500" />,
                                    title: "Scalable",
                                    description: "The scalable blockchain market refers to the segment of the blockchain industry that focuses on developing."
                                },
                                {
                                    icon: <Shield className="h-6 w-6 text-purple-500" />,
                                    title: "Scalable",
                                    description: "Scaling business partitioning the blockchain network into smaller groups called shards."
                                }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                                    className="flex gap-4 group"
                                >
                                    <div className="transition-transform group-hover:scale-110 group-hover:rotate-6">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-2">{feature.title}</h3>
                                        <p className="text-gray-400">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function CaseStudiesSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    return (
        <section ref={ref} className="py-24 bg-black/30">
            <div className="container mx-auto px-4">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="text-3xl font-light mb-4"
                >
                    Most secured<br />Blockchain Solutions.
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-gray-400 mb-12 max-w-xl"
                >
                    Reduce costs, make effectively, and make your business come alive. Hundreds of companies use CrowdChain 360 to build fast.
                </motion.p>
                <div className="grid md:grid-cols-2 gap-8">
                    {[
                        {
                            title: "Impactful Blockchain Success Journeys",
                            description: "Take the first step towards embracing the transformative power of..."
                        },
                        {
                            title: "Navigating the Blockchain Frontier",
                            description: "Take the first step towards embracing the blockchain revolution..."
                        }
                    ].map((study, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                            className="group bg-gray-900/50 rounded-lg p-6 hover:bg-gray-800/50 transition-colors"
                        >
                            <h3 className="text-xl mb-4">{study.title}</h3>
                            <p className="text-gray-400 mb-4">{study.description}</p>
                            <Link href="#" className="inline-flex items-center text-purple-500 hover:text-purple-400 transition-colors">
                                See Case Study <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <div className="mt-4 overflow-hidden rounded-lg">
                                <Image
                                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_200,c_fill/wowzarush/placeholder.svg`}
                                    alt="Case study"
                                    width={300}
                                    height={200}
                                    className="w-full transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function IntegrationSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    return (
        <section ref={ref} className="py-24">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <Image
                            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_400,c_fill/wowzarush/placeholder.svg`}
                            alt="3D Integration illustration"
                            width={400}
                            height={400}
                            className="w-full relative z-10"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl" />
                    </motion.div>
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8 }}
                            className="text-3xl font-light mb-4"
                        >
                            Integration with existing blockchain networks
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-gray-400"
                        >
                            We design and develop smart contracts tailored to your requirements, ensuring that they accurately reflect the terms of your agreement and adhere to best practices in coding and security.
                        </motion.p>
                    </div>
                </div>
            </div>
        </section>
    )
}

