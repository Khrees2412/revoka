import { NextRequest, NextResponse } from "next/server";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createRevokeInstruction } from "@solana/spl-token";
import { Token } from "@/lib/types";
import { IMetadata } from "@/lib/types";
import { Metaplex } from "@metaplex-foundation/js";

// Fast metadata fetching using Helius DAS API
async function getTokenMetadataHelius(
    mint: PublicKey
): Promise<IMetadata | undefined> {
    const heliusRpc = process.env.MAINNET_RPC;

    if (!heliusRpc) {
        console.warn("MAINNET_RPC not configured, skipping Helius metadata fetch");
        return undefined;
    }

    try {
        const response = await fetch(heliusRpc, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "1",
                method: "getAsset",
                params: {
                    id: mint.toString(),
                },
            }),
        });

        const data = await response.json();

        if (data.result?.content?.metadata) {
            const { name, symbol } = data.result.content.metadata;
            const image = data.result.content?.links?.image || data.result.content?.files?.[0]?.uri;

            return {
                name: name || "Unknown Token",
                symbol: symbol || "UNKNOWN",
                image: image || undefined
            };
        }

        // If no metadata found, return undefined
        return undefined;
    } catch (error) {
        console.error("Helius metadata fetch failed for", mint.toString(), ":", error);
        return undefined;
    }
}

// Fallback to Metaplex for metadata (slower but more reliable)
async function getTokenMetadataMetaplex(
    mint: PublicKey
): Promise<IMetadata | undefined> {
    const conn = process.env.MAINNET_RPC || "https://api.mainnet-beta.solana.com";
    const connection = new Connection(conn, "confirmed");
    const metaplex = Metaplex.make(connection);

    try {
        const metadata = await metaplex.nfts().findByMint({
            mintAddress: mint,
        });
        return { name: metadata.name, symbol: metadata.symbol };
    } catch (error) {
        console.error("Metaplex metadata fetch failed:", error);
        return undefined;
    }
}

// Main metadata function with Helius first, Metaplex fallback
async function getTokenMetadata(
    mint: PublicKey
): Promise<IMetadata | undefined> {
    // Try Helius first (fast)
    const heliusMetadata = await getTokenMetadataHelius(mint);
    if (heliusMetadata) {
        return heliusMetadata;
    }

    // Fallback to Metaplex (slower but comprehensive)
    return await getTokenMetadataMetaplex(mint);
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

        // Fetch both SPL Token and Token2022 accounts
        const [splTokenResponse, token2022Response] = await Promise.all([
            connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: TOKEN_PROGRAM_ID,
            }),
            connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: TOKEN_2022_PROGRAM_ID,
            }),
        ]);

        // Combine both token types
        const allTokenAccounts = [
            ...splTokenResponse.value,
            ...token2022Response.value,
        ];

        // Filter tokens with delegations
        const delegatedTokenPromises = allTokenAccounts
            .filter((account) => account.account.data.parsed.info.delegate)
            .map(async (account) => {
                const mintAddress = new PublicKey(
                    account.account.data.parsed.info.mint
                );
                const metadata = await getTokenMetadata(mintAddress);
                return {
                    mint: account.account.data.parsed.info.mint,
                    delegate: account.account.data.parsed.info.delegate,
                    amount:
                        account.account.data.parsed.info.delegatedAmount
                            ?.uiAmountString || "0",
                    tokenName: metadata?.name || "Unknown Token",
                    symbol: metadata?.symbol || "UNKNOWN",
                    image: metadata?.image,
                };
            });

        // Wait for all metadata fetches to complete
        const delegatedTokens: Token[] = await Promise.all(
            delegatedTokenPromises
        );

        return NextResponse.json({
            success: true,
            message: "Token delegations fetched successfully",
            delegatedTokens,
        });
    } catch (error: any) {
        console.error("Error in /api/delegations GET:", error);
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
        console.error("Error in /api/delegations POST:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to create revocation transaction",
            error: error.message,
        });
    }
}

// this confirms a revocation transaction
export async function PUT(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const network = searchParams.get("network");
    const { signedTransaction } = await req.json();

    if (!network || !signedTransaction) {
        return NextResponse.json({
            success: false,
            message:
                "one or both of required parameters (network, signedTransaction) are missing",
        });
    }

    const rpcUrl = getRPCUrl(network);
    const connection = new Connection(rpcUrl, "confirmed");
    try {
        const txBuffer = Buffer.from(signedTransaction, "base64");

        const transaction = Transaction.from(txBuffer);

        // Get fresh blockhash and update transaction
        const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;

        // Re-serialize with fresh blockhash (signatures are preserved)
        const updatedTxBuffer = transaction.serialize();

        const signature = await connection.sendRawTransaction(updatedTxBuffer);

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
            signature: signature,
        });
    } catch (error: any) {
        console.error("Error in /api/delegations PUT:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to confirm transaction",
            error: error.message,
        });
    }
}

// Bulk revoke all delegations
export async function PATCH(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const pk = searchParams.get("public_key");
    const network = searchParams.get("network");

    if (!pk || !network) {
        return NextResponse.json({
            success: false,
            message: "Missing required parameters (public_key, network)",
        });
    }

    const rpcUrl = getRPCUrl(network);
    const connection = new Connection(rpcUrl, "confirmed");
    const publicKey = new PublicKey(pk);

    try {
        // Fetch both SPL Token and Token2022 accounts
        const [splTokenResponse, token2022Response] = await Promise.all([
            connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: TOKEN_PROGRAM_ID,
            }),
            connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: TOKEN_2022_PROGRAM_ID,
            }),
        ]);

        // Combine and filter delegated tokens
        const allTokenAccounts = [
            ...splTokenResponse.value,
            ...token2022Response.value,
        ];

        const delegatedAccounts = allTokenAccounts.filter(
            (account) => account.account.data.parsed.info.delegate
        );

        if (delegatedAccounts.length === 0) {
            return NextResponse.json({
                success: false,
                message: "No delegations found to revoke",
            });
        }

        // Create a single transaction with multiple revoke instructions
        const transaction = new Transaction();

        for (const account of delegatedAccounts) {
            const programId = account.account.owner;
            transaction.add(
                createRevokeInstruction(
                    account.pubkey,
                    publicKey,
                    [],
                    programId
                )
            );
        }

        const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = publicKey;

        return NextResponse.json({
            success: true,
            message: `Bulk revocation transaction created for ${delegatedAccounts.length} tokens`,
            count: delegatedAccounts.length,
            transaction: transaction
                .serialize({ requireAllSignatures: false })
                .toString("base64"),
        });
    } catch (error: any) {
        console.error("Error in /api/delegations PATCH:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to create bulk revocation transaction",
            error: error.message,
        });
    }
}
