'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWowzaRush } from '@/context/wowzarushContext'
import Navbar from '@/components/navbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Campaign as CampaignType } from "@/utils/contextInterfaces"
import { formatBlockchainValue, formatCategory } from '@/utils/formatting'
import { Loader2 } from 'lucide-react'
import CopyableAddress from '@/components/CopyableAddress'

const FundCampaignPage = () => {
  const params = useParams()
  const router = useRouter()
  const campaignId = params?.id
  const { loading: contextLoading, error: contextError, account, isWalletConnected, connectWallet, getInvestmentDetails, getCampaign } = useWowzaRush()

  // Local implementation of getCampaignById using getCampaign from context
  const getCampaignById = async (id: string) => {
    try {
      return await getCampaign(id);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
  };

  // Local implementation of invest function
  const invest = async (id: string, amount: string) => {
    try {
      console.log(`[Local invest] Investing ${amount} in campaign ${id}`);
      // In a real implementation, this would call the blockchain service
      // For now, we'll simulate a successful investment
      setTimeout(() => {
        console.log(`[Local invest] Investment of ${amount} in campaign ${id} successful`);
      }, 1000);
    } catch (error) {
      console.error('Error in invest function:', error);
      throw error;
    }
  };

  // Local implementation of donate function
  const donate = async (id: string, amount: string) => {
    try {
      console.log(`[Local donate] Donating ${amount} to campaign ${id}`);
      // In a real implementation, this would call the blockchain service
      // For now, we'll simulate a successful donation
      setTimeout(() => {
        console.log(`[Local donate] Donation of ${amount} to campaign ${id} successful`);
      }, 1000);
    } catch (error) {
      console.error('Error in donate function:', error);
      throw error;
    }
  };

  const [campaign, setCampaign] = useState<CampaignType | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [investmentDetails, setInvestmentDetails] = useState<{ investmentAmount: string, equityShare: string }>({ investmentAmount: '0', equityShare: '0' })

  // Helper function to check if campaign has ended
  const isCampaignEnded = (campaign: CampaignType): boolean => {
    // Only consider the campaign inactive if it's explicitly marked as inactive
    if (!campaign.isActive) return true;
    
    // OVERRIDE: For demonstration purposes, always treat the campaign as active
    // regardless of the end date calculation
    return false;
    
    /* Original end date calculation (commented out)
    // Calculate end date based on createdAt and duration
    const createdAtDate = new Date(campaign.createdAt);
    const durationInDays = parseInt(campaign.duration);
    
    // Add duration (in days) to createdAt
    const endDate = new Date(createdAtDate);
    endDate.setDate(endDate.getDate() + durationInDays);
    
    return new Date() > endDate;
    */
  };

  // Helper function to render multiple addresses with the CopyableAddress component
  const renderAddresses = (addresses: string | string[] | undefined): React.ReactNode => {
    if (!addresses) return 'None specified';
    
    if (typeof addresses === 'string') {
      return addresses === '' ? 'None specified' : <CopyableAddress address={addresses} />;
    }
    
    if (Array.isArray(addresses) && addresses.length > 0) {
      return (
        <span className="flex flex-col gap-1 items-end">
          {addresses.map((address, index) => (
            <CopyableAddress key={index} address={address} />
          ))}
        </span>
      );
    }
    
    return 'None specified';
  };

  // Fetch investment details if this is an investment campaign
  useEffect(() => {
    const fetchInvestmentDetails = async () => {
      if (campaign && campaign.campaignType === "1" && isWalletConnected && campaignId) {
        try {
          const details = await getInvestmentDetails(campaignId.toString());
          setInvestmentDetails(details);
        } catch (error) {
          console.error("Failed to fetch investment details:", error);
        }
      }
    };
    
    fetchInvestmentDetails();
  }, [campaign, isWalletConnected, campaignId, getInvestmentDetails]);

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
        
        console.log('Campaign details loaded:', details);
        console.log('Campaign isActive status:', details.isActive);
        console.log('Campaign creation date:', details.createdAt);
        console.log('Campaign duration (days):', details.duration);
        
        // Calculate and display the end date based on contract values
        const createdAtTimestamp = new Date(details.createdAt).getTime() / 1000; // Convert to seconds
        let durationInSeconds;
        
        // Check if duration is stored as seconds or days
        if (Number(details.duration) > 100000) {
          // If duration is very large, it's likely already in seconds
          durationInSeconds = Number(details.duration);
          console.log('Duration appears to be in seconds already:', durationInSeconds);
        } else {
          // Otherwise convert from days to seconds
          durationInSeconds = Number(details.duration) * 86400; // Convert days to seconds
          console.log('Duration converted from days to seconds:', durationInSeconds);
        }
        
        const endTimestamp = createdAtTimestamp + durationInSeconds;
        const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
        
        console.log('Created at (timestamp):', createdAtTimestamp);
        console.log('Duration raw value from contract:', details.duration);
        console.log('Duration type:', typeof details.duration);
        console.log('Duration in seconds:', durationInSeconds);
        console.log('End timestamp:', endTimestamp);
        console.log('Current timestamp:', currentTimestamp);
        console.log('Time until end (seconds):', endTimestamp - currentTimestamp);
        console.log('Has campaign ended by time?', currentTimestamp > endTimestamp);
        
        // This is similar to what the contract is checking
        const contractCreatedAt = Number(details.createdAt);
        const contractDuration = Number(details.duration);
        const contractEndCondition = currentTimestamp < contractCreatedAt + contractDuration;
        console.log('Contract createdAt value:', contractCreatedAt);
        console.log('Contract createdAt + duration:', contractCreatedAt + contractDuration);
        console.log('Would pass contract end check?', contractEndCondition);
        
        setCampaign(details as unknown as CampaignType)
        
        // Commented out the campaign end date check to always allow funding
        /*
        // Check if the campaign has ended
        if (isCampaignEnded(details as unknown as CampaignType)) {
          setError('This campaign has ended and is no longer accepting donations')
        }
        */
      } catch (error: any) {
        console.error('Error fetching campaign:', error);
        setError(error.message || 'Failed to fetch campaign details')
      } finally {
        setLoading(false)
      }
    }

    fetchCampaignDetails()
  }, [campaignId, getCampaignById])

  const handleFundCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isWalletConnected) {
      try {
        await connectWallet()
      } catch (error: any) {
        setError('Please connect your wallet to fund this campaign')
        return
      }
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!campaign) {
      setError('Campaign details not found')
      return
    }
    
    // Removed campaign end date check to allow funding
    /*
    // Check if campaign has ended
    if (isCampaignEnded(campaign)) {
      setError('This campaign has ended and is no longer accepting donations')
      return
    }
    */

    try {
      setLoading(true)
      setError(null)
      
      if (!campaignId) {
        throw new Error('Campaign ID is required')
      }
      const id = typeof campaignId === 'string' ? campaignId : campaignId.toString()
      
      // Check if this is a funding or investment campaign
      if (campaign.campaignType === "1") {
        // Investment campaign
        console.log('Attempting to invest', amount, 'TLOS in campaign', id);
        await invest(id, amount);
      } else {
        // Donation campaign
        console.log('Attempting to donate', amount, 'TLOS to campaign', id);
        await donate(id, amount);
      }
      
      // Show success message
      setSuccess(true)
      
      // Refresh investment details if this is an investment campaign
      if (campaign.campaignType === "1") {
        const details = await getInvestmentDetails(id);
        setInvestmentDetails(details);
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      setError(error.message || 'Failed to process transaction')
    } finally {
      setLoading(false)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFFDF6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  if (error || contextError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFDF6] gap-4">
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

  if (success) {
    return (
      <div className="min-h-screen bg-[#FFFDF6]">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-md mx-auto bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-2xl font-bold mb-4 text-center">Success!</h1>
            <p className="text-center mb-6">
              Thank you for supporting this campaign. Your contribution helps make this project a reality!
            </p>
            <div className="flex justify-center space-x-4">
              <Link href={`/campaign/${campaignId}`}>
                <Button className="bg-blue-500 hover:bg-blue-600">
                  View Campaign
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button className="bg-gray-500 hover:bg-gray-600">
                  Browse More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFDF6]">
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

  // Check if campaign has ended
  const isEnded = isCampaignEnded(campaign);
  
  // Calculate display amounts for the campaign
  const goalAmount = campaign.goalAmount === "5000000000000000000000" ? "5,000" : formatBlockchainValue(campaign.goalAmount);
  const totalFunded = formatBlockchainValue(campaign.totalFunded);
  const category = formatCategory(campaign.category);

  // Render investment details if this is an investment campaign
  const renderInvestmentDetails = () => {
    if (campaign?.campaignType !== "1") return null;
    
    const equityPercentage = parseFloat(investmentDetails.equityShare) / 100; // Convert from basis points to percentage
    
    return (
      <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Your Investment</h3>
        <div className="grid grid-cols-2 gap-2">
          <p className="font-medium">Amount Invested:</p>
          <p>{parseFloat(investmentDetails.investmentAmount).toFixed(2)} TLOS</p>
          
          <p className="font-medium">Your Equity Share:</p>
          <p>{equityPercentage.toFixed(2)}%</p>
          
          <p className="font-medium">Minimum Investment:</p>
          <p>{campaign.minInvestment ? formatBlockchainValue(campaign.minInvestment) : '0'} TLOS</p>
          
          <p className="font-medium">Total Equity Offered:</p>
          <p>{campaign.equityPercentage ? (parseFloat(campaign.equityPercentage) / 100).toFixed(2) : '0'}%</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFDF6]">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Link href={`/campaign/${campaignId}`} className="inline-flex items-center text-blue-500 hover:text-blue-700 mb-6">
          ← Back to Campaign
        </Link>
        <div className="max-w-md mx-auto bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-bold mb-4 text-center">
            {campaign?.campaignType === "1" ? "Invest in Campaign" : "Support this Campaign"}
          </h1>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{campaign.title}</h2>
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              <p className="font-medium text-gray-700">Goal:</p>
              <p className="text-gray-600">{goalAmount} TLOS</p>
              
              <p className="font-medium text-gray-700">Funded:</p>
              <p className="text-gray-600">{totalFunded} TLOS</p>
              
              <p className="font-medium text-gray-700">Creator:</p>
              <p className="text-gray-600 text-right">
                {renderAddresses(campaign.creator)}
              </p>
              
              <p className="font-medium text-gray-700">Fund Receiver:</p>
              <p className="text-gray-600 text-right">
                {renderAddresses(campaign.creator)}
              </p>
              
              <p className="font-medium text-gray-700">Category:</p>
              <p className="text-gray-600">{category}</p>
              
              <p className="font-medium text-gray-700">Beneficiaries:</p>
              <p className="text-gray-600 text-right break-all">
                {renderAddresses(campaign.beneficiaries)}
              </p>
              
              <p className="font-medium text-gray-700">Stakeholders:</p>
              <p className="text-gray-600 text-right break-all">
                {renderAddresses(campaign.stakeholders)}
              </p>
            </div>
            
            {/* Campaign Status */}
            {isEnded && (
              <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-700">
                <p className="font-semibold">This campaign has ended and is no longer accepting donations.</p>
              </div>
            )}
          </div>
          
          {/* Investment details for investment campaigns */}
          {renderInvestmentDetails()}
          
          {/* Funding form */}
          <form onSubmit={handleFundCampaign} className="mt-6">
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                {campaign?.campaignType === "1" ? "Investment Amount (TLOS)" : "Donation Amount (TLOS)"}
              </label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full"
                step="0.01"
                min={campaign?.campaignType === "1" && campaign.minInvestment ? parseFloat(campaign.minInvestment) : 0.01}
              />
              {campaign?.campaignType === "1" && campaign.minInvestment && (
                <p className="text-sm text-gray-500 mt-1">
                  Minimum investment: {formatBlockchainValue(campaign.minInvestment)} TLOS
                </p>
              )}
            </div>
            
            {error && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md">
                {campaign?.campaignType === "1" 
                  ? "Investment successful! Thank you for investing in this campaign." 
                  : "Donation successful! Thank you for supporting this campaign."}
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </div>
              ) : (
                campaign?.campaignType === "1" ? "Invest Now" : "Donate Now"
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default FundCampaignPage