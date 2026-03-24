// ============================================================
// Hybrid Data Hooks — Combine blockchain + Firebase reads
// ============================================================
// Each hook fetches financial/governance data from blockchain
// and UI/metadata from Firebase. Falls back to mock data when
// Firebase is not configured.

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ethers } from "ethers";
import { blockchainService } from "./blockchain";
import {
  isFirebaseConfigured,
  getProposalMetadata,
  saveProposalMetadata,
  getActivityLogs,
  getAnalyticsCache,
  getNotifications,
  markNotificationRead,
  getVendors,
  addVendor,
  deleteVendor as fbDeleteVendor,
  getUsers,
  addActivityLog,
  addNotification,
  onNotificationsSnapshot,
  onActivityLogsSnapshot,
} from "./firebase";
import {
  residents as mockResidents,
  proposals as mockProposals,
  vendors as mockVendors,
  transactions as mockTransactions,
  notifications as mockNotifications,
  monthlyCollection as mockMonthlyCollection,
  spendingByDomain as mockSpendingByDomain,
  votingHistory as mockVotingHistory,
  ETH_TO_INR,
  domains,
} from "./mockData";
import type {
  ProposalView,
  ResidentView,
  TransactionView,
  FirebaseVendor,
  FirebaseNotification,
  FirebaseAnalyticsCache,
} from "./types";
import { toast } from "sonner";

// ============================================================
// Treasury — always from blockchain
// ============================================================

export const useTreasuryState = () =>
  useQuery({
    queryKey: ["treasury"],
    queryFn: async () => {
      const state = await blockchainService.getTreasuryState();
      return {
        balanceETH: Number(ethers.formatEther(state.balance)),
        balanceINR: Number(ethers.formatEther(state.balance)) * ETH_TO_INR,
        monthlyFeeETH: Number(ethers.formatEther(state.monthlyFee)),
        monthlyFeeINR: Number(ethers.formatEther(state.monthlyFee)) * ETH_TO_INR,
        penaltyRate: state.penaltyRate,
      };
    },
    staleTime: 30_000,
  });

// ============================================================
// Proposals — on-chain core + Firebase metadata
// ============================================================

export const useProposals = () =>
  useQuery({
    queryKey: ["proposals"],
    queryFn: async (): Promise<ProposalView[]> => {
      const onChain = await blockchainService.getAllProposals();

      if (isFirebaseConfigured()) {
        const metadata = await getProposalMetadata();
        return onChain.map((p) => {
          const meta = metadata.find((m) => m.proposalId === p.id);
          return {
            id: p.id,
            title: meta?.title || `Proposal #${p.id}`,
            description: meta?.description || "",
            domain: meta?.domain || "General",
            amount: Number(ethers.formatEther(p.amount)),
            recipient: p.recipient,
            deadline: p.deadline,
            executed: p.executed,
            votesFor: p.votesFor,
            votesAgainst: p.votesAgainst,
            totalVoters: 80,
            createdBy: meta?.createdBy || "Unknown",
            createdAt: meta?.createdAt || "",
            status: p.executed ? "completed" : p.deadline > Date.now() / 1000 ? "active" : "pending",
          };
        });
      }

      // Fallback: merge mock data
      return mockProposals.map((mp) => {
        const onChainMatch = onChain.find((p) => p.id === Number(mp.id));
        return {
          id: Number(mp.id),
          title: mp.title,
          description: mp.description,
          domain: mp.domain,
          amount: mp.budget,
          recipient: onChainMatch?.recipient || "0x0000",
          deadline: onChainMatch?.deadline || 0,
          executed: onChainMatch?.executed || mp.status === "completed",
          votesFor: onChainMatch?.votesFor ?? mp.votesFor,
          votesAgainst: onChainMatch?.votesAgainst ?? mp.votesAgainst,
          totalVoters: mp.totalVoters,
          createdBy: mp.proposer,
          createdAt: mp.createdAt,
          vendorId: mp.vendorId || undefined,
          status: mp.status,
        };
      });
    },
    staleTime: 15_000,
  });

// ============================================================
// Create Proposal — on-chain tx + Firebase metadata
// ============================================================

export const useCreateProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      domain: string;
      budget: number;
      recipient: string;
      deadline: number;
      createdBy: string;
    }) => {
      // 1. Create on-chain (minimal data)
      const { proposalId, txHash } = await blockchainService.createProposal(
        data.budget,
        data.recipient,
        data.deadline
      );

      // 2. Save metadata to Firebase
      await saveProposalMetadata({
        proposalId,
        title: data.title,
        description: data.description,
        domain: data.domain,
        createdBy: data.createdBy,
        createdAt: new Date().toISOString(),
      });

      return { proposalId, txHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal created on-chain & metadata saved!");
    },
  });
};

// ============================================================
// Vote — on-chain only, event updates Firebase
// ============================================================

export const useVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { proposalId: number; voter: string; support: boolean }) => {
      const txHash = await blockchainService.vote(data.proposalId, data.voter, data.support);
      return { txHash };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success(`Vote recorded: ${variables.support ? "YES" : "NO"}`);
    },
    onError: (err: Error) => {
      toast.error(err.message === "Already voted" ? "You have already voted on this proposal" : "Vote failed");
    },
  });
};

// ============================================================
// Maintenance Payment — on-chain tx, event updates Firebase
// ============================================================

export const usePayMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wallet: string) => {
      const txHash = await blockchainService.payMaintenance(wallet);
      return { txHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      toast.success("Maintenance payment of 0.01 ETH confirmed on-chain!");
    },
  });
};

// ============================================================
// Execute Proposal — on-chain, event updates Firebase
// ============================================================

export const useExecuteProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proposalId: number) => {
      const txHash = await blockchainService.executeProposal(proposalId);
      return { txHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal executed! Funds released.");
    },
  });
};

