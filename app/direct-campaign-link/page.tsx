'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * This page has one purpose: directly navigate to campaign 0
 * It skips all ID parsing and goes straight to the target campaign
 */
export default function DirectCampaignRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to campaign 0 immediately on page load
    router.push('/campaign/0');
  }, [router]);
  
  return (
    <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-4">Redirecting to Campaign 0...</h1>
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
} 