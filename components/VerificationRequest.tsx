import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Info,
  LockKeyhole
} from 'lucide-react';
import { 
  useWowzaRush, 
  VerificationLevel 
} from '@/context/wowzarushContext';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

export default function VerificationRequest() {
  const { isWalletConnected, account, startVerification, getVerificationStatus } = useWowzaRush();
  const [status, setStatus] = useState<{
    level: VerificationLevel, 
    inProgress: boolean, 
    pendingLevel?: VerificationLevel
  }>({
    level: VerificationLevel.UNVERIFIED,
    inProgress: false
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [requestLoading, setRequestLoading] = useState<{
    [key in VerificationLevel]?: boolean
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchStatus = async () => {
      if (!isWalletConnected) {
        setLoading(false);
        return;
      }
      
      try {
        const verificationStatus = await getVerificationStatus();
        setStatus(verificationStatus);
      } catch (error) {
        console.error('Error fetching verification status:', error);
        setError('Failed to fetch verification status');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, [isWalletConnected, getVerificationStatus]);
  
  const handleRequestVerification = async (level: VerificationLevel) => {
    setRequestLoading({ ...requestLoading, [level]: true });
    setError(null);
    setSuccess(null);
    
    try {
      const requestId = await startVerification(level);
      setSuccess(`Verification request submitted successfully. Request ID: ${requestId}`);
      setStatus({
        ...status,
        inProgress: true,
        pendingLevel: level
      });
      
      // In a real implementation, you would redirect to the verification service or poll for status updates
      // For this example, we'll just simulate a successful verification after a delay
      setTimeout(async () => {
        const updatedStatus = await getVerificationStatus();
        setStatus(updatedStatus);
      }, 5000); // Check for updates after 5 seconds
    } catch (error) {
      console.error('Error requesting verification:', error);
      setError('Failed to submit verification request. Please try again.');
    } finally {
      setRequestLoading({ ...requestLoading, [level]: false });
    }
  };
  
  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500">Loading verification status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!isWalletConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-orange-500 mb-4" />
            <p className="text-gray-500 mb-4">Please connect your wallet to verify your identity</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const canRequestVerification = (level: VerificationLevel): boolean => {
    // Can't request the same level or lower
    if (status.level >= level) return false;
    
    // Can't request if there's a pending request
    if (status.inProgress) return false;
    
    // Specific requirements for each level
    switch (level) {
      case VerificationLevel.BASIC:
        // Anyone can request basic verification
        return true;
      
      case VerificationLevel.VERIFIED:
        // Must have basic verification to request verified
        return status.level >= VerificationLevel.BASIC;
      
      case VerificationLevel.ESTABLISHED:
        // Must have verified status to request established
        return status.level >= VerificationLevel.VERIFIED;
      
      default:
        return false;
    }
  };
  
  const getLevelDescription = (level: VerificationLevel): string => {
    switch (level) {
      case VerificationLevel.BASIC:
        return "Email verification to confirm you're a real person";
      
      case VerificationLevel.VERIFIED:
        return "Government ID verification to confirm your identity";
      
      case VerificationLevel.ESTABLISHED:
        return "Enhanced verification for established creators with successful campaigns";
      
      default:
        return "No verification";
    }
  };
  
  const getLevelRequirements = (level: VerificationLevel): string[] => {
    switch (level) {
      case VerificationLevel.BASIC:
        return [
          "Valid email address",
          "Connected wallet"
        ];
      
      case VerificationLevel.VERIFIED:
        return [
          "Basic verification completed",
          "Government-issued ID",
          "Selfie photo",
          "Proof of address"
        ];
      
      case VerificationLevel.ESTABLISHED:
        return [
          "Verified status completed",
          "At least 3 successful campaigns",
          "At least 10 ETH raised across all campaigns",
          "Positive contributor feedback"
        ];
      
      default:
        return [];
    }
  };
  
  const getLevelBenefits = (level: VerificationLevel): string[] => {
    switch (level) {
      case VerificationLevel.BASIC:
        return [
          "Basic trust badge on your profile",
          "Ability to create campaigns",
          "+10 points to trust score"
        ];
      
      case VerificationLevel.VERIFIED:
        return [
          "Verified trust badge on your profile",
          "Higher visibility in search results",
          "Reduced fees for campaign creation",
          "+30 points to trust score"
        ];
      
      case VerificationLevel.ESTABLISHED:
        return [
          "Established creator badge",
          "Featured placement opportunities",
          "Early access to new platform features",
          "Priority support",
          "+50 points to trust score"
        ];
      
      default:
        return [];
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Creator Verification
        </CardTitle>
        <CardDescription>
          Verify your identity to build trust with contributors and unlock platform benefits
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Success</AlertTitle>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}
        
        {status.inProgress && (
          <Alert className="bg-blue-50 border-blue-200">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <AlertTitle className="text-blue-700">Verification in Progress</AlertTitle>
            <AlertDescription className="text-blue-600">
              Your {status.pendingLevel} verification is being processed. This may take a few minutes.
            </AlertDescription>
          </Alert>
        )}
        
        <div>
          <h3 className="text-lg font-medium mb-2">Current Verification Level</h3>
          <div className="flex items-center gap-2 mb-6">
            <Badge 
              className={
                status.level === VerificationLevel.ESTABLISHED ? "bg-purple-500" :
                status.level === VerificationLevel.VERIFIED ? "bg-green-500" :
                status.level === VerificationLevel.BASIC ? "bg-blue-500" :
                "bg-gray-500"
              }
            >
              {status.level}
            </Badge>
            <span className="text-sm text-gray-500">
              {getLevelDescription(status.level)}
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Available Verification Levels</h3>
          
          {/* Basic Verification */}
          <div className={`border rounded-lg p-4 ${status.level === VerificationLevel.BASIC ? 'bg-blue-50' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500">Basic</Badge>
                <h4 className="font-medium">Email Verification</h4>
              </div>
              
              {status.level === VerificationLevel.BASIC ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  Current Level
                </Badge>
              ) : status.level > VerificationLevel.BASIC ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : status.inProgress && status.pendingLevel === VerificationLevel.BASIC ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  In Progress
                </Badge>
              ) : (
                <Button 
                  size="sm"
                  disabled={!canRequestVerification(VerificationLevel.BASIC) || requestLoading[VerificationLevel.BASIC]}
                  onClick={() => handleRequestVerification(VerificationLevel.BASIC)}
                >
                  {requestLoading[VerificationLevel.BASIC] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-1" />
                  )}
                  Verify
                </Button>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <h5 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <LockKeyhole className="h-3 w-3" /> Requirements
                </h5>
                <ul className="text-sm space-y-1">
                  {getLevelRequirements(VerificationLevel.BASIC).map((req, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h5 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <Info className="h-3 w-3" /> Benefits
                </h5>
                <ul className="text-sm space-y-1">
                  {getLevelBenefits(VerificationLevel.BASIC).map((benefit, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Verified Level */}
          <div className={`border rounded-lg p-4 ${status.level === VerificationLevel.VERIFIED ? 'bg-green-50' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">Verified</Badge>
                <h4 className="font-medium">Identity Verification</h4>
              </div>
              
              {status.level === VerificationLevel.VERIFIED ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Current Level
                </Badge>
              ) : status.level > VerificationLevel.VERIFIED ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : status.inProgress && status.pendingLevel === VerificationLevel.VERIFIED ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  In Progress
                </Badge>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button 
                          size="sm"
                          disabled={!canRequestVerification(VerificationLevel.VERIFIED) || requestLoading[VerificationLevel.VERIFIED]}
                          onClick={() => handleRequestVerification(VerificationLevel.VERIFIED)}
                        >
                          {requestLoading[VerificationLevel.VERIFIED] ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-1" />
                          )}
                          Verify
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!canRequestVerification(VerificationLevel.VERIFIED) && status.level < VerificationLevel.BASIC && (
                      <TooltipContent>
                        <p>Complete Basic verification first</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <h5 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <LockKeyhole className="h-3 w-3" /> Requirements
                </h5>
                <ul className="text-sm space-y-1">
                  {getLevelRequirements(VerificationLevel.VERIFIED).map((req, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h5 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <Info className="h-3 w-3" /> Benefits
                </h5>
                <ul className="text-sm space-y-1">
                  {getLevelBenefits(VerificationLevel.VERIFIED).map((benefit, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Established Level */}
          <div className={`border rounded-lg p-4 ${status.level === VerificationLevel.ESTABLISHED ? 'bg-purple-50' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500">Established</Badge>
                <h4 className="font-medium">Established Creator Status</h4>
              </div>
              
              {status.level === VerificationLevel.ESTABLISHED ? (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                  Current Level
                </Badge>
              ) : status.inProgress && status.pendingLevel === VerificationLevel.ESTABLISHED ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  In Progress
                </Badge>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button 
                          size="sm"
                          disabled={!canRequestVerification(VerificationLevel.ESTABLISHED) || requestLoading[VerificationLevel.ESTABLISHED]}
                          onClick={() => handleRequestVerification(VerificationLevel.ESTABLISHED)}
                        >
                          {requestLoading[VerificationLevel.ESTABLISHED] ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-1" />
                          )}
                          Apply
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!canRequestVerification(VerificationLevel.ESTABLISHED) && status.level < VerificationLevel.VERIFIED && (
                      <TooltipContent>
                        <p>Complete Verified level first</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <h5 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <LockKeyhole className="h-3 w-3" /> Requirements
                </h5>
                <ul className="text-sm space-y-1">
                  {getLevelRequirements(VerificationLevel.ESTABLISHED).map((req, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h5 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <Info className="h-3 w-3" /> Benefits
                </h5>
                <ul className="text-sm space-y-1">
                  {getLevelBenefits(VerificationLevel.ESTABLISHED).map((benefit, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex-col items-start">
        <p className="text-sm text-gray-500 mb-2">
          All verification data is securely stored and processed according to our privacy policy.
          Your personal information is never shared with campaign contributors without your permission.
        </p>
        <p className="text-sm text-gray-500">
          Verification status is displayed on your public profile to help build trust with potential contributors.
        </p>
      </CardFooter>
    </Card>
  );
} 