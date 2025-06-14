// "use client";

// import React, { FC, ReactNode, useMemo } from "react";
// import {
//     ConnectionProvider,
//     WalletProvider,
// } from "@solana/wallet-adapter-react";
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import { clusterApiUrl } from "@solana/web3.js";
// import "@solana/wallet-adapter-react-ui/styles.css";
// import { useNetworkStore } from "@/stores/useNetworkStore";

// interface SolanaProviderProps {
//     children: ReactNode;
// }

// export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
//     const network = useNetworkStore((state) => state.network);
//     const endpoint = useMemo(() => clusterApiUrl(network), [network]);

//     return (
//         <ConnectionProvider endpoint={endpoint}>
//             <WalletProvider wallets={[]} autoConnect>
//                 <WalletModalProvider>{children}</WalletModalProvider>
//             </WalletProvider>
//         </ConnectionProvider>
//     );
// };

"use client";

import type React from "react";

import { useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <SolanaWalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </SolanaWalletProvider>
        </ConnectionProvider>
    );
}
