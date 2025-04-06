/**
 * Web3 Storage Utilities
 * 
 * Persistent storage for web3 data with offline support
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define database schema
interface Web3DB extends DBSchema {
  // Store pending transactions
  pendingTransactions: {
    key: string;
    value: {
      id: string;
      hash?: string;
      from: string;
      to: string;
      data: string;
      value: string;
      nonce?: number;
      gasLimit?: string;
      gasPrice?: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
      chainId: number;
      status: 'pending' | 'submitted' | 'confirmed' | 'failed';
      createdAt: number;
      updatedAt: number;
      method?: string; // Contract method name
      params?: any[];  // Method parameters
      error?: string;  // Error message if failed
    };
    indexes: { 'by-status': string; 'by-from': string; 'by-chainId': number };
  };
  
  // Cache of fetched blockchain data
  blockchainCache: {
    key: string; // chainId-address-data
    value: {
      key: string; // Added this to fix the type error
      chainId: number;
      address?: string;  // Contract address if applicable
      data: any;         // The cached data
      expiry: number;    // Timestamp when cache expires
      lastUpdated: number;
    };
    indexes: { 'by-chainId': number; 'by-expiry': number };
  };
  
  // User profiles
  userProfiles: {
    key: string; // address
    value: {
      address: string;
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      lastSynced: number;
      campaigns?: string[]; // IDs of campaigns created by user
      contributions?: string[]; // IDs of campaigns contributed to
    };
    indexes: { 'by-lastSynced': number };
  };
  
  // Campaign data
  campaigns: {
    key: string; // campaign ID
    value: {
      id: string;
      title: string;
      description: string;
      creator: string;
      goalAmount: string;
      currentAmount: string;
      createdAt: number;
      updatedAt: number;
      status: 'active' | 'completed' | 'cancelled';
      milestones: Array<{
        id: string;
        title: string;
        description: string;
        amount: string;
        completed: boolean;
        approved: boolean;
      }>;
      chainId: number;
      contractAddress: string;
      lastSynced: number;
      comments?: Comment[];
      updates?: CampaignUpdate[];
    };
    indexes: { 
      'by-creator': string; 
      'by-status': string; 
      'by-lastSynced': number;
      'by-chainId': number;
    };
  };

  // Questions store
  questions: {
    key: string; // question ID
    value: {
      id: string;
      campaignId: string;
      title: string;
      content: string;
      createdAt: number;
      creatorAddress: string;
      creatorName?: string;
      isAnswered: boolean;
      isPinned: boolean;
      answerCount: number;
      upvotes: number;
      tags: string[];
      answer?: {
        content: string;
        createdAt: number;
        creatorAddress: string;
      } | null;
    };
    indexes: { 
      'by-campaignId': string;
      'by-creator': string;
      'by-createdAt': number;
    };
  };
}

// Time constants
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

// DB connection singleton
let dbPromise: Promise<IDBPDatabase<Web3DB>> | null = null;
let isInitialized = false;

/**
 * Initialize storage
 */
export async function initStorage(): Promise<void> {
  if (isInitialized) return;
  
  try {
    const db = await getDB();
    if (!db) throw new Error('Failed to initialize database');
    isInitialized = true;
    console.log('[Web3Storage] Initialized successfully');
  } catch (error) {
    console.error('[Web3Storage] Initialization error:', error);
    throw error;
  }
}

/**
 * Get database connection with initialization check
 */
