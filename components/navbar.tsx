"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet } from 'lucide-react'
import { useGoalZilla } from "@/context/GoalZillaContext"

export default function Navbar() {
    const { connectWallet, connectedAccount, loading, isConnected } = useGoalZilla();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFDF6] border-b-4 border-black">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between text-gray-600 h-16">
                    <Link
                        href="/"
                        className="text-2xl  font-bold bg-yellow-400 px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                        GoalZilla
                    </Link>

                    <nav className="hidden md:flex items-center space-x-6">
                        <Link
                            href="/campaigns"
                            className="text-lg font-medium hover:bg-yellow-200 hover:text-black px-3 py-1 rounded-md transition-colors"
                        >
                            Campaigns
                        </Link>
                        {["About", "Solutions", "Customers"].map((item) => (
                            <Link
                                key={item}
                                href="#"
                                className="text-lg font-medium hover:bg-yellow-200 px-3 py-1 rounded-md transition-colors"
                            >
                                {item}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/create-campaign">
                            <Button
                                className="bg-green-500 hover:bg-green-600 text-black font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-md"
                            >
                                Create Campaign
                            </Button>
                        </Link>
                        <Button
                            onClick={connectWallet}
                            className="bg-[#10c7e3] hover:bg-[#00a9dd] text-black font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-md flex items-center gap-2"
                        >
                            <Wallet size={20} />
                            {isConnected ? `${connectedAccount!.slice(0, 6)}...${connectedAccount!.slice(-4)}` : "Connect Wallet"}
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}
