## Smart Contract Overview

The GoalZilla smart contract is implemented in Solidity and uses Ethereum’s blockchain to handle campaign creation, funding, and milestone validation.

### Key Components

1. **Structs**:
   - `Milestone`: Represents a project milestone with fields for target amount, completion status, proof of completion, and funding status.
   - `Campaign`: Represents a campaign with fields for title, description, goal amount, duration, milestones, and other metadata.
   - `Vote`: Represents a vote on milestone completion, including the voter’s address and vote message.

2. **State Variables**:
   - `campaignCounter`: Tracks the total number of campaigns.
   - `campaigns`: Mapping of campaign IDs to campaign details.
   - `donations`: Mapping of campaign IDs and addresses to donation amounts.
   - `milestoneVotes`: Tracks votes for each milestone in a campaign.
   - `categoryToCampaigns`: Organizes campaigns by category.

3. **Events**:
   - `CampaignCreated`: Emitted when a new campaign is created.
   - `MilestoneFunded`: Emitted when a milestone is funded.
   - `MilestoneCompleted`: Emitted when a milestone is completed and submitted for review.
   - `VoteSubmitted`: Emitted when a stakeholder submits a vote.
   - `MilestoneAccepted` and `MilestoneRejected`: Emitted after milestone review results.

## Functions

### Public Functions

1. **createCampaign**
   - Allows a user to create a campaign.
   - Parameters include title, description, category, goal amount, duration, milestones, proof of work, beneficiaries, and media.

2. **fundMilestone**
   - Allows a user to fund a specific milestone of a campaign.
   - Requires the exact funding amount for the milestone.

3. **completeMilestone**
   - Allows the campaign creator to mark a milestone as complete and submit proof of completion.

4. **submitVote**
   - Allows stakeholders to vote on a milestone’s completion status.

5. **reviewMilestone**
   - Allows the campaign creator to finalize the status of a milestone after stakeholder votes.

### Modifiers

- `campaignExists`: Ensures the campaign exists.
- `onlyCampaignCreator`: Restricts access to the campaign creator.
- `campaignActive`: Ensures the campaign is active.
- `validMilestone`: Ensures the milestone index is valid.
- `isStakeholder`: Ensures the caller is a stakeholder.

## Example Usage

### Creating a Campaign
```solidity
// Example Campaign Details
string memory title = "Community Library Project";
string memory description = "A project to establish a library in our neighborhood.";
string memory category = "Education";
uint256 goalAmount = 10 ether;
uint256 duration = 90;
string[] memory milestoneNames = ["Purchase Land", "Build Foundation", "Furnishing and Setup"];
uint256[] memory milestoneTargets = [4 ether, 3 ether, 3 ether];
string memory proofOfWork = "Blueprint and proposal document.";
string memory beneficiaries = "Neighborhood community";
string[] memory media = ["ipfs://image1", "ipfs://image2"];

uint256 campaignId = goalZilla.createCampaign(
    title,
    description,
    category,
    goalAmount,
    duration,
    milestoneNames,
    milestoneTargets,
    proofOfWork,
    beneficiaries,
    media
);
```

### Funding a Milestone
```solidity
uint256 campaignId = 0; // Replace with actual campaign ID
uint256 milestoneIndex = 0; // Replace with the milestone index
uint256 fundingAmount = 4 ether; // Replace with the milestone target amount

goalZilla.fundMilestone{ value: fundingAmount }(campaignId, milestoneIndex);
```

### Completing a Milestone
```solidity
uint256 campaignId = 0; // Replace with actual campaign ID
uint256 milestoneIndex = 0; // Replace with the milestone index
string memory proofOfCompletion = "ipfs://proof_of_completion";

goalZilla.completeMilestone(campaignId, milestoneIndex, proofOfCompletion);
```

### Voting on a Milestone
```solidity
uint256 campaignId = 0; // Replace with actual campaign ID
uint256 milestoneIndex = 0; // Replace with the milestone index
bool isUpvote = true; // true for upvote, false for downvote
string memory message = "Great progress!";

goalZilla.submitVote(campaignId, milestoneIndex, isUpvote, message);
```

## Installation and Deployment

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/GoalZilla.git
   cd GoalZilla
   cd web3
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the smart contracts:
   ```bash
   npx hardhat compile
   ```

4. Deploy the contracts:
   ```bash
   npx run deploy
   ```

