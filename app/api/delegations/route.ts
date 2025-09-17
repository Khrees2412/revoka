import { NextRequest, NextResponse } from "next/server";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createRevokeInstruction } from "@solana/spl-token";
import { Token } from "@/lib/types";
import { IMetadata } from "@/lib/types";
import { Metaplex } from "@metaplex-foundation/js";

async function getTokenMetadata(
    mint: PublicKey
): Promise<IMetadata | undefined> {
    // Connect to the Solana mainnet-beta cluster
    const connection = new Connection("https://api.mainnet-beta.solana.com");

    // Initialize the Metaplex SDK
    const metaplex = Metaplex.make(connection);

    try {
        // Fetch the token metadata using the mint address
        const metadata = await metaplex.nfts().findByMint({
            mintAddress: mint,
        });

        // Log the retrieved metadata
        console.log("Token Name:", metadata.name);
        console.log("Token Symbol:", metadata.symbol);
        return { name: metadata.name, symbol: metadata.symbol };
    } catch (error) {
        console.error("Error fetching metadata:", error);
    }
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
        const delegatedTokenPromises = response.value
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
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "Failed to confirm transaction",
            error: error.message,
        });
    }
}
