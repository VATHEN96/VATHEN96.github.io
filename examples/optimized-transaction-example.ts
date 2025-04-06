/**
 * Optimized Transaction Example
 * 
 * This example demonstrates how to use the optimized blockchain service
 * to reduce transaction data size and gas costs by storing large data in IPFS
 */

import { ethers } from 'ethers';
import { optimizedCampaignService } from '../services/optimizedCampaignService';
import optimizedBlockchainService from '../services/optimizedBlockchainService';
import { estimateGasSavings } from '../utils/transaction-optimizer';

// Example campaign data with large description
const exampleCampaignData = {
  title: 'Example Optimized Campaign',
  category: 'Technology',
  goalAmount: '1.0', // 1 ETH
  duration: 30 * 24 * 60 * 60, // 30 days in seconds
  description: 'This is a short description that will be shown in listings.',
  longDescription: `This is a very long description that would normally consume a lot of gas if included directly in the transaction.
    It can include detailed information about the campaign, team members, roadmap, and other details.
    ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50)}
    This repeated text simulates a large amount of data that would be expensive to store on-chain.`,
  milestones: [
    {
      name: 'Initial Research',
      description: `Detailed research phase description with extensive information.
        ${'Research milestone details. '.repeat(20)}`,
      target: ethers.utils.parseEther('0.2'),
      dueDate: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days from now
    },
    {
      name: 'Development',
      description: `Detailed development phase description with extensive information.
        ${'Development milestone details. '.repeat(20)}`,
      target: ethers.utils.parseEther('0.5'),
      dueDate: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60 // 14 days from now
    },
    {
      name: 'Launch',
      description: `Detailed launch phase description with extensive information.
        ${'Launch milestone details. '.repeat(20)}`,
      target: ethers.utils.parseEther('0.3'),
      dueDate: Math.floor(Date.now() / 1000) + 28 * 24 * 60 * 60 // 28 days from now
    }
  ],
  metadata: {
    tags: ['technology', 'blockchain', 'example'],
    team: [
      {
        name: 'John Doe',
        role: 'Project Lead',
        bio: 'Experienced project manager with 10+ years in blockchain technology.'
      },
      {
        name: 'Jane Smith',
        role: 'Developer',
        bio: 'Senior developer with expertise in smart contracts and DApps.'
      }
    ],
    socialLinks: {
      website: 'https://example.com',
      twitter: 'https://twitter.com/example',
      telegram: 'https://t.me/example'
    },
    risks: 'This is a detailed description of potential risks and how they will be mitigated.',
    timeline: [
      {
        date: '2023-06-01',
        title: 'Project Start',
        description: 'Initial research and planning.'
      },
      {
        date: '2023-07-01',
        title: 'Development',
        description: 'Core development phase.'
      },
      {
        date: '2023-08-01',
        title: 'Testing',
        description: 'Comprehensive testing and bug fixing.'
      },
      {
        date: '2023-09-01',
        title: 'Launch',
        description: 'Official product launch.'
      }
    ]
  }
};

/**
 * Demonstrates the gas savings from using optimized transactions
 */
async function demonstrateGasSavings() {
  try {
    console.log('Demonstrating gas savings from optimized transactions...');
    
    // Get provider for gas price
    const provider = optimizedBlockchainService.getProvider();
    if (!provider) {
      throw new Error('No provider available');
    }
    
    // Get current gas price
    const gasPrice = await provider.getGasPrice();
    console.log(`Current gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
    
    // Calculate the size of the original data
    const originalData = JSON.stringify({
      description: exampleCampaignData.description,
      longDescription: exampleCampaignData.longDescription,
      milestones: exampleCampaignData.milestones,
      metadata: exampleCampaignData.metadata
    });
    
    // Simulate optimized data (just the IPFS hash and summary)
    const optimizedData = {
      ipfsHash: 'QmExample123456789', // Example IPFS hash
      summary: exampleCampaignData.description.substring(0, 100),
      timestamp: Date.now()
    };
    
    // Estimate gas savings
    const savings = estimateGasSavings(originalData, optimizedData, gasPrice);
    
    console.log('Gas savings analysis:');
    console.log(`Original data size: ${new TextEncoder().encode(originalData).length} bytes`);
    console.log(`Optimized data size: ${new TextEncoder().encode(JSON.stringify(optimizedData)).length} bytes`);
    console.log(`Original gas cost: ${ethers.utils.formatEther(savings.originalGasCost)} ETH`);
    console.log(`Optimized gas cost: ${ethers.utils.formatEther(savings.optimizedGasCost)} ETH`);
    console.log(`Gas savings: ${ethers.utils.formatEther(savings.savings)} ETH (${savings.savingsPercentage.toFixed(2)}%)`);
    
    return savings;
  } catch (error) {
    console.error('Error demonstrating gas savings:', error);
    throw error;
  }
}

/**
 * Creates a campaign using the optimized service
 */
async function createOptimizedCampaign() {
  try {
    console.log('Creating campaign with optimized data storage...');
    
    // Create empty media files array (would normally contain actual files)
    const mediaFiles: File[] = [];
    
    // Create campaign using optimized service
    const result = await optimizedCampaignService.createCampaign(
      exampleCampaignData.title,
      exampleCampaignData.category,
      exampleCampaignData.goalAmount,
      exampleCampaignData.duration,
      exampleCampaignData.description,
      exampleCampaignData.longDescription,
      exampleCampaignData.milestones,
      mediaFiles,
      exampleCampaignData.metadata
    );
    
    console.log(`Campaign created successfully with ID: ${result.campaignId}`);
    console.log(`Metadata stored in IPFS with hash: ${result.metadataHash}`);
    
    return result;
  } catch (error) {
    console.error('Error creating optimized campaign:', error);
    throw error;
  }
}

/**
 * Main function to run the example
 */
async function runExample() {
  try {
    // Demonstrate gas savings
    await demonstrateGasSavings();
    
    // Create an optimized campaign
    // Note: This is commented out because it would actually create a campaign on the blockchain
    // Uncomment to test with a real transaction
    // await createOptimizedCampaign();
    
    console.log('Example completed successfully');
  } catch (error) {
    console.error('Error running example:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample().catch(console.error);
}

export { demonstrateGasSavings, createOptimizedCampaign, runExample };