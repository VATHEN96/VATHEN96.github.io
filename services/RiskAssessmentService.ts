import { BlockchainService } from './blockchainService';
import { toast } from 'sonner';

// Risk assessment types
export interface RiskFactors {
  // Campaign content factors
  unrealisticGoals: boolean;
  vagueMilestones: boolean;
  lacksCreatorHistory: boolean;
  noSocialMediaPresence: boolean;
  suspiciousLinks: boolean;
  
  // Blockchain/transaction factors
  unusualFundingPattern: boolean;
  suspiciousWalletActivities: boolean;
  
  // Community factors
  multipleReports: boolean;
  negativeCommentRatio: boolean;
  
  // Creator verification factors
  unverifiedIdentity: boolean;
  newAccount: boolean;
}

export interface RiskScore {
  score: number; // 0-100, higher means more risky
  factors: Partial<RiskFactors>;
  level: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: number;
  flaggedBy: 'system' | 'user' | 'admin' | null;
}

export interface CampaignReport {
  id: string;
  campaignId: string;
  reporterId: string;
  reporterAddress: string;
  reason: string;
  details: string;
  evidence?: string[];
  resolved: boolean;
  resolution?: string;
  createdAt: number;
}

export interface SpamPreventionRules {
  campaignsPerDay: number;
  commentsPerHour: number;
  reportsPerDay: number;
  minimumAccountAge: number; // in days
  minimumVerificationLevel: number; // 0-3 (none, email, phone, ID)
  minimumWalletBalance: number; // in ETH
}

class RiskAssessmentService {
  private blockchainService: BlockchainService;
  private spamRules: SpamPreventionRules;
  
  constructor(blockchainService: BlockchainService) {
    this.blockchainService = blockchainService;
    // Default spam prevention rules
    this.spamRules = {
      campaignsPerDay: 3,
      commentsPerHour: 20,
      reportsPerDay: 10,
      minimumAccountAge: 2,
      minimumVerificationLevel: 1,
      minimumWalletBalance: 0.01
    };
  }
  
  // Calculate risk score for a campaign
  async calculateRiskScore(campaignId: string): Promise<RiskScore> {
    try {
      // In a real implementation, this would analyze the campaign data
      // and blockchain interactions to determine risk factors
      
      // For demo purposes, returning mock data
      const mockRiskFactors: Partial<RiskFactors> = {
        unrealisticGoals: Math.random() > 0.8,
        vagueMilestones: Math.random() > 0.7,
        lacksCreatorHistory: Math.random() > 0.6,
        multipleReports: Math.random() > 0.9,
      };
      
      // Calculate score based on identified risk factors
      const factorCount = Object.values(mockRiskFactors).filter(Boolean).length;
      const factorWeight = Object.keys(mockRiskFactors).length;
      const score = Math.min(Math.round((factorCount / factorWeight) * 100), 100);
      
      // Determine risk level based on score
      let level: RiskScore['level'] = 'low';
      if (score > 75) level = 'critical';
      else if (score > 50) level = 'high';
      else if (score > 25) level = 'medium';
      
      return {
        score,
        factors: mockRiskFactors,
        level,
        lastUpdated: Date.now(),
        flaggedBy: score > 50 ? 'system' : null
      };
    } catch (error) {
      console.error('Error calculating risk score:', error);
      throw error;
    }
  }
  
  // Get campaign risk score
  async getCampaignRiskScore(campaignId: string): Promise<RiskScore> {
    try {
      // In a real implementation, this would first check if a recent risk score exists
      // in a database and only recalculate if needed
      return this.calculateRiskScore(campaignId);
    } catch (error) {
      console.error('Error getting campaign risk score:', error);
      throw error;
    }
  }
  
  // Report a campaign
  async reportCampaign(campaignId: string, reporterId: string, reporterAddress: string, reason: string, details: string, evidence?: string[]): Promise<boolean> {
    try {
      // Check if user can report (anti-spam)
      const canReport = await this.canUserPerformAction(reporterAddress, 'report');
      if (!canReport) {
        toast.error('You have reached the daily limit for reporting campaigns');
        return false;
      }
      
      // In a real implementation, this would:
      // 1. Create a report record in the database
      // 2. Update campaign risk score
      // 3. Notify admins for high-risk reports
      
      const report: CampaignReport = {
        id: `rep_${Date.now().toString(36)}`,
        campaignId,
        reporterId,
        reporterAddress,
        reason,
        details,
        evidence,
        resolved: false,
        createdAt: Date.now()
      };
      
      console.log('Campaign reported:', report);
      
      // Trigger risk re-assessment
      await this.calculateRiskScore(campaignId);
      
      toast.success('Campaign reported successfully. Our team will review it.');
      return true;
    } catch (error) {
      console.error('Error reporting campaign:', error);
      toast.error('Failed to report campaign. Please try again.');
      return false;
    }
  }
  
