import type { Metadata } from "next";
import { WalletProvider } from "@/components/provider/solana";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const url = process.env.NEXT_PUBLIC_HOME_URL || "";

export const metadata: Metadata = {
    title: "Revoka - Solana Token Delegation Manager",
    description:
        "Secure your Solana tokens by managing and revoking token delegations",
    metadataBase: new URL(url),
    openGraph: {
        title: "Revoka - Token Security",
        description: "Manage your Solana token delegations securely",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Revoka",
        description: "Secure token delegation management",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <WalletProvider>{children}</WalletProvider>
            </body>
        </html>
    );
}
