"use client";

import { useState, useEffect } from "react";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Loader2,
    Shield,
    Wallet,
    Network,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";
import { Transaction } from "@solana/web3.js";
import { createRevokeInstruction } from "@solana/spl-token";

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

const DashboardSection = ({
    publicKey,
    tokens,
    loading,
    revoking,
    error,
    onRefresh,
    onRevoke,
    onClearError,
}: {
    publicKey: PublicKey | null;
    tokens: TokenDelegation[];
    loading: boolean;
    revoking: string | null;
    error: string | null;
    onRefresh: () => void;
    onRevoke: (mint: string) => void;
    onClearError: () => void;
}) => (
    <div className="max-w-6xl mx-auto space-y-6">
        {/* Error Alert */}
        {error && (
            <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400 flex items-center justify-between">
                    <span>{error}</span>
                    <Button
                        onClick={onClearError}
                        variant="ghost"
                        size="sm"
                        className="text-yellow-400 hover:text-yellow-300 h-auto p-1"
                    >
                        ×
                    </Button>
                </AlertDescription>
            </Alert>
        )}

        {/* Rest of the component remains the same */}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">
                                Connected Wallet
                            </p>
                            <p className="text-lg font-semibold text-white truncate">
                                {publicKey?.toString().slice(0, 8)}...
                                {publicKey?.toString().slice(-8)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">
                                Active Delegations
                            </p>
                            <p className="text-2xl font-bold text-white">
                                {tokens.length}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">
                                Security Status
                            </p>
                            <p className="text-lg font-semibold text-green-400">
                                {tokens.length === 0
                                    ? "Secure"
                                    : "Review Needed"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Token Delegations */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-white">
                            Token Delegations
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Manage tokens where you've delegated authority to
                            other parties
                            {error && (
                                <span className="block text-yellow-400 text-sm mt-1">
                                    Currently showing demo data
                                </span>
                            )}
                        </CardDescription>
                    </div>
                    <Button
                        onClick={onRefresh}
                        disabled={loading}
                        variant="outline"
                        className="border-white/20 hover:bg-white/10"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                        <span className="ml-3 text-gray-400">
                            Loading delegations...
                        </span>
                    </div>
                ) : tokens.length === 0 ? (
                    <Alert className="bg-green-500/10 border-green-500/20">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <AlertDescription className="text-green-400">
                            No active token delegations found. Your tokens are
                            secure!
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        {tokens.map((token, index) => (
                            <div
                                key={token.mint}
                                className="p-4 bg-white/5 rounded-lg border border-white/10"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">
                                                    {token.symbol?.charAt(0) ||
                                                        "T"}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-white">
                                                    {token.tokenName}
                                                </h4>
                                                <p className="text-sm text-gray-400">
                                                    {token.symbol}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="border-orange-500/50 text-orange-400"
                                            >
                                                Delegated
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-400">
                                                    Delegate:{" "}
                                                </span>
                                                <span className="text-white font-mono">
                                                    {token.delegate.slice(0, 8)}
                                                    ...
                                                    {token.delegate.slice(-8)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">
                                                    Amount:{" "}
                                                </span>
                                                <span className="text-white">
                                                    {token.amount}{" "}
                                                    {token.symbol}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => onRevoke(token.mint)}
                                        disabled={revoking === token.mint}
                                        variant="destructive"
                                        className="ml-4"
                                    >
                                        {revoking === token.mint ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Revoking...
                                            </>
                                        ) : (
                                            "Revoke"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
