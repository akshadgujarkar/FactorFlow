"use client"

import { createContext } from "react";
import { BrowserProvider, Contract, JsonRpcSigner } from "ethers";






interface EtherContextType {
    getContractInstance: (address:string) => Promise<Contract | undefined>;
    getAddress: () => Promise<string | null>;
   
    getProvider: () => Promise<BrowserProvider | null>;
    getSignerWallet: () => Promise<JsonRpcSigner | null>;
}

declare global {
    interface Window {
        ethereum?: unknown;   // or use the precise MetaMask type
    }
}


export const etherContext = createContext<EtherContextType | null>(null);

let PROVIDER: BrowserProvider | null = null;
let SIGNER: JsonRpcSigner | null = null;
let CONTRACT: Contract | null = null
let ADDRESS: string | null = null;

async function getProvider(): Promise<BrowserProvider | null> {
    if (typeof window.ethereum !== undefined) {
        if (!PROVIDER) {
            PROVIDER = new BrowserProvider(window.ethereum as any);
            await PROVIDER.send("eth_requestAccounts", []);
            return PROVIDER;
        } else {
            return PROVIDER;
        }
    }
    else {
        console.log("MetaMask is not install");
    }
    return null;
}

async function getAddress(): Promise<string | null> {
    if (ADDRESS && SIGNER) {
        return ADDRESS;
    } else {
        const signer = await getSignerWallet();
        ADDRESS = signer ? await signer.getAddress() : null;
        return ADDRESS;
    }
}

async function getSignerWallet(): Promise<JsonRpcSigner | null> {
    if (SIGNER && PROVIDER) {
        return SIGNER;
    } else {
        PROVIDER = await getProvider();
        SIGNER = PROVIDER ? await PROVIDER.getSigner() : null;
        return SIGNER
    }
}

async function getContractInstance(address:string): Promise<Contract | undefined> {
    if (!CONTRACT) {
        const signer = await getSignerWallet();
        // CONTRACT = new Contract(address, abi.abi, signer);
        return CONTRACT;
    }
    return CONTRACT;
}




export const EtherContextProvider = ({ children }: { children: React.ReactNode }) => {

    return (
        <etherContext.Provider value={
            {
                getAddress,
                getContractInstance,
                getProvider, getSignerWallet,
            }
        }>
            {children}
        </etherContext.Provider>
    )
}