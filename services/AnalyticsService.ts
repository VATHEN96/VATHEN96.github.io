import { BlockchainService } from '../services/blockchainService';
import { toast } from 'sonner';

export interface OnChainMetric {
  id: string;
  name: string;
  value: number | string;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  description: string;
  category: 'funding' | 'governance' | 'community' | 'milestone';
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all';
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface MetricChartData {
  metricId: string;
  timeline: ChartDataPoint[];
}

export interface MilestoneProgress {
  id: string;
  title: string;
  description: string;
  dueDate: number;
  completedDate?: number;
  status: 'pending' | 'inProgress' | 'completed' | 'delayed';
  progress: number; // 0-100
  linkedProposals: LinkedProposal[];
  fundingRequired: number;
  fundingReceived: number;
  deliverables: string[];
}

export interface LinkedProposal {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  votingEndTime: number;
  votingPower: number;
  result?: string;
  impactDescription?: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  performance: {
    fundingProgress: number; // 0-100
    contributorCount: number;
    averageContribution: number;
    fundingRate: number; // ETH per day
    participationRate: number; // % of contributors who vote
    milestoneCompletionRate: number; // % of milestones completed on time
    socialEngagement: number; // social shares/mentions
    contributorChangePercent?: number; // % change in contributors
    fundingAmount?: number; // Total funding amount in ETH
  };
  metrics: OnChainMetric[];
  projections: {
    estimatedCompletion: number; // timestamp
    fundingProjection: number; // projected final %
    remainingMilestones: number;
  };
  riskIndicators: {
    fundingRisk: 'low' | 'medium' | 'high';
    scheduleRisk: 'low' | 'medium' | 'high';
    deliveryRisk: 'low' | 'medium' | 'high';
  };
  governance?: {
    proposalCount: number;
    voteCount: number;
  };
}

class AnalyticsService {
  private blockchainService: BlockchainService;
  
  constructor() {
    this.blockchainService = new BlockchainService();
  }
  
  // Get comprehensive on-chain metrics for a campaign
  async getCampaignMetrics(campaignId: string): Promise<OnChainMetric[]> {
    try {
      // In a real implementation, this would fetch on-chain data
      // For demo purposes, using mock data
      return [
        {
          id: 'funding_total',
          name: 'Total Funding',
          value: '35.5 ETH',
          changePercent: 12.3,
          trend: 'up',
          description: 'Total ETH contributed to the campaign',
          category: 'funding'
        },
        {
          id: 'contributors_count',
          name: 'Contributors',
          value: 127,
          changePercent: 5.8,
          trend: 'up',
          description: 'Number of unique wallet addresses that have contributed',
          category: 'community'
        },
        {
          id: 'avg_contribution',
          name: 'Avg. Contribution',
          value: '0.28 ETH',
          changePercent: -2.1,
          trend: 'down',
          description: 'Average contribution amount per contributor',
          category: 'funding'
        },
        {
          id: 'governance_participation',
          name: 'Governance Participation',
          value: '68%',
          changePercent: 4.2,
          trend: 'up',
          description: 'Percentage of token holders participating in governance',
          category: 'governance'
        },
        {
          id: 'proposal_success_rate',
          name: 'Proposal Success Rate',
          value: '73%',
          changePercent: 0,
          trend: 'neutral',
          description: 'Percentage of proposals that have passed',
          category: 'governance'
        },
        {
          id: 'milestone_completion',
          name: 'Milestone Completion',
          value: '4/7',
          changePercent: 25,
          trend: 'up',
          description: 'Number of completed milestones out of total',
          category: 'milestone'
        },
        {
          id: 'on_time_delivery',
          name: 'On-time Delivery',
          value: '85%',
          changePercent: -5,
          trend: 'down',
          description: 'Percentage of milestones completed on schedule',
          category: 'milestone'
        },
        {
          id: 'community_growth',
          name: 'Community Growth',
          value: '12%',
          changePercent: 3.5,
          trend: 'up',
          description: 'Weekly growth rate of the community',
          category: 'community'
        }
      ];
    } catch (error) {
      console.error('Error fetching campaign metrics:', error);
      toast.error('Failed to load campaign metrics');
      throw error;
    }
  }
  
  // Get time series data for a specific metric
  async getMetricChartData(campaignId: string, metricId: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<MetricChartData> {
    try {
      // Generate 30 days of mock data
      const timeline: ChartDataPoint[] = [];
      const now = new Date();
      const baseValue = metricId.includes('funding') ? 20 : metricId.includes('governance') ? 50 : 30;
      const volatility = metricId.includes('funding') ? 2 : metricId.includes('governance') ? 5 : 3;
      
      // Generate data with a general upward trend
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Create some volatility but with a general trend upward
        const randomFactor = (Math.random() * volatility * 2) - volatility;
        const trendFactor = (30 - i) / 10; // Creates an upward trend
        const value = Math.max(0, baseValue + randomFactor + trendFactor);
        
        timeline.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(value * 100) / 100
        });
      }
      
