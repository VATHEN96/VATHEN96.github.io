'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  campaignId: string;
}

export default function ShareButton({ campaignId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const campaignUrl = `${window.location.origin}/campaign/${campaignId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out this campaign',
        text: 'I found this interesting campaign on WowzaRush',
        url: campaignUrl,
      }).catch(() => {
        // Fallback if share fails
        copyToClipboard(campaignUrl);
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      copyToClipboard(campaignUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button 
      onClick={handleShare} 
      variant="outline"
      className="flex items-center gap-2"
    >
      <Share2 className="h-4 w-4" />
      {copied ? 'Copied!' : 'Share'}
    </Button>
  );
} 