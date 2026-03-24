import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ethers } from "ethers";
import { useEther } from "@/context/EtherContext";
import {
  addActivityLog,
  addNotification,
  addVendor,
  deleteVendor as fbDeleteVendor,
  getActivityLogs,
  getAnalyticsCache,
  getNotifications,
  getProposalMetadata,
  getUsers,
  getVendors,
  isFirebaseConfigured,
  markNotificationRead,
  onNotificationsSnapshot,
  saveProposalMetadata,
} from "./firebase";
import { ETH_TO_INR } from "./currency";
import type {
  FirebaseNotification,
  FirebaseVendor,
  ProposalView,
  ResidentView,
  TransactionView,
} from "./types";
import { toast } from "sonner";

export const domains = [
  "Infrastructure",
  "Maintenance",
  "Amenities",
  "Security",
  "Governance",
  "Community",
];

const resolveProposalStatus = (executed: boolean, deadline: number): ProposalView["status"] => {
  if (executed) return "completed";
  if (deadline >= Math.floor(Date.now() / 1000)) return "active";
  return "pending";
};

const buildMonthlyCollection = (transactions: TransactionView[]) => {
  const map = new Map<string, number>();
  transactions
    .filter((tx) => tx.type === "maintenance")
    .forEach((tx) => {
      const month = tx.date.slice(0, 7);
      map.set(month, (map.get(month) ?? 0) + tx.amount);
    });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, collected]) => ({
      month,
      collected,
      target: 0,
    }));
};

export const useTreasuryState = () => {
  const { getTreasuryState } = useEther();

  return useQuery({
    queryKey: ["treasury"],
    queryFn: async () => {
      const state = await getTreasuryState();
      const balanceETH = Number(ethers.formatEther(state.balance));
      const monthlyFeeETH = Number(ethers.formatEther(state.monthlyFee));

      return {
        balanceETH,
        balanceINR: balanceETH * ETH_TO_INR,
        monthlyFeeETH,
        monthlyFeeINR: monthlyFeeETH * ETH_TO_INR,
        penaltyRate: state.penaltyRate,
      };
    },
    staleTime: 30_000,
  });
};

export const useProposals = () => {
  const { getAllProposals } = useEther();

  return useQuery({
    queryKey: ["proposals"],
    queryFn: async (): Promise<ProposalView[]> => {
      const onChain = await getAllProposals();
      const metadata = isFirebaseConfigured() ? await getProposalMetadata() : [];

      return onChain.map((p) => {
        const meta = metadata.find((m) => m.proposalId === p.id);
        const totalVotes = p.votesFor + p.votesAgainst;

        return {
          id: p.id,
          title: meta?.title || `Proposal #${p.id}`,
          description: meta?.description || "No description provided.",
          domain: meta?.domain || "Governance",
          amount: Number(ethers.formatEther(p.amount)),
          recipient: p.recipient,
          deadline: p.deadline,
          executed: p.executed,
          votesFor: p.votesFor,
          votesAgainst: p.votesAgainst,
          totalVoters: totalVotes,
          createdBy: meta?.createdBy || "Unknown",
          createdAt: meta?.createdAt || new Date(p.deadline * 1000).toISOString(),
          vendorId: undefined,
          status: resolveProposalStatus(p.executed, p.deadline),
        };
      });
    },
    staleTime: 15_000,
  });
};

export const useCreateProposal = () => {
  const queryClient = useQueryClient();
  const { createProposal } = useEther();

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
      const { proposalId, txHash } = await createProposal(
        data.budget,
        data.recipient,
        data.deadline
      );

      if (isFirebaseConfigured()) {
        await saveProposalMetadata({
          proposalId,
          title: data.title,
          description: data.description,
          domain: data.domain,
          createdBy: data.createdBy,
          createdAt: new Date().toISOString(),
        });

        await addActivityLog({
          type: "DEPOSIT",
          walletAddress: data.createdBy,
          proposalId,
          description: `Created proposal #${proposalId}`,
          txHash,
          timestamp: new Date().toISOString(),
        });
      }

      return { proposalId, txHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Proposal created successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create proposal");
    },
  });
};

