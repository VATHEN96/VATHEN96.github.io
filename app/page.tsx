"use client";

import { useWowzaRush } from "@/context/wowzarushContext";
import Navbar from "@/components/navbar";
import { CircleDollarSign, ShieldCheck, Users, TrendingUp, Star, User, Search } from "lucide-react";
import Link from "next/link";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";
import { Metadata } from "next";
import Image from "next/image";

export default function Home() {
  const { isWalletConnected } = useWowzaRush();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Features Section */}
      <Features />
      
      {/* Key Features Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-black dark:text-white">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Milestone-Based Funding */}
            <div className="bg-white dark:bg-black p-6 rounded-lg border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-transform hover:translate-y-1">
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Milestone-Based Funding</h3>
              <p className="text-gray-700 dark:text-gray-300">Only funds are distributed after verification by reaching certain milestones</p>
            </div>
            
            {/* Peer-to-Peer Review System */}
            <div className="bg-white dark:bg-black p-6 rounded-lg border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-transform hover:translate-y-1">
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Peer-to-Peer Review System</h3>
              <p className="text-gray-700 dark:text-gray-300">Built-in governance and feedback from a community of users to ensure trustworthiness</p>
            </div>
            
            {/* Skip Gas Fees, Watch First */}
            <div className="bg-white dark:bg-black p-6 rounded-lg border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-transform hover:translate-y-1">
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Skip Gas Fees, Watch First</h3>
              <p className="text-gray-700 dark:text-gray-300">Try the app without gas fees; just watch first</p>
            </div>
            
            {/* Platform Fees */}
            <div className="bg-white dark:bg-black p-6 rounded-lg border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-transform hover:translate-y-1">
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Platform Fees</h3>
              <p className="text-gray-700 dark:text-gray-300">No upfront fees for creating a campaign; only get 5% fee on funded projects</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <HowItWorks />
      
      {/* Call to Action */}
      <CTA />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}


