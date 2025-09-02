import { create } from "zustand";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Connection } from "@solana/web3.js";

interface NetworkStore {
    network: WalletAdapterNetwork;
    connection: Connection;
    setNetwork: (network: WalletAdapterNetwork) => void;
    getConnection: () => Connection;
}

const getRPCUrl = (network: WalletAdapterNetwork): string => {
    switch (network) {
        case WalletAdapterNetwork.Devnet:
            return "https://api.devnet.solana.com";
        case WalletAdapterNetwork.Testnet:
            return "https://api.testnet.solana.com";
        case WalletAdapterNetwork.Mainnet:
            return (
                process.env.MAINNET_RPC || "https://api.mainnet-beta.solana.com"
            );
        default:
            return "https://api.devnet.solana.com";
    }
};

export const useNetworkStore = create<NetworkStore>((set, get) => ({
    network: WalletAdapterNetwork.Devnet,
    connection: new Connection("https://api.devnet.solana.com", {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60000,
    }),
    setNetwork: (network) => {
        const endpoint = getRPCUrl(network);
        set({
            network,
            connection: new Connection(endpoint, {
                commitment: "confirmed",
                confirmTransactionInitialTimeout: 60000,
            }),
        });
    },
    getConnection: () => get().connection,
}));
