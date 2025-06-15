export interface TokenInfo {
    mint: string;
    amount: string;
    decimals: number;
    delegate: string | null;
    delegatedAmount: string;
}

export interface TokenCardProps {
    token: TokenInfo;
    onRefresh: () => void;
}

export interface LoadingSpinnerProps {
    className?: string;
}

export interface TokenMetadata {
    name?: string;
    symbol?: string;
    image?: string;
}

export interface RevokeState {
    isRevoking: boolean;
    currentMint: string | null;
    error: string | null;
}
