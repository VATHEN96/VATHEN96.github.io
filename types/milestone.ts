export interface Milestone {
  id?: string;
  name: string;
  target: number;
  completed?: boolean;
  isCompleted?: boolean;
  isUnderReview?: boolean;
  proofOfCompletion?: string;
  pendingReview?: boolean;
  dueDate?: Date;
} 