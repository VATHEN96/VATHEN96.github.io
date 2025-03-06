"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModeToggle } from '@/components/mode-toggle';
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
  ListItem,
} from '@/components/ui/navigation-menu';

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

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

// Function to render ListItem component for navigation menu
const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
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
  const pathname = usePathname();
  const { isWalletConnected, connectWallet, userProfile } = useWowzaRush();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

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
      href: '/explore',
      label: 'Explore',
      active: pathname === '/explore',
    },
    {
      href: '/how-it-works',
      label: 'How it Works',
      active: pathname === '/how-it-works',
    },
    {
      href: '/about',
      label: 'About',
      active: pathname === '/about',
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white/95 dark:bg-black/95 backdrop-blur-sm shadow-sm border-b border-black dark:border-white' : 'bg-white dark:bg-black'
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 md:hidden text-black dark:text-white">
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 bg-white dark:bg-black text-black dark:text-white border-r border-black dark:border-white">
            <MobileNav pathname={pathname} />
          </SheetContent>
        </Sheet>
        
        <Link href="/" className="flex items-center gap-2">
          <ClientImage src="/logo.svg" alt="WowZaRush Logo" width={32} height={32} className="dark:invert" />
          <span className="font-bold text-lg hidden md:inline-block text-black dark:text-white">WowZaRush</span>
        </Link>
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Discover</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {categories.map((category) => (
                    <ListItem
                      key={category.title}
                      title={category.title}
                      href={category.href}
                    >
                      {category.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link href="/create" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Create
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/about"
                      >
                        <div className="mb-2 mt-4 text-lg font-medium">
                          About WowZaRush
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Learn how our platform empowers creators and supports community-driven projects.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/help" title="Help Center">
                    Find answers to common questions and learn how to use the platform.
                  </ListItem>
                  <ListItem href="/blog" title="Blog">
                    Read the latest news and updates from the WowZaRush team.
                  </ListItem>
                  <ListItem href="/roadmap" title="Roadmap">
                    See what's coming next for WowZaRush and our development plans.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link href="/analytics" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Analytics
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                route.active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>
        
        <div className={cn(
          "hidden md:block relative transition-all duration-300 ease-in-out flex-1",
          isSearchOpen ? "md:max-w-md lg:max-w-xl" : "md:max-w-xs"
        )}>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns, creators..."
              className="pl-8 w-full"
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setIsSearchOpen(false)}
            />
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
            className="relative"
            onClick={toggleNotifications}
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
          
          <ModeToggle />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t py-4 px-4 bg-background">
          {/* Search Input - Mobile */}
          <div className="relative w-full mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search campaigns..."
              className="w-full pl-8 bg-muted/50"
            />
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
          <NotificationCenter onClose={() => setShowNotifications(false)} />
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
      href: '/explore',
      label: 'Explore',
      active: pathname === '/explore',
    },
    {
      href: '/how-it-works',
      label: 'How it Works',
      active: pathname === '/how-it-works',
    },
    {
      href: '/about',
      label: 'About',
      active: pathname === '/about',
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
