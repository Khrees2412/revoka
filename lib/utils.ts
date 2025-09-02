"use client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const config = {
    analytics: {
        enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
    },
};
