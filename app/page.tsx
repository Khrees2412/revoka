"use client";

import { useState, useEffect } from "react";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { config } from "@/lib/utils";
import {
    Card,
    CardContent,
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

interface TokenDelegation {
    mint: string;
    delegate: string;
    amount: string;
    tokenName?: string;
    symbol?: string;
}

export default function Home() {
    const { network, setNetwork, connection } = useNetworkStore();
    const { publicKey, connected, sendTransaction } = useWallet();
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
            const response = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                {
                    programId: TOKEN_PROGRAM_ID,
                }
            );

            // Filter tokens with delegations
            const delegatedTokens = response.value
                .filter((account) => account.account.data.parsed.info.delegate)
                .map((account) => ({
                    mint: account.account.data.parsed.info.mint,
                    delegate: account.account.data.parsed.info.delegate,
                    amount:
                        account.account.data.parsed.info.delegatedAmount
                            ?.uiAmountString || "0",
                    tokenName: "Unknown Token",
                    symbol: "UNK",
                }));

            setTokens(delegatedTokens);
        } catch (error: any) {
            console.error("Error fetching tokens:", error);
        } finally {
            setIsInitialLoading(false);
            setIsRefreshing(false);
        }
    };

    const revokeDelegate = async (mint: string) => {
        if (!publicKey || !connection) return;

        setRevoking(mint);
        try {
            const tokenAccounts =
                await connection.getParsedTokenAccountsByOwner(publicKey, {
                    mint: new PublicKey(mint),
                });

            const tokenAccount = tokenAccounts.value[0];
            const transaction = new Transaction().add(
                createRevokeInstruction(tokenAccount.pubkey, publicKey, [])
            );

            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature);

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
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
                            <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-pink-600 hover:!from-purple-700 hover:!to-pink-700 !border-0 !rounded-lg !font-medium" />
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

        <Card className="max-w-md mx-auto bg-white/5 border-white/10 backdrop-blur-sm">
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
            <CardContent className="space-y-4">
                <WalletMultiButton className="!w-full !bg-gradient-to-r !from-purple-600 !to-pink-600 hover:!from-purple-700 hover:!to-pink-700 !border-0 !rounded-lg !font-medium !py-3" />
                <p className="text-xs text-gray-500 text-center">
                    Note: Demo data will be shown due to RPC rate limits. Use a
                    custom RPC for live data.
                </p>
            </CardContent>
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
            </SelectContent>
        </Select>
    </div>
);
