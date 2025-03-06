/**
 * Proof Tracker Utility
 * 
 * This module provides functions for managing milestone proof submissions
 * using the server-side API instead of localStorage.
 */

export interface ProofEntry {
  id?: string;
  campaignId: string;
  milestoneIndex: number;
  proofContent: string;
  submitter: string;
  status: 'pending' | 'confirmed' | 'rejected';
  transactionHash?: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Save a proof of milestone completion to the server
 */
export async function saveProof(
  campaignId: string,
  milestoneIndex: number,
  proofContent: string,
  submitter: string,
  transactionHash?: string
): Promise<ProofEntry> {
  try {
    const response = await fetch('/api/proofs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId,
        milestoneIndex,
        proofContent,
        submitter,
        transactionHash,
        status: 'pending'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save proof');
    }

    const data = await response.json();
    console.log('Proof saved successfully:', data);
    return data.proof;
  } catch (error) {
    console.error('Error saving proof:', error);
    throw error;
  }
}

/**
 * Get all pending proofs for a campaign
 */
export async function getCampaignProofs(campaignId: string): Promise<ProofEntry[]> {
  try {
    const response = await fetch(`/api/proofs?campaignId=${campaignId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch proofs');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching proofs:', error);
    return [];
  }
}

/**
 * Update the status of a proof by transaction hash
 */
export async function updateProofStatus(
  transactionHash: string,
  status: 'pending' | 'confirmed' | 'rejected'
): Promise<boolean> {
  try {
    // First, get all proofs to find the one with this transaction hash
    const response = await fetch('/api/proofs', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch proofs');
    }

    const proofs: ProofEntry[] = await response.json();
    const matchingProof = proofs.find(proof => proof.transactionHash === transactionHash);

    if (!matchingProof) {
      console.warn(`No proof found with transaction hash: ${transactionHash}`);
      return false;
    }

    // Update the proof status
    return await updateMilestoneProofStatus(
      matchingProof.campaignId,
      matchingProof.milestoneIndex,
      status
    );
  } catch (error) {
    console.error('Error updating proof status:', error);
    return false;
  }
}

/**
 * Update the status of a proof by campaign ID and milestone index
 */
export async function updateMilestoneProofStatus(
  campaignId: string,
  milestoneIndex: number,
  status: 'pending' | 'confirmed' | 'rejected'
): Promise<boolean> {
  try {
    const response = await fetch('/api/proofs', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId,
        milestoneIndex,
        status
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update proof status');
    }

    const data = await response.json();
    console.log('Proof status updated successfully:', data);
    return true;
  } catch (error) {
    console.error('Error updating proof status:', error);
    return false;
  }
}

/**
 * Delete a proof from the server
 */
export async function deleteProof(
  campaignId: string,
  milestoneIndex: number
): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/proofs?campaignId=${campaignId}&milestoneIndex=${milestoneIndex}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      // If the error is "Proof not found", that's actually fine for our use case
      if (response.status === 404) {
        console.log(`No proof found to delete for campaign ${campaignId}, milestone ${milestoneIndex}`);
        return true;
      }
      throw new Error(errorData.error || 'Failed to delete proof');
    }

    const data = await response.json();
    console.log('Proof deleted successfully:', data);
    return true;
  } catch (error) {
    console.error('Error deleting proof:', error);
    return false;
  }
} 