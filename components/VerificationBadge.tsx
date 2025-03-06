'use client';

import React from 'react';
import { VerificationLevel } from '@/context/wowzarushContext';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  ShieldX
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface VerificationBadgeProps {
  level: VerificationLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function VerificationBadge({ 
  level, 
  showLabel = true, 
  size = 'md' 
}: VerificationBadgeProps) {
  let icon = null;
  let label = '';
  let variant: 'outline' | 'secondary' | 'default' | 'destructive' = 'outline';
  let tooltip = '';
  
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20;
  
  switch (level) {
    case VerificationLevel.ESTABLISHED:
      icon = <ShieldCheck className="text-green-500" size={iconSize} />;
      label = 'Established';
      variant = 'default';
      tooltip = 'Established creator with multiple successful campaigns';
      break;
    case VerificationLevel.VERIFIED:
      icon = <Shield className="text-blue-500" size={iconSize} />;
      label = 'Verified';
      variant = 'secondary';
      tooltip = 'Identity verified through official channels';
      break;
    case VerificationLevel.BASIC:
      icon = <ShieldAlert className="text-yellow-500" size={iconSize} />;
      label = 'Basic';
      variant = 'outline';
      tooltip = 'Basic verification with email confirmation';
      break;
    case VerificationLevel.NONE:
    default:
      icon = <ShieldX className="text-gray-400" size={iconSize} />;
      label = 'Unverified';
      variant = 'outline';
      tooltip = 'Creator has not completed verification';
      break;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={variant} 
            className={`flex items-center gap-1 ${
              size === 'sm' ? 'text-xs py-0' : 
              size === 'md' ? 'text-sm' : 'text-base py-1.5 px-3'
            }`}
          >
            {icon}
            {showLabel && <span>{label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 