'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWowzaRush } from '@/context/wowzarushContext';
import { Bell, Settings, Eye, Trash2, Check, X } from 'lucide-react';
import { Notification, NotificationPreferences } from '@/services/NotificationService';
import { format } from 'date-fns';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationCenter() {
  const { account, isWalletConnected, getUserNotifications, getUnreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, updateNotificationPreferences, getNotificationPreferences } = useWowzaRush();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [openSettings, setOpenSettings] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<string>('all');
  
  // Load notifications when wallet is connected
  useEffect(() => {
    if (isWalletConnected && account) {
      loadNotifications();
      loadUnreadCount();
      loadNotificationPreferences();
      
      // Set up interval to check for new notifications (every 60 seconds)
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [isWalletConnected, account]);
  
  const loadNotifications = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const result = await getUserNotifications(account);
      setNotifications(result);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadUnreadCount = async () => {
    if (!account) return;
    try {
      const count = await getUnreadNotificationsCount(account);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };
  
  const loadNotificationPreferences = async () => {
    if (!account) return;
    try {
      const prefs = await getNotificationPreferences(account);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };
  
  const handleMarkAsRead = async (notification: Notification) => {
    try {
      const success = await markNotificationAsRead(notification.id);
      if (success) {
        setNotifications(current =>
          current.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        loadUnreadCount();
      }
    } catch (error) {
      console.error(`Error marking notification ${notification.id} as read:`, error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!account) return;
    try {
      const success = await markAllNotificationsAsRead(account);
      if (success) {
        setNotifications(current =>
          current.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };
  
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const success = await deleteNotification(notificationId);
      if (success) {
        setNotifications(current =>
          current.filter(n => n.id !== notificationId)
        );
        loadUnreadCount();
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      toast.error('Failed to delete notification');
    }
  };
  
  const handleUpdatePreferences = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!account || !preferences) return;
    
    try {
      const updatedPreferences = {
        ...preferences,
        [key]: value
      };
      
      const success = await updateNotificationPreferences(account, { [key]: value });
      if (success) {
        setPreferences(updatedPreferences);
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update notification preferences');
    }
  };
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'update':
        return <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
          <Bell className="h-3 w-3 text-blue-700" />
        </div>;
      case 'delivery':
      case 'milestone':
        return <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
          <Bell className="h-3 w-3 text-green-700" />
        </div>;
      case 'governance':
        return <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
          <Bell className="h-3 w-3 text-purple-700" />
        </div>;
      case 'comment':
      case 'mention':
        return <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
          <Bell className="h-3 w-3 text-orange-700" />
        </div>;
      case 'contribution':
        return <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
          <Bell className="h-3 w-3 text-indigo-700" />
        </div>;
      default:
        return <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
          <Bell className="h-3 w-3 text-gray-700" />
        </div>;
    }
  };
  
  const filteredNotifications = notifications.filter(notification => {
    if (notificationFilter === 'all') return true;
    if (notificationFilter === 'unread') return !notification.isRead;
    return notification.type === notificationFilter;
  });
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex items-center gap-2">
              <Dialog open={openSettings} onOpenChange={setOpenSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Notification Settings</DialogTitle>
                  </DialogHeader>
                  {preferences ? (
                    <Tabs defaultValue="types">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="types">Notification Types</TabsTrigger>
                        <TabsTrigger value="delivery">Delivery Methods</TabsTrigger>
                      </TabsList>
                      <TabsContent value="types" className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="campaign-updates">Campaign Updates</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications about updates to campaigns you're following</p>
                          </div>
                          <Switch
                            id="campaign-updates"
                            checked={preferences.campaignUpdates}
                            onCheckedChange={(checked) => handleUpdatePreferences('campaignUpdates', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="delivery-updates">Delivery Updates</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications about delivery status changes</p>
                          </div>
                          <Switch
                            id="delivery-updates"
                            checked={preferences.deliveryUpdates}
                            onCheckedChange={(checked) => handleUpdatePreferences('deliveryUpdates', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="milestone-updates">Milestone Updates</Label>
                            <p className="text-sm text-muted-foreground">Get notified about project milestone completions</p>
                          </div>
                          <Switch
                            id="milestone-updates"
                            checked={preferences.milestoneUpdates}
                            onCheckedChange={(checked) => handleUpdatePreferences('milestoneUpdates', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="comment-replies">Comment Replies</Label>
                            <p className="text-sm text-muted-foreground">Get notified when someone replies to your comments</p>
                          </div>
                          <Switch
                            id="comment-replies"
                            checked={preferences.commentReplies}
                            onCheckedChange={(checked) => handleUpdatePreferences('commentReplies', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="governance-proposals">Governance Proposals</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications about new governance proposals</p>
                          </div>
                          <Switch
                            id="governance-proposals"
                            checked={preferences.governanceProposals}
                            onCheckedChange={(checked) => handleUpdatePreferences('governanceProposals', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="contribution-confirmations">Contribution Confirmations</Label>
                            <p className="text-sm text-muted-foreground">Get notified when your contributions are confirmed</p>
                          </div>
                          <Switch
                            id="contribution-confirmations"
                            checked={preferences.contributionConfirmations}
                            onCheckedChange={(checked) => handleUpdatePreferences('contributionConfirmations', checked)}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="delivery" className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="email-notifications">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                          </div>
                          <Switch
                            id="email-notifications"
                            checked={preferences.emailNotifications}
                            onCheckedChange={(checked) => handleUpdatePreferences('emailNotifications', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="push-notifications">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                          </div>
                          <Switch
                            id="push-notifications"
                            checked={preferences.pushNotifications}
                            onCheckedChange={(checked) => handleUpdatePreferences('pushNotifications', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="marketing-emails">Marketing Emails</Label>
                            <p className="text-sm text-muted-foreground">Receive updates about new features and promotions</p>
                          </div>
                          <Switch
                            id="marketing-emails"
                            checked={preferences.marketingEmails}
                            onCheckedChange={(checked) => handleUpdatePreferences('marketingEmails', checked)}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="space-y-4 py-4">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="h-4 w-4 mr-1" /> Mark all read
              </Button>
            </div>
          </SheetTitle>
          
          <div className="flex items-center justify-between mt-4">
            <Select
              value={notificationFilter}
              onValueChange={setNotificationFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="update">Campaign Updates</SelectItem>
                <SelectItem value="delivery">Delivery Updates</SelectItem>
                <SelectItem value="milestone">Milestones</SelectItem>
                <SelectItem value="governance">Governance</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="contribution">Contributions</SelectItem>
                <SelectItem value="mention">Mentions</SelectItem>
              </SelectContent>
            </Select>
            
            <Badge variant="outline" className="ml-auto">
              {unreadCount} unread
            </Badge>
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-180px)] py-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No notifications to display</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`flex items-start space-x-4 p-4 rounded-lg transition-colors ${
                    notification.isRead ? 'bg-background' : 'bg-primary/5'
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-muted-foreground break-words">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.createdAt), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {notification.actionUrl && (
                      <Link href={notification.actionUrl} passHref>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (!notification.isRead) {
                              handleMarkAsRead(notification);
                            }
                          }}
                        >
                          View
                        </Button>
                      </Link>
                    )}
                    
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMarkAsRead(notification)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <SheetFooter className="pt-2 border-t mt-2">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 