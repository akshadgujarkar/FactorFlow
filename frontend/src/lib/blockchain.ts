// ============================================================
// Blockchain Service — Mock Smart Contract Interface
// ============================================================
// Simulates on-chain interactions. Replace with real ethers.js
// contract calls when deploying to a testnet/mainnet.

import { ethers } from "ethers";
import type {
  OnChainProposal,
  TreasuryState,
  MaintenancePaidEvent,
  ProposalCreatedEvent,
  VoteCastEvent,
  ProposalExecutedEvent,
} from "./types";

// ----- ABI (minimal — matches the on-chain functions kept) -----
export const TREASURY_ABI = [
  // Read
  "function getBalance() view returns (uint256)",
  "function monthlyFee() view returns (uint256)",
  "function penaltyRate() view returns (uint256)",
  "function getProposal(uint256 id) view returns (uint256 amount, address recipient, uint256 deadline, bool executed, uint256 votesFor, uint256 votesAgainst)",
  "function hasVoted(uint256 proposalId, address voter) view returns (bool)",
  "function getPaymentStatus(address user) view returns (bool paid, uint256 amount, uint256 timestamp)",
  // Write
  "function payMaintenance() payable",
  "function createProposal(uint256 amount, address recipient, uint256 deadline) returns (uint256)",
  "function vote(uint256 proposalId, bool support)",
  "function executeProposal(uint256 proposalId)",
  // Events
  "event MaintenancePaid(address indexed user, uint256 amount)",
  "event ProposalCreated(uint256 indexed proposalId)",
  "event VoteCast(address indexed voter, uint256 indexed proposalId, bool support)",
  "event ProposalExecuted(uint256 indexed proposalId)",
];

// ----- Mock Contract Address -----
export const CONTRACT_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD1e";

// ============================================================
// Mock blockchain state (simulates contract storage)
// ============================================================

const mockTreasuryBalance = ethers.parseEther("2.5");
const mockMonthlyFee = ethers.parseEther("0.01");
const mockPenaltyRate = 25; // 25% annual

const mockOnChainProposals: OnChainProposal[] = [
  { id: 1, amount: ethers.parseEther("0.5"), recipient: "0xven1...abc1", deadline: Date.now() / 1000 + 86400 * 30, executed: false, votesFor: 45, votesAgainst: 12 },
  { id: 2, amount: ethers.parseEther("0.15"), recipient: "0x0000...0000", deadline: Date.now() / 1000 + 86400 * 30, executed: false, votesFor: 30, votesAgainst: 5 },
  { id: 3, amount: ethers.parseEther("0.2"), recipient: "0xven2...abc2", deadline: Date.now() / 1000 - 86400, executed: true, votesFor: 60, votesAgainst: 8 },
  { id: 4, amount: ethers.parseEther("0.3"), recipient: "0xven3...abc3", deadline: Date.now() / 1000 + 86400 * 20, executed: false, votesFor: 55, votesAgainst: 3 },
  { id: 5, amount: ethers.parseEther("0.1"), recipient: "0x0000...0000", deadline: Date.now() / 1000 + 86400 * 15, executed: false, votesFor: 20, votesAgainst: 15 },
];

const mockPaymentStatus: Record<string, { paid: boolean; amount: bigint; timestamp: number }> = {
  "0x1a2b...3c4d": { paid: true, amount: ethers.parseEther("0.01"), timestamp: Date.now() / 1000 - 86400 * 23 },
  "0x5e6f...7g8h": { paid: false, amount: BigInt(0), timestamp: 0 },
  "0x9i0j...1k2l": { paid: false, amount: BigInt(0), timestamp: 0 },
  "0x3m4n...5o6p": { paid: true, amount: ethers.parseEther("0.01"), timestamp: Date.now() / 1000 - 86400 * 19 },
};

const mockVotes: Record<string, Set<string>> = {};

// ============================================================
// Event listener callbacks (simulates contract.on())
// ============================================================

type EventCallback<T> = (event: T, txHash: string) => void;

const eventListeners: {
  MaintenancePaid: EventCallback<MaintenancePaidEvent>[];
  ProposalCreated: EventCallback<ProposalCreatedEvent>[];
  VoteCast: EventCallback<VoteCastEvent>[];
  ProposalExecuted: EventCallback<ProposalExecutedEvent>[];
} = {
  MaintenancePaid: [],
  ProposalCreated: [],
  VoteCast: [],
  ProposalExecuted: [],
};

