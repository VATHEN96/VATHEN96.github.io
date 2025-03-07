import React, { useState, useEffect } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Medal, Trophy, Award, ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { NFTBadge } from '@/types';

interface NFTBadgeDisplayProps {
  badges?: NFTBadge[];
  walletAddress?: string;
  isProfile?: boolean;
  campaignId?: string;
  showEmpty?: boolean;
}

const NFTBadgeDisplay: React.FC<NFTBadgeDisplayProps> = ({
  badges: initialBadges,
  walletAddress,
  isProfile = false,
  campaignId,
  showEmpty = true
}) => {
  const { account, getUserNFTBadges, getCampaignNFTBadges, isWalletConnected } = useWowzaRush();
  const [badges, setBadges] = useState<NFTBadge[]>(initialBadges || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialBadges);
  const [selectedBadge, setSelectedBadge] = useState<NFTBadge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  
  useEffect(() => {
    if (initialBadges) {
      setBadges(initialBadges);
      return;
    }
    
    const loadBadges = async () => {
      setIsLoading(true);
      try {
        let badgeData: NFTBadge[] = [];
        
        if (campaignId) {
          // Get badges for a specific campaign
          badgeData = await getCampaignNFTBadges(campaignId);
        } else if (walletAddress) {
          // Get badges for a specific wallet
          badgeData = await getUserNFTBadges(walletAddress);
        } else if (isWalletConnected && account) {
          // Get badges for the connected wallet
          badgeData = await getUserNFTBadges(account);
        }
        
        if (badgeData && badgeData.length > 0) {
          setBadges(badgeData);
        } else if (!showEmpty) {
          // If we don't want to show empty state, use mock data
          const mockBadges: NFTBadge[] = [
            {
              id: 'badge-1',
              tokenId: '1',
              name: 'Early Supporter',
              description: 'Awarded to early supporters of the campaign',
              imageUrl: 'https://via.placeholder.com/300/2563eb/ffffff?text=Early+Supporter',
              campaignId: campaignId || 'campaign-1',
              campaignTitle: 'Decentralized Finance Platform',
              tierId: 'tier-1',
              tierName: 'Early Bird',
              acquiredAt: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
              rarity: 'uncommon',
              contractAddress: '0x1234567890123456789012345678901234567890'
            },
            {
              id: 'badge-2',
              tokenId: '2',
              name: 'Gold Backer',
              description: 'Awarded to gold tier backers of the campaign',
              imageUrl: 'https://via.placeholder.com/300/eab308/ffffff?text=Gold+Backer',
              campaignId: campaignId || 'campaign-1',
              campaignTitle: 'Decentralized Finance Platform',
              tierId: 'tier-3',
              tierName: 'Gold Supporter',
              acquiredAt: Date.now() - 1000 * 60 * 60 * 24 * 15, // 15 days ago
              rarity: 'rare',
              properties: {
                votingPower: 10,
                earlyAccess: true
              },
              contractAddress: '0x1234567890123456789012345678901234567890'
            },
            {
              id: 'badge-3',
              tokenId: '3',
              name: 'Platinum Patron',
              description: 'Awarded to the most generous backers of the campaign',
              imageUrl: 'https://via.placeholder.com/300/9333ea/ffffff?text=Platinum+Patron',
              campaignId: campaignId || 'campaign-2',
              campaignTitle: 'Web3 Educational Platform',
              tierId: 'tier-4',
              tierName: 'Platinum Patron',
              acquiredAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
              rarity: 'legendary',
              properties: {
                votingPower: 25,
                earlyAccess: true,
                exclusiveContent: true
              },
              contractAddress: '0x0987654321098765432109876543210987654321'
            }
          ];
          setBadges(mockBadges);
        }
      } catch (error) {
        console.error('Error loading NFT badges:', error);
        toast.error('Failed to load NFT badges');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBadges();
  }, [
    initialBadges, 
    campaignId, 
    walletAddress, 
    account, 
    isWalletConnected, 
    getUserNFTBadges, 
    getCampaignNFTBadges, 
    showEmpty
  ]);
  
  const handleBadgeClick = (badge: NFTBadge) => {
    setSelectedBadge(badge);
    setIsDialogOpen(true);
  };
  
  const viewOnBlockExplorer = (contractAddress: string, tokenId: string) => {
    // This would open a block explorer link to view the NFT
    // For example: Etherscan, OpenSea, etc.
    window.open(`https://etherscan.io/token/${contractAddress}?a=${tokenId}`, '_blank');
  };
  
  const getRarityColor = (rarity: NFTBadge['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-200 text-gray-700';
      case 'uncommon':
        return 'bg-green-100 text-green-800';
      case 'rare':
        return 'bg-blue-100 text-blue-800';
      case 'epic':
        return 'bg-purple-100 text-purple-800';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading NFT badges...</span>
      </div>
    );
  }
  
  if (badges.length === 0 && showEmpty) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Trophy className="h-12 w-12 mx-auto text-gray-300" />
            <h3 className="text-lg font-medium">No NFT Badges Yet</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {isProfile ? (
                "You haven't earned any NFT badges yet. Support campaigns to earn unique badges that showcase your contribution."
              ) : (
                "Contribute to this campaign to earn unique NFT badges that showcase your support."
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((badge) => (
          <Card
            key={badge.id}
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleBadgeClick(badge)}
          >
            <div className="aspect-square relative">
              <img
                src={badge.imageUrl}
                alt={badge.name}
                className="w-full h-full object-cover"
              />
              <Badge className={`absolute top-2 right-2 ${getRarityColor(badge.rarity)}`}>
                {badge.rarity ? badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1) : 'Unknown'}
              </Badge>
            </div>
            
            <CardContent className="pt-4">
              <h3 className="font-semibold text-lg truncate">{badge.name}</h3>
              <p className="text-sm text-gray-500 truncate">{badge.tierName}</p>
              
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Medal className="h-3 w-3 mr-1" />
                <span>From: {badge.campaignTitle}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Badge Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedBadge && (
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <span className="mr-2">{selectedBadge.name}</span>
                <Badge className={getRarityColor(selectedBadge.rarity)}>
                  {selectedBadge.rarity ? selectedBadge.rarity.charAt(0).toUpperCase() + selectedBadge.rarity.slice(1) : 'Unknown'}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                NFT Badge #{selectedBadge.tokenId}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="aspect-square relative rounded-md overflow-hidden">
                <img
                  src={selectedBadge.imageUrl}
                  alt={selectedBadge.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Description</h4>
                <p className="text-sm text-gray-700">{selectedBadge.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Campaign</h4>
                  <p className="text-sm">{selectedBadge.campaignTitle}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Tier</h4>
                  <p className="text-sm">{selectedBadge.tierName}</p>
                </div>
                
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">Acquired:</span>
                  <p className="text-sm">{selectedBadge.acquiredAt ? new Date(selectedBadge.acquiredAt).toLocaleDateString() : 'Unknown'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Token ID</h4>
                  <p className="text-sm font-mono">{selectedBadge.tokenId}</p>
                </div>
              </div>
              
              {selectedBadge.properties && Object.keys(selectedBadge.properties).length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Properties</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedBadge.properties).map(([key, value]) => (
                      <div key={key} className="bg-gray-100 p-2 rounded-md">
                        <p className="text-xs text-gray-500 uppercase">{key}</p>
                        <p className="text-sm font-medium">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => viewOnBlockExplorer(
                  selectedBadge.contractAddress || '', 
                  selectedBadge.tokenId
                )}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
              
              <Button size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default NFTBadgeDisplay; 