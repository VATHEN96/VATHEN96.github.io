import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Star, 
  BadgeCheck, 
  Users, 
  Flame, 
  MessageSquare, 
  Clock, 
  Award, 
  ChevronRight, 
  Sparkles, 
  Wallet, 
  Code, 
  HelpCircle, 
  CheckCircle, 
  Loader2, 
  Trophy, 
  AlertCircle,
  Edit,
  RefreshCw
} from 'lucide-react';
import { useWowzaRush, VerificationLevel } from '@/context/wowzarushContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Define appropriate interface for Campaign
interface Campaign {
  id: string | number;
  title: string;
  description: string;
  creator: string;
  goalAmount?: string | number;
  totalFunded?: string | number;
  createdAt?: number;
  status?: string;
  media?: string[];
  category?: string;
  [key: string]: any; // Allow for additional properties
}

// Define interfaces for Achievement and Activity
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  earnedAt?: number;
  progress?: number;
  total?: number;
}

interface Activity {
  id: string;
  type: 'campaign_created' | 'campaign_funded' | 'campaign_milestone' | 'verification' | 'comment' | 'question';
  title: string;
  description: string;
  timestamp: number;
  link?: string;
  metadata?: any;
}

interface SafeUserProfileProps {
  address: string;
}

export const SafeUserProfile: React.FC<SafeUserProfileProps> = ({ 
  address,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { blockchainService, web3Storage, getCreatorProfile } = useWowzaRush();
    
  const loadProfileData = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
      
    try {
      console.log('Loading profile data for address:', address);
      
      // Try to get user profile from context first
      try {
        const profile = await getCreatorProfile(address);
        console.log('Profile from context:', profile);
        if (profile) {
          setUserProfile(profile);
          setEditForm({
            displayName: profile.displayName || '',
            bio: profile.bio || '',
            avatarUrl: profile.avatarUrl || '',
          });
        }
      } catch (profileErr) {
        console.warn('Failed to load user profile from context:', profileErr);
      }

      // Get user campaigns if blockchain service is available
      try {
        if (blockchainService?.getUserCampaigns) {
          console.log('Fetching user campaigns from blockchain service');
          const userCampaigns = await blockchainService.getUserCampaigns(address);
          console.log('User campaigns:', userCampaigns);
          if (Array.isArray(userCampaigns)) {
            setCampaigns(userCampaigns);
          } else {
            console.warn('getUserCampaigns did not return an array');
            setCampaigns([]);
          }
        } else {
          console.warn('Blockchain service or getUserCampaigns method not available');
        }
      } catch (campaignsErr) {
        console.error('Failed to load user campaigns:', campaignsErr);
        setCampaigns([]);
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Failed to load profile data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [address, blockchainService, getCreatorProfile, web3Storage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadProfileData();
      toast.success('Profile data refreshed');
    } catch (error) {
      toast.error('Failed to refresh profile data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!web3Storage?.updateUserProfile) {
      toast.error('Profile editing is not available at the moment. Please try again later.');
      return;
    }

    try {
      await web3Storage.updateUserProfile(address, {
        ...userProfile,
        ...editForm,
        address, // Ensure address is included
      });
      
      setUserProfile((prev: any) => ({
        ...prev,
        ...editForm,
        address, // Ensure address is included
      }));
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile. Please try again later.');
    }
  };

  const renderCampaignCard = (campaign: Campaign) => {
    if (!campaign) return null;
    
    return (
      <Card key={campaign.id} className="overflow-hidden">
        <div className="aspect-video relative bg-gray-100">
          {campaign.media && campaign.media[0] ? (
            <img
              src={campaign.media[0]}
              alt={campaign.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <CardHeader className="p-4">
          <CardTitle className="text-lg truncate">{campaign.title}</CardTitle>
          <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
        </CardHeader>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Link 
            href={`/campaign/${campaign.id}`}
            className="text-primary hover:underline flex items-center gap-1 text-sm"
          >
            View Campaign <ChevronRight className="h-4 w-4" />
          </Link>
          {campaign.status && (
            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
              {campaign.status}
            </Badge>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userProfile?.avatarUrl} />
              <AvatarFallback>{formatAddress(address).slice(0, 2)}</AvatarFallback>
            </Avatar>
            {!isEditing ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {userProfile?.displayName || formatAddress(address)}
                </h2>
                <p className="text-gray-500 text-sm mb-2">
                  {formatAddress(address)}
                </p>
                {userProfile?.bio && (
                  <p className="text-gray-600 mt-2">{userProfile.bio}</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="flex-1 space-y-4">
                <Input
                  placeholder="Display Name"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                />
                <Input
                  placeholder="Avatar URL"
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                />
                <Textarea
                  placeholder="Bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
          
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">My Campaigns</h3>
            <Link href="/create-campaign">
              <Button size="sm">Create Campaign</Button>
            </Link>
          </div>
          
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg p-6">
              <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="mb-2">No campaigns created yet</p>
              <p className="text-sm text-gray-400">Start your first campaign to begin raising funds</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => renderCampaignCard(campaign))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default SafeUserProfile; 