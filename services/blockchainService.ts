import { ethers } from 'ethers';
import BadgeNFTABI from '../contracts/BadgeNFT.json';
import GovernanceABI from '../contracts/Governance.json';
import { toast } from 'sonner';

// Type definitions
export interface RewardTier {
  id: string;
  name: string;
  description: string;
  amount: number;
  rewards: string[];
  nftBadge: boolean;
  votingPower: number;
  maxContributions?: number;
  governanceRights: boolean;
}

export interface CreateProposalParams {
  campaignId: string;
  title: string;
  description: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  endTime: number;
}

export interface NFTBadgeMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

class BlockchainService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private badgeNFTContract: ethers.Contract | null = null;
  private governanceContract: ethers.Contract | null = null;
  
  // Contract addresses (would come from environment variables in production)
  private readonly BADGE_NFT_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Example address
  private readonly GOVERNANCE_CONTRACT_ADDRESS = '0x0987654321098765432109876543210987654321'; // Example address
  
  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.initializeProvider();
    }
  }
  
  private async initializeProvider() {
    try {
      // Initialize provider and signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      
      // Initialize contracts
      this.badgeNFTContract = new ethers.Contract(
        this.BADGE_NFT_CONTRACT_ADDRESS,
        BadgeNFTABI.abi,
        this.signer
      );
      
      this.governanceContract = new ethers.Contract(
        this.GOVERNANCE_CONTRACT_ADDRESS,
        GovernanceABI.abi,
        this.signer
      );
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
    }
  }
  
  // Connect wallet and get accounts
  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('Ethereum wallet not detected. Please install MetaMask or another Ethereum wallet.');
    }
    
    if (!this.provider) {
      this.initializeProvider();
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }
  
  // Get current account
  async getCurrentAccount(): Promise<string | null> {
    if (!window.ethereum) {
      return null;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    } catch (error) {
      console.error('Error getting current account:', error);
      return null;
    }
  }
  
  // Check if wallet is connected
  async isWalletConnected(): Promise<boolean> {
    const account = await this.getCurrentAccount();
    return !!account;
  }
  
  // Mint NFT badge
  async mintNFTBadge(
    campaignId: string, 
    tierId: string, 
    recipientAddress: string,
    metadata: NFTBadgeMetadata
  ): Promise<{ tokenId: string }> {
    this.ensureProviderAndSigner();
    
    try {
      // In a real implementation, we would upload metadata to IPFS first
      // and use the resulting URI in the contract call
      const metadataURI = `ipfs://example/${campaignId}/${tierId}`;
      
      // Call mintBadge function on the contract
      const transaction = await this.badgeNFTContract!.mintBadge(
        recipientAddress,
        metadataURI,
        {
          campaignId,
          tierId,
          votingPower: metadata.attributes.find(attr => attr.trait_type === 'voting_power')?.value || 0
        }
      );
      
      // Wait for transaction to be mined
      const receipt = await transaction.wait();
      
      // Get token ID from event logs
      const mintEvent = receipt.events?.find(e => e.event === 'BadgeMinted');
      const tokenId = mintEvent?.args?.tokenId.toString();
      
      return { tokenId };
    } catch (error) {
      console.error('Error minting NFT badge:', error);
      throw error;
    }
  }
  
  // Get user's NFT badges
  async getUserNFTBadges(userAddress: string): Promise<any[]> {
    this.ensureProviderAndSigner();
    
    try {
      // Get token IDs owned by the user
      const tokenIds = await this.badgeNFTContract!.getTokensByOwner(userAddress);
      
      // Get metadata for each token
      const badges = await Promise.all(
        tokenIds.map(async (tokenId: ethers.BigNumber) => {
          const tokenURI = await this.badgeNFTContract!.tokenURI(tokenId);
          // In a real implementation, we would fetch JSON from IPFS
          // For now, we'll just mock it
          
          // Mock badge data
          return {
            id: `badge-${tokenId.toString()}`,
            tokenId: tokenId.toString(),
            name: `Badge #${tokenId.toString()}`,
            description: 'A badge for supporting a campaign',
            imageUrl: `https://via.placeholder.com/300?text=Badge+${tokenId.toString()}`,
            campaignId: 'campaign-1',
            campaignTitle: 'Example Campaign',
            tier: 'Silver Supporter',
            rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'][
              Math.floor(Math.random() * 5)
            ],
            votingPower: Math.floor(Math.random() * 20) + 1,
            dateIssued: Date.now() - Math.floor(Math.random() * 10000000000),
            attributes: [
              {
                trait_type: 'Tier',
                value: 'Silver Supporter'
              },
              {
                trait_type: 'Voting Power',
                value: Math.floor(Math.random() * 20) + 1
              }
            ]
          };
        })
      );
      
      return badges;
    } catch (error) {
      console.error('Error getting user NFT badges:', error);
      throw error;
    }
  }
  
  // Get campaign tiers
  async getCampaignTiers(campaignId: string): Promise<RewardTier[]> {
    this.ensureProviderAndSigner();
    
    try {
      // In a real implementation, we would fetch tiers from the contract
      // For now, we'll just mock it
      return [
        {
          id: 'tier-1',
          name: 'Early Bird',
          description: 'Basic supporter tier with early access',
          amount: 0.01,
          rewards: ['Early access', 'Thank you email'],
          nftBadge: true,
          votingPower: 1,
          governanceRights: true
        },
        {
          id: 'tier-2',
          name: 'Silver Supporter',
          description: 'Silver tier with additional benefits',
          amount: 0.05,
          rewards: ['Early access', 'Thank you email', 'Name in credits'],
          nftBadge: true,
          votingPower: 5,
          governanceRights: true
        },
        {
          id: 'tier-3',
          name: 'Gold Supporter',
          description: 'Gold tier with significant benefits',
          amount: 0.1,
          rewards: [
            'Early access', 
            'Thank you email', 
            'Name in credits', 
            'Exclusive updates'
          ],
          nftBadge: true,
          votingPower: 10,
          governanceRights: true
        },
        {
          id: 'tier-4',
          name: 'Platinum Patron',
          description: 'Premium tier with all benefits',
          amount: 0.5,
          rewards: [
            'Early access', 
            'Thank you email', 
            'Name in credits', 
            'Exclusive updates',
            'Private Discord access',
            'One-on-one meeting with creator'
          ],
          nftBadge: true,
          votingPower: 25,
          maxContributions: 10,
          governanceRights: true
        }
      ];
    } catch (error) {
      console.error('Error getting campaign tiers:', error);
      throw error;
    }
  }
  
  // Contribute to campaign and receive NFT badge
  async contributeToCampaign(
    campaignId: string, 
    tierId: string, 
    amount: number
  ): Promise<{ transactionHash: string; tokenId: string }> {
    this.ensureProviderAndSigner();
    
    try {
      // 1. Send contribution
      const transaction = await this.signer!.sendTransaction({
        to: this.GOVERNANCE_CONTRACT_ADDRESS,
        value: ethers.utils.parseEther(amount.toString())
      });
      
      // Wait for transaction to be mined
      const receipt = await transaction.wait();
      
      // 2. Mint NFT badge
      const userAddress = await this.signer!.getAddress();
      
      // Get tier details
      const tiers = await this.getCampaignTiers(campaignId);
      const tier = tiers.find(t => t.id === tierId);
      
      if (!tier) {
        throw new Error('Tier not found');
      }
      
      // Create badge metadata
      const metadata: NFTBadgeMetadata = {
        name: `${tier.name} - ${campaignId}`,
        description: `Badge for ${tier.name} tier support of campaign ${campaignId}`,
        image: `https://via.placeholder.com/300?text=${tier.name}`,
        external_url: `https://wowzarush.io/campaign/${campaignId}`,
        attributes: [
          {
            trait_type: 'Tier',
            value: tier.name
          },
          {
            trait_type: 'Campaign',
            value: campaignId
          },
          {
            trait_type: 'Contribution',
            value: amount
          },
          {
            trait_type: 'Voting Power',
            value: tier.votingPower
          }
        ]
      };
      
      // Mint the badge
      const { tokenId } = await this.mintNFTBadge(
        campaignId,
        tierId,
        userAddress,
        metadata
      );
      
      return {
        transactionHash: receipt.transactionHash,
        tokenId
      };
    } catch (error) {
      console.error('Error contributing to campaign:', error);
      throw error;
    }
  }
  
  // Create governance proposal
  async createProposal(params: CreateProposalParams): Promise<string> {
    this.ensureProviderAndSigner();
    
    try {
      // Format options for the contract
      const optionTexts = params.options.map(option => option.text);
      
      // Call createProposal function on the contract
      const transaction = await this.governanceContract!.createProposal(
        params.campaignId,
        params.title,
        params.description,
        optionTexts,
        params.endTime
      );
      
      // Wait for transaction to be mined
      const receipt = await transaction.wait();
      
      // Get proposal ID from event logs
      const proposalEvent = receipt.events?.find(e => e.event === 'ProposalCreated');
      const proposalId = proposalEvent?.args?.proposalId.toString();
      
      return proposalId;
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }
  
  // Get campaign proposals
  async getCampaignProposals(campaignId: string): Promise<any[]> {
    this.ensureProviderAndSigner();
    
    try {
      // In a real implementation, we would fetch proposals from the contract
      // For now, we'll just mock it
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      
      return [
        {
          id: 'proposal-1',
          campaignId,
          title: 'Update project roadmap',
          description: 'Should we adjust our roadmap to prioritize mobile app development over desktop features?',
          creatorAddress: '0x1234567890123456789012345678901234567890',
          creatorName: 'Community Member',
          createdAt: now - 5 * day,
          endTime: now + 2 * day,
          options: [
            { id: 'option-1', text: 'Focus on mobile app first', votes: 156 },
            { id: 'option-2', text: 'Focus on desktop features first', votes: 89 }
          ],
          status: 'active',
          totalVotes: 245,
          userVoted: Math.random() > 0.5,
          userVoteOption: Math.random() > 0.5 ? 'option-1' : null
        },
        {
          id: 'proposal-2',
          campaignId,
          title: 'Community event planning',
          description: 'Which type of community event should we organize next month?',
          creatorAddress: '0x9876543210987654321098765432109876543210',
          creatorName: 'Project Lead',
          createdAt: now - 15 * day,
          endTime: now - 5 * day,
          options: [
            { id: 'option-3', text: 'Virtual hackathon', votes: 120 },
            { id: 'option-4', text: 'AMA with team', votes: 78 },
            { id: 'option-5', text: 'Community showcase', votes: 45 }
          ],
          status: 'completed',
          totalVotes: 243,
          userVoted: true,
          userVoteOption: 'option-3'
        },
        {
          id: 'proposal-3',
          campaignId,
          title: 'Token distribution model',
          description: 'How should we distribute the remaining token allocation?',
          creatorAddress: '0x5555666677778888999900001111222233334444',
          creatorName: 'Governance Lead',
          createdAt: now - 2 * day,
          endTime: now + 5 * day,
          options: [
            { id: 'option-6', text: 'Increase community allocation', votes: 230 },
            { id: 'option-7', text: 'Increase development fund', votes: 120 },
            { id: 'option-8', text: 'Keep the current distribution', votes: 67 }
          ],
          status: 'active',
          totalVotes: 417,
          userVoted: false
        }
      ];
    } catch (error) {
      console.error('Error getting campaign proposals:', error);
      throw error;
    }
  }
  
  // Vote on proposal
  async voteOnProposal(
    campaignId: string,
    proposalId: string,
    optionId: string
  ): Promise<boolean> {
    this.ensureProviderAndSigner();
    
    try {
      // Call vote function on the contract
      const transaction = await this.governanceContract!.vote(
        proposalId,
        optionId
      );
      
      // Wait for transaction to be mined
      await transaction.wait();
      
      return true;
    } catch (error) {
      console.error('Error voting on proposal:', error);
      throw error;
    }
  }
  
  // Get user voting power
  async getUserVotingPower(userAddress: string, campaignId: string): Promise<any> {
    this.ensureProviderAndSigner();
    
    try {
      // In a real implementation, we would fetch from the contract
      // For now, we'll just mock it
      
      // Random voting power between 0 and 50
      const totalPower = Math.floor(Math.random() * 50);
      
      // Create tier breakdown
      const tiers = [
        { tier: 'Early Bird', power: Math.floor(Math.random() * 5) },
        { tier: 'Silver Supporter', power: Math.floor(Math.random() * 10) },
        { tier: 'Gold Supporter', power: Math.floor(Math.random() * 15) },
        { tier: 'Platinum Patron', power: Math.floor(Math.random() * 20) }
      ].filter(t => t.power > 0);
      
      return {
        total: totalPower,
        tiers
      };
    } catch (error) {
      console.error('Error getting user voting power:', error);
      throw error;
    }
  }
  
  // Get user contributions to all campaigns
  async getUserContributions(userAddress: string): Promise<any[]> {
    this.ensureProviderAndSigner();
    
    try {
      // In a real implementation, this would query the blockchain
      // For now, return mock data
      return [
        {
          id: 'contrib-1',
          campaignId: 'campaign-1',
          campaignName: 'Amazing Project 1',
          amount: 0.5,
          timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
          tier: 'Silver Supporter',
          status: 'confirmed',
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        },
        {
          id: 'contrib-2',
          campaignId: 'campaign-2',
          campaignName: 'Awesome Project 2',
          amount: 1.2,
          timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
          tier: 'Gold Supporter',
          status: 'confirmed',
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
        }
      ];
    } catch (error) {
      console.error('Error getting user contributions:', error);
      return [];
    }
  }
  
  // Get user contributions to a specific campaign
  async getUserContributionsToCampaign(userAddress: string, campaignId: string): Promise<any[]> {
    this.ensureProviderAndSigner();
    
    try {
      // In a real implementation, this would query the blockchain for specific campaign contributions
      // For now, return mock data specific to the campaignId
      const allContributions = await this.getUserContributions(userAddress);
      return allContributions.filter(contribution => contribution.campaignId === campaignId);
    } catch (error) {
      console.error(`Error getting user contributions to campaign ${campaignId}:`, error);
      return [];
    }
  }
  
  // Ensure provider and signer are initialized
  private ensureProviderAndSigner() {
    if (!this.provider || !this.signer) {
      throw new Error('Blockchain service not initialized. Please connect your wallet first.');
    }
  }
}

export { BlockchainService };
export default BlockchainService; 