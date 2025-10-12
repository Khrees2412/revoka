"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Wallet,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Loader2,
} from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import { Token } from "@/lib/types";

interface DashboardSectionProps {
    publicKey: PublicKey | null;
    tokens: Token[];
    loading: boolean;
    revoking: string | null;
    error: string | null;
    isInitialLoading: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
    onRevoke: (mint: string) => void;
    onRevokeAll?: () => void;
    onClearError: () => void;
}

const WalletCard = ({ publicKey }: { publicKey: PublicKey | null }) => (
    <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-6">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                    <p className="text-xs text-zinc-500 font-medium">Connected Wallet</p>
                    <p className="text-sm font-mono font-medium text-white truncate mt-0.5">
                        {publicKey
                            ? `${publicKey.toString().slice(0, 8)}...${publicKey
                                  .toString()
                                  .slice(-8)}`
                            : "Not Connected"}
                    </p>
                </div>
            </div>
        </CardContent>
    </Card>
);

const DelegationsCard = ({ tokens }: { tokens: Token[] }) => (
    <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-6">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                    <p className="text-xs text-zinc-500 font-medium">Active Delegations</p>
                    <p className="text-2xl font-semibold text-white mt-0.5">
                        {tokens.length}
                    </p>
                </div>
            </div>
        </CardContent>
    </Card>
);

const SecurityStatusCard = ({ tokens }: { tokens: Token[] }) => (
    <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-6">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                    <p className="text-xs text-zinc-500 font-medium">Security Status</p>
                    <p className="text-sm font-medium text-white mt-0.5">
                        {tokens.length === 0 ? "Secure" : "Review Needed"}
                    </p>
                </div>
            </div>
        </CardContent>
    </Card>
);

const DelegationItem = ({
    token,
    revoking,
    onRevoke,
}: {
    token: Token;
    revoking: string | null;
    onRevoke: (mint: string) => void;
}) => (
    <div className="p-6 bg-zinc-950 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-black font-bold text-lg">
                            {token.symbol?.charAt(0) || "T"}
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white text-lg mb-1">
                            {token.tokenName}
                        </h4>
                        <p className="text-sm text-zinc-500 font-mono">{token.symbol}</p>
                    </div>
                    <Badge
                        variant="outline"
                        className="border-zinc-700 text-zinc-400 text-xs hidden sm:inline-flex"
                    >
                        Delegated
                    </Badge>
                </div>
                <div className="space-y-3 text-sm pl-0 sm:pl-16">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className="text-zinc-500 font-medium min-w-[90px]">Delegate:</span>
                        <span className="text-white font-mono text-xs break-all sm:break-normal">
                            {token.delegate.slice(0, 12)}...{token.delegate.slice(-12)}
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className="text-zinc-500 font-medium min-w-[90px]">Amount:</span>
                        <span className="text-white font-semibold">
                            {token.amount} {token.symbol}
                        </span>
                    </div>
                </div>
            </div>
            <Button
                onClick={() => onRevoke(token.mint)}
                disabled={revoking === token.mint}
                variant="destructive"
                className="w-full sm:w-auto shrink-0"
                size="default"
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
);

const DashboardSection = ({
    publicKey,
    tokens,
    loading,
    revoking,
    error,
    isInitialLoading,
    isRefreshing,
    onRefresh,
    onRevoke,
    onRevokeAll,
    onClearError,
}: DashboardSectionProps) => (
    <div className="max-w-6xl mx-auto space-y-6">
        {error && (
            <Alert className="bg-red-950 border-red-900">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <AlertDescription className="text-red-400 flex items-center justify-between">
                    <span>{error}</span>
                    <Button
                        onClick={onClearError}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 h-auto p-1"
                    >
                        ×
                    </Button>
                </AlertDescription>
            </Alert>
        )}

        {(isInitialLoading || isRefreshing) && (
            <Alert className="bg-zinc-950 border-zinc-800">
                <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                <AlertDescription className="text-zinc-400 ml-2">
                    {isInitialLoading
                        ? "Loading delegations..."
                        : "Switching network..."}
                </AlertDescription>
            </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[88px]">
            <WalletCard publicKey={publicKey} />
            <DelegationsCard tokens={tokens} />
            <SecurityStatusCard tokens={tokens} />
        </div>

        <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="pb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <CardTitle className="text-white text-2xl font-semibold mb-2">
                            Token Delegations
                        </CardTitle>
                        <CardDescription className="text-zinc-400 font-light text-base">
                            Manage tokens where you've delegated authority to other parties
                        </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        {onRevokeAll && tokens.length > 1 && (
                            <Button
                                onClick={onRevokeAll}
                                disabled={loading || isRefreshing || isInitialLoading || !!revoking}
                                variant="destructive"
                                size="default"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                )}
                                Revoke All ({tokens.length})
                            </Button>
                        )}
                        <Button
                            onClick={onRefresh}
                            disabled={loading || isRefreshing || isInitialLoading}
                            variant="outline"
                            className="border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 hover:text-white"
                            size="default"
                        >
                            {loading || isRefreshing || isInitialLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                        Refresh
                    </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0 min-h-[200px]">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                        <span className="ml-3 text-zinc-500">
                            Loading delegations...
                        </span>
                    </div>
                ) : tokens.length === 0 ? (
                    <Alert className="bg-zinc-900 border-zinc-800">
                        <CheckCircle className="w-4 h-4 text-zinc-400" />
                        <AlertDescription className="text-zinc-400">
                            No active token delegations found. Your tokens are secure!
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        {tokens.map((token) => (
                            <DelegationItem
                                key={token.mint}
                                token={token}
                                revoking={revoking}
                                onRevoke={onRevoke}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
);

export default DashboardSection;
