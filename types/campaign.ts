import { Milestone } from './milestone';

export interface Campaign {
  id: string;
  creator: string;
  title: string;
  description: string;
  goalAmount: number;
  totalFunded: number;
  deadline: Date;
  milestones: Milestone[];
  category: string;
  beneficiaries: string;
  proofOfWork: string;
  collateral: string;
  multimedia: string[];
  isActive: boolean;
  createdAt: Date;
  duration: number;
} 