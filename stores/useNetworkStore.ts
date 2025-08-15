import { create } from "zustand";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Connection } from "@solana/web3.js";
import { config } from "@/lib/utils";

interface NetworkStore {
    network: WalletAdapterNetwork;
    connection: Connection;
    setNetwork: (network: WalletAdapterNetwork) => void;
    getConnection: () => Connection;
}

const origin = typeof window !== "undefined" ? window.location.origin : "";
const mainnetRpcUrl =
    config?.rpcEndpoints?.mainnet || "https://api.mainnet-beta.solana.com";
const devnetRpcUrl =
    config?.rpcEndpoints?.devnet || "https://api.devnet.solana.com";
const testnetRpcUrl =
    config?.rpcEndpoints?.testnet || "https://api.testnet.solana.com";
const commitmentLevel = config?.commitmentLevel || "confirmed";

export const useNetworkStore = create<NetworkStore>((set, get) => ({
    network: WalletAdapterNetwork.Mainnet,
    connection: new Connection(mainnetRpcUrl, {
        commitment: config.commitmentLevel,
        confirmTransactionInitialTimeout: 60000,
    }),
    setNetwork: (network) => {
        let endpoint = mainnetRpcUrl;
        if (network === WalletAdapterNetwork.Devnet) {
            endpoint = devnetRpcUrl;
        } else if (network === WalletAdapterNetwork.Testnet) {
            endpoint = testnetRpcUrl;
        }
        try {
            set({
                network,
                connection: new Connection(endpoint, {
                    commitment: commitmentLevel,
                }),
            });
        } catch (error) {
            console.error("Failed to create Solana connection:", error);
        }
    },
    getConnection: () => get().connection,
}));