export const useVote = () => {
  const queryClient = useQueryClient();
  const { vote } = useEther();

  return useMutation({
    mutationFn: async (data: { proposalId: number; voter: string; support: boolean }) => {
      const txHash = await vote(data.proposalId, data.support);

      if (isFirebaseConfigured()) {
        await addActivityLog({
          type: "VOTE",
          walletAddress: data.voter,
          proposalId: data.proposalId,
          description: `Voted ${data.support ? "YES" : "NO"} on proposal #${data.proposalId}`,
          txHash,
          timestamp: new Date().toISOString(),
        });
      }

      return { txHash };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["votingHistory"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success(`Vote submitted: ${variables.support ? "YES" : "NO"}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Vote failed");
    },
  });
};

export const usePayMaintenance = () => {
  const queryClient = useQueryClient();
  const { payMaintenance, getTreasuryState } = useEther();

  return useMutation({
    mutationFn: async (wallet: string) => {
      const txHash = await payMaintenance();

      if (isFirebaseConfigured()) {
        const treasury = await getTreasuryState();
        const amountEth = Number(ethers.formatEther(treasury.monthlyFee));
        await addActivityLog({
          type: "MAINTENANCE_PAYMENT",
          walletAddress: wallet,
          amount: amountEth,
          amountINR: amountEth * ETH_TO_INR,
          description: "Maintenance payment completed",
          txHash,
          timestamp: new Date().toISOString(),
        });

        await addNotification({
          walletAddress: wallet,
          title: "Maintenance Paid",
          message: `Your payment (${amountEth.toFixed(4)} ETH) is confirmed.`,
          type: "SYSTEM",
          read: false,
          timestamp: new Date().toISOString(),
        });
      }

      return { txHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Maintenance payment confirmed.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Maintenance payment failed");
    },
  });
};

export const useExecuteProposal = () => {
  const queryClient = useQueryClient();
  const { executeProposal, getProposal } = useEther();

  return useMutation({
    mutationFn: async (proposalId: number) => {
      const proposal = await getProposal(proposalId);
      const txHash = await executeProposal(proposalId);

      if (isFirebaseConfigured()) {
        await addActivityLog({
          type: "EXECUTE",
          walletAddress: proposal.recipient,
          proposalId,
          amount: Number(ethers.formatEther(proposal.amount)),
          amountINR: Number(ethers.formatEther(proposal.amount)) * ETH_TO_INR,
          description: `Executed proposal #${proposalId}`,
          txHash,
          timestamp: new Date().toISOString(),
        });
      }

      return { txHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Proposal executed.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Execution failed");
    },
  });
};

export const useResidents = () => {
  const { getPaymentStatus, getTreasuryState } = useEther();

  return useQuery({
    queryKey: ["residents"],
    queryFn: async (): Promise<ResidentView[]> => {
      if (!isFirebaseConfigured()) return [];

      const [users, treasury] = await Promise.all([getUsers(), getTreasuryState()]);
      const monthlyFeeInr = Number(ethers.formatEther(treasury.monthlyFee)) * ETH_TO_INR;

      const residents = users.filter((u) => u.role === "resident");
      return await Promise.all(
        residents.map(async (resident) => {
          const payment = await getPaymentStatus(resident.walletAddress);
          const lateFee = payment.paid ? 0 : Math.round((monthlyFeeInr * treasury.penaltyRate) / 100);

          return {
            walletAddress: resident.walletAddress,
            flatNumber: resident.flatNumber,
            name: resident.name,
            maintenanceDue: monthlyFeeInr,
            lateFee,
            status: payment.paid ? "paid" : lateFee > 0 ? "late" : "pending",
            paidDate: payment.paid
              ? new Date(payment.timestamp * 1000).toISOString().slice(0, 10)
              : null,
          };
        })
      );
    },
  });
};

export const useTransactions = () => {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async (): Promise<TransactionView[]> => {
      if (!isFirebaseConfigured()) return [];

      const logs = await getActivityLogs();
      return logs
        .filter((log) => log.type === "MAINTENANCE_PAYMENT" || log.type === "EXECUTE")
        .map((log) => ({
          id: log.id,
          type: log.type === "MAINTENANCE_PAYMENT" ? "maintenance" : "payment",
          from: log.type === "MAINTENANCE_PAYMENT" ? log.walletAddress : "Treasury",
          to: log.type === "MAINTENANCE_PAYMENT" ? "Treasury" : log.walletAddress,
          amount: log.amount ?? 0,
          inr: log.amountINR ?? 0,
          date: (log.timestamp || "").slice(0, 10),
          hash: log.txHash || "-",
        }));
    },
  });
};

