'use client';

import Link from 'next/link';
import { Campaign } from '@/utils/contextInterfaces';
import { Button } from './ui/button';
import { formatBlockchainValue, formatCategory, calculateProgress, calculateDaysLeft } from '@/utils/formatting';
import { useWowzaRush, VerificationLevel } from '@/context/wowzarushContext';
import { useEffect, useState } from 'react';
import VerificationBadge from './VerificationBadge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';
import { Settings } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  compact?: boolean;
}

export default function CampaignCard({ campaign, compact = false }: CampaignCardProps) {
  const { getCreatorProfile, account } = useWowzaRush();
  const [creatorName, setCreatorName] = useState<string>('');
  const [creatorImage, setCreatorImage] = useState<string>('');
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>(VerificationLevel.NONE);
  
  const isCreator = account && campaign.creator && 
    (typeof campaign.creator === 'string' && typeof account === 'string') && 
    account.toLowerCase() === campaign.creator.toLowerCase();
  
  useEffect(() => {
    const loadCreatorInfo = async () => {
      if (campaign.creator) {
        try {
          // First check if we already have creator info in the campaign object (for mock data)
          if (campaign.creatorName || (campaign.creatorProfile && campaign.creatorProfile.displayName)) {
            setCreatorName(campaign.creatorName || campaign.creatorProfile?.displayName || '');
            setCreatorImage(campaign.creatorProfile?.profileImageUrl || '');
            setVerificationLevel(campaign.creatorProfile?.verificationLevel || VerificationLevel.NONE);
            return; // Skip API call if we already have the data
          }
          
          // Otherwise load from API
          // First ensure the creator is a string
          const creatorAddress = typeof campaign.creator === 'string' 
            ? campaign.creator 
            : typeof campaign.creator === 'object' && campaign.creator !== null 
              ? String(campaign.creator) 
              : '';
              
          if (!creatorAddress) {
            console.warn('Invalid creator address format:', campaign.creator);
            setCreatorName('Unknown Creator');
            return;
          }
          
          const profile = await getCreatorProfile(creatorAddress);
          if (profile) {
            setCreatorName(profile.displayName || `Creator ${creatorAddress.slice(0, 6)}`);
            setCreatorImage(profile.profileImageUrl || '');
            setVerificationLevel(profile.verificationLevel);
          }
        } catch (error) {
          console.error('Error loading creator profile:', error);
          // Set fallback values if loading fails
          const displayAddress = typeof campaign.creator === 'string' 
            ? campaign.creator.slice(0, 6) 
            : 'Unknown';
          setCreatorName(`Creator ${displayAddress}`);
        }
      }
    };
    
    loadCreatorInfo();
  }, [campaign.creator, campaign.creatorName, campaign.creatorProfile, getCreatorProfile]);

  // Debug logging
  console.log(`Rendering CampaignCard for campaign ${campaign.id} with title: ${campaign.title}`);
  console.log(`Campaign has milestones:`, campaign.milestones);
  console.log(`Milestone count:`, campaign.milestones?.length || 0);

  // Use our formatting utilities with safeguards
  const progress = calculateProgress(campaign.totalFunded || campaign.amountRaised || 0, campaign.goalAmount || 0);
  const daysLeft = calculateDaysLeft(getDeadline());
  const formattedCategory = formatCategory(campaign.category || 0);
  const formattedGoalAmount = formatBlockchainValue(campaign.goalAmount || 0);
  const formattedTotalFunded = formatBlockchainValue(campaign.totalFunded || campaign.amountRaised || 0);
  
  // Get milestone count safely
  const milestoneCount = Array.isArray(campaign.milestones) ? campaign.milestones.length : 0;

  // Add duration to createdAt to get a more accurate deadline
  function getDeadline() {
    try {
      // First check if we have an explicit deadline
      if (campaign.deadline) {
        return new Date(campaign.deadline);
      }
      
      // Otherwise calculate it from createdAt + duration
      if (campaign.createdAt) {
        const createdAt = new Date(campaign.createdAt);
        
        // Check if date is valid
        if (isNaN(createdAt.getTime())) {
          throw new Error('Invalid createdAt date');
        }
        
        // Parse duration - assuming it's in days
        // If it fails, default to 30 days
        const durationInDays = parseInt(String(campaign.duration)) || 30;
        
        const deadline = new Date(createdAt);
        deadline.setDate(createdAt.getDate() + durationInDays);
        
        return deadline;
      }
      
      // Fallback to current date + 30 days
      throw new Error('Missing createdAt date');
    } catch (error) {
      console.warn('Error calculating deadline, using fallback:', error);
      // If any calculation fails, return a date 30 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      return defaultDate;
    }
  };

  // Check if campaign has a valid image URL
  // Only consider an image URL valid if it's not empty
  const hasValidImage = Boolean(
    (campaign.imageUrl && campaign.imageUrl.trim().length > 0) || 
    (campaign.media && campaign.media.length > 0 && campaign.media[0] && campaign.media[0].trim().length > 0)
  );

  return (
    <div className={`bg-white dark:bg-black ${compact ? 'p-4' : 'p-6'} rounded-lg border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all duration-200`}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${campaign.creator}`} className="hover:opacity-80 transition-opacity">
              <Avatar className={`${compact ? 'h-6 w-6' : 'h-8 w-8'} border border-black dark:border-white`}>
                <AvatarImage src={creatorImage} alt={creatorName} />
                <AvatarFallback className="bg-black text-white dark:bg-white dark:text-black">{creatorName.slice(0, 2)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex flex-col">
              <Link href={`/profile/${campaign.creator}`} className="text-sm font-medium hover:underline text-black dark:text-white">
                {creatorName}
              </Link>
              <VerificationBadge level={verificationLevel} showLabel={false} size="sm" />
            </div>
          </div>
          {!compact && (
            <span className="bg-white dark:bg-black px-2 py-1 rounded-full text-sm font-semibold border-2 border-black dark:border-white text-black dark:text-white">
              {formattedCategory}
            </span>
          )}
        </div>
        
        <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-black dark:text-white`}>
          {campaign.title} (ID: {campaign.id.toString().substring(0, 4)}...)
        </h3>

        {hasValidImage && (
          <div className="rounded-lg overflow-hidden mb-4 h-40 relative">
            <Image
              src={campaign.imageUrl || campaign.media?.[0] || ''}
              alt={campaign.title}
              fill
              style={{ objectFit: "cover" }}
              priority={true}
            />
          </div>
        )}

        {!compact && (
          <p className="text-black dark:text-white line-clamp-2">{campaign.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-black dark:text-white">
            <span>Progress</span>
            <span className="font-semibold">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
            <div
              className="bg-black dark:bg-white h-2.5 rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-black dark:text-white">
            <span>{formattedTotalFunded} TLOS raised</span>
            <span>Goal: {formattedGoalAmount} TLOS</span>
          </div>
        </div>

        {!compact && (
          <div className="flex justify-between items-center text-sm">
            <div className="space-y-1">
              <p className="text-black dark:text-white">Time Left</p>
              <p className="font-semibold text-black dark:text-white">{daysLeft} days</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-black dark:text-white">Milestones</p>
              <p className="font-semibold text-black dark:text-white">{milestoneCount}</p>
            </div>
          </div>
        )}

        <div className={`${compact ? 'pt-2' : 'pt-4'} flex gap-4`}>
          {compact ? (
            <>
              <Link href={`/fund-campaign/${campaign.id}`} className="flex-1">
                <Button
                  className="w-full bg-black hover:bg-gray-800 text-white font-semibold dark:bg-white dark:text-black dark:hover:bg-gray-200 border-2 border-black dark:border-white"
                  variant="default"
                >
                  Fund Now
                </Button>
              </Link>
              {isCreator && (
                <Link href={`/manage-campaign/${campaign.id}`} className="flex-1">
                  <Button
                    className="w-full bg-white hover:bg-gray-100 text-black font-semibold dark:bg-black dark:text-white dark:hover:bg-gray-900 border-2 border-black dark:border-white"
                    variant="outline"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href={`/campaign/${campaign.id}`} className="flex-1">
                <Button
                  className="w-full bg-black hover:bg-gray-800 text-white font-semibold dark:bg-white dark:text-black dark:hover:bg-gray-200 border-2 border-black dark:border-white"
                  variant="default"
                >
                  View Details
                </Button>
              </Link>
              {isCreator ? (
                <Link href={`/manage-campaign/${campaign.id}`} className="flex-1">
                  <Button
                    className="w-full bg-white hover:bg-gray-100 text-black font-semibold dark:bg-black dark:text-white dark:hover:bg-gray-900 border-2 border-black dark:border-white"
                    variant="outline"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Campaign
                  </Button>
                </Link>
              ) : (
                <Link href={`/fund-campaign/${campaign.id}`} className="flex-1">
                  <Button
                    className="w-full bg-white hover:bg-gray-100 text-black font-semibold dark:bg-black dark:text-white dark:hover:bg-gray-900 border-2 border-black dark:border-white"
                    variant="outline"
                  >
                    Fund Now
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}