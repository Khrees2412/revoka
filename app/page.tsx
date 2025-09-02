"use client";

import { useState, useEffect } from "react";
import { useNetworkStore } from "@/stores/useNetworkStore";
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
import { createRevokeInstruction } from "@solana/spl-token";
import DashboardSection from "./dashboard/page";
import { sign } from "crypto";

interface TokenDelegation {
    mint: string;
    delegate: string;
    amount: string;
    tokenName?: string;
    symbol?: string;
}

export default function Home() {
    const { network, setNetwork, connection } = useNetworkStore();
    const { publicKey, connected, signTransaction } = useWallet();
    const [tokens, setTokens] = useState<TokenDelegation[]>([]);
    const [loading, setLoading] = useState(false);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchTokens = async (showRefreshState = false) => {
        if (!publicKey || !connection) return;

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
                throw new Error("Failed to fetch tokens");
            }

            const { delegatedTokens } = await response.json();

            setTokens(delegatedTokens);
        } catch (error: any) {
            console.error("Error fetching tokens:", error);
        } finally {
            setIsInitialLoading(false);
            setIsRefreshing(false);
        }
    };

    const revokeDelegate = async (mint: string) => {
        setRevoking(mint);
        try {
            const response = await fetch(
                `/api/delegations?public_key=${publicKey}&network=${network}&mint=${mint}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch token account for revocation");
            }

            const { transaction } = await response.json();

            if (!transaction) {
                throw new Error("Failed to create revocation transaction");
            }
            const tx = Transaction.from(Buffer.from(transaction, "base64"));

            if (!signTransaction) {
                throw new Error("Wallet does not support transaction signing");
            }

            const signedTx = await signTransaction(tx);

            // Serialize signed transaction to base64
            const signature = signedTx.serialize().toString("base64");

            const res = await fetch(
                `/api/delegations?network=${network}&signature=${signature}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!res.ok) {
                throw new Error("Failed to confirm revocation transaction");
            }

            await fetchTokens(); // Refresh token list
        } catch (error: any) {
            setError("Failed to revoke delegation: " + error.message);
        } finally {
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
                {!connected ? (
                    <WelcomeSection />
                ) : (
                    <DashboardSection
                        publicKey={publicKey}
                        tokens={tokens}
                        loading={loading}
                        revoking={revoking}
                        error={error}
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
                <SelectItem value={WalletAdapterNetwork.Mainnet}>
                    Mainnet
                </SelectItem>
                <SelectItem value={WalletAdapterNetwork.Devnet}>
                    Devnet
                </SelectItem>
                <SelectItem value={WalletAdapterNetwork.Testnet}>
                    Testnet
                </SelectItem>
            </SelectContent>
        </Select>
    </div>
);
