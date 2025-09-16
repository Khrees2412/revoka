// app/dashboard/page.tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import DashboardSection from "@/components/dashboard/DashboardSection";
import { Token } from "@/lib/types";

export default function DashboardPage() {
    const { connected, publicKey } = useWallet();
    const [hydrated, setHydrated] = useState(false);
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    if (!hydrated) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-400">Loading...</p>
            </div>
        );
    }

    if (!connected || !publicKey) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-400">Please connect your wallet.</p>
            </div>
        );
    }

    return (
        <DashboardSection
            publicKey={publicKey}
            tokens={tokens}
            loading={loading}
            revoking={null}
            error={null}
            isInitialLoading={false}
            isRefreshing={false}
            onRefresh={() => {}}
            onRevoke={() => {}}
            onClearError={() => {}}
        />
    );
}
