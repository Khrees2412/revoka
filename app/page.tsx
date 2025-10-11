// app/page.tsx
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
import { Shield, Wallet, Network, CheckCircle } from "lucide-react";
import { Transaction } from "@solana/web3.js";
import DashboardSection from "@/components/dashboard/DashboardSection"; // ✅ fixed
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

    useEffect(() => {
        setHydrated(true);
    }, []);

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
        <div className="min-h-screen bg-black text-white">
            <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white">
                                <Shield className="h-5 w-5 text-black" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight">
                                    Revoka
                                </h1>
                                <p className="text-[10px] text-zinc-500 -mt-0.5">
                                    by debyth
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <NetworkSelector
                                network={network}
                                setNetwork={setNetwork}
                            />
                            <WalletMultiButton className="!bg-white hover:!bg-zinc-100 !text-black !border-0 !rounded-md !font-medium !text-sm !transition-colors" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {!hydrated ? (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-zinc-500">Loading...</p>
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
    <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-20 pt-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-white mb-6">
                <Shield className="h-8 w-8 text-black" />
            </div>
            <h2 className="text-6xl font-bold tracking-tight mb-6 leading-[1.05]">
                Clean Up Your
                <br />
                Token Approvals
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light">
                Managing token delegations on Solana shouldn't be complicated.
                View all your active approvals and revoke the ones you don't need anymore—simple as that.
            </p>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
            <FeatureCard
                icon={<Wallet className="h-6 w-6" />}
                title="1. Connect Your Wallet"
                description="Securely connect your Solana wallet. We never ask for your private keys or seed phrase."
            />
            <FeatureCard
                icon={<Shield className="h-6 w-6" />}
                title="2. Review Delegations"
                description="See all active token approvals with full transparency on which programs can spend your tokens."
            />
            <FeatureCard
                icon={<Network className="h-6 w-6" />}
                title="3. Revoke Safely"
                description="Remove any approval with one click. Each revocation is a simple on-chain transaction you control."
            />
        </div>

        {/* Best Practices */}
        <div className="mb-20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold mb-8 text-center">Security Best Practices</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-950">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                        <CheckCircle className="h-5 w-5 text-zinc-400" />
                    </div>
                    <h4 className="font-semibold mb-2">Audit Regularly</h4>
                    <p className="text-sm text-zinc-400 font-light leading-relaxed">
                        Check your active delegations monthly. Revoke approvals for services you no longer use.
                    </p>
                </div>
                <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-950">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                        <CheckCircle className="h-5 w-5 text-zinc-400" />
                    </div>
                    <h4 className="font-semibold mb-2">Trust but Verify</h4>
                    <p className="text-sm text-zinc-400 font-light leading-relaxed">
                        Only approve tokens for protocols you trust. Always verify contract addresses before approving.
                    </p>
                </div>
                <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-950">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                        <CheckCircle className="h-5 w-5 text-zinc-400" />
                    </div>
                    <h4 className="font-semibold mb-2">Revoke After Use</h4>
                    <p className="text-sm text-zinc-400 font-light leading-relaxed">
                        Finished with a DeFi protocol? Revoke its access immediately to minimize your attack surface.
                    </p>
                </div>
                <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-950">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                        <CheckCircle className="h-5 w-5 text-zinc-400" />
                    </div>
                    <h4 className="font-semibold mb-2">Stay Informed</h4>
                    <p className="text-sm text-zinc-400 font-light leading-relaxed">
                        Follow protocol updates and security advisories. Act quickly if a service you've approved is compromised.
                    </p>
                </div>
            </div>
        </div>

        {/* CTA */}
        <div className="max-w-2xl mx-auto text-center py-12 px-8 border border-zinc-800 rounded-xl bg-zinc-950 mb-12">
            <Wallet className="h-12 w-12 mx-auto mb-6 text-zinc-400" />
            <h3 className="text-3xl font-semibold mb-4">
                Ready to Secure Your Tokens?
            </h3>
            <p className="text-zinc-400 mb-8 font-light leading-relaxed">
                Connect your Solana wallet to see all active token delegations.
                Free to use, no registration required.
            </p>
            <WalletMultiButton className="!bg-white hover:!bg-zinc-100 !text-black !border-0 !rounded-md !font-medium !transition-colors !text-base !px-8 !py-6" />
            <p className="text-xs text-zinc-600 mt-6">
                Your wallet, your control. We never store your private keys.
            </p>
        </div>

        {/* About / Creator Pitch */}
        <div className="max-w-3xl mx-auto mb-12">
            <div className="border border-zinc-800 rounded-xl p-8 bg-zinc-950">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-1">
                        <Shield className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-3">Built by Debyth</h3>
                        <p className="text-zinc-400 leading-relaxed font-light mb-4">
                            At <a href="https://debyth.com" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Debyth</a>,
                            we're building automated payment infrastructure for Solana—think recurring payments
                            and direct debits with stablecoins. These features rely on token delegations to work seamlessly.
                        </p>
                        <p className="text-zinc-400 leading-relaxed font-light mb-4">
                            While building Debyth, we realized users needed an easy way to monitor and manage
                            these approvals. Revoka solves that. Whether you're using automated payments, DeFi protocols,
                            or any dApp that requires token approvals, Revoka gives you full visibility and control.
                        </p>
                        <p className="text-zinc-400 leading-relaxed font-light mb-4">
                            No more digging through blockchain explorers or running CLI commands. Just connect your wallet,
                            see your active delegations, and revoke the ones you don't need anymore.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="https://debyth.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-sm text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
                            >
                                Learn more about Debyth →
                            </a>
                            <a
                                href="https://twitter.com/debyth_hq"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-sm text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
                            >
                                Follow on Twitter →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <Card className="bg-zinc-950 border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
        <div className="mb-4 flex justify-start text-white">
            {icon}
        </div>
        <CardTitle className="text-white text-lg font-semibold mb-2 text-left">
            {title}
        </CardTitle>
        <CardDescription className="text-zinc-400 text-sm text-left font-light leading-relaxed">
            {description}
        </CardDescription>
    </Card>
);

const NetworkSelector = ({
    network,
    setNetwork,
}: {
    network: WalletAdapterNetwork;
    setNetwork: (network: WalletAdapterNetwork) => void;
}) => (
    <div className="flex items-center gap-2">
        <Select
            value={network}
            onValueChange={(value) => setNetwork(value as WalletAdapterNetwork)}
        >
            <SelectTrigger className="w-32 bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 transition-colors">
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
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