      return {
        metricId,
        timeline
      };
    } catch (error) {
      console.error(`Error fetching chart data for metric ${metricId}:`, error);
      toast.error('Failed to load metric chart data');
      throw error;
    }
  }
  
  // Get milestone progress with linked governance proposals
  async getMilestonesWithProposals(campaignId: string): Promise<MilestoneProgress[]> {
    try {
      // In a real implementation, this would fetch milestone data and linked proposals
      // from the blockchain or database
      // For demo purposes, using mock data
      return [
        {
          id: 'milestone_1',
          title: 'Project Kickoff',
          description: 'Initial setup and team onboarding',
          dueDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
          completedDate: Date.now() - 28 * 24 * 60 * 60 * 1000, // 28 days ago
          status: 'completed',
          progress: 100,
          linkedProposals: [
            {
              id: 'proposal_1',
              title: 'Approve project timeline',
              status: 'completed',
              votingEndTime: Date.now() - 35 * 24 * 60 * 60 * 1000,
              votingPower: 50000,
              result: 'Approved (92%)',
              impactDescription: 'Established project timeline and major deliverables'
            }
          ],
          fundingRequired: 5,
          fundingReceived: 5,
          deliverables: ['Team assembled', 'Project roadmap', 'Initial documentation']
        },
        {
          id: 'milestone_2',
          title: 'Prototype Development',
          description: 'Develop initial working prototype',
          dueDate: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
          completedDate: Date.now() - 16 * 24 * 60 * 60 * 1000, // 16 days ago
          status: 'completed',
          progress: 100,
          linkedProposals: [
            {
              id: 'proposal_2',
              title: 'Technical architecture approval',
              status: 'completed',
              votingEndTime: Date.now() - 25 * 24 * 60 * 60 * 1000,
              votingPower: 48000,
              result: 'Approved (88%)',
              impactDescription: 'Finalized technical architecture with community feedback'
            },
            {
              id: 'proposal_3',
              title: 'Prototype feature prioritization',
              status: 'completed',
              votingEndTime: Date.now() - 20 * 24 * 60 * 60 * 1000,
              votingPower: 52000,
              result: 'Approved (76%)',
              impactDescription: 'Community voted on most important features for the prototype'
            }
          ],
          fundingRequired: 10,
          fundingReceived: 10,
          deliverables: ['Architecture document', 'Working prototype', 'Development environment']
        },
        {
          id: 'milestone_3',
          title: 'Alpha Release',
          description: 'Release alpha version for early adopters',
          dueDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
          completedDate: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
          status: 'completed',
          progress: 100,
          linkedProposals: [
            {
              id: 'proposal_4',
              title: 'Alpha testing incentives',
              status: 'completed',
              votingEndTime: Date.now() - 10 * 24 * 60 * 60 * 1000,
              votingPower: 55000,
              result: 'Approved (95%)',
              impactDescription: 'Approved distribution of test tokens to alpha testers'
            }
          ],
          fundingRequired: 8,
          fundingReceived: 8,
          deliverables: ['Alpha release', 'Testing documentation', 'Bug tracking system']
        },
        {
          id: 'milestone_4',
          title: 'Beta Release',
          description: 'Public beta with expanded feature set',
          dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 days from now
          status: 'inProgress',
          progress: 75,
          linkedProposals: [
            {
              id: 'proposal_5',
              title: 'Feature scope adjustment',
              status: 'completed',
              votingEndTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
              votingPower: 60000,
              result: 'Approved (82%)',
              impactDescription: 'Adjusted feature scope to focus on core functionality'
            },
            {
              id: 'proposal_6',
              title: 'UI/UX redesign',
              status: 'active',
              votingEndTime: Date.now() + 2 * 24 * 60 * 60 * 1000,
              votingPower: 25000,
              impactDescription: 'Proposal to improve the user interface before beta launch'
            }
          ],
          fundingRequired: 12,
          fundingReceived: 9,
          deliverables: ['Beta release', 'User documentation', 'Marketing materials']
        },
        {
          id: 'milestone_5',
          title: 'Security Audit',
          description: 'Complete security audit by third party',
          dueDate: Date.now() + 20 * 24 * 60 * 60 * 1000, // 20 days from now
          status: 'pending',
          progress: 15,
          linkedProposals: [
            {
              id: 'proposal_7',
              title: 'Security audit vendor selection',
              status: 'active',
              votingEndTime: Date.now() + 5 * 24 * 60 * 60 * 1000,
              votingPower: 42000,
              impactDescription: 'Vote on which security firm to engage for audit'
            }
          ],
          fundingRequired: 15,
          fundingReceived: 5,
          deliverables: ['Audit report', 'Vulnerability assessment', 'Remediation plan']
        },
        {
          id: 'milestone_6',
          title: 'Public Launch',
          description: 'Full public release of the product',
          dueDate: Date.now() + 45 * 24 * 60 * 60 * 1000, // 45 days from now
          status: 'pending',
          progress: 0,
          linkedProposals: [],
          fundingRequired: 20,
          fundingReceived: 0,
          deliverables: ['Production deployment', 'Press release', 'Community launch event']
        },
        {
          id: 'milestone_7',
          title: 'Post-Launch Support',
          description: 'Ongoing support and initial feature updates',
          dueDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days from now
          status: 'pending',
          progress: 0,
          linkedProposals: [],
          fundingRequired: 10,
          fundingReceived: 0,
          deliverables: ['Support system', 'Update roadmap', 'Community feedback analysis']
        }
      ];
    } catch (error) {
      console.error('Error fetching milestones with proposals:', error);
      toast.error('Failed to load milestone data');
      throw error;
    }
  }
  
  // Link a proposal to a milestone
  async linkProposalToMilestone(proposalId: string, milestoneId: string, impactDescription: string): Promise<boolean> {
    try {
      // In a real implementation, this would update the linkage in the database or blockchain
      console.log(`Linking proposal ${proposalId} to milestone ${milestoneId}`);
      console.log(`Impact description: ${impactDescription}`);
      
      toast.success('Proposal linked to milestone successfully');
      return true;
    } catch (error) {
      console.error('Error linking proposal to milestone:', error);
      toast.error('Failed to link proposal to milestone');
      return false;
    }
  }
  
  // Remove link between proposal and milestone
  async unlinkProposalFromMilestone(campaignId: string, milestoneId: string, proposalId: string): Promise<boolean> {
    try {
      // In a real implementation, this would remove the linkage in the database or blockchain
      console.log(`Unlinking proposal ${proposalId} from milestone ${milestoneId} in campaign ${campaignId}`);
      
      toast.success('Proposal unlinked from milestone');
      return true;
    } catch (error) {
      console.error('Error unlinking proposal from milestone:', error);
      toast.error('Failed to unlink proposal from milestone');
      return false;
    }
  }
  
  // Get comprehensive analytics for a campaign
  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    try {
      // In a real implementation, this would calculate analytics from on-chain data
      // For demo purposes, using mock data
      const metrics = await this.getCampaignMetrics(campaignId);
      
      return {
        campaignId,
        performance: {
          fundingProgress: 72,
          contributorCount: 127,
          averageContribution: 0.28,
          fundingRate: 2.5,
          participationRate: 68,
          milestoneCompletionRate: 85,
          socialEngagement: 245,
          contributorChangePercent: 12,
          fundingAmount: 35.6
        },
        metrics,
        projections: {
          estimatedCompletion: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days from now
          fundingProjection: 95,
          remainingMilestones: 3
        },
        riskIndicators: {
          fundingRisk: 'low',
          scheduleRisk: 'medium',
          deliveryRisk: 'low'
        },
        governance: {
          proposalCount: 8,
          voteCount: 142
        }
      };
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      toast.error('Failed to load campaign analytics');
      throw error;
    }
  }
  
  // Get all active proposals that could be linked to milestones
  async getLinkableProposals(campaignId: string): Promise<Omit<LinkedProposal, 'impactDescription'>[]> {
    try {
      // In a real implementation, this would fetch all proposals that aren't already linked
      // For demo purposes, using mock data
      return [
        {
          id: 'proposal_8',
          title: 'Community rewards program',
          status: 'active',
          votingEndTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
          votingPower: 38000
        },
        {
          id: 'proposal_9',
          title: 'Partnership with external project',
          status: 'active',
          votingEndTime: Date.now() + 10 * 24 * 60 * 60 * 1000,
          votingPower: 42000
        },
        {
          id: 'proposal_10',
          title: 'Budget reallocation for marketing',
          status: 'pending',
          votingEndTime: Date.now() + 14 * 24 * 60 * 60 * 1000,
          votingPower: 0
        }
      ];
    } catch (error) {
      console.error('Error fetching linkable proposals:', error);
      toast.error('Failed to load proposals');
      throw error;
    }
  }
}

export default AnalyticsService; 