export const useAnalytics = () => {
  const { getTreasuryState, getAllProposals } = useEther();

  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const [treasury, proposals, users, txs, cache] = await Promise.all([
        getTreasuryState(),
        getAllProposals(),
        isFirebaseConfigured() ? getUsers() : Promise.resolve([]),
        isFirebaseConfigured() ? getActivityLogs() : Promise.resolve([]),
        isFirebaseConfigured() ? getAnalyticsCache() : Promise.resolve(null),
      ]);

      const treasuryBalance = Number(ethers.formatEther(treasury.balance));
      const residents = users.filter((u) => u.role === "resident");
      const paidSet = new Set(
        txs.filter((t) => t.type === "MAINTENANCE_PAYMENT").map((t) => t.walletAddress)
      );
      const proposalStats = {
        total: proposals.length,
        active: proposals.filter((p) => resolveProposalStatus(p.executed, p.deadline) === "active")
          .length,
        completed: proposals.filter((p) => p.executed).length,
        pending: proposals.filter((p) => resolveProposalStatus(p.executed, p.deadline) === "pending")
          .length,
      };

      const participationRate =
        proposals.length && residents.length
          ? Math.min(
              100,
              Math.round(
                (proposals.reduce((acc, p) => acc + p.votesFor + p.votesAgainst, 0) /
                  (proposals.length * residents.length)) *
                  100
              )
            )
          : 0;

      const monthlyCollection = cache?.monthlyCollection?.length
        ? cache.monthlyCollection
        : buildMonthlyCollection(
            txs
              .filter((l) => l.type === "MAINTENANCE_PAYMENT")
              .map((l, i) => ({
                id: String(i),
                type: "maintenance",
                from: l.walletAddress,
                to: "Treasury",
                amount: l.amount ?? 0,
                inr: l.amountINR ?? 0,
                date: (l.timestamp || "").slice(0, 10),
                hash: l.txHash || "-",
              }))
          );

      return {
        treasuryBalance,
        treasuryBalanceINR: treasuryBalance * ETH_TO_INR,
        totalCollectionRate: residents.length
          ? Math.round((paidSet.size / residents.length) * 100)
          : 0,
        participationRate,
        proposalStats,
        monthlyCollection,
        spendingByDomain:
          cache?.spendingByDomain ??
          [
            {
              domain: "Governance",
              amount: Number(
                proposals
                  .filter((p) => p.executed)
                  .reduce((sum, p) => sum + Number(ethers.formatEther(p.amount)), 0)
                  .toFixed(4)
              ),
              color: "hsl(200, 100%, 55%)",
            },
          ],
      };
    },
    staleTime: 60_000,
  });
};

export const useNotifications = (wallet?: string) => {
  const [realtimeData, setRealtimeData] = useState<FirebaseNotification[] | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured() || !wallet) return;
    const unsubscribe = onNotificationsSnapshot(wallet, setRealtimeData);
    return unsubscribe;
  }, [wallet]);

  const query = useQuery({
    queryKey: ["notifications", wallet],
    queryFn: async () => {
      if (!isFirebaseConfigured() || !wallet) return [];
      return await getNotifications(wallet);
    },
  });

  return {
    ...query,
    data: realtimeData || query.data,
  };
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useVendors = () =>
  useQuery({
    queryKey: ["vendors"],
    queryFn: async (): Promise<FirebaseVendor[]> => {
      if (!isFirebaseConfigured()) return [];
      return await getVendors();
    },
  });

export const useAddVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor added.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add vendor");
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fbDeleteVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor removed.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove vendor");
    },
  });
};

export const useVotingHistory = () => {
  const { data: proposals } = useProposals();
  const titleById = useMemo(
    () =>
      new Map(
        (proposals ?? []).map((p) => [String(p.id), p.title])
      ),
    [proposals]
  );

  return useQuery({
    queryKey: ["votingHistory"],
    queryFn: async () => {
      if (!isFirebaseConfigured()) return [];
      const logs = await getActivityLogs();

      return logs
        .filter((log) => log.type === "VOTE")
        .map((log) => ({
          proposalId: String(log.proposalId ?? ""),
          title:
            titleById.get(String(log.proposalId ?? "")) ||
            `Proposal #${String(log.proposalId ?? "")}`,
          vote: log.description.includes("YES") ? "for" : "against",
          date: (log.timestamp || "").slice(0, 10),
        }));
    },
  });
};

export { ETH_TO_INR };

