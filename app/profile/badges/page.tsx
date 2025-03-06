'use client';

import React, { useState, useEffect } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Loader2,
  Medal,
  ExternalLink,
  Shield,
  Zap,
  Award,
  Info,
  Star,
  Gift,
  Users,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface NFTBadge {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  campaignId: string;
  campaignTitle: string;
  tier: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  votingPower: number;
  dateIssued: number;
  attributes: {
    trait_type: string;
    value: string;
  }[];
}

const BadgesPage = () => {
  const { account, isWalletConnected, connectWallet, getUserNFTBadges } = useWowzaRush();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [badges, setBadges] = useState<NFTBadge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<NFTBadge | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [totalVotingPower, setTotalVotingPower] = useState<number>(0);
  
  useEffect(() => {
    const loadBadges = async () => {
      if (!isWalletConnected || !account) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const badges = await getUserNFTBadges(account);
        setBadges(badges);
        
        // Calculate total voting power
        const totalPower = badges.reduce((total, badge) => total + badge.votingPower, 0);
        setTotalVotingPower(totalPower);
        
        // Set first badge as selected if available
        if (badges.length > 0) {
          setSelectedBadge(badges[0]);
        }
      } catch (error) {
        console.error('Error loading NFT badges:', error);
        toast.error('Failed to load NFT badges');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBadges();
  }, [account, isWalletConnected, getUserNFTBadges]);
  
  const filteredBadges = badges.filter((badge) => {
    if (activeFilter === 'all') return true;
    return badge.rarity === activeFilter;
  });
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-500 text-white';
      case 'uncommon':
        return 'bg-green-500 text-white';
      case 'rare':
        return 'bg-blue-500 text-white';
      case 'epic':
        return 'bg-purple-500 text-white';
      case 'legendary':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (!isWalletConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="mx-auto max-w-md">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <Medal className="h-16 w-16 mx-auto text-primary opacity-80" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Your NFT Badges</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Connect your wallet to view the NFT badges you've earned from supporting campaigns.
                </p>
              </div>
              <Button size="lg" onClick={connectWallet}>
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your NFT badges...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your NFT Badges</h1>
          <p className="text-muted-foreground">
            Badges earned from supporting campaigns on WowzaRush
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 text-base flex items-center">
            <Star className="h-4 w-4 mr-2 text-yellow-500" />
            <span>{badges.length} Badges</span>
          </Badge>
          
          <Badge variant="secondary" className="px-3 py-1 text-base flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            <span>{totalVotingPower} Voting Power</span>
          </Badge>
        </div>
      </div>
      
      {badges.length === 0 ? (
        <Card className="mb-8">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <Medal className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
              <div className="space-y-2">
                <h2 className="text-xl font-medium">No Badges Found</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You haven't earned any NFT badges yet. Support campaigns to earn exclusive badges with special benefits.
                </p>
              </div>
              <Button asChild>
                <Link href="/">
                  Explore Campaigns
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Badge Collection</CardTitle>
              </CardHeader>
              
              <CardContent className="py-0">
                <Tabs defaultValue="all" onValueChange={setActiveFilter}>
                  <TabsList className="mb-4 grid grid-cols-5">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="common">Common</TabsTrigger>
                    <TabsTrigger value="uncommon">Uncommon</TabsTrigger>
                    <TabsTrigger value="rare">Rare</TabsTrigger>
                    <TabsTrigger value="epic">Epic</TabsTrigger>
                    <TabsTrigger value="legendary">Legendary</TabsTrigger>
                  </TabsList>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4 pb-4">
                    {filteredBadges.map((badge) => (
                      <div 
                        key={badge.id}
                        className={`relative border cursor-pointer rounded-xl overflow-hidden transition-all hover:border-primary ${
                          selectedBadge?.id === badge.id ? 'border-primary ring-2 ring-primary ring-opacity-50' : ''
                        }`}
                        onClick={() => setSelectedBadge(badge)}
                      >
                        <div className="aspect-square relative">
                          {badge.imageUrl ? (
                            <Image 
                              src={badge.imageUrl} 
                              alt={badge.name} 
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-secondary flex items-center justify-center">
                              <Medal className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <Badge className={`absolute top-2 right-2 ${getRarityColor(badge.rarity)}`}>
                          {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                        </Badge>
                        
                        <div className="p-2 text-center">
                          <p className="text-sm font-medium truncate">{badge.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Badge Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <h3 className="font-medium">Governance Rights</h3>
                    <p className="text-sm text-muted-foreground">
                      Use your badges to vote on proposals and help shape campaign decisions.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Gift className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <h3 className="font-medium">Exclusive Rewards</h3>
                    <p className="text-sm text-muted-foreground">
                      Get special rewards and perks from campaigns based on your badges.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <h3 className="font-medium">Community Status</h3>
                    <p className="text-sm text-muted-foreground">
                      Display your badges to show your support level within the community.
                    </p>
                  </div>
                </div>
                
                <Button variant="outline" asChild className="w-full mt-2">
                  <Link href="/dashboard">
                    <Shield className="h-4 w-4 mr-2" />
                    Governance Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            {selectedBadge ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedBadge.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        From campaign: {selectedBadge.campaignTitle}
                      </p>
                    </div>
                    <Badge className={getRarityColor(selectedBadge.rarity)}>
                      {selectedBadge.rarity.charAt(0).toUpperCase() + selectedBadge.rarity.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="mx-auto max-w-md aspect-square relative rounded-xl overflow-hidden">
                    {selectedBadge.imageUrl ? (
                      <Image 
                        src={selectedBadge.imageUrl} 
                        alt={selectedBadge.name} 
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <Medal className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p>{selectedBadge.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Contribution Tier</h3>
                      <p className="font-medium">{selectedBadge.tier}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Date Issued</h3>
                      <p className="font-medium">{formatDate(selectedBadge.dateIssued)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Token ID</h3>
                      <p className="font-medium truncate">{selectedBadge.tokenId}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Voting Power</h3>
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-1 text-primary" />
                        <p className="font-medium">{selectedBadge.votingPower}</p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedBadge.attributes && selectedBadge.attributes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Attributes</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedBadge.attributes.map((attr, index) => (
                          <div key={index} className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">{attr.trait_type}</p>
                            <p className="font-medium">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <Button variant="outline" asChild>
                      <Link href={`/campaign/${selectedBadge.campaignId}`}>
                        Visit Campaign
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild>
                      <a href={`https://opensea.io/assets/ethereum/${selectedBadge.tokenId}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on OpenSea
                      </a>
                    </Button>
                    
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard?campaign=${selectedBadge.campaignId}`}>
                        <Shield className="h-4 w-4 mr-2" />
                        Governance
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Medal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-medium mb-2">Select a Badge</h2>
                    <p className="text-muted-foreground">
                      Click on a badge from your collection to view its details.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgesPage; 