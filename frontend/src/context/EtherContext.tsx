import {
  BrowserProvider,
  Contract,
  ethers,
  JsonRpcSigner,
  type InterfaceAbi,
  type Eip1193Provider,
} from "ethers";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { OnChainProposal, TreasuryState } from "@/lib/types";
import SocietyDAO from './SocietyDAO.json'

type MaintenancePaidListener = (user: string, amount: bigint, txHash: string) => void;
type ProposalCreatedListener = (proposalId: number, txHash: string) => void;
type VoteCastListener = (voter: string, proposalId: number, support: boolean, txHash: string) => void;
type ProposalExecutedListener = (proposalId: number, txHash: string) => void;
type EthereumProviderWithEvents = Eip1193Provider & {
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
};

interface EtherContextType {
  contractAddress: string;
  isConnected: boolean;
  isHydrated: boolean;
  walletAddress: string | null;
  chainId: number | null;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  getProvider: () => Promise<BrowserProvider>;
  getSignerWallet: () => Promise<JsonRpcSigner>;
  getTreasuryState: () => Promise<TreasuryState>;
  getProposalCount: () => Promise<number>;
  getProposal: (id: number) => Promise<OnChainProposal>;
  getAllProposals: () => Promise<OnChainProposal[]>;
  hasVoted: (proposalId: number, voter: string) => Promise<boolean>;
  getPaymentStatus: (wallet: string) => Promise<{ paid: boolean; amount: bigint; timestamp: number }>;
  payMaintenance: () => Promise<string>;
  createProposal: (
    amountEth: number,
    recipient: string,
    deadline: number
  ) => Promise<{ proposalId: number; txHash: string }>;
  vote: (proposalId: number, support: boolean) => Promise<string>;
  executeProposal: (proposalId: number) => Promise<string>;
  onMaintenancePaid: (cb: MaintenancePaidListener) => Promise<() => void>;
  onProposalCreated: (cb: ProposalCreatedListener) => Promise<() => void>;
  onVoteCast: (cb: VoteCastListener) => Promise<() => void>;
  onProposalExecuted: (cb: ProposalExecutedListener) => Promise<() => void>;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}



const EtherContext = createContext<EtherContextType | null>(null);

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const SOCIETY_DAO_ABI = (SocietyDAO as { abi: InterfaceAbi }).abi;

const toOnChainProposal = (id: number, p: any): OnChainProposal => ({
  id,
  amount: p.amount as bigint,
  recipient: String(p.recipient),
  deadline: Number(p.deadline),
  executed: Boolean(p.executed),
  votesFor: Number(p.votesFor),
  votesAgainst: Number(p.votesAgainst),
});