async function getDB(): Promise<IDBPDatabase<Web3DB>> {
  if (!dbPromise) {
    try {
      dbPromise = openDB<Web3DB>('wowzarush-web3-db', 1, {
        upgrade(db) {
          // Create stores if they don't exist
          if (!db.objectStoreNames.contains('pendingTransactions')) {
            const txStore = db.createObjectStore('pendingTransactions', {
              keyPath: 'id',
            });
            txStore.createIndex('by-status', 'status');
            txStore.createIndex('by-from', 'from');
            txStore.createIndex('by-chainId', 'chainId');
          }
          
          if (!db.objectStoreNames.contains('blockchainCache')) {
            const cacheStore = db.createObjectStore('blockchainCache', {
              keyPath: 'key',
            });
            cacheStore.createIndex('by-chainId', 'chainId');
            cacheStore.createIndex('by-expiry', 'expiry');
          }
          
          if (!db.objectStoreNames.contains('userProfiles')) {
            const profilesStore = db.createObjectStore('userProfiles', {
              keyPath: 'address',
            });
            profilesStore.createIndex('by-lastSynced', 'lastSynced');
          }
          
          if (!db.objectStoreNames.contains('campaigns')) {
            const campaignsStore = db.createObjectStore('campaigns', {
              keyPath: 'id',
            });
            campaignsStore.createIndex('by-creator', 'creator');
            campaignsStore.createIndex('by-status', 'status');
            campaignsStore.createIndex('by-lastSynced', 'lastSynced');
            campaignsStore.createIndex('by-chainId', 'chainId');
          }

          if (!db.objectStoreNames.contains('questions')) {
            const questionsStore = db.createObjectStore('questions', {
              keyPath: 'id',
            });
            questionsStore.createIndex('by-campaignId', 'campaignId');
            questionsStore.createIndex('by-creator', 'creatorAddress');
            questionsStore.createIndex('by-createdAt', 'createdAt');
          }
        },
      });
    } catch (error) {
      console.error('[Web3Storage] Database connection error:', error);
      throw error;
    }
  }
  
  try {
    return await dbPromise;
  } catch (error) {
    console.error('[Web3Storage] Database access error:', error);
    throw error;
  }
}

/**
 * Pending Transactions API
 */
