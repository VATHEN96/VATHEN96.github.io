'use client';

import Link from 'next/link';
import { Campaign } from '@/utils/contextInterfaces';
import { Button } from './ui/button';
import { formatBlockchainValue, formatCategory, calculateProgress, calculateDaysLeft } from '@/utils/formatting';
import { useWowzaRush, VerificationLevel } from '@/context/wowzarushContext';
import { useEffect, useState } from 'react';
import VerificationBadge from './VerificationBadge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const { getCreatorProfile } = useWowzaRush();
  const [creatorName, setCreatorName] = useState<string>('');
  const [creatorImage, setCreatorImage] = useState<string>('');
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>(VerificationLevel.NONE);
  
  useEffect(() => {
    const loadCreatorInfo = async () => {
      if (campaign.creator) {
        try {
          const profile = await getCreatorProfile(campaign.creator);
          if (profile) {
            setCreatorName(profile.displayName || `Creator ${campaign.creator.slice(0, 6)}`);
            setCreatorImage(profile.profileImageUrl || '');
            setVerificationLevel(profile.verificationLevel);
          }
        } catch (error) {
          console.error('Error loading creator profile:', error);
        }
      }
    };
    
    loadCreatorInfo();
  }, [campaign.creator, getCreatorProfile]);

  // Debug logging
  console.log(`Rendering CampaignCard for campaign ${campaign.id} with title: ${campaign.title}`);
  console.log(`Campaign has milestones:`, campaign.milestones);
  console.log(`Milestone count:`, campaign.milestones?.length || 0);

  // Use our formatting utilities
  const progress = calculateProgress(campaign.totalFunded, campaign.goalAmount);
  const daysLeft = calculateDaysLeft(getDeadline());
  const formattedCategory = formatCategory(campaign.category);
  const formattedGoalAmount = formatBlockchainValue(campaign.goalAmount);
  const formattedTotalFunded = formatBlockchainValue(campaign.totalFunded);

  // Add duration to createdAt to get a more accurate deadline
  function getDeadline() {
    try {
      const createdAt = new Date(campaign.createdAt);
      // Parse duration - assuming it's in days
      // If it fails, default to 30 days
      const durationInDays = parseInt(campaign.duration) || 30;
      
      const deadline = new Date(createdAt);
      deadline.setDate(createdAt.getDate() + durationInDays);
      
      return deadline;
    } catch (error) {
      // If any calculation fails, return a date 30 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      return defaultDate;
    }
  };

  return (
    <div className="bg-white dark:bg-black p-6 rounded-lg border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${campaign.creator}`} className="hover:opacity-80 transition-opacity">
              <Avatar className="h-8 w-8 border border-black dark:border-white">
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
          <span className="bg-white dark:bg-black px-2 py-1 rounded-full text-sm font-semibold border-2 border-black dark:border-white text-black dark:text-white">
            {formattedCategory}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-black dark:text-white">{campaign.title}</h3>

        <p className="text-black dark:text-white line-clamp-2">{campaign.description}</p>

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

        <div className="flex justify-between items-center text-sm">
          <div className="space-y-1">
            <p className="text-black dark:text-white">Time Left</p>
            <p className="font-semibold text-black dark:text-white">{daysLeft} days</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-black dark:text-white">Milestones</p>
            <p className="font-semibold text-black dark:text-white">{Array.isArray(campaign.milestones) ? campaign.milestones.length : 0}</p>
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <Link href={`/campaign/${campaign.id}`} className="flex-1">
            <Button
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold dark:bg-white dark:text-black dark:hover:bg-gray-200 border-2 border-black dark:border-white"
              variant="default"
            >
              View Details
            </Button>
          </Link>
          <Link href={`/fund-campaign/${campaign.id}`} className="flex-1">
            <Button
              className="w-full bg-white hover:bg-gray-100 text-black font-semibold dark:bg-black dark:text-white dark:hover:bg-gray-900 border-2 border-black dark:border-white"
              variant="outline"
            >
              Fund Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}