'use client';

import React, { useEffect, useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Bell, Calendar, Mail, Info } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { 
  ReminderPreference,
  getUserReminderPreferences,
  getPreferenceForCampaign,
  configureCampaignReminders,
  requestNotificationPermission,
  areBrowserNotificationsAvailable
} from '@/utils/milestoneReminders';
import { toast } from 'sonner';

interface MilestoneReminderSettingsProps {
  campaignId: string;
  campaignTitle: string;
}

export default function MilestoneReminderSettings({ campaignId, campaignTitle }: MilestoneReminderSettingsProps) {
  // Get the current preference for this campaign
  const [preferences, setPreferences] = useState<ReminderPreference>(() => 
    getPreferenceForCampaign(campaignId)
  );
  
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  
  useEffect(() => {
    // Check if browser notifications are supported
    setNotificationsSupported(typeof window !== 'undefined' && 'Notification' in window);
  }, []);
  
  const handleSavePreferences = () => {
    // Save the preferences
    configureCampaignReminders(campaignId, preferences);
    toast.success('Reminder preferences saved', {
      description: 'You will be notified according to your preferences',
    });
  };
  
  const handleBrowserNotificationsToggle = async (enabled: boolean) => {
    if (enabled && notificationsSupported) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast.error('Notification permission denied', {
          description: 'Please enable notifications in your browser settings to receive browser notifications',
        });
        // Update UI state but don't actually enable it
        setPreferences(prev => ({ ...prev, browserNotifications: false }));
        return;
      }
    }
    
    setPreferences(prev => ({ ...prev, browserNotifications: enabled }));
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Milestone Reminders
        </CardTitle>
        <CardDescription>
          Configure how you want to be reminded about upcoming milestones for {campaignTitle}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Days before notice */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="days-notice" className="text-sm font-medium">
              Remind me
            </Label>
            <span className="text-sm text-gray-500">
              {preferences.milestoneDaysBeforeNotice} days before due date
            </span>
          </div>
          
          <Slider
            id="days-notice"
            min={1}
            max={14}
            step={1}
            value={[preferences.milestoneDaysBeforeNotice]}
            onValueChange={(value) => setPreferences(prev => ({ ...prev, milestoneDaysBeforeNotice: value[0] }))}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 day</span>
            <span>7 days</span>
            <span>14 days</span>
          </div>
        </div>
        
        {/* Notification types */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Notification Methods</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-gray-500" />
              <Label htmlFor="in-app" className="text-sm">In-app notifications</Label>
            </div>
            <Switch 
              id="in-app" 
              checked={true} 
              disabled={true} // Always enabled
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <Label htmlFor="email" className="text-sm">Email notifications</Label>
            </div>
            <Switch 
              id="email" 
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-gray-500" />
              <div className="space-y-1">
                <Label htmlFor="browser" className="text-sm">Browser notifications</Label>
                {!notificationsSupported && (
                  <p className="text-xs text-gray-500">Not supported in your browser</p>
                )}
              </div>
            </div>
            <Switch 
              id="browser" 
              checked={preferences.browserNotifications}
              onCheckedChange={handleBrowserNotificationsToggle}
              disabled={!notificationsSupported}
            />
          </div>
        </div>
        
        {/* Reminder frequency */}
        <div className="space-y-2">
          <Label htmlFor="frequency" className="text-sm font-medium">
            Reminder Frequency
          </Label>
          <Select 
            value={preferences.reminderFrequency}
            onValueChange={(value: 'daily' | 'weekly' | 'once') => 
              setPreferences(prev => ({ ...prev, reminderFrequency: value }))
            }
          >
            <SelectTrigger id="frequency" className="w-full">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="once">Once per milestone</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            How often to repeat reminders for upcoming and overdue milestones
          </p>
        </div>
        
        {/* Info box */}
        <div className="bg-blue-50 p-3 rounded-md flex items-start space-x-2">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p>You'll automatically be reminded about:</p>
            <ul className="list-disc list-inside mt-1 text-xs">
              <li>Milestones that are {preferences.milestoneDaysBeforeNotice} days away from their due date</li>
              <li>Milestones that are due today</li>
              <li>Milestones that are overdue</li>
              <li>Milestones that are approaching within 3 days</li>
            </ul>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button onClick={handleSavePreferences} className="w-full">
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  );
} 