// ============================================================
// Residents — Firebase for metadata, blockchain for payment status
// ============================================================

export const useResidents = () =>
  useQuery({
    queryKey: ["residents"],
    queryFn: async (): Promise<ResidentView[]> => {
      if (isFirebaseConfigured()) {
        const users = await getUsers();
        const results = await Promise.all(
          users
            .filter((u) => u.role === "resident")
            .map(async (u) => {
              const status = await blockchainService.getPaymentStatus(u.walletAddress);
              return {
                walletAddress: u.walletAddress,
                flatNumber: u.flatNumber,
                name: u.name,
                maintenanceDue: 2000,
                lateFee: status.paid ? 0 : 500,
                status: status.paid ? "paid" : "pending",
                paidDate: status.paid ? new Date(status.timestamp * 1000).toISOString().split("T")[0] : null,
              } as ResidentView;
            })
        );
        return results;
      }

      // Fallback to mock
      return mockResidents.map((r) => ({
        walletAddress: r.wallet,
        flatNumber: r.flat,
        name: r.name,
        maintenanceDue: r.maintenanceDue,
        lateFee: r.lateFee,
        status: r.status,
        paidDate: r.paidDate,
      }));
    },
  });

// ============================================================
// Analytics — Firebase cached, with blockchain balance
// ============================================================

export const useAnalytics = () =>
  useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const treasury = await blockchainService.getTreasuryState();
      const balanceETH = Number(ethers.formatEther(treasury.balance));

      if (isFirebaseConfigured()) {
        const cache = await getAnalyticsCache();
        return {
          treasuryBalance: balanceETH,
          treasuryBalanceINR: balanceETH * ETH_TO_INR,
          totalCollectionRate: cache?.totalCollectionRate ?? 75,
          participationRate: cache?.participationRate ?? 60,
          proposalStats: cache?.proposalStats ?? { total: 5, active: 3, completed: 1, pending: 1 },
          monthlyCollection: cache?.monthlyCollection ?? mockMonthlyCollection,
          spendingByDomain: cache?.spendingByDomain ?? mockSpendingByDomain,
        };
      }

      // Fallback mock
      return {
        treasuryBalance: balanceETH,
        treasuryBalanceINR: balanceETH * ETH_TO_INR,
        totalCollectionRate: 75,
        participationRate: 60,
        proposalStats: { total: 5, active: 3, completed: 1, pending: 1 },
        monthlyCollection: mockMonthlyCollection,
        spendingByDomain: mockSpendingByDomain,
      };
    },
    staleTime: 60_000,
  });

// ============================================================
// Transactions / Activity Logs — Firebase with real-time
// ============================================================

export const useTransactions = () =>
  useQuery({
    queryKey: ["transactions"],
    queryFn: async (): Promise<TransactionView[]> => {
      if (isFirebaseConfigured()) {
        const logs = await getActivityLogs();
        return logs
          .filter((l) => l.type === "MAINTENANCE_PAYMENT" || l.type === "EXECUTE")
          .map((l, i) => ({
            id: l.id || String(i),
            type: l.type === "MAINTENANCE_PAYMENT" ? "maintenance" : "payment",
            from: l.type === "MAINTENANCE_PAYMENT" ? l.walletAddress : "Treasury",
            to: l.type === "MAINTENANCE_PAYMENT" ? "Treasury" : l.walletAddress,
            amount: l.amount || 0,
            inr: l.amountINR || 0,
            date: l.timestamp.split("T")[0],
            hash: l.txHash || "—",
          }));
      }
      return mockTransactions;
    },
  });

// ============================================================
// Notifications — Firebase with real-time listener
// ============================================================

export const useNotifications = (wallet?: string) => {
  const [realtimeData, setRealtimeData] = useState<FirebaseNotification[] | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured() || !wallet) return;
    const unsub = onNotificationsSnapshot(wallet, setRealtimeData);
    return unsub;
  }, [wallet]);

  const query_ = useQuery({
    queryKey: ["notifications", wallet],
    queryFn: async () => {
      if (isFirebaseConfigured() && wallet) {
        return await getNotifications(wallet);
      }
      // Fallback mock (map to Firebase shape)
      return mockNotifications.map((n) => ({
        id: n.id,
        walletAddress: wallet || "",
        title: n.title,
        message: n.message,
        type: (n.type === "proposal" ? "VOTE" : n.type === "payment" ? "REMINDER" : "SYSTEM") as FirebaseNotification["type"],
        read: n.read,
        timestamp: n.time,
      }));
    },
  });

  return {
    ...query_,
    data: realtimeData || query_.data,
  };
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

// ============================================================
// Vendors — Firebase only
// ============================================================

export const useVendors = () =>
  useQuery({
    queryKey: ["vendors"],
    queryFn: async (): Promise<FirebaseVendor[]> => {
      if (isFirebaseConfigured()) return await getVendors();
      return mockVendors;
    },
  });

export const useAddVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor added!");
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fbDeleteVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor removed");
    },
  });
};

// ============================================================
// Voting History — Firebase activity logs filtered
// ============================================================

export const useVotingHistory = () =>
  useQuery({
    queryKey: ["votingHistory"],
    queryFn: async () => {
      if (isFirebaseConfigured()) {
        const logs = await getActivityLogs();
        return logs
          .filter((l) => l.type === "VOTE")
          .map((l) => ({
            proposalId: String(l.proposalId),
            title: `Proposal #${l.proposalId}`,
            vote: l.description.includes("YES") ? "for" : "against",
            date: l.timestamp.split("T")[0],
          }));
      }
      return mockVotingHistory;
    },
  });

// Re-export for convenience
export { domains, ETH_TO_INR };