export const pendingTransactions = {
  /**
   * Add a transaction to the store
   */
  async add(tx: Omit<Web3DB['pendingTransactions']['value'], 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
    const db = await getDB();
    const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();
    
    await db.add('pendingTransactions', {
      ...tx,
      id,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    
    return id;
  },
  
  /**
   * Update transaction status
   */
  async updateStatus(id: string, status: 'pending' | 'submitted' | 'confirmed' | 'failed', error?: string) {
    const db = await getDB();
    const tx = await db.get('pendingTransactions', id);
    
    if (!tx) {
      throw new Error(`Transaction ${id} not found`);
    }
    
    await db.put('pendingTransactions', {
      ...tx,
      status,
      error,
      updatedAt: Date.now(),
    });
  },
  
  /**
   * Update transaction with hash after submission
   */
  async updateHash(id: string, hash: string) {
    const db = await getDB();
    const tx = await db.get('pendingTransactions', id);
    
    if (!tx) {
      throw new Error(`Transaction ${id} not found`);
    }
    
    await db.put('pendingTransactions', {
      ...tx,
      hash,
      status: 'submitted',
      updatedAt: Date.now(),
    });
  },
  
  /**
   * Get pending transaction by ID
   */
  async get(id: string) {
    const db = await getDB();
    return db.get('pendingTransactions', id);
  },
  
  /**
   * Get all pending transactions for an address
   */
  async getByAddress(address: string) {
    const db = await getDB();
    return db.getAllFromIndex(
      'pendingTransactions', 
      'by-from', 
      address.toLowerCase()
    );
  },
  
  /**
   * Get transactions by status
   */
  async getByStatus(status: 'pending' | 'submitted' | 'confirmed' | 'failed') {
    const db = await getDB();
    return db.getAllFromIndex('pendingTransactions', 'by-status', status);
  },
  
  /**
   * Get pending transactions for a chain
   */
  async getByChain(chainId: number) {
    const db = await getDB();
    return db.getAllFromIndex('pendingTransactions', 'by-chainId', chainId);
  },
  
  /**
   * Delete a transaction
   */
  async delete(id: string) {
    const db = await getDB();
    await db.delete('pendingTransactions', id);
  },
  
  /**
   * Clean up old transactions
   */
  async cleanup(olderThan = ONE_DAY * 7) { // Default: 7 days
    const db = await getDB();
    const now = Date.now();
    const txs = await db.getAll('pendingTransactions');
    
    const oldTxs = txs.filter(tx => {
      return (
        (tx.status === 'confirmed' || tx.status === 'failed') &&
        now - tx.updatedAt > olderThan
      );
    });
    
    const tx = db.transaction('pendingTransactions', 'readwrite');
    for (const oldTx of oldTxs) {
      await tx.store.delete(oldTx.id);
    }
    await tx.done;
    
    return oldTxs.length;
  },
};

/**
 * Blockchain Cache API
 */
export const blockchainCache = {
  /**
   * Add or update cached data
   */
  async set(
    key: string,
    data: any,
    chainId: number,
    ttl = ONE_HOUR,
    address?: string
  ) {
    const db = await getDB();
    const now = Date.now();
    
    await db.put('blockchainCache', {
      key,
      data,
      chainId,
      address,
      expiry: now + ttl,
      lastUpdated: now,
    });
  },
  
  /**
   * Get cached data if not expired
   */
  async get(key: string): Promise<any | null> {
    const db = await getDB();
    const cached = await db.get('blockchainCache', key);
    
    if (!cached) return null;
    
    // Check if expired
    if (cached.expiry < Date.now()) {
      await db.delete('blockchainCache', key);
      return null;
    }
    
    return cached.data;
  },
  
  /**
   * Delete cached data
   */
  async delete(key: string) {
    const db = await getDB();
    await db.delete('blockchainCache', key);
  },
  
  /**
   * Clear cache for a specific chain
   */
  async clearChain(chainId: number) {
    const db = await getDB();
    const cached = await db.getAllFromIndex('blockchainCache', 'by-chainId', chainId);
    
    const tx = db.transaction('blockchainCache', 'readwrite');
    for (const item of cached) {
      await tx.store.delete(item.key);
    }
    await tx.done;
    
    return cached.length;
  },
  
  /**
   * Clean up expired cache entries
   */
  async cleanup() {
    const db = await getDB();
    const now = Date.now();
    const expired = await db.getAllFromIndex(
      'blockchainCache',
      'by-expiry',
      IDBKeyRange.upperBound(now)
    );
    
    const tx = db.transaction('blockchainCache', 'readwrite');
    for (const item of expired) {
      await tx.store.delete(item.key);
    }
    await tx.done;
    
    return expired.length;
  },
};

/**
 * User Profiles API
 */
export const userProfiles = {
  /**
   * Add or update user profile
   */
  async set(profile: Omit<Web3DB['userProfiles']['value'], 'lastSynced'>) {
    const db = await getDB();
    
    await db.put('userProfiles', {
      ...profile,
      address: profile.address.toLowerCase(),
      lastSynced: Date.now(),
    });
  },
  
  /**
   * Get user profile
   */
  async get(address: string) {
    const db = await getDB();
    return db.get('userProfiles', address.toLowerCase());
  },
  
  /**
   * Update specific fields of a profile
   */
  async update(address: string, fields: Partial<Omit<Web3DB['userProfiles']['value'], 'address' | 'lastSynced'>>) {
    const db = await getDB();
    const profile = await db.get('userProfiles', address.toLowerCase());
    
    if (!profile) {
      throw new Error(`Profile for ${address} not found`);
    }
    
    await db.put('userProfiles', {
      ...profile,
      ...fields,
      lastSynced: Date.now(),
    });
  },
  
  /**
   * Delete user profile
   */
  async delete(address: string) {
    const db = await getDB();
    await db.delete('userProfiles', address.toLowerCase());
  },
};

/**
 * Campaigns API
 */
export const campaigns = {
  /**
   * Add or update campaign
   */
  async set(campaign: Omit<Web3DB['campaigns']['value'], 'lastSynced'>) {
    const db = await getDB();
    
    await db.put('campaigns', {
      ...campaign,
      creator: campaign.creator.toLowerCase(),
      lastSynced: Date.now(),
    });
  },
  
  /**
   * Get campaign by ID
   */
  async get(id: string) {
    const db = await getDB();
    return db.get('campaigns', id);
  },
  
  /**
   * Get campaigns by creator
   */
  async getByCreator(address: string) {
    const db = await getDB();
    return db.getAllFromIndex('campaigns', 'by-creator', address.toLowerCase());
  },
  
  /**
   * Get campaigns by status
   */
  async getByStatus(status: 'active' | 'completed' | 'cancelled') {
    const db = await getDB();
    return db.getAllFromIndex('campaigns', 'by-status', status);
  },
  
  /**
   * Get campaigns by chain
   */
  async getByChain(chainId: number) {
    const db = await getDB();
    return db.getAllFromIndex('campaigns', 'by-chainId', chainId);
  },
  
  /**
   * Update campaign status
   */
  async updateStatus(id: string, status: 'active' | 'completed' | 'cancelled') {
    const db = await getDB();
    const campaign = await db.get('campaigns', id);
    
    if (!campaign) {
      throw new Error(`Campaign ${id} not found`);
    }
    
    await db.put('campaigns', {
      ...campaign,
      status,
      updatedAt: Date.now(),
      lastSynced: Date.now(),
    });
  },
  
  /**
   * Update campaign milestone
   */
  async updateMilestone(campaignId: string, milestoneId: string, updates: Partial<Web3DB['campaigns']['value']['milestones'][0]>) {
    const db = await getDB();
    const campaign = await db.get('campaigns', campaignId);
    
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    const milestoneIndex = campaign.milestones.findIndex(m => m.id === milestoneId);
    if (milestoneIndex === -1) {
      throw new Error(`Milestone ${milestoneId} not found in campaign ${campaignId}`);
    }
    
    campaign.milestones[milestoneIndex] = {
      ...campaign.milestones[milestoneIndex],
      ...updates,
    };
    
    await db.put('campaigns', {
      ...campaign,
      updatedAt: Date.now(),
      lastSynced: Date.now(),
    });
  },
  
  /**
   * Delete campaign
   */
  async delete(id: string) {
    const db = await getDB();
    await db.delete('campaigns', id);
  },
};

// User Profile API
export async function getUserProfile(address: string) {
  try {
    if (!isInitialized) {
      await initStorage();
    }
    
    const db = await getDB();
    const profile = await db.get('userProfiles', address);
    return profile || null;
  } catch (error) {
    console.error(`[Web3Storage] Error getting user profile for ${address}:`, error);
    return null;
  }
}

export async function updateUserProfile(address: string, data: Partial<Web3DB['userProfiles']['value']>) {
  try {
    if (!isInitialized) {
      await initStorage();
    }
    
    const db = await getDB();
    const existing = await db.get('userProfiles', address);
    const now = Date.now();
    
    await db.put('userProfiles', {
      ...existing,
      ...data,
      address,
      lastSynced: now,
    });
    
    return true;
  } catch (error) {
    console.error(`[Web3Storage] Error updating user profile for ${address}:`, error);
    throw error;
  }
}

// Auto-initialize in client
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initStorage().catch(console.error);
  }, 2000); // Delay to avoid blocking main thread during page load
}

