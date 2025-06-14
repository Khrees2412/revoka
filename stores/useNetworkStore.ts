// import { create } from "zustand";
// import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
// import { Connection, clusterApiUrl } from "@solana/web3.js";

// interface NetworkState {
//     network: WalletAdapterNetwork;
//     connection: Connection;
//     setNetwork: (network: WalletAdapterNetwork) => void;
//     getConnection: () => Connection;
// }

// export const useNetworkStore = create<NetworkState>((set, get) => ({
//     network: WalletAdapterNetwork.Devnet,
//     connection: new Connection(clusterApiUrl(WalletAdapterNetwork.Devnet)),
//     setNetwork: (network) =>
//         set({
//             network,
//             connection: new Connection(clusterApiUrl(network)),
//         }),
//     getConnection: () => get().connection,
// }));

import { create } from "zustand";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { config } from "@/lib/utils";

interface NetworkStore {
    network: WalletAdapterNetwork;
    connection: Connection;
    setNetwork: (network: WalletAdapterNetwork) => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
    network: WalletAdapterNetwork.Mainnet,
    connection: new Connection(config.rpcEndpoints.mainnet, {
        commitment: config.commitmentLevel,
        confirmTransactionInitialTimeout: 60000,
    }),
    setNetwork: (network) => {
        const endpoint =
            network === WalletAdapterNetwork.Mainnet
                ? config.rpcEndpoints.mainnet
                : config.rpcEndpoints.devnet;

        set({
            network,
            connection: new Connection(endpoint, {
                commitment: config.commitmentLevel,
            }),
        });
    },
}));
