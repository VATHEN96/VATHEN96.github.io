"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { Search, ArrowRight } from "lucide-react";
import { useWowzarush } from "@/context/wowzarushContext";
import type { Campaign } from "@/utils/types";

// Helper: Calculate the number of days left until a campaign's deadline
const calculateDaysLeft = (deadline: Date | string): number => {
    const now = new Date();
    const endDate = new Date(deadline);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

export default function CampaignsPage() {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const { fetchCampaigns, campaigns, loading, error } = useWowzarush();

    // Fetch campaigns on mount
    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    // Filter campaigns based on search term (checks title and category)
    const filteredCampaigns: Campaign[] = campaigns.filter((campaign) =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#FFFDF6]">
            <Navbar />
            <main className="container mx-auto px-4 pt-24 pb-12">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold">Explore Campaigns</h1>
                    <Link href="/create-campaign">
                        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                            Create Campaign
                        </Button>
                    </Link>
                </div>

                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-4 border-black text-lg focus:outline-none focus:ring-4 ring-yellow-400 rounded-md"
                    />
                </div>

                {/* Display loading and error messages if needed */}
                {loading ? (
                    <p className="text-center text-lg">Loading campaigns...</p>
                ) : error ? (
                    <p className="text-center text-red-500 text-lg">Error: {error}</p>
                ) : filteredCampaigns.length === 0 ? (
                    <p className="text-center text-lg">No campaigns found.</p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCampaigns.map((campaign) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                <h2 className="text-2xl font-bold mb-2">{campaign.title}</h2>
                                <p className="text-gray-600 mb-4">{campaign.category}</p>
                                <div className="mb-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-yellow-400 h-2.5 rounded-full"
                                            style={{
                                                width: `${(campaign.totalFunded / campaign.goalAmount) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold">
                                        {campaign.totalFunded.toFixed(2)} TLOS raised
                                    </span>
                                    <span className="text-gray-600">
                                        {campaign.goalAmount} TLOS goal
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        {calculateDaysLeft(campaign.deadline)} days left
                                    </span>
                                    <Link href={`/campaign/${campaign.id}`}>
                                        <Button className="bg-[#00FF7F] hover:bg-[#00DD7F] text-black font-bold border-2 border-black rounded-md flex items-center gap-2">
                                            View Details <ArrowRight size={16} />
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
