import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { TokenInfo } from "@/lib/types";

export const useTokens = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTokens = useCallback(
        async (showRefreshState = false) => {
            if (!publicKey || !connection) return;

            if (showRefreshState) {
                setIsRefreshing(true);
            } else {
                setIsInitialLoading(true);
            }

            try {
                // ...existing code...
            } catch (err: any) {
                setError(`Failed to fetch tokens: ${err.message}`);
                console.error("Error fetching tokens:", err);
            } finally {
                setIsInitialLoading(false);
                setIsRefreshing(false);
            }
        },
        [connection, publicKey]
    );

    return {
        tokens,
        isInitialLoading,
        isRefreshing,
        error,
        fetchTokens,
    };
};
