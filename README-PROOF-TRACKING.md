# Proof Tracking System

This document explains the proof tracking system implemented in the WowzaRush platform to handle milestone proof submissions.

## Overview

The proof tracking system provides a reliable way to manage milestone proof submissions, ensuring that users don't lose their work even if blockchain transactions take time to confirm or encounter issues.

### Key Components

1. **Server-side API** (`/app/api/proofs/route.ts`):
   - Stores proof submissions in a JSON file database
   - Provides endpoints for creating, reading, updating, and deleting proofs
   - Maintains proof status (pending, confirmed, rejected)

2. **Client-side Utility** (`/utils/proofTracker.ts`):
   - Provides functions for interacting with the API
   - Handles saving proofs, fetching proofs, updating status, and deleting proofs

3. **Transaction Webhook** (`/app/api/transaction-webhook/route.ts`):
   - Receives updates about transaction status from blockchain listeners
   - Updates proof status based on transaction confirmations

4. **Milestone Management Component** (`/app/components/MilestoneManagement.tsx`):
   - Uses the API to display and manage milestone proofs
   - Provides UI for submitting proofs and checking status

## How It Works

1. **Proof Submission Flow**:
   - User submits proof of milestone completion
   - Proof is saved to the server API with status "pending"
   - Transaction is submitted to the blockchain
   - UI is updated to show "Pending Confirmation" status
   - Transaction hash is saved with the proof record

2. **Status Updates**:
   - Periodic checks query the API for proof status updates
   - Transaction webhook can update status when confirmations are received
   - Users can manually refresh status with the "Check Status" button

3. **Cleanup**:
   - When a proof is confirmed on the blockchain, the server record is deleted
   - If a transaction fails, the status is updated to "rejected"

## Debugging Tools

1. **Fix Stuck Proofs Button**:
   - Checks for proofs that are confirmed on the blockchain but still show as pending
   - Cleans up any stale proof records

2. **Debug Milestones Button**:
   - Shows all proofs stored in the API for the current campaign
   - Helps diagnose issues with proof submission and display

## Data Storage

Proofs are stored in a JSON file at `/data/proofs.json` with the following structure:

```json
[
  {
    "id": "unique-id",
    "campaignId": "1",
    "milestoneIndex": 0,
    "proofContent": "This is my proof of completion...",
    "submitter": "0x123...abc",
    "status": "pending",
    "transactionHash": "0xabc...123",
    "createdAt": 1621234567890,
    "updatedAt": 1621234567890
  }
]
```

## Benefits Over localStorage

This system improves upon the previous localStorage-based approach by:

1. **Persistence**: Data persists across browser sessions and devices
2. **Reliability**: No risk of localStorage being cleared or reaching size limits
3. **Centralization**: All users see the same proof status
4. **Webhook Support**: Can receive external updates about transaction status
5. **Better Debugging**: Easier to diagnose and fix issues with proof submissions 