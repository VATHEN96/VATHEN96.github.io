import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  CircleCheck, 
  Award, 
  CircleDollarSign, 
  Users, 
  Calendar, 
  CircleAlert,
  ExternalLink
} from 'lucide-react';
import { useWowzaRush, VerificationLevel, CreatorProfile } from '@/context/wowzarushContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CreatorProfileCardProps {
  address: string;
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
}

// Custom styled Progress component
const StyledProgress = React.forwardRef<
  React.ElementRef<typeof Progress>,
  React.ComponentPropsWithoutRef<typeof Progress> & { indicatorColor?: string }
>(({ className, indicatorColor, ...props }, ref) => (
  <div className="relative w-full">
    <Progress ref={ref} className={className} {...props} />
    {indicatorColor && (
      <div 
        className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
        style={{ 
          clipPath: `inset(0 ${100 - (props.value || 0)}% 0 0)` 
        }}
      >
        <div className={`h-full w-full ${indicatorColor}`} />
      </div>
    )}
  </div>
));
StyledProgress.displayName = "StyledProgress";

export default function CreatorProfileCard({ 
  address, 
  size = 'md', 
  showStats = true 
}: CreatorProfileCardProps) {
  const { getCreatorProfile, calculateTrustScore, account } = useWowzaRush();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [trustScore, setTrustScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const creatorProfile = await getCreatorProfile(address);
        setProfile(creatorProfile);
        
        if (creatorProfile) {
          const score = await calculateTrustScore(address);
          setTrustScore(score);
        }
      } catch (error) {
        console.error('Error loading creator profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (address) {
      loadProfile();
    }
  }, [address, getCreatorProfile, calculateTrustScore]);
  
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
  
  if (loading) {
    return (
      <Card className={`w-full ${size === 'sm' ? 'max-w-xs' : size === 'lg' ? 'max-w-2xl' : 'max-w-md'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!profile) {
    return (
      <Card className={`w-full ${size === 'sm' ? 'max-w-xs' : size === 'lg' ? 'max-w-2xl' : 'max-w-md'}`}>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-gray-500">
              Creator profile not found
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`w-full ${size === 'sm' ? 'max-w-xs' : size === 'lg' ? 'max-w-2xl' : 'max-w-md'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.profileImageUrl} alt={profile.displayName || profile.address} />
            <AvatarFallback>{(profile.displayName || profile.address).substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{profile.displayName || profile.address.substring(0, 10)}</h3>
              {getVerificationBadge()}
            </div>
            <p className="text-sm text-gray-500">
              {profile.address.substring(0, 6)}...{profile.address.substring(profile.address.length - 4)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {profile.bio && (
          <p className="text-sm text-gray-700">
            {profile.bio}
          </p>
        )}
        
        <div className="space-y-1">
          <div className="flex justify-between mb-1">
            <span className="text-sm">Trust Score</span>
            <span className="font-semibold">{trustScore}/100</span>
          </div>
          <StyledProgress value={trustScore} className="h-2" indicatorColor={getTrustScoreColor()} />
        </div>
        
        {profile.badges?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((badge, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="capitalize"
              >
                {badge.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        )}
        
        {showStats && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Funds Raised</p>
                <p className="text-lg font-bold">{parseFloat(profile?.stats?.totalFundsRaised || "0").toFixed(2)} ETH</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Contributors</p>
                <p className="text-lg font-bold">{profile?.stats?.totalContributors || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Success Rate</p>
                <p className="text-lg font-bold">
                  {profile?.stats?.campaignsCreated > 0 
                    ? Math.round((profile?.stats?.successfulCampaigns / profile?.stats?.campaignsCreated) * 100)
                    : 0}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Campaigns</p>
                <p className="text-lg font-bold">{profile?.stats?.campaignsCreated || 0}</p>
              </div>
            </div>
          </div>
        )}
        
        {profile.socialLinks && Object.values(profile.socialLinks).some(link => !!link) && (
          <div className="pt-2">
            <p className="text-sm font-medium mb-2">Connect with creator</p>
            <div className="flex gap-2">
              {profile.socialLinks.website && (
                <Button size="sm" variant="outline" asChild>
                  <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Website
                  </a>
                </Button>
              )}
              {profile.socialLinks.twitter && (
                <Button size="sm" variant="outline" asChild>
                  <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">Twitter</a>
                </Button>
              )}
              {profile.socialLinks.github && (
                <Button size="sm" variant="outline" asChild>
                  <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer">GitHub</a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      {account === address && (
        <CardFooter className="border-t pt-4">
          <Button variant="outline" asChild className="w-full">
            <a href="/profile/edit">Edit Profile</a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 