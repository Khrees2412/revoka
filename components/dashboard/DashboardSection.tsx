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
    <div className="p-5 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-black font-semibold text-sm">
                            {token.symbol?.charAt(0) || "T"}
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white text-base">
                            {token.tokenName}
                        </h4>
                        <p className="text-sm text-zinc-500 font-mono">{token.symbol}</p>
                    </div>
                    <Badge
                        variant="outline"
                        className="border-zinc-700 text-zinc-400 text-xs"
                    >
                        Delegated
                    </Badge>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-medium min-w-[70px]">Delegate:</span>
                        <span className="text-white font-mono text-xs">
                            {token.delegate.slice(0, 8)}...
                            {token.delegate.slice(-8)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-medium min-w-[70px]">Amount:</span>
                        <span className="text-white font-medium">
                            {token.amount} {token.symbol}
                        </span>
                    </div>
                </div>
            </div>
            <Button
                onClick={() => onRevoke(token.mint)}
                disabled={revoking === token.mint}
                variant="destructive"
                className="ml-4 shrink-0"
                size="sm"
            >
                {revoking === token.mint ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
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
                        ? "Initializing network..."
                        : "Switching network..."}
                </AlertDescription>
            </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WalletCard publicKey={publicKey} />
            <DelegationsCard tokens={tokens} />
            <SecurityStatusCard tokens={tokens} />
        </div>

        <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-white text-xl font-semibold">
                            Token Delegations
                        </CardTitle>
                        <CardDescription className="text-zinc-400 font-light">
                            Manage tokens where you've delegated authority to other parties
                        </CardDescription>
                    </div>
                    <Button
                        onClick={onRefresh}
                        disabled={loading || isRefreshing || isInitialLoading}
                        variant="outline"
                        className="border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                        size="sm"
                    >
                        {loading || isRefreshing || isInitialLoading ? (
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
                    <div className="flex items-center justify-center py-16">
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
                    <div className="space-y-3">
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
