import { NextRequest, NextResponse } from "next/server";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createRevokeInstruction } from "@solana/spl-token";

interface TokenDelegation {
    mint: string;
    delegate: string;
    amount: string;
    tokenName?: string;
    symbol?: string;
}

const getRPCUrl = (network: string): string => {
    switch (network) {
        case "devnet":
            return "https://api.devnet.solana.com";
        case "testnet":
            return "https://api.testnet.solana.com";
        case "mainnet-beta":
            return (
                process.env.MAINNET_RPC || "https://api.mainnet-beta.solana.com"
            );
        default:
            return "https://api.devnet.solana.com";
    }
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const pk = searchParams.get("public_key");
        const network = searchParams.get("network");

        if (!pk || !network) {
            return NextResponse.json({
                success: false,
                message:
                    "one or both of required parameters (public_key, network) are missing",
            });
        }
        const rpcUrl = getRPCUrl(network);
        const connection = new Connection(rpcUrl, "confirmed");
        const publicKey = new PublicKey(pk);

        const response = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            {
                programId: TOKEN_PROGRAM_ID,
            }
        );

        // Filter tokens with delegations
        const delegatedTokens: TokenDelegation[] = response.value
            .filter((account) => account.account.data.parsed.info.delegate)
            .map((account) => ({
                mint: account.account.data.parsed.info.mint,
                delegate: account.account.data.parsed.info.delegate,
                amount:
                    account.account.data.parsed.info.delegatedAmount
                        ?.uiAmountString || "0",
                tokenName: "Unknown Token",
                symbol: "UNK",
            }));

        return NextResponse.json({
            success: true,
            message: "Token delegations fetched successfully",
            delegatedTokens,
        });
    } catch (error: any) {
        console.error("Error in /api/delegations:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch token delegations",
            message: error.message,
        });
    }
}

// use this to revoke a delegation or all delegations for a given public key
export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const pk = searchParams.get("public_key");
    const network = searchParams.get("network");
    const mint = searchParams.get("mint");

    if (!pk || !network || !mint) {
        return NextResponse.json({
            success: false,
            message:
                "one or both of required parameters (public_key, network, mint) are missing",
        });
    }

    const rpcUrl = getRPCUrl(network);
    const connection = new Connection(rpcUrl, "confirmed");
    const publicKey = new PublicKey(pk);
    try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            {
                mint: new PublicKey(mint),
            }
        );

        const tokenAccount = tokenAccounts.value[0];
        const transaction = new Transaction().add(
            createRevokeInstruction(tokenAccount.pubkey, publicKey, [])
        );

        const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = publicKey;

        return NextResponse.json({
            success: true,
            message: "Revocation transaction created successfully",
            transaction: transaction
                .serialize({ requireAllSignatures: false })
                .toString("base64"),
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Failed to create revocation transaction",
            error: error.message,
        });
    }
}

// this confirms a revocation transaction
export async function PATCH(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const network = searchParams.get("network");
    const signature = searchParams.get("signature");

    if (!network || !signature) {
        return NextResponse.json({
            success: false,
            message:
                "one or both of required parameters (network, signature) are missing",
        });
    }

    const rpcUrl = getRPCUrl(network);
    const connection = new Connection(rpcUrl, "confirmed");
    try {
        const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash();

        await connection.confirmTransaction(
            {
                signature,
                blockhash,
                lastValidBlockHeight,
            },
            "confirmed"
        );
        return NextResponse.json({
            success: true,
            message: "Transaction confirmed",
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Failed to confirm transaction",
            error: error.message,
        });
    }
}
