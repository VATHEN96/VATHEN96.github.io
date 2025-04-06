import BlockchainServiceFixedV3Instance from './blockchainServiceFixedV3';

// Removed mock data for development

/**
 * Fetch campaigns created by a user
 */
export async function fetchUserCampaigns(userAddress: string) {
  if (!userAddress) {
    console.warn('Cannot fetch user campaigns: No user address');
    return [];
  }
  
  try {
    console.log('Fetching user campaigns for address:', userAddress);
    
    // Try to get from blockchain service if available
    if (BlockchainServiceFixedV3Instance?.getUserCampaigns) {
      const campaigns = await BlockchainServiceFixedV3Instance.getUserCampaigns(userAddress);
      if (Array.isArray(campaigns)) {
        console.log(`Fetched ${campaigns.length} user campaigns`);
        return campaigns;
      }
    }
    
    // Return empty array instead of mock data
    console.log('No campaigns available from blockchain service');
    return [];
  } catch (error) {
    console.error('Error fetching user campaigns:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Fetch campaigns backed by a user
 */
export async function fetchBackedCampaigns(userAddress: string) {
  if (!userAddress) {
    console.warn('Cannot fetch backed campaigns: No user address');
    return [];
  }
  
  try {
    console.log('Fetching backed campaigns for address:', userAddress);
    
    // Try to get from blockchain service if available
    if (BlockchainServiceFixedV3Instance?.getUserContributions) {
      const campaigns = await BlockchainServiceFixedV3Instance.getUserContributions(userAddress);
      if (Array.isArray(campaigns)) {
        console.log(`Fetched ${campaigns.length} backed campaigns`);
        return campaigns;
      }
    }
    
    // Return empty array instead of mock data
    console.log('No backed campaigns available from blockchain service');
    return [];
  } catch (error) {
    console.error('Error fetching backed campaigns:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Fetch campaigns a user has contributed to
 * This is an alias for fetchBackedCampaigns to maintain function name compatibility
 */
export const fetchUserContributedCampaigns = fetchBackedCampaigns; 