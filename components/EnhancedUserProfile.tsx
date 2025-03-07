import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  CircleCheck, 
  Award, 
  CircleDollarSign, 
  Users, 
  Calendar, 
  CircleAlert,
  ExternalLink,
  History,
  Activity,
  Flame,
  Star,
  Sparkles,
  Heart,
  TrendingUp,
  BadgeCheck,
  MessageSquare,
  HelpCircle,
  CheckCircle,
  Loader2,
  Trophy,
  AlertCircle,
  Gift
} from 'lucide-react';
import { useWowzaRush, VerificationLevel, CreatorProfile } from '@/context/wowzarushContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import CampaignCard from '@/components/CampaignCard';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

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

interface EnhancedUserProfileProps {
  address: string;
  showTabs?: boolean;
  isViewOnly?: boolean;
}

export const EnhancedUserProfile: React.FC<EnhancedUserProfileProps> = ({ 
  address,
  showTabs = true,
  isViewOnly = false
}) => {
  // Add a version console log to force component refresh
  console.log('EnhancedUserProfile component version 1.2 - Forced rebuild');
  
  const { getCreatorProfile, calculateTrustScore, account, userCampaigns, getUserCampaigns, getUserBackedCampaigns, followCreator, isFollowing } = useWowzaRush();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [trustScore, setTrustScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [backedCampaigns, setBackedCampaigns] = useState<any[]>([]);
  const [isFollowingCreator, setIsFollowingCreator] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  
  const isOwnProfile = account?.toLowerCase() === address?.toLowerCase();
  
  useEffect(() => {
    const loadProfileData = async () => {
      if (profile) {
        setLoading(false);
        return;
      }

      if (!address) return;

      setLoading(true);
      try {
        // Load profile data
        const profileData = await getCreatorProfile(address);
        
        // Ensure profile data has a stats object
        if (profileData && !profileData.stats) {
          profileData.stats = {
            totalRaised: 12500,
            totalFundsRaised: "12.5",
            totalBacked: 8,
            totalContributors: 42,
            successfulCampaigns: 3,
            campaignsCreated: 5
          };
        }
        
        setProfile(profileData);

        // Check if following
        if (account && !isOwnProfile) {
          const following = await isFollowing(account, address);
          setIsFollowingCreator(following);
        }

        // Load campaigns
        const userCampaigns = await getUserCampaigns(address);
        setCampaigns(userCampaigns || []);

        // Load backed campaigns
        const userBackedCampaigns = await getUserBackedCampaigns(address);
        setBackedCampaigns(userBackedCampaigns || []);

        if (profileData) {
          const score = await calculateTrustScore(address);
          setTrustScore(score);
          
          // Generate mock achievements
          generateMockAchievements(profileData);
          
          // Generate mock activities
          generateMockActivities(profileData);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    if (address) {
      loadProfileData();
    }
  }, [address, account, getCreatorProfile, calculateTrustScore, getUserCampaigns, getUserBackedCampaigns, isFollowing, profile]);
  
  // Ensure profile is not null and has a stats object before rendering
  useEffect(() => {
    if (profile && !profile.stats) {
      const updatedProfile = { 
        ...profile, 
        stats: {
          totalRaised: 12500,
          totalFundsRaised: "12.5",
          totalBacked: 8,
          totalContributors: 42,
          successfulCampaigns: 3,
          campaignsCreated: 5
        }
      };
      setProfile(updatedProfile);
    }
  }, [profile]);
  
  const generateMockAchievements = (profile: CreatorProfile) => {
    // Get safe stats object with correct types
    const stats = profile?.stats || {
      campaigns: 0,
      contributions: 0,
      followers: 0,
      following: 0,
      totalFundsRaised: "0",
      totalContributors: 0,
      campaignsCreated: 0,
      successfulCampaigns: 0
    };
    
    // For backward compatibility - calculate totalRaised and totalBacked from available fields
    const totalFundsRaisedNum = parseFloat(stats.totalFundsRaised || "0");
    const totalContributors = stats.totalContributors || 0;

    // In a real app, these would come from backend data
    const mockAchievements: Achievement[] = [
      {
        id: 'first_campaign',
        title: 'Campaign Pioneer',
        description: 'Created your first campaign',
        icon: <Flame className="h-6 w-6 text-orange-500" />,
        earned: (stats.successfulCampaigns ?? 0) > 0,
        earnedAt: Date.now() - 3600000 * 24 * 30, // 30 days ago
      },
      {
        id: 'verification',
        title: 'Verified Creator',
        description: 'Completed identity verification',
        icon: <BadgeCheck className="h-6 w-6 text-green-500" />,
        earned: (profile?.verificationLevel ?? 0) > (VerificationLevel.NONE ?? 0),
        earnedAt: Date.now() - 3600000 * 24 * 15, // 15 days ago
      },
      {
        id: 'fundraiser',
        title: 'Fundraising Champion',
        description: 'Raised over $10,000 in total',
        icon: <Trophy className="h-6 w-6 text-yellow-500" />,
        earned: totalFundsRaisedNum > 10,
        earnedAt: totalFundsRaisedNum > 10 ? Date.now() - 3600000 * 24 * 5 : undefined, // 5 days ago
        progress: Math.min(totalFundsRaisedNum, 10),
        total: 10,
      },
      {
        id: 'community',
        title: 'Community Builder',
        description: 'Gathered a community of 50+ contributors',
        icon: <Users className="h-6 w-6 text-blue-500" />,
        earned: totalContributors > 50,
        earnedAt: totalContributors > 50 ? Date.now() - 3600000 * 24 * 2 : undefined, // 2 days ago
        progress: Math.min(totalContributors, 50),
        total: 50,
      },
      {
        id: 'milestone',
        title: 'Milestone Achiever',
        description: 'Successfully completed a campaign milestone',
        icon: <CheckCircle className="h-6 w-6 text-indigo-500" />,
        earned: (stats.successfulCampaigns ?? 0) > 0,
        earnedAt: (stats.successfulCampaigns ?? 0) > 0 ? Date.now() - 3600000 * 24 * 10 : undefined, // 10 days ago
      },
    ];

    return mockAchievements;
  };
  
  const generateMockActivities = (profile: CreatorProfile) => {
    // In a real app, these would come from backend data
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'campaign_created',
        title: 'Created a new campaign',
        description: 'Started "Decentralized Marketplace" campaign',
        timestamp: Date.now() - 3600000 * 24 * 14, // 14 days ago
        link: '/campaign/1',
        metadata: {
          campaignId: '1',
          campaignTitle: 'Decentralized Marketplace'
        }
      },
      {
        id: '2',
        type: 'verification',
        title: 'Identity Verified',
        description: 'Achieved verified status',
        timestamp: Date.now() - 3600000 * 24 * 12, // 12 days ago
        metadata: {
          verificationLevel: VerificationLevel.VERIFIED
        }
      },
      {
        id: '3',
        type: 'campaign_milestone',
        title: 'Milestone Completed',
        description: 'Completed "MVP Implementation" milestone for Decentralized Marketplace',
        timestamp: Date.now() - 3600000 * 24 * 7, // 7 days ago
        link: '/campaign/1',
        metadata: {
          campaignId: '1',
          milestoneId: '1',
          milestoneName: 'MVP Implementation'
        }
      },
      {
        id: '4',
        type: 'campaign_funded',
        title: 'Received Funding',
        description: 'Campaign "Decentralized Marketplace" received 5 ETH funding',
        timestamp: Date.now() - 3600000 * 24 * 5, // 5 days ago
        link: '/campaign/1',
        metadata: {
          campaignId: '1',
          amount: 5,
          currency: 'ETH'
        }
      },
      {
        id: '5',
        type: 'comment',
        title: 'Posted Comment',
        description: 'Commented on "DeFi Lending Protocol" campaign',
        timestamp: Date.now() - 3600000 * 24 * 2, // 2 days ago
        link: '/campaign/2',
        metadata: {
          campaignId: '2',
          commentId: '1',
          campaignTitle: 'DeFi Lending Protocol'
        }
      }
    ];
    
    setActivities(mockActivities);
  };
  
  const getVerificationBadge = () => {
    if (!profile) return null;
    
    switch (profile.verificationLevel) {
      case VerificationLevel.ESTABLISHED:
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600 flex items-center gap-1">
            <Award className="h-3 w-3" />
            Established
          </Badge>
        );
      case VerificationLevel.VERIFIED:
        return (
          <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Verified
          </Badge>
        );
      case VerificationLevel.BASIC:
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1">
            <CircleCheck className="h-3 w-3" />
            Basic
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-500 flex items-center gap-1">
            <CircleAlert className="h-3 w-3" />
            Unverified
          </Badge>
        );
    }
  };
  
  const getTrustScoreColor = () => {
    if (trustScore >= 80) return 'bg-green-500';
    if (trustScore >= 60) return 'bg-green-400';
    if (trustScore >= 40) return 'bg-yellow-500';
    if (trustScore >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Format activity time
  const formatActivityTime = (timestamp: number) => {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };
  
  // Get activity icon
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'campaign_created':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'campaign_funded':
        return <CircleDollarSign className="h-5 w-5 text-green-500" />;
      case 'campaign_milestone':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      case 'verification':
        return <Shield className="h-5 w-5 text-orange-500" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
      case 'question':
        return <HelpCircle className="h-5 w-5 text-indigo-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const handleFollow = async () => {
    if (!account) {
      toast.error('Please connect your wallet to follow creators');
      return;
    }

    setIsLoadingFollow(true);
    try {
      await followCreator(address);
      setIsFollowingCreator(true);
      toast.success(`You are now following ${profile?.displayName || 'this creator'}`);
    } catch (error) {
      console.error('Error following creator:', error);
      toast.error('Failed to follow creator');
    } finally {
      setIsLoadingFollow(false);
    }
  };
  
  const handleUnfollow = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoadingFollow(true);
    try {
      await followCreator(address, false);
      setIsFollowingCreator(false);
      toast.success(`You have unfollowed ${profile?.displayName || 'this creator'}`);
    } catch (error) {
      console.error('Error unfollowing creator:', error);
      toast.error('Failed to unfollow creator');
    } finally {
      setIsLoadingFollow(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-lg text-center">Loading profile...</p>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="w-10 h-10 mb-4 text-red-500" />
        <p className="text-lg text-center font-bold">Profile Not Found</p>
        <p className="text-center mt-2">Could not load profile data for this address.</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }
  
  // Ensure profile stats are available
  const profileStats = profile?.stats || {
    totalRaised: 12500,
    totalBacked: 8,
    successfulCampaigns: 3,
    totalContributors: 42
  };

  // Create mock profile with safe access
  const createMockProfile = () => {
    // Get safe profileStats object
    const profileStats = profile?.stats || {
      campaigns: 0,
      contributions: 0,
      followers: 0,
      following: 0,
      totalFundsRaised: "0",
      totalContributors: 0,
      campaignsCreated: 0,
      successfulCampaigns: 0
    };
    
    // For backward compatibility - derived values
    const totalFundsRaisedNum = parseFloat(profileStats.totalFundsRaised || "0");
    const contributions = profileStats.contributions || 0;

    return {
      id: profile?.id || "mock-id",
      address: profile?.address || address,
      displayName: profile?.displayName || "Creator" + address.substring(0, 6),
      bio: profile?.bio || "No bio provided",
      avatar: profile?.profileImageUrl || "",
      // Use optional chaining for properties that might not exist in the interface
      coverImage: profile?.socialLinks?.website || "", // Use a fallback instead of coverImageUrl
      joinedDate: new Date().getTime() - 1000 * 60 * 60 * 24 * 90, // 90 days ago
      trustScore: profile?.trustScore || 85,
      followers: profileStats.followers || 128,
      following: profileStats.following || 45,
      // Use derived values for missing properties
      totalRaised: totalFundsRaisedNum,
      totalBacked: contributions,
      successfulCampaigns: profileStats.successfulCampaigns || 0,
      socialLinks: profile?.socialLinks || {
        twitter: "https://twitter.com/username",
        website: "https://example.com",
        github: "https://github.com/username",
        linkedin: "https://linkedin.com/in/username"
      },
      badges: profile?.badges || [
        { id: 1, name: "Early Supporter", icon: "🌟" },
        { id: 2, name: "Top Creator", icon: "🏆" },
        { id: 3, name: "Verified", icon: "✅" }
      ],
      skills: ["Blockchain Development", "Smart Contracts", "Web3", "DeFi"] // Use a hardcoded array
    };
  };

  const mockProfile = createMockProfile();
  
  // Use real data if available, otherwise use mock data
  const displayProfile = {
    ...mockProfile,
    ...profile
  };
  
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        <div 
          className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative"
          style={displayProfile.coverImage ? { backgroundImage: `url(${displayProfile.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {isOwnProfile && !isViewOnly && (
            <div className="absolute top-4 right-4">
              <Button asChild variant="secondary" size="sm">
                <Link href="/profile/edit">Edit Profile</Link>
              </Button>
            </div>
          )}
        </div>
        
        <CardContent className="pt-0 relative">
          <div className="flex flex-col md:flex-row gap-6 -mt-12">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 border-4 border-background">
                {displayProfile.avatar ? (
                  <AvatarImage src={displayProfile.avatar} alt={displayProfile.displayName} />
                ) : null}
                <AvatarFallback className="text-2xl">
                  {displayProfile.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 pt-12 md:pt-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{displayProfile.displayName}</h2>
                  <p className="text-sm text-gray-500">
                    {address.substring(0, 8)}...{address.substring(address.length - 6)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Joined {formatDistanceToNow(displayProfile.joinedDate, { addSuffix: true })}
                  </p>
                </div>
                
                {!isOwnProfile && !isViewOnly && (
                  <div className="mt-4 md:mt-0">
                    {isFollowingCreator ? (
                      <Button 
                        variant="outline" 
                        onClick={handleUnfollow}
                        disabled={isLoadingFollow}
                      >
                        {isLoadingFollow ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Following
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleFollow}
                        disabled={isLoadingFollow}
                      >
                        {isLoadingFollow ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Follow
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Bio */}
              <p className="mt-4 text-gray-700">{displayProfile.bio}</p>
              
              {/* Badges */}
              {displayProfile.badges && displayProfile.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {displayProfile.badges.map((badge: any) => (
                    <Badge key={badge.id} variant="secondary" className="px-2 py-1">
                      <span className="mr-1">{badge.icon}</span>
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Skills */}
              {displayProfile.skills && displayProfile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {displayProfile.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="px-2 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Social Links */}
              {displayProfile.socialLinks && Object.keys(displayProfile.socialLinks).length > 0 && (
                <div className="flex gap-3 mt-4">
                  {displayProfile.socialLinks.twitter && (
                    <a href={displayProfile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                      </svg>
                    </a>
                  )}
                  {displayProfile.socialLinks.github && (
                    <a href={displayProfile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                      </svg>
                    </a>
                  )}
                  {displayProfile.socialLinks.website && (
                    <a href={displayProfile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-500">
                      <ExternalLink size={20} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Trust Score</p>
                <p className="text-2xl font-bold">{displayProfile.trustScore}%</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={displayProfile.trustScore} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Raised</p>
                <p className="text-2xl font-bold">${displayProfile.totalRaised.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Across {displayProfile.successfulCampaigns} successful campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Community</p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xl font-bold">{displayProfile.followers}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{displayProfile.following}</p>
                    <p className="text-xs text-gray-500">Following</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{displayProfile.totalBacked}</p>
                    <p className="text-xs text-gray-500">Backed</p>
                  </div>
                </div>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="backed">Backed</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About {displayProfile.displayName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{displayProfile.bio}</p>
              
              <Separator className="my-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Achievements</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Award className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Top Creator</p>
                        <p className="text-sm text-gray-500">Raised over $10,000 in campaigns</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Early Adopter</p>
                        <p className="text-sm text-gray-500">Joined WowzaRush in its early days</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Gift className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Generous Backer</p>
                        <p className="text-sm text-gray-500">Backed {displayProfile.totalBacked} campaigns</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Expertise</h3>
                  <ul className="space-y-3">
                    {displayProfile.skills.map((skill: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Created Campaigns</CardTitle>
              <CardDescription>
                Campaigns created by {displayProfile.displayName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-center py-6 text-gray-500">
                  No campaigns created yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaigns.map((campaign: any) => (
                    <Card key={campaign.id} className="overflow-hidden">
                      <div className="h-40 bg-gray-200 relative">
                        {campaign.mainImage && (
                          <img 
                            src={campaign.mainImage} 
                            alt={campaign.title} 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <CardContent className="pt-4">
                        <h3 className="font-semibold text-lg truncate">{campaign.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {campaign.description.substring(0, 100)}...
                        </p>
                        <div className="mt-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">${campaign.currentAmount} raised</p>
                            <Progress value={(campaign.currentAmount / campaign.goalAmount) * 100} className="h-2 mt-1" />
                          </div>
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/campaign/${campaign.id}`}>View Campaign</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Backed Tab */}
        <TabsContent value="backed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backed Campaigns</CardTitle>
              <CardDescription>
                Campaigns {displayProfile.displayName} has supported
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backedCampaigns.length === 0 ? (
                <p className="text-center py-6 text-gray-500">
                  No backed campaigns yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {backedCampaigns.map((campaign: any) => (
                    <Card key={campaign.id} className="overflow-hidden">
                      <div className="h-40 bg-gray-200 relative">
                        {campaign.mainImage && (
                          <img 
                            src={campaign.mainImage} 
                            alt={campaign.title} 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <CardContent className="pt-4">
                        <h3 className="font-semibold text-lg truncate">{campaign.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          by {campaign.creatorName || `${campaign.creatorId.substring(0, 6)}...`}
                        </p>
                        <div className="mt-3">
                          <p className="text-sm font-medium">${campaign.currentAmount} raised</p>
                          <Progress value={(campaign.currentAmount / campaign.goalAmount) * 100} className="h-2 mt-1" />
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/campaign/${campaign.id}`}>View Campaign</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent actions and updates from {displayProfile.displayName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock activity items - in a real app, these would come from the backend */}
                <div className="flex gap-4 items-start">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Created a new campaign</p>
                    <p className="text-sm text-gray-500">
                      "Decentralized Finance Platform" was launched
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(Date.now() - 1000 * 60 * 60 * 24 * 2, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Gift className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Backed a campaign</p>
                    <p className="text-sm text-gray-500">
                      Contributed $250 to "Web3 Educational Platform"
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(Date.now() - 1000 * 60 * 60 * 24 * 5, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Commented on a campaign</p>
                    <p className="text-sm text-gray-500">
                      "This looks promising! I'm excited to see how it develops."
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(Date.now() - 1000 * 60 * 60 * 24 * 7, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Reached a milestone</p>
                    <p className="text-sm text-gray-500">
                      Successfully completed their first campaign
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(Date.now() - 1000 * 60 * 60 * 24 * 14, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 