// Questions API
export const questions = {
  /**
   * Add a question to the store
   */
  async add(question: Omit<Web3DB['questions']['value'], 'createdAt'> & { createdAt?: number }) {
    try {
      if (!isInitialized) {
        await initStorage();
      }
      
      const db = await getDB();
      const now = Date.now();
      
      await db.put('questions', {
        ...question,
        createdAt: question.createdAt || now
      });
      
      return question.id;
    } catch (error) {
      console.error('[Web3Storage] Error adding question:', error);
      throw error;
    }
  },
  
  /**
   * Get a question by ID
   */
  async get(id: string) {
    try {
      if (!isInitialized) {
        await initStorage();
      }
      
      const db = await getDB();
      return db.get('questions', id);
    } catch (error) {
      console.error(`[Web3Storage] Error getting question ${id}:`, error);
      return null;
    }
  },
  
  /**
   * Get all questions for a campaign
   */
  async getByCampaign(campaignId: string) {
    try {
      if (!isInitialized) {
        await initStorage();
      }
      
      const db = await getDB();
      const questions = await db.getAllFromIndex('questions', 'by-campaignId', campaignId);
      
      // Sort by creation date, newest first
      return questions.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error(`[Web3Storage] Error getting questions for campaign ${campaignId}:`, error);
      return [];
    }
  },
  
  /**
   * Update a question
   */
  async update(id: string, updates: Partial<Omit<Web3DB['questions']['value'], 'id' | 'campaignId'>>) {
    try {
      if (!isInitialized) {
        await initStorage();
      }
      
      const db = await getDB();
      const question = await db.get('questions', id);
      
      if (!question) {
        throw new Error(`Question ${id} not found`);
      }
      
      await db.put('questions', {
        ...question,
        ...updates
      });
      
      return true;
    } catch (error) {
      console.error(`[Web3Storage] Error updating question ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a question
   */
  async delete(id: string) {
    try {
      if (!isInitialized) {
        await initStorage();
      }
      
      const db = await getDB();
      await db.delete('questions', id);
      return true;
    } catch (error) {
      console.error(`[Web3Storage] Error deleting question ${id}:`, error);
      throw error;
    }
  }
};

// Add exported helper functions for questions
export async function getQuestions(campaignId: string) {
  try {
    if (!isInitialized) {
      await initStorage();
    }
    
    return await questions.getByCampaign(campaignId);
  } catch (error) {
    console.error(`[Web3Storage] Error getting questions for campaign ${campaignId}:`, error);
    return [];
  }
}

export async function addQuestion(campaignId: string, question: Omit<Web3DB['questions']['value'], 'campaignId'>) {
  try {
    if (!isInitialized) {
      await initStorage();
    }
    
    await questions.add({
      ...question,
      campaignId
    });
    
    return question;
  } catch (error) {
    console.error(`[Web3Storage] Error adding question to campaign ${campaignId}:`, error);
    throw error;
  }
}

/**
 * Comments related functionality
 */

// Comment interface
export interface Comment {
  id: string;
  campaignId: string;
  userId: string;
  content: string;
  timestamp: number;
  likes: number;
  isCreator: boolean;
  parentId?: string;
  replies?: Comment[];
}

/**
 * Add a comment to a campaign
 * @param campaignId The ID of the campaign
 * @param comment The comment to add
 * @returns The created comment
 */
export async function addComment(campaignId: string, comment: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment> {
  const db = await getDB();
  
  // Create a transaction to add the comment
  const tx = db.transaction('campaigns', 'readwrite');
  const store = tx.objectStore('campaigns');
  
  // Get the campaign
  const campaign = await store.get(campaignId);
  if (!campaign) {
    throw new Error(`Campaign with ID ${campaignId} not found`);
  }
  
  // Ensure campaign has comments array
  if (!campaign.comments) {
    campaign.comments = [];
  }
  
  // Create the comment with ID and timestamp
  const newComment: Comment = {
    ...comment,
    id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
    likes: 0,
  };
  
  // Add comment to campaign
  campaign.comments.push(newComment);
  
  // Update campaign in store
  await store.put(campaign);
  await tx.done;
  
  return newComment;
}

/**
 * Campaign update interface
 */
export interface CampaignUpdate {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  creatorAddress: string;
  creatorName?: string;
  isPublic: boolean;
  attachments?: string[];
  likes: number;
  isPinned?: boolean;
}

/**
 * Get all updates for a campaign
 * @param campaignId The ID of the campaign
 * @param includePrivate Whether to include private updates
 * @returns Array of campaign updates
 */
export async function getCampaignUpdates(campaignId: string, includePrivate: boolean = false): Promise<CampaignUpdate[]> {
  try {
    if (!campaignId) {
      console.error('[Web3Storage] Campaign ID is required to fetch updates');
      return [];
    }

    const db = await getDB();
    const campaign = await db.get('campaigns', campaignId);
    
    if (!campaign || !campaign.updates) {
      return [];
    }
    
    // Filter updates based on visibility
    let updates = campaign.updates;
    if (!includePrivate) {
      updates = updates.filter((update: CampaignUpdate) => update.isPublic);
    }
    
    // Sort by creation time (newest first)
    return updates.sort((a: CampaignUpdate, b: CampaignUpdate) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('[Web3Storage] Error fetching campaign updates:', error);
    return [];
  }
}

/**
 * Get a single campaign update by ID
 * @param updateId The ID of the campaign update
 * @returns The campaign update or null if not found
 */
export async function getCampaignUpdate(updateId: string): Promise<CampaignUpdate | null> {
  try {
    if (!updateId) {
      console.error('[Web3Storage] Update ID is required');
      return null;
    }

    const db = await getDB();
    const tx = db.transaction('campaigns', 'readonly');
    const store = tx.objectStore('campaigns');
    const allCampaigns = await store.getAll();
    
    // Search through all campaigns for the update
    for (const campaign of allCampaigns) {
      if (campaign.updates && Array.isArray(campaign.updates)) {
        const update = campaign.updates.find((u: CampaignUpdate) => u.id === updateId);
        if (update) {
          return update;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Web3Storage] Error fetching campaign update:', error);
    return null;
  }
}

/**
 * Add a new campaign update
 * @param update The campaign update to add
 * @returns The created campaign update
 */
export async function addCampaignUpdate(update: Omit<CampaignUpdate, 'id' | 'createdAt' | 'updatedAt' | 'likes'>): Promise<CampaignUpdate> {
  try {
    const { campaignId } = update;
    if (!campaignId) {
      throw new Error('Campaign ID is required');
    }
    
    const db = await getDB();
    const campaign = await db.get('campaigns', campaignId);
    
    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }
    
    const now = Date.now();
    const newUpdate: CampaignUpdate = {
      ...update,
      id: `update-${campaignId}-${now}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      likes: 0
    };
    
    // Initialize updates array if it doesn't exist
    if (!campaign.updates) {
      campaign.updates = [];
    }
    
    // Add the new update
    campaign.updates.push(newUpdate);
    
    // Update the campaign
    await db.put('campaigns', {
      ...campaign,
      lastSynced: now
    });
    
    return newUpdate;
  } catch (error) {
    console.error('[Web3Storage] Error adding campaign update:', error);
    throw error;
  }
}

/**
 * Update an existing campaign update
 * @param updateId The ID of the campaign update to update
 * @param updateData The data to update in the campaign update
 * @returns True if the update was found and updated, false otherwise
 */
export async function updateCampaignUpdate(updateId: string, updateData: Partial<CampaignUpdate>): Promise<boolean> {
  try {
    if (!updateId) {
      console.error('[Web3Storage] Update ID is required');
      return false;
    }
    
    const db = await getDB();
    const tx = db.transaction('campaigns', 'readwrite');
    const store = tx.objectStore('campaigns');
    const allCampaigns = await store.getAll();
    
    let found = false;
    
    // Search through all campaigns for the update
    for (const campaign of allCampaigns) {
      if (campaign.updates && Array.isArray(campaign.updates)) {
        const updateIndex = campaign.updates.findIndex((u: CampaignUpdate) => u.id === updateId);
        
        if (updateIndex !== -1) {
          // Update the campaign update
          campaign.updates[updateIndex] = {
            ...campaign.updates[updateIndex],
            ...updateData,
            updatedAt: Date.now()
          };
          
          // Save the campaign
          await store.put({
            ...campaign,
            lastSynced: Date.now()
          });
          
          found = true;
          break;
        }
      }
    }
    
    await tx.done;
    return found;
  } catch (error) {
    console.error('[Web3Storage] Error updating campaign update:', error);
    return false;
  }
}

/**
 * Delete a campaign update
 * @param updateId The ID of the campaign update to delete
 * @returns True if the update was found and deleted, false otherwise
 */
export async function deleteCampaignUpdate(updateId: string): Promise<boolean> {
  try {
    if (!updateId) {
      console.error('[Web3Storage] Update ID is required');
      return false;
    }
    
    const db = await getDB();
    const tx = db.transaction('campaigns', 'readwrite');
    const store = tx.objectStore('campaigns');
    const allCampaigns = await store.getAll();
    
    let found = false;
    
    // Search through all campaigns for the update
    for (const campaign of allCampaigns) {
      if (campaign.updates && Array.isArray(campaign.updates)) {
        const updateIndex = campaign.updates.findIndex((u: CampaignUpdate) => u.id === updateId);
        
        if (updateIndex !== -1) {
          // Remove the update from the campaign
          campaign.updates.splice(updateIndex, 1);
          
          // Save the campaign
          await store.put({
            ...campaign,
            lastSynced: Date.now()
          });
          
          found = true;
          break;
        }
      }
    }
    
    await tx.done;
    return found;
  } catch (error) {
    console.error('[Web3Storage] Error deleting campaign update:', error);
    return false;
  }
} 