import { differenceInDays, format, isAfter, isBefore, addDays } from 'date-fns';
import { toast } from 'sonner';
import { Milestone } from '@/types/milestone';

// Type for tracking reminder preferences
export type ReminderPreference = {
  campaignId: string;
  milestoneDaysBeforeNotice: number; // Days before due date to be reminded
  emailNotifications: boolean;
  browserNotifications: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'once';
};

// Type for storing dismissed reminders to avoid duplicates
type DismissedReminder = {
  campaignId: string;
  milestoneId: string;
  dismissedAt: Date;
};

// LocalStorage keys
const REMINDER_PREFERENCES_KEY = 'wowzarush_reminder_preferences';
const DISMISSED_REMINDERS_KEY = 'wowzarush_dismissed_reminders';
const LAST_CHECK_KEY = 'wowzarush_last_reminder_check';

// Default reminder settings if none are saved
const DEFAULT_REMINDER_PREFERENCES: ReminderPreference = {
  campaignId: 'all', // 'all' means apply to all campaigns
  milestoneDaysBeforeNotice: 7,
  emailNotifications: true,
  browserNotifications: true,
  reminderFrequency: 'weekly',
};

/**
 * Load user reminder preferences from localStorage
 */
export const getUserReminderPreferences = (): ReminderPreference[] => {
  if (typeof window === 'undefined') return [DEFAULT_REMINDER_PREFERENCES];
  
  try {
    const savedPrefs = localStorage.getItem(REMINDER_PREFERENCES_KEY);
    if (!savedPrefs) return [DEFAULT_REMINDER_PREFERENCES];
    
    const parsedPrefs = JSON.parse(savedPrefs) as ReminderPreference[];
    return parsedPrefs.length ? parsedPrefs : [DEFAULT_REMINDER_PREFERENCES];
  } catch (error) {
    console.error('Error loading reminder preferences:', error);
    return [DEFAULT_REMINDER_PREFERENCES];
  }
};

/**
 * Save user reminder preferences to localStorage
 */
export const saveUserReminderPreferences = (preferences: ReminderPreference[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(REMINDER_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving reminder preferences:', error);
  }
};

/**
 * Get user's reminder preference for a specific campaign
 */
export const getPreferenceForCampaign = (campaignId: string): ReminderPreference => {
  const allPreferences = getUserReminderPreferences();
  const campaignSpecific = allPreferences.find(pref => pref.campaignId === campaignId);
  const globalDefault = allPreferences.find(pref => pref.campaignId === 'all');
  
  return campaignSpecific || globalDefault || DEFAULT_REMINDER_PREFERENCES;
};

/**
 * Load dismissed reminders from localStorage
 */
const getDismissedReminders = (): DismissedReminder[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(DISMISSED_REMINDERS_KEY);
    if (!saved) return [];
    
    return JSON.parse(saved) as DismissedReminder[];
  } catch (error) {
    console.error('Error loading dismissed reminders:', error);
    return [];
  }
};

/**
 * Save a dismissed reminder to localStorage
 */
const saveDismissedReminder = (campaignId: string, milestoneId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const dismissed = getDismissedReminders();
    const newDismissed = [...dismissed, { 
      campaignId, 
      milestoneId, 
      dismissedAt: new Date() 
    }];
    
    localStorage.setItem(DISMISSED_REMINDERS_KEY, JSON.stringify(newDismissed));
  } catch (error) {
    console.error('Error saving dismissed reminder:', error);
  }
};

/**
 * Check if a milestone reminder has been dismissed recently based on reminder frequency
 */
const isReminderDismissed = (
  campaignId: string, 
  milestoneId: string, 
  frequency: 'daily' | 'weekly' | 'once'
): boolean => {
  const dismissed = getDismissedReminders();
  const match = dismissed.find(d => d.campaignId === campaignId && d.milestoneId === milestoneId);
  
  if (!match) return false;
  
  // If frequency is 'once', and it's been dismissed before, don't show again
  if (frequency === 'once') return true;
  
  const now = new Date();
  const dismissedAt = new Date(match.dismissedAt);
  
  // Check based on frequency
  if (frequency === 'daily') {
    // Show again if it was dismissed yesterday or earlier
    return differenceInDays(now, dismissedAt) < 1;
  } else if (frequency === 'weekly') {
    // Show again if it was dismissed more than a week ago
    return differenceInDays(now, dismissedAt) < 7;
  }
  
  return false;
};

/**
 * Check if browser notifications are supported and enabled
 */
export const areBrowserNotificationsAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
    'Notification' in window && 
    Notification.permission === 'granted';
};

/**
 * Request permission for browser notifications
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Show a reminder notification for a milestone
 */
