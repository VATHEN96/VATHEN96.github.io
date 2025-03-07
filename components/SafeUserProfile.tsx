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
import { useWowzaRush, VerificationLevel, CreatorProfile } from '@/context/wowzarushContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import Link from 'next/link';
import CampaignCard from './CampaignCard';
import Image from 'next/image';

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
  showTabs?: boolean;
  isViewOnly?: boolean;
}

export const SafeUserProfile: React.FC<SafeUserProfileProps> = ({ 
  address,
  showTabs = true,
  isViewOnly = false
}) => {
  console.log('SafeUserProfile rendering with address:', address);
  
  // Create the loadingRef at the top level of the component
  const loadingRef = React.useRef(false);
  
  // State declarations
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFollowLoading, setIsFollowLoading] = useState<boolean>(false);
  const [isFollowingCreator, setIsFollowingCreator] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [backedCampaigns, setBackedCampaigns] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Get context values
  const { 
    getCreatorProfile, 
    account, 
    getUserCampaigns, 
    getUserBackedCampaigns, 
    followCreator, 
    isFollowing,
    calculateTrustScore 
  } = useWowzaRush();

  // Memoize the isOwnProfile value to avoid unnecessary recalculations
  const isOwnProfile = useMemo(() => 
    account?.toLowerCase() === address?.toLowerCase(),
    [account, address]
  );
  
  // Fallback trust score calculation if the context doesn't provide it
  const calculateTrustScoreFallback = useCallback(async (userAddress: string): Promise<number> => {
    console.log("Using fallback trust score calculation for address:", userAddress);
    // Simple mock implementation
    return 85; // Return a default score
  }, []);

  // Use the context function or our fallback - memoize to prevent dependency changes
  const getTrustScore = useMemo(() => 
    calculateTrustScore || calculateTrustScoreFallback, 
    [calculateTrustScore, calculateTrustScoreFallback]
  );
  
  // Memoize generator functions to prevent recreating them on every render
  const generateMockAchievements = useCallback((profileData: CreatorProfile) => {
    // Ensure stats are available with all potential properties
    const stats = profileData?.stats || {
      campaigns: 0,
      contributions: 0,
      followers: 0,
      following: 0,
      totalFundsRaised: "0",
      totalContributors: 0,
      campaignsCreated: 0,
      successfulCampaigns: 0
    };
    
    // For backward compatibility - calculate values from available fields
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
        earned: (profileData?.verificationLevel ?? 0) > (VerificationLevel.NONE ?? 0),
        earnedAt: Date.now() - 3600000 * 24 * 20, // 20 days ago
      },
      {
        id: 'funding_milestone',
        title: 'Funding Milestone',
        description: 'Raised 10 ETH across all campaigns',
        icon: <Trophy className="h-6 w-6 text-yellow-500" />,
        earned: totalFundsRaisedNum > 10,
        earnedAt: totalFundsRaisedNum > 10 ? Date.now() - 3600000 * 24 * 5 : undefined, // 5 days ago
        progress: Math.min(totalFundsRaisedNum, 10),
        total: 10
      },
      {
        id: 'community_builder',
        title: 'Community Builder',
        description: 'Attracted 50 unique contributors',
        icon: <Users className="h-6 w-6 text-blue-500" />,
        earned: totalContributors > 50,
        earnedAt: totalContributors > 50 ? Date.now() - 3600000 * 24 * 2 : undefined, // 2 days ago
        progress: Math.min(totalContributors, 50),
        total: 50
      },
      {
        id: 'successful_campaign',
        title: 'Campaign Success',
        description: 'Successfully completed a campaign',
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
        earned: (stats.successfulCampaigns ?? 0) > 0,
        earnedAt: (stats.successfulCampaigns ?? 0) > 0 ? Date.now() - 3600000 * 24 * 10 : undefined, // 10 days ago
      },
    ];
    
    setAchievements(mockAchievements);
  }, []);

  const generateMockActivities = useCallback((profileData: CreatorProfile) => {
    // In a real app, these would come from backend data
    const mockActivities: Activity[] = [
      {
        id: 'activity1',
        type: 'campaign_created',
        title: 'Created a new campaign',
        description: 'DeFi Education Platform for Emerging Markets',
        timestamp: Date.now() - 3600000 * 24 * 2, // 2 days ago
        link: '/campaign/1',
      },
      {
        id: 'activity2',
        type: 'campaign_funded',
        title: 'Backed a campaign',
        description: 'Contributed 1.5 ETH to "Decentralized Identity Solution"',
        timestamp: Date.now() - 3600000 * 24 * 5, // 5 days ago
        link: '/campaign/2',
      },
      {
        id: 'activity3',
        type: 'verification',
        title: 'Completed verification',
        description: 'Achieved Basic verification level',
        timestamp: Date.now() - 3600000 * 24 * 10, // 10 days ago
      },
      {
        id: 'activity4',
        type: 'campaign_milestone',
        title: 'Milestone completed',
        description: 'Successfully completed milestone 2 in "DeFi Education Platform"',
        timestamp: Date.now() - 3600000 * 24 * 15, // 15 days ago
        link: '/campaign/1',
      },
      {
        id: 'activity5',
        type: 'comment',
        title: 'New comment',
        description: 'Commented on "Decentralized Identity Solution"',
        timestamp: Date.now() - 3600000 * 24 * 20, // 20 days ago
        link: '/campaign/2#comments',
      },
    ];
    
    setActivities(mockActivities);
  }, []);

  // Initialize static fields early to improve user experience
  useEffect(() => {
    console.log("Initial data setup effect running");
    // Set initial mock data right away - even before the main data loads
    // This ensures the UI shows *something* right away
    setCampaigns([
      {
        id: '1',
        title: 'DeFi Education Platform',
        description: 'Educational platform for DeFi',
        creator_address: address || '0x123',
        status: 'active',
        funds_raised: 12.5,
        target: 20
      }
    ]);
    
    setBackedCampaigns([
      {
        id: '2',
        title: 'NFT Marketplace',
        description: 'A marketplace for artists',
        creator_address: '0x123',
        status: 'active',
        funds_raised: 8.3,
        target: 15
      }
    ]);
    
    // Set a mock trust score immediately
    console.log("Setting initial trust score");
    setTrustScore(85);
    
    // Force loading to false after a timeout as a safety measure
    const timer = setTimeout(() => {
      console.log("Force ending loading state after timeout");
      setLoading(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []); // Run only once on component mount
  
  // Load profile data 
  useEffect(() => {
    console.log("Profile loading useEffect triggered with address:", address);
    // Cancel previous requests
    const controller = new AbortController();
    let isMounted = true;
    
    // Always set loading to false after a timeout (safety measure)
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.log("SAFETY TIMEOUT: Force ending profile loading state");
        setLoading(false);
      }
    }, 5000);
    
    const loadProfileData = async () => {
      // Only load once per mount - this breaks any potential infinite loops
      if (loadingRef.current) {
        console.log("Skipping redundant loadProfileData call - already loaded once");
        return;
      }
      
      if (!address) {
        console.log("No address provided, setting error and ending loading");
        setError("No address provided");
        setLoading(false);
        return;
      }

      // Prevent multiple concurrent calls - add a stronger loading check
      if (loading) {
        console.log("Skipping loadProfileData call - already loading");
        return;
      }

      console.log("SafeUserProfile: Starting loadProfileData for", address);
      loadingRef.current = true;
      
      setLoading(true);
      setError(null);
      
      try {
        // Create static mock data first - so we at least have something to show
        const staticMockProfile = {
          address,
          name: `User ${address.substring(0, 6)}`,
          displayName: `User ${address.substring(0, 6)}`,
          bio: "Loading profile...",
          stats: {
            totalRaised: 0,
            totalFundsRaised: "0",
            totalBacked: 0,
            totalContributors: 0,
            successfulCampaigns: 0,
            campaignsCreated: 0
          }
        };
        
        // Set this mock profile immediately to avoid null errors
        if (isMounted) {
          setProfile(staticMockProfile);
        }
        
        // Now try to get the real profile data
        try {
          console.log("Fetching profile data for address:", address);
          const profileData = await getCreatorProfile(address);
          console.log("Profile data received:", profileData ? "success" : "failed");
          
          if (!profileData && isMounted) {
            // Still update the UI with what we have
            console.log("No profile data returned, using mock data");
          } else if (isMounted) {
            console.log("Setting real profile data");
            setProfile(profileData);
          }
        } catch (error) {
          console.error("Error loading profile:", error);
          // Continue with mock data, don't set an error
        }
        
        if (!isMounted) {
          return;
        }
        
        // Set a mock trust score
        console.log("Setting trust score");
        setTrustScore(85);
        
        // Use the mock achievement and activity generators
        console.log("Generating mock achievements and activities");
        generateMockAchievements(staticMockProfile);
        generateMockActivities(staticMockProfile);
        
      } catch (error) {
        console.error('Error in loadProfileData:', error);
        if (isMounted) {
          setError('Failed to load profile data');
        }
      } finally {
        clearTimeout(safetyTimeout);
        if (isMounted) {
          console.log("Setting loading to false in finally block");
          setLoading(false);
        }
        console.log("loadProfileData completed");
      }
    };
    
    loadProfileData();
    
    // Cleanup function
    return () => {
      console.log("Cleanup function called");
      isMounted = false;
      controller.abort();
      clearTimeout(safetyTimeout);
    };
  }, [address, generateMockAchievements, generateMockActivities, getCreatorProfile]); // Remove loading dependency

  // Handle follow action
  const handleFollow = useCallback(async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsFollowLoading(true);
    try {
      await followCreator(address, true);
      setIsFollowingCreator(true);
      toast.success('Now following creator');
    } catch (error) {
      console.error('Error following creator:', error);
      toast.error('Failed to follow creator');
    } finally {
      setIsFollowLoading(false);
    }
  }, [followCreator, address, setIsFollowingCreator, setIsFollowLoading]);

  // Handle unfollow action
  const handleUnfollow = useCallback(async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsFollowLoading(true);
    try {
      await followCreator(address, false);
      setIsFollowingCreator(false);
      toast.success('Unfollowed creator');
    } catch (error) {
      console.error('Error unfollowing creator:', error);
      toast.error('Failed to unfollow creator');
    } finally {
      setIsFollowLoading(false);
    }
  }, [followCreator, address, setIsFollowingCreator, setIsFollowLoading]);

  // Get verification badge
  const getVerificationBadge = useCallback(() => {
    const level = profile?.verificationLevel || VerificationLevel.NONE;
    
    switch(level) {
      case VerificationLevel.BASIC:
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Basic Verified</Badge>;
      case VerificationLevel.VERIFIED:
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Verified</Badge>;
      case VerificationLevel.ESTABLISHED:
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Established</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Unverified</Badge>;
    }
  }, [profile]);

  // Get trust score color
  const getTrustScoreColor = useCallback(() => {
    if (trustScore && trustScore >= 80) return "text-green-500";
    if (trustScore && trustScore >= 60) return "text-yellow-500";
    return "text-red-500";
  }, [trustScore]);

  // Format activity time
  const formatActivityTime = useCallback((timestamp: number) => {
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
  }, []);

  // Get activity icon
  const getActivityIcon = useCallback((type: Activity['type']) => {
    switch(type) {
      case 'campaign_created':
        return <Sparkles className="h-5 w-5 text-purple-500" />;
      case 'campaign_funded':
        return <Wallet className="h-5 w-5 text-green-500" />;
      case 'campaign_milestone':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'verification':
        return <BadgeCheck className="h-5 w-5 text-yellow-500" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-orange-500" />;
      case 'question':
        return <HelpCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Code className="h-5 w-5 text-gray-500" />;
    }
  }, []);

  // Check if any content is available to display
  const hasContent = campaigns.length > 0 || backedCampaigns.length > 0 || (profile && profile.stats);
  
  // Render only loading state if still loading and no content available
  if (loading && !hasContent) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-12">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <h3 className="text-lg font-medium">Loading profile...</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          This should only take a moment...
        </p>
      </div>
    );
  }
  
  // Show error state if there's an error and no content
  if (error && !hasContent) {
    return (
      <div className="w-full min-h-[300px] flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-3" />
        <h3 className="text-lg font-medium mb-2">Error Loading Profile</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Create default profile stats 
  const defaultStats = {
    campaigns: 5,
    contributions: 8,
    followers: 120,
    following: 45,
    totalFundsRaised: "12500",
    totalContributors: 42,
    campaignsCreated: 5,
    successfulCampaigns: 3
  };

  // Ensure profile stats are available with null checking
  const profileStats = profile && profile.stats ? profile.stats : defaultStats;

  // Create a safe profile object that won't cause null errors
  const safeDisplayName = profile && profile.displayName ? 
    profile.displayName : 
    `User ${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  
  const safeBio = profile && profile.bio ? profile.bio : "No bio provided";

  // Create mock profile with safe access
  const mockProfile = {
    displayName: safeDisplayName,
    bio: safeBio,
    avatar: profile?.profileImageUrl || "",
    coverImage: profile?.socialLinks?.website || "", // Fallback to website URL
    joinedDate: profile?.joinDate ? new Date(profile.joinDate).getTime() : (Date.now() - 1000 * 60 * 60 * 24 * 90), // 90 days ago
    trustScore: profile?.trustScore || 85,
    followers: profileStats.followers || 128,
    following: profileStats.following || 45,
    // Use derived values for compatibility
    totalRaised: parseFloat(profileStats.totalFundsRaised || "0"),
    totalBacked: profileStats.contributions || 0,
    successfulCampaigns: profileStats.successfulCampaigns || 0,
    socialLinks: profile?.socialLinks || {
      twitter: "https://twitter.com/username",
      github: "https://github.com/username",
      website: "https://example.com"
    },
    badges: profile?.badges || [
      { id: 1, name: "Early Supporter", icon: "🌟" },
      { id: 2, name: "Top Creator", icon: "🏆" },
      { id: 3, name: "Verified", icon: "✅" }
    ],
    skills: ["Blockchain Development", "Smart Contracts", "Web3", "DeFi"]
  };

  // Use real data if available, otherwise use mock data
  const userData = {
    ...mockProfile,
    // Override with real data if available
    displayName: profile && profile.displayName ? profile.displayName : mockProfile.displayName,
    bio: profile && profile.bio ? profile.bio : mockProfile.bio,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header - Improved */}
      <div className="relative rounded-xl overflow-hidden mb-8 shadow-lg border border-gray-700">
        {userData.coverImage ? (
          <div className="h-72 md:h-80 w-full relative">
            <Image 
              src={userData.coverImage}
              fill
              alt="Cover"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="h-72 md:h-80 w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#ffffff_0%,_transparent_70%)]"></div>
          </div>
        )}
        
        {/* Improved avatar with better positioning and border */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 md:-bottom-20 md:left-8 md:transform-none border-4 border-gray-800 dark:border-gray-900 rounded-full overflow-hidden bg-gray-800 shadow-xl">
          <Avatar className="h-32 w-32 md:h-40 md:w-40 ring-4 ring-blue-500/20">
            <AvatarImage src={userData.avatar} />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-600 to-purple-700 text-white">
              {userData.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {/* Profile Info - Enhanced grid layout */}
      <div className="mt-24 md:mt-28 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-1">
          <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    {userData.displayName}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 flex items-center text-gray-300">
                    {address.substring(0, 6)}...{address.substring(address.length - 4)}
                  </CardDescription>
                </div>
                {getVerificationBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Bio</h3>
                <p className="text-sm text-gray-200">{userData.bio}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Trust Score</h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-xl font-bold ${getTrustScoreColor()}`}>{trustScore}</span>
                  <Progress value={trustScore || 0} className="h-2 flex-1 bg-gray-700" />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 bg-gray-700/30 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-300">Following</p>
                  <p className="text-lg font-bold text-white">{userData.following}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-300">Followers</p>
                  <p className="text-lg font-bold text-white">{userData.followers}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-300">Campaigns</p>
                  <p className="text-lg font-bold text-white">{userData.successfulCampaigns}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {userData.badges.map((badge, index) => {
                    // Handle both string badges and object badges
                    if (typeof badge === 'string') {
                      return (
                        <Badge key={index} variant="outline" className="px-2 py-1 bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-700">
                          {badge}
                        </Badge>
                      );
                    } else {
                      return (
                        <Badge key={badge.id || index} variant="outline" className="px-2 py-1 bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-700">
                          <span className="mr-1">{badge.icon}</span> {badge.name}
                        </Badge>
                      );
                    }
                  })}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {userData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1 bg-blue-900/30 hover:bg-blue-800/40 text-blue-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              {!isOwnProfile && account ? (
                isFollowingCreator ? (
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-600 hover:bg-gray-700 hover:text-gray-200" 
                    onClick={handleUnfollow} 
                    disabled={isFollowLoading}
                  >
                    {isFollowLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Unfollowing...
                      </>
                    ) : (
                      'Unfollow'
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                    onClick={handleFollow} 
                    disabled={isFollowLoading}
                  >
                    {isFollowLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Following...
                      </>
                    ) : (
                      'Follow'
                    )}
                  </Button>
                )
              ) : isOwnProfile ? (
                <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-700 hover:text-gray-200" asChild>
                  <Link href="/profile/edit">
                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                  </Link>
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {showTabs && (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-8 bg-gray-800 p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-900/70 data-[state=active]:text-white">Overview</TabsTrigger>
                <TabsTrigger value="campaigns" className="data-[state=active]:bg-blue-900/70 data-[state=active]:text-white">Campaigns</TabsTrigger>
                <TabsTrigger value="backed" className="data-[state=active]:bg-blue-900/70 data-[state=active]:text-white">Backed</TabsTrigger>
                <TabsTrigger value="achievements" className="data-[state=active]:bg-blue-900/70 data-[state=active]:text-white">Achievements</TabsTrigger>
              </TabsList>

              {/* Tab content sections with improved styling */}
              <TabsContent value="overview" className="space-y-8">
                <Card className="border-gray-700 bg-gray-800/70 shadow-md">
                  <CardHeader className="border-b border-gray-700">
                    <CardTitle className="text-xl text-white">Achievements</CardTitle>
                    <CardDescription className="text-gray-300">Recent achievements earned by this creator</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {achievements
                        .filter(achievement => achievement.earned)
                        .slice(0, 3)
                        .map(achievement => (
                          <Card key={achievement.id} className="bg-gray-700/50 border-gray-600 hover:bg-gray-700/70 transition-colors">
                            <CardContent className="p-4 flex items-center space-x-4">
                              <div className="bg-gray-900 rounded-full p-2 shadow-inner">
                                {achievement.icon}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-100">{achievement.title}</h4>
                                <p className="text-xs text-gray-300">{achievement.description}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-700 bg-gray-800/70 shadow-md">
                  <CardHeader className="border-b border-gray-700">
                    <CardTitle className="text-xl text-white">Recent Activity</CardTitle>
                    <CardDescription className="text-gray-300">Latest actions from this creator</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {activities.slice(0, 3).map(activity => (
                        <div key={activity.id} className="flex items-start space-x-4">
                          <div className="bg-gray-700 rounded-full p-2">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-gray-100">{activity.title}</h4>
                              <span className="text-xs text-gray-300">{formatActivityTime(activity.timestamp)}</span>
                            </div>
                            <p className="text-sm text-gray-200">{activity.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-700 bg-gray-800/70 shadow-md">
                  <CardHeader className="border-b border-gray-700">
                    <CardTitle className="text-xl text-white">Campaigns</CardTitle>
                    <CardDescription className="text-gray-300">Created by this user</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {campaigns.length > 0 ? (
                      <div className="space-y-4">
                        {campaigns.slice(0, 2).map(campaign => (
                          <CampaignCard 
                            key={campaign.id} 
                            campaign={campaign} 
                            compact 
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-gray-500">
                        No campaigns created yet
                      </p>
                    )}
                  </CardContent>
                  {campaigns.length > 2 && (
                    <CardFooter className="border-t border-gray-700">
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab('campaigns')}>
                        View All Campaigns
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="campaigns" className="space-y-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Created Campaigns</h2>
                {campaigns.length > 0 ? (
                  <div className="space-y-6">
                    {campaigns.map(campaign => (
                      <CampaignCard 
                        key={campaign.id} 
                        campaign={campaign} 
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-gray-700 bg-gray-800/70 shadow-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Sparkles className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-xl font-medium text-gray-200 mb-2">No Campaigns Created</h3>
                      <p className="text-gray-400 text-center max-w-md mb-6">
                        This user hasn't created any campaigns yet. Check back later!
                      </p>
                      {isOwnProfile && (
                        <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Link href="/create">
                            Create Campaign
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="backed" className="space-y-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Backed Campaigns</h2>
                {backedCampaigns.length > 0 ? (
                  <div className="space-y-6">
                    {backedCampaigns.map(campaign => (
                      <CampaignCard 
                        key={campaign.id} 
                        campaign={campaign} 
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-gray-700 bg-gray-800/70 shadow-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Wallet className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-xl font-medium text-gray-200 mb-2">No Backed Campaigns</h3>
                      <p className="text-gray-400 text-center max-w-md mb-6">
                        This user hasn't backed any campaigns yet. Check back later!
                      </p>
                      <Button asChild>
                        <Link href="/discover" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          Explore Campaigns
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="achievements" className="space-y-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Achievements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {achievements.map(achievement => (
                    <Card 
                      key={achievement.id} 
                      className={`border ${achievement.earned ? 'border-gray-700 bg-gray-800/70' : 'border-gray-800 bg-gray-900/30 opacity-60'} shadow-md transition-all duration-200 hover:shadow-lg`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`rounded-full p-3 ${achievement.earned ? 'bg-blue-900/40 text-blue-300 ring-2 ring-blue-500/20' : 'bg-gray-800 text-gray-500'}`}>
                            {achievement.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className={`font-bold text-lg ${achievement.earned ? 'text-white' : 'text-gray-400'}`}>
                                {achievement.title}
                              </h3>
                              {achievement.earned && (
                                <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                                  Earned
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm ${achievement.earned ? 'text-gray-300' : 'text-gray-500'} mb-3`}>
                              {achievement.description}
                            </p>
                            
                            {(achievement.progress !== undefined && achievement.total) && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className={achievement.earned ? 'text-gray-300' : 'text-gray-500'}>Progress</span>
                                  <span className={achievement.earned ? 'text-gray-300' : 'text-gray-500'}>
                                    {achievement.progress} / {achievement.total}
                                  </span>
                                </div>
                                <Progress 
                                  value={(achievement.progress / achievement.total) * 100} 
                                  className={`h-2 ${achievement.earned ? 'bg-gray-700' : 'bg-gray-800'}`}
                                />
                              </div>
                            )}
                            
                            {(achievement.earned && achievement.earnedAt) && (
                              <p className="text-xs text-gray-400 mt-3">
                                Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafeUserProfile; 