export const EtherContextProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const assertEnvironment = useCallback(() => {
    if (!window.ethereum) throw new Error("MetaMask not detected");
    if (!CONTRACT_ADDRESS) throw new Error("Missing VITE_CONTRACT_ADDRESS in frontend/.env");
  }, []);

  const getProvider = useCallback(async () => {
    assertEnvironment();
    if (provider) return provider;
    const nextProvider = new BrowserProvider(window.ethereum as Eip1193Provider);
    setProvider(nextProvider);
    return nextProvider;
  }, [assertEnvironment, provider]);

  const connectWallet = useCallback(async () => {
    const p = await getProvider();
    const accounts = (await p.send("eth_requestAccounts", [])) as string[];
    if (!accounts?.length) throw new Error("No wallet account found");

    const normalized = ethers.getAddress(accounts[0]);
    const network = await p.getNetwork();
    setWalletAddress(normalized);
    setChainId(Number(network.chainId));
    return normalized;
  }, [getProvider]);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setChainId(null);
  }, []);

  const getSignerWallet = useCallback(async () => {
    const p = await getProvider();
    if (!walletAddress) await connectWallet();
    return await p.getSigner();
  }, [connectWallet, getProvider, walletAddress]);

  const getReadContract = useCallback(async () => {
    const p = await getProvider();
    return new Contract(CONTRACT_ADDRESS, SOCIETY_DAO_ABI, p);
  }, [getProvider]);

  const getWriteContract = useCallback(async () => {
    const signer = await getSignerWallet();
    return new Contract(CONTRACT_ADDRESS, SOCIETY_DAO_ABI, signer);
  }, [getSignerWallet]);

  const getTreasuryState = useCallback(async (): Promise<TreasuryState> => {
    const contract = await getReadContract();
    const [balance, monthlyFee, penaltyRate] = await Promise.all([
      contract.getBalance(),
      contract.monthlyFee(),
      contract.penaltyRate(),
    ]);
    return { balance, monthlyFee, penaltyRate: Number(penaltyRate) };
  }, [getReadContract]);

  const getProposalCount = useCallback(async () => {
    const contract = await getReadContract();
    return Number(await contract.proposalCount());
  }, [getReadContract]);

  const getProposal = useCallback(
    async (id: number) => {
      const contract = await getReadContract();
      const raw = await contract.getProposal(id);
      return toOnChainProposal(id, raw);
    },
    [getReadContract]
  );

  const getAllProposals = useCallback(async () => {
    const count = await getProposalCount();
    if (!count) return [];
    const proposals = await Promise.all(
      Array.from({ length: count }, (_, i) => getProposal(i + 1))
    );
    return proposals.sort((a, b) => b.id - a.id);
  }, [getProposal, getProposalCount]);

  const hasVoted = useCallback(
    async (proposalId: number, voter: string) => {
      const contract = await getReadContract();
      return await contract.hasVoted(proposalId, voter);
    },
    [getReadContract]
  );

  const getPaymentStatus = useCallback(
    async (wallet: string) => {
      const contract = await getReadContract();
      const [paid, amount, timestamp] = await contract.getPaymentStatus(wallet);
      return { paid, amount, timestamp: Number(timestamp) };
    },
    [getReadContract]
  );

  const payMaintenance = useCallback(async () => {
    const contract = await getWriteContract();
    const monthlyFee = await contract.monthlyFee();
    const tx = await contract.payMaintenance({ value: monthlyFee });
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  }, [getWriteContract]);

  const createProposal = useCallback(
    async (amountEth: number, recipient: string, deadline: number) => {
      const contract = await getWriteContract();
      const amountWei = ethers.parseEther(String(amountEth));
      const tx = await contract.createProposal(amountWei, recipient, deadline);
      const receipt = await tx.wait();

      let proposalId = await getProposalCount();
      const createdEvent = receipt?.logs
        ?.map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed: any) => parsed?.name === "ProposalCreated");

      if (createdEvent?.args?.proposalId) {
        proposalId = Number(createdEvent.args.proposalId);
      }

      return { proposalId, txHash: receipt?.hash ?? tx.hash };
    },
    [getProposalCount, getWriteContract]
  );

  const vote = useCallback(
    async (proposalId: number, support: boolean) => {
      const contract = await getWriteContract();
      const tx = await contract.vote(proposalId, support);
      const receipt = await tx.wait();
      return receipt?.hash ?? tx.hash;
    },
    [getWriteContract]
  );

  const executeProposal = useCallback(
    async (proposalId: number) => {
      const contract = await getWriteContract();
      const tx = await contract.executeProposal(proposalId);
      const receipt = await tx.wait();
      return receipt?.hash ?? tx.hash;
    },
    [getWriteContract]
  );

  const onMaintenancePaid = useCallback(
    async (cb: MaintenancePaidListener) => {
      const contract = await getReadContract();
      const listener = (user: string, amount: bigint, event: any) =>
        cb(user, amount, event.log.transactionHash);
      contract.on("MaintenancePaid", listener);
      return () => {
        contract.off("MaintenancePaid", listener);
      };
    },
    [getReadContract]
  );

  const onProposalCreated = useCallback(
    async (cb: ProposalCreatedListener) => {
      const contract = await getReadContract();
      const listener = (proposalId: bigint, event: any) =>
        cb(Number(proposalId), event.log.transactionHash);
      contract.on("ProposalCreated", listener);
      return () => {
        contract.off("ProposalCreated", listener);
      };
    },
    [getReadContract]
  );

  const onVoteCast = useCallback(
    async (cb: VoteCastListener) => {
      const contract = await getReadContract();
      const listener = (
        voter: string,
        proposalId: bigint,
        support: boolean,
        event: any
      ) => cb(voter, Number(proposalId), support, event.log.transactionHash);
      contract.on("VoteCast", listener);
      return () => {
        contract.off("VoteCast", listener);
      };
    },
    [getReadContract]
  );

  const onProposalExecuted = useCallback(
    async (cb: ProposalExecutedListener) => {
      const contract = await getReadContract();
      const listener = (proposalId: bigint, event: any) =>
        cb(Number(proposalId), event.log.transactionHash);
      contract.on("ProposalExecuted", listener);
      return () => {
        contract.off("ProposalExecuted", listener);
      };
    },
    [getReadContract]
  );

  useEffect(() => {
    if (!window.ethereum) {
      setIsHydrated(true);
      return;
    }

    const eth = window.ethereum as EthereumProviderWithEvents;
    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts.length) {
        disconnectWallet();
        return;
      }
      setWalletAddress(ethers.getAddress(accounts[0]));
    };

    const handleChainChanged = (nextChainIdHex: string) => {
      setChainId(Number(nextChainIdHex));
    };

    eth.on?.("accountsChanged", handleAccountsChanged);
    eth.on?.("chainChanged", handleChainChanged);

    (async () => {
      try {
        const p = await getProvider();
        const accounts = (await p.send("eth_accounts", [])) as string[];
        if (accounts.length > 0) {
          setWalletAddress(ethers.getAddress(accounts[0]));
          const network = await p.getNetwork();
          setChainId(Number(network.chainId));
        }
      } finally {
        setIsHydrated(true);
      }
    })();

    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
      eth.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [disconnectWallet, getProvider]);

  const value = useMemo<EtherContextType>(
    () => ({
      contractAddress: CONTRACT_ADDRESS,
      isConnected: Boolean(walletAddress),
      isHydrated,
      walletAddress,
      chainId,
      connectWallet,
      disconnectWallet,
      getProvider,
      getSignerWallet,
      getTreasuryState,
      getProposalCount,
      getProposal,
      getAllProposals,
      hasVoted,
      getPaymentStatus,
      payMaintenance,
      createProposal,
      vote,
      executeProposal,
      onMaintenancePaid,
      onProposalCreated,
      onVoteCast,
      onProposalExecuted,
    }),
    [
      chainId,
      connectWallet,
      disconnectWallet,
      executeProposal,
      getAllProposals,
      getPaymentStatus,
      getProposal,
      getProposalCount,
      getProvider,
      getSignerWallet,
      getTreasuryState,
      hasVoted,
      onMaintenancePaid,
      onProposalCreated,
      onProposalExecuted,
      onVoteCast,
      payMaintenance,
      isHydrated,
      walletAddress,
      createProposal,
      vote,
    ]
  );

  return <EtherContext.Provider value={value}>{children}</EtherContext.Provider>;
};

export const useEther = () => {
  const ctx = useContext(EtherContext);
  if (!ctx) throw new Error("useEther must be used within EtherContextProvider");
  return ctx;
};
