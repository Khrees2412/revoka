import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Wallet,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";
import { PublicKey } from "@solana/web3.js";

interface TokenDelegation {
    mint: string;
    delegate: string;
    amount: string;
    tokenName?: string;
    symbol?: string;
}

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

export default DashboardSection;
