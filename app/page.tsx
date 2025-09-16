"use client";

import { useState, useEffect } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Shield, Wallet, Network } from "lucide-react";
import { Transaction } from "@solana/web3.js";
import DashboardSection from "./dashboard/page";
import { Token } from "@/lib/types";

// Get the initial network synchronously from localStorage
const getInitialNetwork = (): WalletAdapterNetwork => {
    if (typeof window !== "undefined") {
        const savedNetwork = localStorage.getItem("network");
        if (
            savedNetwork &&
            Object.values(WalletAdapterNetwork).includes(
                savedNetwork as WalletAdapterNetwork
            )
        ) {
            return savedNetwork as WalletAdapterNetwork;
        }
    }
    return WalletAdapterNetwork.Devnet;
};

export default function Home() {
    const [network, setNetwork] =
        useState<WalletAdapterNetwork>(getInitialNetwork);
    const { publicKey, connected, signTransaction } = useWallet();
    const [tokens, setTokens] = useState<Token[]>([]);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    // Ensure component is mounted before rendering wallet-dependent UI
    useEffect(() => {
        setHydrated(true);
    }, []);

    // Save current network to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("network", network);
    }, [network]);

    const fetchTokens = async (showRefreshState = false) => {
        if (!publicKey) return;

        if (showRefreshState) {
            setIsRefreshing(true);
        } else {
            setIsInitialLoading(true);
        }

        try {
            const response = await fetch(
                `/api/delegations?public_key=${publicKey}&network=${network}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                setError("Failed to fetch tokens");
                throw new Error("Failed to fetch tokens");
            }

            const { delegatedTokens } = await response.json();
            setTokens(delegatedTokens);
        } catch (error: any) {
            console.error("Error fetching tokens:", error);
            setError("Error fetching tokens: " + error.message);
        } finally {
            setIsInitialLoading(false);
            setIsRefreshing(false);
        }
    };

    const revokeDelegate = async (mint: string) => {
        setLoading(true);
        setRevoking(mint);
        try {
            const response = await fetch(
                `/api/delegations?public_key=${publicKey}&network=${network}&mint=${mint}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!response.ok) throw new Error("Failed to fetch token account");

            const { transaction } = await response.json();
            if (!transaction) throw new Error("Missing revocation transaction");

            const tx = Transaction.from(Buffer.from(transaction, "base64"));
            if (!signTransaction) throw new Error("Wallet cannot sign");

            const signedTx = await signTransaction(tx);

            const res = await fetch(`/api/delegations?network=${network}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signedTransaction: signedTx.serialize().toString("base64"),
                }),
            });

            if (!res.ok) throw new Error("Failed to confirm transaction");
            const { success } = await res.json();
            if (!success) {
                throw new Error("Transaction confirmation failed");
            }

            await fetchTokens();
            setError(null);
            setRevoking(null);
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            setError("Failed to revoke delegation: " + error.message);
        } finally {
            setLoading(false);
            setRevoking(null);
        }
    };

    useEffect(() => {
        if (connected && publicKey) {
            fetchTokens();
        }
    }, [connected, publicKey, network]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#232526] to-[#414345] text-gray-100">
            <header className="relative z-10 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#232526] to-[#414345] rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Revoka
                                </h1>
                                <p className="text-sm text-gray-400">
                                    Token Delegation Manager
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <NetworkSelector
                                network={network}
                                setNetwork={setNetwork}
                            />
                            <WalletMultiButton className="!bg-gradient-to-r !from-[#232526] !to-[#414345] hover:!from-[#18181b] hover:!to-[#232526] !border-0 !rounded-lg !font-medium" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {!hydrated ? (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-gray-400">Loading...</p>
                    </div>
                ) : !connected ? (
                    <WelcomeSection />
                ) : (
                    <DashboardSection
                        publicKey={publicKey}
                        tokens={tokens}
                        revoking={revoking}
                        error={error}
                        loading={loading}
                        isInitialLoading={isInitialLoading}
                        isRefreshing={isRefreshing}
                        onRefresh={fetchTokens}
                        onRevoke={revokeDelegate}
                        onClearError={() => setError(null)}
                    />
                )}
            </main>
        </div>
    );
}

const WelcomeSection = () => (
    <div className="max-w-4xl mx-auto text-center py-20">
        <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">
                Secure Your Solana Tokens
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Revoka helps you manage and revoke token delegations on Solana.
                Keep your assets secure by monitoring and controlling who has
                access to your tokens.
            </p>
        </div>

        <Card className="max-w-md mx-auto bg-white/5 border-white/10">
            <CardHeader className="text-center">
                <Wallet className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <CardTitle className="text-white">
                    Connect Your Wallet
                </CardTitle>
                <CardDescription className="text-gray-400">
                    Connect your Solana wallet to view and manage token
                    delegations
                </CardDescription>
            </CardHeader>
        </Card>
    </div>
);

const NetworkSelector = ({
    network,
    setNetwork,
}: {
    network: WalletAdapterNetwork;
    setNetwork: (network: WalletAdapterNetwork) => void;
}) => (
    <div className="flex items-center gap-2">
        <Network className="w-4 h-4 text-gray-400" />
        <Select
            value={network}
            onValueChange={(value) => setNetwork(value as WalletAdapterNetwork)}
        >
            <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={WalletAdapterNetwork.Devnet}>
                    Devnet
                </SelectItem>
                <SelectItem value={WalletAdapterNetwork.Mainnet}>
                    Mainnet
                </SelectItem>
                <SelectItem value={WalletAdapterNetwork.Testnet}>
                    Testnet
                </SelectItem>
            </SelectContent>
        </Select>
    </div>
);