  // Get reports for a campaign
  async getCampaignReports(campaignId: string, adminOnly: boolean = true): Promise<CampaignReport[]> {
    try {
      // In a real implementation, this would fetch reports from a database
      // For demo purposes, returning mock data
      
      const mockReports: CampaignReport[] = [
        {
          id: 'rep_1',
          campaignId,
          reporterId: 'user_1',
          reporterAddress: '0x1234...abcd',
          reason: 'Suspicious activity',
          details: 'Campaign goals seem unrealistic and the creator has no history.',
          resolved: false,
          createdAt: Date.now() - 86400000 // 1 day ago
        },
        {
          id: 'rep_2',
          campaignId,
          reporterId: 'user_2',
          reporterAddress: '0x5678...efgh',
          reason: 'Potential scam',
          details: 'Similar campaign was reported as scam on another platform.',
          evidence: ['https://example.com/evidence1', 'https://example.com/evidence2'],
          resolved: true,
          resolution: 'Campaign verified with creator. No evidence of scam found.',
          createdAt: Date.now() - 172800000 // 2 days ago
        }
      ];
      
      return mockReports;
    } catch (error) {
      console.error('Error getting campaign reports:', error);
      throw error;
    }
  }
  
  // Resolve a campaign report (admin only)
  async resolveReport(reportId: string, resolution: string): Promise<boolean> {
    try {
      // In a real implementation, this would update the report in the database
      console.log(`Resolving report ${reportId} with resolution: ${resolution}`);
      
      toast.success('Report resolved successfully');
      return true;
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
      return false;
    }
  }
  
  // Flag campaign as high risk (admin or system)
  async flagCampaign(campaignId: string, flaggedBy: 'system' | 'admin', reason?: string): Promise<boolean> {
    try {
      // In a real implementation, this would update the campaign's risk status in the database
      console.log(`Flagging campaign ${campaignId} by ${flaggedBy}. Reason: ${reason || 'Not provided'}`);
      
      return true;
    } catch (error) {
      console.error('Error flagging campaign:', error);
      return false;
    }
  }
  
  // Unflag campaign (admin only)
  async unflagCampaign(campaignId: string, adminId: string, reason: string): Promise<boolean> {
    try {
      // In a real implementation, this would update the campaign's risk status in the database
      console.log(`Unflagging campaign ${campaignId} by admin ${adminId}. Reason: ${reason}`);
      
      return true;
    } catch (error) {
      console.error('Error unflagging campaign:', error);
      return false;
    }
  }
  
  // Anti-spam: Check if user can perform an action
  async canUserPerformAction(address: string, actionType: 'create' | 'comment' | 'report'): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Check the user's account age
      // 2. Verify user's identity level
      // 3. Check wallet balance
      // 4. Check recent activity rates
      
      // For demo purposes, always return true
      return true;
    } catch (error) {
      console.error(`Error checking if user can perform ${actionType}:`, error);
      return false;
    }
  }
  
  // Anti-spam: Update spam prevention rules (admin only)
  async updateSpamRules(rules: Partial<SpamPreventionRules>): Promise<boolean> {
    try {
      this.spamRules = { ...this.spamRules, ...rules };
      console.log('Spam prevention rules updated:', this.spamRules);
      
      return true;
    } catch (error) {
      console.error('Error updating spam prevention rules:', error);
      return false;
    }
  }
  
  // Anti-spam: Get current spam prevention rules
  getSpamRules(): SpamPreventionRules {
    return this.spamRules;
  }
  
  // Helper: Generate risk description for user-facing messages
  getRiskDescription(score: RiskScore): string {
    let description = '';
    
    switch (score.level) {
      case 'low':
        description = 'This campaign has passed our automated risk checks.';
        break;
      case 'medium':
        description = 'This campaign has some risk factors that you should be aware of.';
        break;
      case 'high':
        description = 'This campaign has multiple risk factors. Please research thoroughly before contributing.';
        break;
      case 'critical':
        description = 'This campaign has been flagged for significant risk factors. Proceed with extreme caution.';
        break;
    }
    
    // Add specific factor warnings
    if (score.factors) {
      const factorDescriptions = [];
      
      if (score.factors.unrealisticGoals) {
        factorDescriptions.push('The campaign goals may be unrealistic based on the provided timeline and budget.');
      }
      if (score.factors.vagueMilestones) {
        factorDescriptions.push('The campaign milestones lack specific details or measurable outcomes.');
      }
      if (score.factors.lacksCreatorHistory) {
        factorDescriptions.push('The creator has limited history on the platform.');
      }
      if (score.factors.multipleReports) {
        factorDescriptions.push('The campaign has received multiple reports from community members.');
      }
      
      if (factorDescriptions.length > 0) {
        description += ' Risk factors include: ' + factorDescriptions.join('. ');
      }
    }
    
    return description;
  }
}

export default RiskAssessmentService; 