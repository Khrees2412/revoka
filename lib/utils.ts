"use client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
export const config = {
    rpcEndpoints: {
        mainnet: process.env.NEXT_PUBLIC_MAINNET_RPC!,
        devnet: process.env.NEXT_PUBLIC_DEVNET_RPC!,
        testnet: process.env.NEXT_PUBLIC_TESTNET_RPC!,
    },
    commitmentLevel: "confirmed" as const,
    analytics: {
        enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
    },
};