const showMilestoneReminder = (
  campaignId: string, 
  campaignTitle: string, 
  milestone: Milestone, 
  daysUntilDue: number,
  preference: ReminderPreference
): void => {
  const milestoneId = milestone.id || `milestone-${campaignId}-${milestone.name}`;
  
  if (isReminderDismissed(campaignId, milestoneId, preference.reminderFrequency)) {
    return;
  }
  
  const dueStatus = daysUntilDue < 0 
    ? `Overdue by ${Math.abs(daysUntilDue)} days` 
    : daysUntilDue === 0 
      ? 'Due today' 
      : `Due in ${daysUntilDue} days`;

  const reminderTitle = `${daysUntilDue < 0 ? '🚨' : '⏰'} ${campaignTitle} - ${milestone.name}`;
  const reminderMessage = `${dueStatus} (${milestone.dueDate ? format(milestone.dueDate, 'MMM d') : 'No date'})`;
  
  // Show in-app toast notification
  toast(reminderTitle, {
    description: reminderMessage,
    action: {
      label: "Dismiss",
      onClick: () => saveDismissedReminder(campaignId, milestoneId),
    },
    duration: 8000,
  });
  
  // Show browser notification if enabled and available
  if (preference.browserNotifications && areBrowserNotificationsAvailable()) {
    try {
      new Notification(reminderTitle, {
        body: reminderMessage,
        icon: '/logo.png'
      });
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }
  
  // Here you would typically trigger an email notification via your backend
  // if preference.emailNotifications is true
  if (preference.emailNotifications) {
    console.log(`Would send email for ${campaignTitle} - ${milestone.name} (${dueStatus})`);
    // This would be implemented with an API call to your backend
  }
};

/**
 * Check milestones for campaigns and show reminders as needed
 * This should be called when a user loads relevant pages
 */
export const checkMilestoneReminders = (
  campaigns: Array<{ id: string; title: string; milestones: Milestone[] }>
): void => {
  if (typeof window === 'undefined') return;
  
  // Check if we've already run this recently to avoid spamming notifications
  try {
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const now = new Date();
    
    if (lastCheck) {
      const lastCheckDate = new Date(lastCheck);
      // Only check once per hour
      if (differenceInDays(now, lastCheckDate) < 0.04) {
        return;
      }
    }
    
    // Update last check time
    localStorage.setItem(LAST_CHECK_KEY, now.toISOString());
  } catch (error) {
    console.error('Error checking reminder timing:', error);
  }
  
  const today = new Date();
  
  // For each campaign, check milestones
  campaigns.forEach(campaign => {
    const preference = getPreferenceForCampaign(campaign.id);
    const { milestoneDaysBeforeNotice } = preference;
    
    // Check each milestone
    campaign.milestones.forEach(milestone => {
      // Skip completed milestones
      if (milestone.completed || milestone.isCompleted) return;
      
      // If milestone has a due date
      if (milestone.dueDate) {
        const dueDate = new Date(milestone.dueDate);
        const daysUntilDue = differenceInDays(dueDate, today);
        
        // Check if it's due soon based on user preferences
        if (
          // Is exactly at the preferred notice days
          daysUntilDue === milestoneDaysBeforeNotice ||
          // Is due today
          daysUntilDue === 0 ||
          // Is overdue
          daysUntilDue < 0 ||
          // Is critically close (within 3 days)
          (daysUntilDue <= 3 && daysUntilDue > 0)
        ) {
          showMilestoneReminder(campaign.id, campaign.title, milestone, daysUntilDue, preference);
        }
      }
    });
  });
};

/**
 * Configure all reminders for a campaign - to be called when a user visits a campaign page or similar
 */
export const configureCampaignReminders = (
  campaignId: string,
  reminderPreference: Partial<ReminderPreference>
): void => {
  const allPreferences = getUserReminderPreferences();
  
  // Find existing preference for this campaign or create a new one
  const existingIndex = allPreferences.findIndex(pref => pref.campaignId === campaignId);
  
  if (existingIndex >= 0) {
    // Update existing preference
    allPreferences[existingIndex] = { 
      ...allPreferences[existingIndex], 
      ...reminderPreference 
    };
  } else {
    // Create new preference
    allPreferences.push({ 
      ...DEFAULT_REMINDER_PREFERENCES, 
      campaignId, 
      ...reminderPreference 
    });
  }
  
  // Save updated preferences
  saveUserReminderPreferences(allPreferences);
};

/**
 * Initialize reminder system
 * Call this function when the app is initialized to set up notifications
 */
export const initializeReminderSystem = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  // Request notification permission if needed and browser supports it
  if ('Notification' in window && Notification.permission !== 'denied') {
    await requestNotificationPermission();
  }
}; 