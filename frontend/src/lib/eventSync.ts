// ============================================================
// Event Sync — Bridges smart contract events → Firebase
// ============================================================
// Listens to on-chain events and updates Firebase collections
// accordingly. This is the glue between the two layers.

import { ethers } from "ethers";
import { blockchainService } from "./blockchain";
import {
  addActivityLog,
  addNotification,
  updateAnalyticsCache,
  getAnalyticsCache,
} from "./firebase";
import { ETH_TO_INR } from "./mockData";

export const initEventSync = () => {
  const unsubscribers: (() => void)[] = [];

  // ----- MaintenancePaid → activity_logs + analytics_cache -----
  unsubscribers.push(
    blockchainService.onMaintenancePaid(async (event, txHash) => {
      const ethAmount = Number(ethers.formatEther(event.amount));

      await addActivityLog({
        type: "MAINTENANCE_PAYMENT",
        walletAddress: event.user,
        amount: ethAmount,
        amountINR: ethAmount * ETH_TO_INR,
        description: `Maintenance payment of ${ethAmount} ETH received`,
        txHash,
        timestamp: new Date().toISOString(),
      });

      // Update cached analytics
      const cache = await getAnalyticsCache();
      if (cache) {
        await updateAnalyticsCache({
          totalCollectionRate: Math.min(100, cache.totalCollectionRate + 2),
        });
      }

      console.log(`[EventSync] MaintenancePaid: ${event.user} → ${ethAmount} ETH`);
    })
  );

  // ----- VoteCast → activity_logs + participation stats -----
  unsubscribers.push(
    blockchainService.onVoteCast(async (event, txHash) => {
      await addActivityLog({
        type: "VOTE",
        walletAddress: event.voter,
        proposalId: event.proposalId,
        description: `Voted ${event.support ? "YES" : "NO"} on proposal #${event.proposalId}`,
        txHash,
        timestamp: new Date().toISOString(),
      });

      const cache = await getAnalyticsCache();
      if (cache) {
        await updateAnalyticsCache({
          participationRate: Math.min(100, cache.participationRate + 1),
        });
      }

      console.log(`[EventSync] VoteCast: ${event.voter} → Proposal #${event.proposalId} (${event.support ? "YES" : "NO"})`);
    })
  );

  // ----- ProposalCreated → activity_logs + notifications -----
  unsubscribers.push(
    blockchainService.onProposalCreated(async (event, txHash) => {
      await addActivityLog({
        type: "DEPOSIT",
        walletAddress: "system",
        proposalId: event.proposalId,
        description: `New proposal #${event.proposalId} created on-chain`,
        txHash,
        timestamp: new Date().toISOString(),
      });

      // Broadcast notification to all residents (in real app, iterate users)
      await addNotification({
        walletAddress: "all",
        title: `New Proposal #${event.proposalId}`,
        message: "A new proposal has been submitted for community voting.",
        type: "VOTE",
        read: false,
        timestamp: new Date().toISOString(),
      });

      console.log(`[EventSync] ProposalCreated: #${event.proposalId}`);
    })
  );

  // ----- ProposalExecuted → activity_logs + analytics -----
  unsubscribers.push(
    blockchainService.onProposalExecuted(async (event, txHash) => {
      await addActivityLog({
        type: "EXECUTE",
        walletAddress: "system",
        proposalId: event.proposalId,
        description: `Proposal #${event.proposalId} executed — funds transferred`,
        txHash,
        timestamp: new Date().toISOString(),
      });

      const cache = await getAnalyticsCache();
      if (cache) {
        await updateAnalyticsCache({
          proposalStats: {
            ...cache.proposalStats,
            completed: cache.proposalStats.completed + 1,
            active: Math.max(0, cache.proposalStats.active - 1),
          },
        });
      }

      console.log(`[EventSync] ProposalExecuted: #${event.proposalId}`);
    })
  );

  // Return cleanup function
  return () => unsubscribers.forEach((unsub) => unsub());
};
