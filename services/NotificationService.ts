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

// Convert from class to object with methods
const NotificationService = {
  // Campaign updates methods
  async getCampaignUpdates(campaignId: string, includePrivate: boolean = false): Promise<CampaignUpdate[]> {
    try {
      // In a real implementation, this would fetch from a database or API
      // For now, return mock data
      const mockUpdates: CampaignUpdate[] = [
        {
          id: 'update-1',
          campaignId,
          title: 'Project Kickoff',
          content: 'We\'re excited to announce that our project has officially kicked off! Thanks to all our backers for your support.',
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
          isPublic: true,
          isPinned: true,
          attachments: [
            {
              type: 'image',
              url: 'https://via.placeholder.com/800x450?text=Kickoff+Event',
              name: 'Kickoff Event Photo'
            }
          ],
          likes: 120,
          comments: 45
        },
        {
          id: 'update-2',
          campaignId,
          title: 'Development Update - Week 2',
          content: 'We\'ve made significant progress on the first milestone. Here\'s what we\'ve accomplished so far...',
          createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
          isPublic: true,
          isPinned: false,
          likes: 95,
          comments: 23
        },
        {
          id: 'update-3',
          campaignId,
          title: 'Exclusive Backer Preview',
          content: 'As a special thank you to our backers, here\'s an exclusive preview of the upcoming features!',
          createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
          isPublic: false,
          isPinned: false,
          attachments: [
            {
              type: 'video',
              url: 'https://example.com/preview-video.mp4',
              name: 'Feature Preview'
            }
          ],
          likes: 210,
          comments: 86
        },
        {
          id: 'update-4',
          campaignId,
          title: 'First Milestone Completed!',
          content: 'We\'re thrilled to announce that we\'ve reached our first production milestone ahead of schedule!',
          createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
          isPublic: true,
          isPinned: true,
          likes: 156,
          comments: 32
        }
      ];

      // Filter private updates if needed
      return includePrivate 
        ? mockUpdates 
        : mockUpdates.filter(update => update.isPublic);
    } catch (error) {
      console.error(`Error getting updates for campaign ${campaignId}:`, error);
      return [];
    }
  },

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
  },

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
  },

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
  },

  // Delivery tracking methods
  async getDeliveryStatus(campaignId: string, rewardTierId?: string): Promise<DeliveryStatus[]> {
    try {
      // In a real implementation, this would fetch from a database or API
      // For now, return mock data
      const mockDeliveryStatuses: DeliveryStatus[] = [
        {
          id: 'delivery-1',
          campaignId,
          rewardTierId: 'tier-2',
          rewardTierName: 'Silver Supporter',
          estimatedDeliveryDate: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days from now
          updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
          shippingStarted: false,
          shippingCompleted: false,
          trackingAvailable: false,
          milestones: [
            {
              id: 'milestone-1',
              title: 'Design Phase',
              description: 'Finalizing the product design',
              targetDate: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
              completedDate: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
              status: 'completed'
            },
            {
              id: 'milestone-2',
              title: 'Production',
              description: 'Manufacturing the product',
              targetDate: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days from now
              completedDate: null,
              status: 'in-progress'
            },
            {
              id: 'milestone-3',
              title: 'Quality Assurance',
              description: 'Testing the product for quality',
              targetDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
              completedDate: null,
              status: 'pending'
            },
            {
              id: 'milestone-4',
              title: 'Shipping',
              description: 'Shipping the product to backers',
              targetDate: Date.now() + 45 * 24 * 60 * 60 * 1000, // 45 days from now
              completedDate: null,
              status: 'pending'
            }
          ]
        },
        {
          id: 'delivery-2',
          campaignId,
          rewardTierId: 'tier-3',
          rewardTierName: 'Gold Supporter',
          estimatedDeliveryDate: Date.now() + 45 * 24 * 60 * 60 * 1000, // 45 days from now
          updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
          shippingStarted: false,
          shippingCompleted: false,
          trackingAvailable: false,
          milestones: [
            {
              id: 'milestone-5',
              title: 'Design Phase',
              description: 'Finalizing the product design',
              targetDate: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
              completedDate: Date.now() - 12 * 24 * 60 * 60 * 1000, // 12 days ago
              status: 'completed'
            },
            {
              id: 'milestone-6',
              title: 'Premium Material Sourcing',
              description: 'Sourcing premium materials for Gold tier',
              targetDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
              completedDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago (ahead of schedule)
              status: 'completed'
            },
            {
              id: 'milestone-7',
              title: 'Production',
              description: 'Manufacturing the premium version',
              targetDate: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 days from now
              completedDate: null,
              status: 'in-progress'
            },
            {
              id: 'milestone-8',
              title: 'Quality Assurance',
              description: 'Extensive testing for premium version',
              targetDate: Date.now() + 25 * 24 * 60 * 60 * 1000, // 25 days from now
              completedDate: null,
              status: 'pending'
            },
            {
              id: 'milestone-9',
              title: 'Shipping',
              description: 'Priority shipping for Gold tier backers',
              targetDate: Date.now() + 35 * 24 * 60 * 60 * 1000, // 35 days from now
              completedDate: null,
              status: 'pending'
            }
          ]
        }
      ];

      // Filter by reward tier if specified
      return rewardTierId 
        ? mockDeliveryStatuses.filter(status => status.rewardTierId === rewardTierId) 
        : mockDeliveryStatuses;
    } catch (error) {
      console.error(`Error getting delivery status for campaign ${campaignId}:`, error);
      return [];
    }
  },

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
  },

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
  },

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
  },

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      // In a real implementation, this would update in a database or API
      return true;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      return false;
    }
  },

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      // In a real implementation, this would update in a database or API
      return true;
    } catch (error) {
      console.error(`Error marking all notifications as read for user ${userId}:`, error);
      return false;
    }
  },

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      // In a real implementation, this would delete from a database or API
      return true;
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      return false;
    }
  },

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
  },

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
  },

  // Private helper methods
  notifyBackersAboutUpdate(update: CampaignUpdate): void {
    // In a real implementation, this would create notifications for all backers
    // and potentially send emails/push notifications based on preferences
    console.log(`Notifying backers about update: ${update.title}`);
  },

  notifyBackersAboutDeliveryUpdate(deliveryId: string, updates: Partial<DeliveryStatus>): void {
    // In a real implementation, this would create notifications for relevant backers
    console.log(`Notifying backers about delivery update for ${deliveryId}`);
  },

  notifyBackersAboutMilestoneUpdate(deliveryId: string, milestoneId: string, updates: Partial<DeliveryMilestone>): void {
    // In a real implementation, this would create notifications for relevant backers
    console.log(`Notifying backers about milestone update: ${milestoneId} for delivery ${deliveryId}`);
  }
};

export default NotificationService; 