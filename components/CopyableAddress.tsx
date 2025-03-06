'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyableAddressProps {
  address: string;
  className?: string;
}

/**
 * CopyableAddress component
 * Displays a truncated address with copy-to-clipboard functionality on hover
 */
export default function CopyableAddress({ address, className = '' }: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);

  // Function to truncate address for display
  const truncateAddress = (address: string): string => {
    if (!address) return '';
    if (address.length <= 10) return address;
    
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Function to copy address to clipboard
  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy address: ', err);
      });
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 group cursor-pointer relative ${className}`}
      onClick={copyToClipboard}
      title="Click to copy full address"
    >
      <span>{truncateAddress(address)}</span>
      <span className="text-gray-400 group-hover:text-blue-500 transition-colors">
        {copied ? <Check className="text-green-500" size={16} /> : <Copy size={16} />}
      </span>
      {copied && (
        <span className="text-xs text-green-500 absolute bg-white px-2 py-1 rounded shadow-sm -top-8 left-1/2 transform -translate-x-1/2 z-10">
          Copied!
        </span>
      )}
    </span>
  );
} 