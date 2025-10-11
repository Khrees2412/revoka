"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function CustomWalletButton() {
    const { publicKey, disconnect, connected } = useWallet();
    const { setVisible } = useWalletModal();

    if (connected && publicKey) {
        return (
            <Button
                onClick={disconnect}
                variant="outline"
                className="border-zinc-800 hover:bg-zinc-900"
            >
                <Wallet className="w-4 h-4 mr-2" />
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </Button>
        );
    }

    return (
        <Button
            onClick={() => setVisible(true)}
            className="bg-white hover:bg-zinc-100 text-black"
        >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
        </Button>
    );
}
