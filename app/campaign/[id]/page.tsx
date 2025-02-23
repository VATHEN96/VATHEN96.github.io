'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useWowzarush } from '@/context/wowzarushContext'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import type { Campaign } from "@/utils/types"

export default function CampaignDetailPage() {
    const params = useParams()
    const campaignId = params?.id
    const { getCampaign, loading: contextLoading, error: contextError, getCampaignById } = useWowzarush()
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()

    useEffect(() => {
        const fetchCampaignDetails = async () => {
            if (!campaignId) {
                setError('Campaign ID is required')
                return
            }
            try {
                setLoading(true)
                const id = typeof campaignId === 'string' ? campaignId : campaignId.toString()
                const details = await getCampaignById(id)
                if (!details) {
                    throw new Error('Campaign not found')
                }
                setCampaign(details)
            } catch (error: any) {
                setError(error.message || 'Failed to fetch campaign details')
            } finally {
                setLoading(false)
            }
        }

        fetchCampaignDetails()
    }, [campaignId, getCampaignById])

    if (loading || contextLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#90EE90]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        )
    }

    if (error || contextError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#90EE90] gap-4">
                <div className="bg-white p-8 rounded shadow-lg border-2 border-black">
                    <p className="text-red-500 font-bold">{error || contextError}</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-all duration-300"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#90EE90]">
                <p className="text-red-500 font-bold">Campaign not found</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-all duration-300"
                >
                    Go Back
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FFFDF6]">
            <Navbar />
            <main className="container mx-auto px-4 pt-24 pb-12">
                <h1 className="text-4xl font-bold mb-8">{campaign.title}</h1>
                <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-gray-600 mb-4">{campaign.description}</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <h2 className="font-bold">Goal Amount</h2>
                            <p>{campaign.goalAmount} TLOS</p>
                        </div>
                        <div>
                            <h2 className="font-bold">Total Funded</h2>
                            <p>{campaign.totalFunded} TLOS</p>
                        </div>
                        <div>
                            <h2 className="font-bold">Creator</h2>
                            <p className="truncate">{campaign.creator}</p>
                        </div>
                        <div>
                            <h2 className="font-bold">Category</h2>
                            <p>{campaign.category}</p>
                        </div>
                    </div>
                    <div className="mb-8">
                        <h2 className="font-bold mb-4">Milestones</h2>
                        {campaign.milestones.map((milestone) => (
                            <div key={milestone.id} className="mb-4 p-4 border-2 border-black">
                                <h3 className="font-bold">{milestone.name}</h3>
                                <p>Target: {milestone.target} TLOS</p>
                                <p>Status: {milestone.completed ? 'Completed' : 'In Progress'}</p>
                                {milestone.dueDate && (
                                    <p>Due: {milestone.dueDate.toLocaleDateString()}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
