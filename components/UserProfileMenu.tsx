import React from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  User, 
  LogOut, 
  Plus, 
  Heart, 
  History, 
  Shield,
  Wallet
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export function UserProfileMenu() {
  const { account, isWalletConnected, connectWallet, disconnectWallet } = useWowzaRush();
  const router = useRouter();

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
  };

  const handleCreateCampaign = () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to create a campaign');
      return;
    }
    router.push('/campaign/create');
  };

  // Format wallet address for display
  const formatAddress = (address: string | null | undefined): string => {
    if (!address || typeof address !== 'string') return '';
    
    // Ensure the address is a string and has the correct format
    const cleanAddress = address.toString().toLowerCase();
    if (cleanAddress.length < 10) return cleanAddress;
    
    return `${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)}`;
  };

  // Generate avatar fallback from address
  const getAvatarFallback = (address: string | null | undefined): string => {
    if (!address || typeof address !== 'string') return 'WR';
    
    // Ensure the address is a string and has the correct format
    const cleanAddress = address.toString().replace('0x', '');
    if (cleanAddress.length < 2) return 'WR';
    
    return cleanAddress.slice(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isWalletConnected ? (
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt="User" />
              <AvatarFallback>{getAvatarFallback(account || '')}</AvatarFallback>
            </Avatar>
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={handleConnectWallet}>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </DropdownMenuTrigger>
      
      {isWalletConnected && (
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">My Wallet</p>
              <p className="text-xs leading-none text-muted-foreground">
                {formatAddress(account || '')}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              My Profile
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center cursor-pointer">
              <Shield className="h-4 w-4 mr-2" />
              Governance
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href="/profile/favorites" className="flex items-center cursor-pointer">
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href="/profile/contributions" className="flex items-center cursor-pointer">
              <History className="h-4 w-4 mr-2" />
              Contribution History
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleCreateCampaign}
            className="flex items-center cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={handleDisconnectWallet}
            className="flex items-center cursor-pointer text-red-500 focus:text-red-500"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
} 