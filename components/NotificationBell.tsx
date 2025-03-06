'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWowzaRush } from '@/context/wowzarushContext';
import { useRouter } from 'next/navigation';
import { playBellSound } from '@/utils/notificationSound';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  campaignId: string;
  milestoneIndex: number;
  milestoneTitle: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'vote' | 'milestone_completed' | 'funds_released';
  voter?: string;
  isUpvote?: boolean;
}

export const saveNotification = (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
  // Get existing notifications
  const existingNotifications = getNotifications();
  
  // Create new notification with id and timestamp
  const newNotification: Notification = {
    ...notification,
    id: Math.random().toString(36).substring(2, 15),
    timestamp: Date.now(),
    read: false
  };
  
  // Add to beginning of array to show newest first
  const updatedNotifications = [newNotification, ...existingNotifications];
  
  // Save to localStorage
  localStorage.setItem('wowzarush_notifications', JSON.stringify(updatedNotifications));
  
  return newNotification;
};

export const getNotifications = (): Notification[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem('wowzarush_notifications');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse notifications from localStorage', e);
    return [];
  }
};

export const markNotificationAsRead = (notificationId: string) => {
  const notifications = getNotifications();
  const updatedNotifications = notifications.map(notification => 
    notification.id === notificationId 
      ? { ...notification, read: true } 
      : notification
  );
  
  localStorage.setItem('wowzarush_notifications', JSON.stringify(updatedNotifications));
  return updatedNotifications;
};

export const markAllNotificationsAsRead = () => {
  const notifications = getNotifications();
  const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
  
  localStorage.setItem('wowzarush_notifications', JSON.stringify(updatedNotifications));
  return updatedNotifications;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { account } = useWowzaRush();
  const router = useRouter();
  const prevCountRef = useRef<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Load notifications and set up interval to check for new ones
  useEffect(() => {
    if (!account) return;
    
    // Load initial notifications
    const loadedNotifications = getNotifications();
    setNotifications(loadedNotifications);
    prevCountRef.current = loadedNotifications.filter(n => !n.read).length;
    
    // Set up interval to check for new notifications
    const interval = setInterval(() => {
      const freshNotifications = getNotifications();
      setNotifications(freshNotifications);
      
      // Check if there are new notifications
      const currentUnreadCount = freshNotifications.filter(n => !n.read).length;
      if (currentUnreadCount > prevCountRef.current) {
        // Play bell sound using our utility
        playBellSound();
      }
      
      prevCountRef.current = currentUnreadCount;
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [account]);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    const updated = markNotificationAsRead(notification.id);
    setNotifications(updated);
    
    // Navigate to the campaign page
    router.push(`/campaign/${notification.campaignId}`);
    
    // Close dropdown
    setIsOpen(false);
  };
  
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = markAllNotificationsAsRead();
    setNotifications(updated);
  };
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  if (!account) return null;
  
  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        className="relative p-2" 
        aria-label="Notifications"
        onClick={toggleDropdown}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[1rem] h-4"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-md z-50">
          <div className="flex justify-between items-center p-2 border-b border-gray-200">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id}
                className={`flex flex-col items-start p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full justify-between">
                  <span className="font-medium">
                    {notification.type === 'vote' 
                      ? 'New Vote' 
                      : notification.type === 'milestone_completed' 
                        ? 'Milestone Completed' 
                        : 'Funds Released'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-sm mt-1">
                  {notification.type === 'vote' 
                    ? `A contributor ${notification.isUpvote ? 'approved' : 'rejected'} milestone ${notification.milestoneIndex + 1}: ${notification.milestoneTitle}`
                    : notification.message}
                </p>
                
                <div className="flex mt-2 w-full justify-end">
                  <span className="text-xs text-blue-600">
                    View Campaign →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 