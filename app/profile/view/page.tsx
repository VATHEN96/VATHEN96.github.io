'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWowzaRush } from '@/context/wowzarushContext';
import { EnhancedUserProfile } from '@/components/EnhancedUserProfile';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function ProfileViewPage() {
  const searchParams = useSearchParams();
  const address = searchParams?.get('address');
  const { getCreatorProfile } = useWowzaRush();
  
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!address) {
        setError('No wallet address provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const profileData = await getCreatorProfile(address);
        setProfile(profileData);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile. The user may not exist or there was an error.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [address, getCreatorProfile]);

  if (!address) {
    return (
      <div className="w-full px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            No wallet address provided. Please specify a wallet address to view a profile.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading profile...</span>
        </div>
      ) : error ? (
        <div>
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      ) : (
        <EnhancedUserProfile 
          address={address as string} 
          isViewOnly={true} 
        />
      )}
    </div>
  );
} 