// ----- Event emitter (called after mock transactions) -----
const emitEvent = <T>(event: keyof typeof eventListeners, data: T) => {
  const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  (eventListeners[event] as EventCallback<T>[]).forEach((cb) => cb(data, txHash));
};

// ============================================================
// Public API — mirrors smart contract interface
// ============================================================

export const blockchainService = {
  // ----- READ (view functions) -----

  async getTreasuryState(): Promise<TreasuryState> {
    await simulateDelay();
    return {
      balance: mockTreasuryBalance,
      monthlyFee: mockMonthlyFee,
      penaltyRate: mockPenaltyRate,
    };
  },

  async getProposal(id: number): Promise<OnChainProposal | null> {
    await simulateDelay();
    return mockOnChainProposals.find((p) => p.id === id) || null;
  },

  async getAllProposals(): Promise<OnChainProposal[]> {
    await simulateDelay();
    return [...mockOnChainProposals];
  },

  async getPaymentStatus(wallet: string): Promise<{ paid: boolean; amount: bigint; timestamp: number }> {
    await simulateDelay();
    return mockPaymentStatus[wallet] || { paid: false, amount: BigInt(0), timestamp: 0 };
  },

  async hasVoted(proposalId: number, voter: string): Promise<boolean> {
    await simulateDelay();
    return mockVotes[proposalId]?.has(voter) || false;
  },

  // ----- WRITE (state-changing functions) -----

  async payMaintenance(wallet: string): Promise<string> {
    await simulateDelay(1500);
    const txHash = generateTxHash();
    mockPaymentStatus[wallet] = {
      paid: true,
      amount: mockMonthlyFee,
      timestamp: Date.now() / 1000,
    };
    emitEvent("MaintenancePaid", { user: wallet, amount: mockMonthlyFee });
    return txHash;
  },

  async createProposal(amount: number, recipient: string, deadline: number): Promise<{ proposalId: number; txHash: string }> {
    await simulateDelay(2000);
    const proposalId = mockOnChainProposals.length + 1;
    mockOnChainProposals.push({
      id: proposalId,
      amount: ethers.parseEther(String(amount)),
      recipient,
      deadline,
      executed: false,
      votesFor: 0,
      votesAgainst: 0,
    });
    emitEvent("ProposalCreated", { proposalId });
    return { proposalId, txHash: generateTxHash() };
  },

  async vote(proposalId: number, voter: string, support: boolean): Promise<string> {
    await simulateDelay(1000);
    if (!mockVotes[proposalId]) mockVotes[proposalId] = new Set();
    if (mockVotes[proposalId].has(voter)) throw new Error("Already voted");
    mockVotes[proposalId].add(voter);

    const proposal = mockOnChainProposals.find((p) => p.id === proposalId);
    if (proposal) {
      if (support) proposal.votesFor++;
      else proposal.votesAgainst++;
    }
    emitEvent("VoteCast", { voter, proposalId, support });
    return generateTxHash();
  },

  async executeProposal(proposalId: number): Promise<string> {
    await simulateDelay(2000);
    const proposal = mockOnChainProposals.find((p) => p.id === proposalId);
    if (proposal) proposal.executed = true;
    emitEvent("ProposalExecuted", { proposalId });
    return generateTxHash();
  },

  // ----- EVENT LISTENERS -----

  onMaintenancePaid(cb: EventCallback<MaintenancePaidEvent>) {
    eventListeners.MaintenancePaid.push(cb);
    return () => {
      eventListeners.MaintenancePaid = eventListeners.MaintenancePaid.filter((l) => l !== cb);
    };
  },

  onProposalCreated(cb: EventCallback<ProposalCreatedEvent>) {
    eventListeners.ProposalCreated.push(cb);
    return () => {
      eventListeners.ProposalCreated = eventListeners.ProposalCreated.filter((l) => l !== cb);
    };
  },

  onVoteCast(cb: EventCallback<VoteCastEvent>) {
    eventListeners.VoteCast.push(cb);
    return () => {
      eventListeners.VoteCast = eventListeners.VoteCast.filter((l) => l !== cb);
    };
  },

  onProposalExecuted(cb: EventCallback<ProposalExecutedEvent>) {
    eventListeners.ProposalExecuted.push(cb);
    return () => {
      eventListeners.ProposalExecuted = eventListeners.ProposalExecuted.filter((l) => l !== cb);
    };
  },
};

// ============================================================
// Helpers
// ============================================================

function simulateDelay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateTxHash(): string {
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}
