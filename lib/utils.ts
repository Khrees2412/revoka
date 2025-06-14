import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// lib/config.ts
export const config = {
    rpcEndpoints: {
        mainnet:
            process.env.MAINNET_RPC || "https://api.mainnet-beta.solana.com",
        devnet: process.env.DEVNET_RPC || "https://api.devnet.solana.com",
    },
    commitmentLevel: "confirmed" as const,
    analytics: {
        enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
    },
};
