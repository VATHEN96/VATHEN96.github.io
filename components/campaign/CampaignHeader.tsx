"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Users, Tag, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Campaign } from '@/types/campaign';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatBlockchainValue, formatCategory } from '@/utils/formatting';

interface CampaignHeaderProps {
  campaign: Campaign;
}

export default function CampaignHeader({ campaign }: CampaignHeaderProps) {
  // Calculate progress percentage
  const progress = campaign.totalFunded > 0 
    ? Math.min(Math.round((campaign.totalFunded / campaign.goalAmount) * 100), 100)
    : 0;
  
  // Format dates and values
  const timeLeft = (() => {
    try {
      // Check if deadline is valid
      if (!campaign.deadline) return 'Deadline not set';
      
      // Try to parse the date safely
      const deadlineDate = new Date(campaign.deadline);
      
      // Check if parsed date is valid
      if (isNaN(deadlineDate.getTime())) return 'Invalid deadline';
      
      return formatDistanceToNow(deadlineDate, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting deadline:', error);
      return 'Date calculation error';
    }
  })();
  
  const formattedGoal = formatBlockchainValue(campaign.goalAmount);
  const formattedFunded = formatBlockchainValue(campaign.totalFunded);
  const category = formatCategory(campaign.category);
  
  // Default image if multimedia is empty
  const headerImage = campaign.multimedia && campaign.multimedia.length > 0
    ? campaign.multimedia[0]
    : '/placeholder-campaign.jpg';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/campaigns" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Link>
      </div>
      
      {/* Campaign Title */}
      <h1 className="text-4xl font-bold tracking-tight text-black">{campaign.title}</h1>
      
      {/* Campaign Image */}
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <Image 
          src={headerImage}
          alt={campaign.title}
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>
      
      {/* Campaign Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Funding Progress Card */}
        <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium">Funding Progress</span>
                <span className="text-lg font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 bg-gray-200" />
              <div className="flex justify-between text-sm">
                <span>{formattedFunded} raised</span>
                <span>Goal: {formattedGoal}</span>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold border-2 border-black">
                  Contribute Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Time Remaining Card */}
        <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="text-lg font-medium">Time Remaining</span>
              </div>
              <p className="text-2xl font-bold">{timeLeft}</p>
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  <span className="font-medium">Category:</span>
                  <Badge variant="outline" className="bg-yellow-400 px-2 py-1 rounded-full text-sm font-semibold border-2 border-black">
                    {category}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Creator Card */}
        <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-lg font-medium">Creator</span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-gray-200">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="Creator" />
                  <AvatarFallback>{campaign.creator ? campaign.creator.slice(0, 2) : 'NA'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">{campaign.creator || 'Unknown Creator'}</p>
                  <Link href={`/profile/${campaign.creator || 'unknown'}`} className="text-sm text-blue-600 hover:underline">
                    View Profile
                  </Link>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="outline" className="w-full border-2 border-black">
                  <Heart className="mr-2 h-4 w-4" />
                  Follow Creator
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Campaign Description */}
      <div className="bg-white p-6 rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">About this Campaign</h2>
        <p className="text-gray-800 whitespace-pre-line">{campaign.description}</p>
      </div>
    </div>
  );
} 