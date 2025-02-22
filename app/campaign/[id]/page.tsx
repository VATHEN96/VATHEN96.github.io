'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useWowzarush } from '@/context/GoalZillaContext'
import Link from 'next/link'
import Navbar from '@/components/navbar'

interface CampaignDetails {
    title: string
    description: string
    proofOfWork: string
    beneficiaries: string
    media: string[]
}

export default function CampaignDetailPage() {
    const [campaignDetails, setCampaignDetails] = useState<CampaignDetails | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const params = useParams()
    const campaignId = params?.id as string

    const router = useRouter()
    const { getCampaignById } = useGoalZilla()

    useEffect(() => {
        if (!campaignId) return

        const fetchDetails = async () => {
            try {
                setLoading(true)
                const details = await getCampaignById(campaignId)
                if (!details) {
                    throw new Error('Campaign not found')
                }
                // Manually construct the object so that all properties of CampaignDetails are provided.
                const detailsWithMedia: CampaignDetails = {
                    title: details.title,
                    description: details.description,
                    proofOfWork: details.proofOfWork,
                    beneficiaries: details.beneficiaries,
                    media: []  // Default value for media since details.media doesn't exist
                }
                setCampaignDetails(detailsWithMedia)
            } catch (error: any) {
                setError(error.message || 'Failed to fetch campaign details')
                console.error('Error fetching campaign details:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDetails()
    }, [campaignId, getCampaignById])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#90EE90]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#90EE90] gap-4">
                <div className="bg-white p-8 rounded shadow-lg border-2 border-black">
                    <p className="text-red-500 font-bold">{error}</p>
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

    if (!campaignDetails) {
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
        <div className="min-h-screen bg-[#F4F7F6]">
            <Navbar />

            <main className="container mx-auto my-5 px-4 py-8 sm:px-6 lg:px-8">
                <div className="bg-white border-4 my-8 border-black p-8 rounded-lg shadow-2xl max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold text-center mb-8 border-b-4 border-black pb-4">
                        {campaignDetails.title}
                    </h1>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="bg-yellow-400 px-4 py-1 rounded-lg shadow-md">Description</span>
                            </h2>
                            <p className="text-lg text-gray-700 leading-relaxed">{campaignDetails.description}</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="bg-yellow-400 px-4 py-1 rounded-lg shadow-md">Proof of Work</span>
                            </h2>
                            <p className="text-lg text-gray-700 leading-relaxed">{campaignDetails.proofOfWork}</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="bg-yellow-400 px-4 py-1 rounded-lg shadow-md">Beneficiaries</span>
                            </h2>
                            <p className="text-lg text-gray-700 leading-relaxed">{campaignDetails.beneficiaries}</p>
                        </section>

                        {campaignDetails.media && campaignDetails.media.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                    <span className="bg-yellow-400 px-4 py-1 rounded-lg shadow-md">Media</span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {campaignDetails.media.map((mediaLink, index) => (
                                        <div
                                            key={index}
                                            className="border-2 border-black rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                                        >
                                            <img
                                                src={mediaLink}
                                                alt={`Campaign media ${index + 1}`}
                                                className="w-full h-full object-cover hover:scale-105 transition-all duration-300"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <div className="flex justify-center mt-8">
                            <Link href={`/fund-campaign/${campaignId}`}>
                                <button
                                    className="bg-[#ffff29] px-8 py-3 rounded-lg border-2 text-black border-black hover:bg-yellow-300 hover:-translate-y-1 transition-colors text-lg font-bold flex items-center gap-2"
                                >
                                    I want to fund this campaign <span role="img" aria-label="money">💶</span>
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
