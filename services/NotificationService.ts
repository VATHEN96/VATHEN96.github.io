import { toast } from 'sonner';

// Types for campaign updates
export interface CampaignUpdate {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  createdAt: number;
  isPublic: boolean;
  isPinned: boolean;
  attachments?: {
    type: 'image' | 'video' | 'document';
    url: string;
    name: string;
  }[];
  likes: number;
  comments: number;
}

// Types for delivery tracking
export interface DeliveryMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: number;
  completedDate: number | null;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
}

export interface DeliveryStatus {
  id: string;
  campaignId: string;
  rewardTierId: string;
  rewardTierName: string;
  milestones: DeliveryMilestone[];
  estimatedDeliveryDate: number;
  updatedAt: number;
  shippingStarted: boolean;
  shippingCompleted: boolean;
  trackingAvailable: boolean;
}

// Types for notifications
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'update' | 'delivery' | 'milestone' | 'contribution' | 'governance' | 'comment' | 'mention';
  relatedId: string; // campaignId, updateId, etc.
  createdAt: number;
  isRead: boolean;
  actionUrl?: string;
}

export interface NotificationPreferences {
  campaignUpdates: boolean;
  deliveryUpdates: boolean;
  milestoneUpdates: boolean;
  commentReplies: boolean;
  governanceProposals: boolean;
  contributionConfirmations: boolean;
  marketingEmails: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export class NotificationService {
  // Campaign updates methods
  async getCampaignUpdates(campaignId: string, includePrivate: boolean = false): Promise<CampaignUpdate[]> {
    try {
      // Return empty array instead of mock data
      console.log('No campaign updates available');
      return [];
    } catch (error) {
      console.error(`Error getting updates for campaign ${campaignId}:`, error);
      return [];
    }
  }

  async createCampaignUpdate(updateData: Omit<CampaignUpdate, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<CampaignUpdate | null> {
    try {
      // In a real implementation, this would save to a database or API
      const newUpdate: CampaignUpdate = {
        ...updateData,
        id: `update-${Date.now()}`,
        createdAt: Date.now(),
        likes: 0,
        comments: 0
      };

      // Notify backers about the new update
      if (newUpdate.isPublic) {
        this.notifyBackersAboutUpdate(newUpdate);
      }

      toast.success('Campaign update published successfully!');
      return newUpdate;
    } catch (error) {
      console.error('Error creating campaign update:', error);
      toast.error('Failed to publish campaign update');
      return null;
    }
  }

  async updateCampaignUpdate(updateId: string, updateData: Partial<CampaignUpdate>): Promise<boolean> {
    try {
      // In a real implementation, this would update in a database or API
      toast.success('Campaign update edited successfully!');
      return true;
    } catch (error) {
      console.error(`Error updating campaign update ${updateId}:`, error);
      toast.error('Failed to edit campaign update');
      return false;
    }
  }

  async deleteCampaignUpdate(updateId: string): Promise<boolean> {
    try {
      // In a real implementation, this would delete from a database or API
      toast.success('Campaign update deleted successfully!');
      return true;
    } catch (error) {
      console.error(`Error deleting campaign update ${updateId}:`, error);
      toast.error('Failed to delete campaign update');
      return false;
    }
  }

  // Delivery tracking methods
  async getDeliveryStatus(campaignId: string, rewardTierId?: string): Promise<DeliveryStatus[]> {
    try {
      // In a real implementation, this would fetch from a database or API
      // Return empty array instead of mock data
      console.log('No delivery status data available');
      return [];
    } catch (error) {
      console.error(`Error getting delivery status for campaign ${campaignId}:`, error);
      return [];
    }
  }

  async updateDeliveryStatus(deliveryId: string, updates: Partial<DeliveryStatus>): Promise<boolean> {
    try {
      // In a real implementation, this would update in a database or API
      toast.success('Delivery status updated successfully!');

      // Notify backers about the delivery update
      this.notifyBackersAboutDeliveryUpdate(deliveryId, updates);

      return true;
    } catch (error) {
      console.error(`Error updating delivery status ${deliveryId}:`, error);
      toast.error('Failed to update delivery status');
      return false;
    }
  }

  async updateMilestone(deliveryId: string, milestoneId: string, updates: Partial<DeliveryMilestone>): Promise<boolean> {
    try {
      // In a real implementation, this would update in a database or API
      toast.success('Milestone updated successfully!');

      // Notify backers about the milestone update
      this.notifyBackersAboutMilestoneUpdate(deliveryId, milestoneId, updates);

      return true;
    } catch (error) {
      console.error(`Error updating milestone ${milestoneId}:`, error);
      toast.error('Failed to update milestone');
      return false;
    }
  }

  // Notification methods
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      // In a real implementation, this would fetch from a database or API
      // For now, return mock data
      return [
        {
          id: 'notification-1',
          userId,
          title: 'New Campaign Update',
          message: 'Project XYZ has posted a new update: "Production Milestone Achieved!"',
          type: 'update',
          relatedId: 'campaign-1',
          createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
          isRead: false,
          actionUrl: '/campaign/campaign-1?update=update-4'
        },
        {
          id: 'notification-2',
          userId,
          title: 'Delivery Milestone Completed',
          message: 'The "Design Phase" milestone for your Silver Supporter reward has been completed!',
          type: 'milestone',
          relatedId: 'delivery-1',
          createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
          isRead: true,
          actionUrl: '/campaign/campaign-1/delivery'
        },
        {
          id: 'notification-3',
          userId,
          title: 'New Proposal to Vote',
          message: 'A new governance proposal "Update project roadmap" is available for voting.',
          type: 'governance',
          relatedId: 'proposal-1',
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
          isRead: false,
          actionUrl: '/campaign/campaign-1?tab=governance'
        },
        {
          id: 'notification-4',
          userId,
          title: 'Reply to Your Comment',
          message: 'User123 replied to your comment: "Thanks for the feedback!"',
          type: 'comment',
          relatedId: 'comment-2',
          createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
          isRead: false,
          actionUrl: '/campaign/campaign-1?tab=comments&highlight=comment-2'
        }
      ];
    } catch (error) {
      console.error(`Error getting notifications for user ${userId}:`, error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      // In a real implementation, this would update in a database or API
      return true;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      return false;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      // In a real implementation, this would update in a database or API
      return true;
    } catch (error) {
      console.error(`Error marking all notifications as read for user ${userId}:`, error);
      return false;
    }
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      // In a real implementation, this would delete from a database or API
      return true;
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      return false;
    }
  }

  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      // In a real implementation, this would update in a database or API
      toast.success('Notification preferences updated successfully!');
      return true;
    } catch (error) {
      console.error(`Error updating notification preferences for user ${userId}:`, error);
      toast.error('Failed to update notification preferences');
      return false;
    }
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // In a real implementation, this would fetch from a database or API
      // For now, return default preferences
      return {
        campaignUpdates: true,
        deliveryUpdates: true,
        milestoneUpdates: true,
        commentReplies: true,
        governanceProposals: true,
        contributionConfirmations: true,
        marketingEmails: false,
        emailNotifications: true,
        pushNotifications: false
      };
    } catch (error) {
      console.error(`Error getting notification preferences for user ${userId}:`, error);
      // Return default preferences as fallback
      return {
        campaignUpdates: true,
        deliveryUpdates: true,
        milestoneUpdates: true,
        commentReplies: true,
        governanceProposals: true,
        contributionConfirmations: true,
        marketingEmails: false,
        emailNotifications: true,
        pushNotifications: false
      };
    }
  }

  // Private helper methods
  private notifyBackersAboutUpdate(update: CampaignUpdate): void {
    // In a real implementation, this would create notifications for all backers
    // and potentially send emails/push notifications based on preferences
    console.log(`Notifying backers about update: ${update.title}`);
  }

  private notifyBackersAboutDeliveryUpdate(deliveryId: string, updates: Partial<DeliveryStatus>): void {
    // In a real implementation, this would create notifications for relevant backers
    console.log(`Notifying backers about delivery update for ${deliveryId}`);
  }

  private notifyBackersAboutMilestoneUpdate(deliveryId: string, milestoneId: string, updates: Partial<DeliveryMilestone>): void {
    // In a real implementation, this would create notifications for relevant backers
    console.log(`Notifying backers about milestone update: ${milestoneId} for delivery ${deliveryId}`);
  }
}

export default NotificationService; 