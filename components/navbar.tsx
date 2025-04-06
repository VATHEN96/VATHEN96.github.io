"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserProfileMenu } from '@/components/UserProfileMenu';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useWowzaRush } from '@/context/wowzarushContext';
import { Search, Menu, X, Bell } from 'lucide-react';
import Image from 'next/image';
import ClientImage from './ClientImage';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuList,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

import { DEBUG_MODE } from '@/services/blockchainServiceFixedV3';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Define categories for the navigation menu
const categories = [
  {
    title: "Technology",
    href: "/discover/technology",
    description: "Explore innovative tech projects building the future of web3."
  },
  {
    title: "Environment",
    href: "/discover/environment",
    description: "Support sustainable and eco-friendly initiatives making a difference."
  },
  {
    title: "Arts & Culture",
    href: "/discover/arts",
    description: "Discover creative projects from artists and cultural innovators."
  },
  {
    title: "Education",
    href: "/discover/education",
    description: "Help fund educational initiatives and learning platforms."
  },
  {
    title: "Community",
    href: "/discover/community",
    description: "Join community-driven projects creating positive social impact."
  },
  {
    title: "Finance",
    href: "/discover/finance",
    description: "Explore DeFi protocols and financial infrastructure projects."
  }
];

// Define custom ListItem component for navigation dropdown
interface ListItemProps {
  title: string;
  href: string;
  children?: React.ReactNode;
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  ListItemProps
>(({ title, href, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          ref={ref}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export default function Navbar() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { isWalletConnected, connectWallet, userProfile } = useWowzaRush();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check for unread notifications
  useEffect(() => {
    // This would be replaced with actual notification service integration
    if (isWalletConnected && userProfile) {
      setNotificationCount(3); // Example count, would be fetched from service
    } else {
      setNotificationCount(0);
    }
  }, [isWalletConnected, userProfile]);

  const routes = [
    {
      href: '/create',
      label: 'Create',
      active: pathname === '/create',
    },
    {
      href: '/how-it-works',
      label: 'How it Works',
      active: pathname === '/how-it-works',
    },
    {
      href: '/my-campaigns',
      label: 'My Campaigns',
      active: pathname === '/my-campaigns',
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search-campaign?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-black' : 'bg-white'
      }`}
    >
      <div className="w-full flex h-16 items-center justify-between px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 md:hidden text-black" aria-label="Open menu">
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 bg-white text-black border-r border-black">
            <MobileNav pathname={pathname} />
          </SheetContent>
        </Sheet>
        
        <Link href="/" className="flex items-center gap-2">
          <ClientImage src="/logo.svg" alt="WowZaRush Logo" width={32} height={32} />
          <span className="font-bold text-lg hidden md:inline-block text-black">WowZaRush</span>
          {DEBUG_MODE && (
            <div className="bg-amber-500 text-black font-medium px-3 py-1 text-xs rounded-full ml-2 flex items-center">
              <span className="animate-pulse mr-1">⚠️</span>
              DEBUG MODE
            </div>
          )}
        </Link>
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/create" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Create
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link href="/how-it-works" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  How it Works
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link href="/my-campaigns" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  My Campaigns
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuTrigger>Series Funding</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  <ListItem
                    title="Create Series Campaign"
                    href="/create-series-funding"
                  >
                    Start your journey with series funding for your startup
                  </ListItem>
                  <ListItem
                    title="Browse Series Funding"
                    href="/discover?type=series-funding"
                  >
                    Explore startups raising Series A, B, and C funding
                  </ListItem>
                  <ListItem
                    title="How Series Funding Works"
                    href="/how-it-works#series-funding"
                  >
                    Learn about multi-tier funding rounds for different growth stages
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
          {/* Routes removed as per requirements */}
        </nav>
        
        <div className={cn(
          "hidden md:block relative transition-all duration-300 ease-in-out flex-1",
          isSearchOpen ? "md:max-w-md lg:max-w-xl" : "md:max-w-xs"
        )}>
          <div className="relative">
            <form onSubmit={handleSearchSubmit}>
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns, creators..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setIsSearchOpen(false)}
              />
            </form>
          </div>
        </div>
        
        <div className="flex items-center ml-auto">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="relative touch-button"
            onClick={toggleNotifications}
            aria-label={`Notifications ${notificationCount > 0 ? `(${notificationCount} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {notificationCount}
              </span>
            )}
          </Button>
          
          {isWalletConnected ? (
            <UserProfileMenu />
          ) : (
            <Button onClick={connectWallet} className="ml-4">Connect Wallet</Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t py-4 px-4 bg-background">
          {/* Search Input - Mobile */}
          <div className="relative w-full mb-4">
            <form onSubmit={handleSearchSubmit}>
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search campaigns..."
                className="w-full pl-8 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col space-y-4">
            {routes.map((route) => (
              <SheetClose asChild key={route.href}>
                <Link
                  href={route.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    route.active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {route.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
        </div>
      )}

      {/* Notification Center */}
      {showNotifications && (
        <div className="absolute right-4 top-16 w-80 z-50">
          <NotificationCenter onClose={toggleNotifications} />
        </div>
      )}
    </header>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  const { isWalletConnected, connectWallet } = useWowzaRush();
  
  const routes = [
    {
      href: '/',
      label: 'Home',
      active: pathname === '/',
    },
    {
      href: '/create',
      label: 'Create',
      active: pathname === '/create',
    },
    {
      href: '/how-it-works',
      label: 'How it Works',
      active: pathname === '/how-it-works',
    },
    {
      href: '/my-campaigns',
      label: 'My Campaigns',
      active: pathname === '/my-campaigns',
    },
  ];

  // Series funding navigation items
  const seriesFundingLinks = [
    {
      href: '/create-series-funding',
      label: 'Create Series Campaign',
    },
    {
      href: '/discover?type=series-funding',
      label: 'Browse Series Funding',
    },
    {
      href: '/how-it-works#series-funding',
      label: 'How Series Funding Works',
    },
  ];
  
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto px-6 pb-10">
      <div className="flex items-center py-4">
        <ClientImage src="/logo.svg" alt="WowZaRush Logo" width={24} height={24} />
        <span className="ml-2 font-bold text-lg">WowZaRush</span>
      </div>
      <div className="flex flex-col space-y-3">
        {routes.map((route) => (
          <SheetClose asChild key={route.href}>
            <Link
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                route.active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {route.label}
            </Link>
          </SheetClose>
        ))}
        
        {/* Series Funding Section */}
        <div className="pt-2">
          <div className="text-sm font-medium mb-2">Series Funding</div>
          <div className="grid gap-2 pl-2">
            {seriesFundingLinks.map((link) => (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 pt-6">
        <div className="grid gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8" />
          </div>
        </div>
        
        {!isWalletConnected && (
          <Button onClick={connectWallet} className="w-full">
            Connect Wallet
          </Button>
        )}
      </div>
    </div>
  );
}
