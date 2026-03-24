// ============================================================
// Types for the hybrid on-chain + Firebase architecture
// ============================================================

// ----- ON-CHAIN TYPES (source of truth for financial/governance data) -----

export interface OnChainProposal {
  id: number;
  amount: bigint; // wei
  recipient: string; // wallet address
  deadline: number; // unix timestamp
  executed: boolean;
  votesFor: number;
  votesAgainst: number;
}

export interface OnChainMaintenanceRecord {
  wallet: string;
  amountPaid: bigint; // wei
  timestamp: number;
  txHash: string;
}

export interface OnChainVote {
  voter: string;
  proposalId: number;
  support: boolean; // true = YES, false = NO
}

export interface TreasuryState {
  balance: bigint; // wei
  monthlyFee: bigint; // wei
  penaltyRate: number; // percentage
}

// ----- FIREBASE TYPES (off-chain UI data layer) -----

export interface FirebaseUser {
  walletAddress: string;
  flatNumber: string;
  name: string;
  role: "admin" | "resident";
  createdAt: string;
}

export interface FirebaseProposalMetadata {
  proposalId: number; // linked to on-chain ID
  title: string;
  description: string;
  domain: string;
  vendorId?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
}

export interface FirebaseActivityLog {
  id: string;
  type: "DEPOSIT" | "VOTE" | "EXECUTE" | "MAINTENANCE_PAYMENT";
  walletAddress: string;
  proposalId?: number;
  amount?: number; // ETH (display-friendly)
  amountINR?: number;
  description: string;
  txHash?: string;
  timestamp: string;
}

export interface FirebaseAnalyticsCache {
  totalCollectionRate: number; // percentage
  participationRate: number; // percentage
  proposalStats: {
    total: number;
    active: number;
    completed: number;
    pending: number;
  };
  monthlyCollection: { month: string; collected: number; target: number }[];
  spendingByDomain: { domain: string; amount: number; color: string }[];
  lastUpdated: string;
}

export interface FirebaseNotification {
  id: string;
  walletAddress: string;
  message: string;
  title: string;
  type: "REMINDER" | "PENALTY" | "VOTE" | "SYSTEM";
  read: boolean;
  timestamp: string;
}

export interface FirebaseVendor {
  id: string;
  name: string;
  specialty: string;
  contact: string;
  wallet: string;
  rating: number;
  completedJobs: number;
}

// ----- COMBINED / VIEW TYPES (merged for UI consumption) -----

export interface ProposalView {
  id: number;
  title: string;
  description: string;
  domain: string;
  amount: number; // ETH
  recipient: string;
  deadline: number;
  executed: boolean;
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  createdBy: string;
  createdAt: string;
  vendorId?: string;
  status: "active" | "completed" | "pending";
}

export interface ResidentView {
  walletAddress: string;
  flatNumber: string;
  name: string;
  maintenanceDue: number; // INR
  lateFee: number; // INR
  status: "paid" | "pending" | "late";
  paidDate: string | null;
}

export interface TransactionView {
  id: string;
  type: "maintenance" | "payment";
  from: string;
  to: string;
  amount: number; // ETH
  inr: number;
  date: string;
  hash: string;
}

// ----- SMART CONTRACT EVENT TYPES -----

export interface ContractEvent {
  event: string;
  args: Record<string, unknown>;
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

export type MaintenancePaidEvent = {
  user: string;
  amount: bigint;
};

export type ProposalCreatedEvent = {
  proposalId: number;
};

export type VoteCastEvent = {
  voter: string;
  proposalId: number;
  support: boolean;
};

export type ProposalExecutedEvent = {
  proposalId: number;
};
