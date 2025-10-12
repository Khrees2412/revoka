// Mock all Solana dependencies BEFORE imports
jest.mock("@solana/web3.js", () => ({
    Connection: jest.fn(),
    PublicKey: jest.fn(),
    Transaction: jest.fn(),
}));

jest.mock("@solana/spl-token", () => ({
    TOKEN_PROGRAM_ID: {
        toString: () => "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        toBase58: () => "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        toBuffer: () => Buffer.from("mock"),
        toBytes: () => new Uint8Array(32),
        equals: jest.fn(),
    },
    TOKEN_2022_PROGRAM_ID: {
        toString: () => "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        toBase58: () => "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        toBuffer: () => Buffer.from("mock"),
        toBytes: () => new Uint8Array(32),
        equals: jest.fn(),
    },
    createRevokeInstruction: jest.fn(),
}));

jest.mock("@metaplex-foundation/js", () => ({
    Metaplex: jest.fn(),
}));

import { GET, POST, PUT } from "@/app/api/delegations/route";
import { NextRequest } from "next/server";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createRevokeInstruction } from "@solana/spl-token";

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
    process.env = { ...originalEnv };
});

afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
});

const MockedConnection = Connection as jest.MockedClass<typeof Connection>;
const MockedPublicKey = PublicKey as jest.MockedClass<typeof PublicKey>;
const MockedTransaction = Transaction as jest.MockedClass<typeof Transaction>;
const mockedCreateRevokeInstruction =
    createRevokeInstruction as jest.MockedFunction<
        typeof createRevokeInstruction
    >;

describe("/api/delegations", () => {
    let mockConnection: jest.Mocked<Connection>;

    const createGetRequest = (url: string) => {
        return new NextRequest(url);
    };

    const createPostPutRequest = (url: string, method: "POST" | "PUT", body?: object) => {
        return new NextRequest(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined,
        });
    };

    beforeEach(() => {
        mockConnection = {
            getParsedTokenAccountsByOwner: jest.fn(),
            getLatestBlockhash: jest.fn(),
            sendRawTransaction: jest.fn(),
            confirmTransaction: jest.fn(),
        } as any;

        MockedConnection.mockImplementation(() => mockConnection);

        // Mock PublicKey constructor
        MockedPublicKey.mockImplementation(
            (key: any) =>
                ({
                    toString: () =>
                        typeof key === "string" ? key : "mocked-key",
                    toBase58: () =>
                        typeof key === "string" ? key : "mocked-key",
                    equals: jest.fn(),
                    toBuffer: jest.fn(),
                    toBytes: jest.fn(),
                } as any)
        );

        // Mock Transaction
        const mockTransaction = {
            add: jest.fn().mockReturnThis(),
            serialize: jest
                .fn()
                .mockReturnValue(Buffer.from("mock-transaction")),
            recentBlockhash: undefined,
            lastValidBlockHeight: undefined,
            feePayer: undefined,
        } as any;
        MockedTransaction.mockImplementation(() => mockTransaction);
        MockedTransaction.from = jest.fn().mockReturnValue(mockTransaction);

        // Mock createRevokeInstruction
        mockedCreateRevokeInstruction.mockReturnValue({} as any);
    });

    describe("GET /api/delegations", () => {
        it("should return 400 when public_key is missing", async () => {
            const req = createGetRequest(
                "http://localhost:3000/api/delegations?network=devnet"
            );
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200); // NextResponse.json returns 200 by default
            expect(json.success).toBe(false);
            expect(json.message).toBe(
                "one or both of required parameters (public_key, network) are missing"
            );
        });

        it("should return 400 when network is missing", async () => {
            const req = createGetRequest(
                "http://localhost:3000/api/delegations?public_key=test-pk"
            );
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe(
                "one or both of required parameters (public_key, network) are missing"
            );
        });

        it("should return 400 when both parameters are missing", async () => {
            const req = createGetRequest(
                "http://localhost:3000/api/delegations"
            );
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe(
                "one or both of required parameters (public_key, network) are missing"
            );
        });

        it("should use custom mainnet RPC from environment variable", async () => {
            process.env.MAINNET_RPC = "https://custom-mainnet-rpc.com";
            mockConnection.getParsedTokenAccountsByOwner.mockResolvedValue({
                context: { slot: 123456 },
                value: [],
            });

            const req = createGetRequest(
                "http://localhost:3000/api/delegations?public_key=test-pk&network=mainnet-beta"
            );
            await GET(req);

            expect(MockedConnection).toHaveBeenCalledWith(
                "https://custom-mainnet-rpc.com",
                "confirmed"
            );
        });

        it.each([
            ["devnet", "https://api.devnet.solana.com"],
            ["testnet", "https://api.testnet.solana.com"],
            ["mainnet-beta", "https://api.mainnet-beta.solana.com"],
            ["unknown", "https://api.devnet.solana.com"],
        ])(
            "should use correct RPC URL for network: %s",
            async (network, expectedUrl) => {
                mockConnection.getParsedTokenAccountsByOwner.mockResolvedValue({
                    context: { slot: 123456 },
                    value: [],
                });

                const req = createGetRequest(
                    `http://localhost:3000/api/delegations?public_key=test-pk&network=${network}`
                );
                await GET(req);

                expect(MockedConnection).toHaveBeenCalledWith(
                    expectedUrl,
                    "confirmed"
                );
            }
        );

        it("should return empty array when no delegated tokens exist", async () => {
            mockConnection.getParsedTokenAccountsByOwner.mockResolvedValue({
                context: { slot: 123456 },
                value: [
                    {
                        pubkey: new PublicKey("token-account-key"),
                        account: {
                            data: {
                                parsed: {
                                    info: {
                                        mint: "mint-address",
                                        delegate: null, // No delegate
                                        delegatedAmount: null,
                                    },
                                },
                                program: "spl-token",
                                space: 165,
                            },
                            executable: false,
                            lamports: 2039280,
                            owner: new PublicKey(
                                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                            ),
                            rentEpoch: 361,
                        },
                    },
                ],
            });

            const req = createGetRequest(
                "http://localhost:3000/api/delegations?public_key=test-pk&network=devnet"
            );
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.delegatedTokens).toEqual([]);
        });

        it("should return delegated tokens with correct structure", async () => {
            mockConnection.getParsedTokenAccountsByOwner.mockResolvedValue({
                context: { slot: 123456 },
                value: [
                    {
                        pubkey: new PublicKey("token-account-1"),
                        account: {
                            data: {
                                parsed: {
                                    info: {
                                        mint: "mint-address-1",
                                        delegate: "delegate-address-1",
                                        delegatedAmount: {
                                            uiAmountString: "100.5",
                                        },
                                    },
                                },
                                program: "spl-token",
                                space: 165,
                            },
                            executable: false,
                            lamports: 2039280,
                            owner: new PublicKey(
                                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                            ),
                            rentEpoch: 361,
                        },
                    },
                    {
                        pubkey: new PublicKey("token-account-2"),
                        account: {
                            data: {
                                parsed: {
                                    info: {
                                        mint: "mint-address-2",
                                        delegate: "delegate-address-2",
                                        delegatedAmount: null, // No amount
                                    },
                                },
                                program: "spl-token",
                                space: 165,
                            },
                            executable: false,
                            lamports: 2039280,
                            owner: new PublicKey(
                                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                            ),
                            rentEpoch: 361,
                        },
                    },
                ],
            });

            const req = createGetRequest(
                "http://localhost:3000/api/delegations?public_key=test-pk&network=devnet"
            );
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.delegatedTokens).toHaveLength(2);
            expect(json.delegatedTokens[0]).toEqual({
                mint: "mint-address-1",
                delegate: "delegate-address-1",
                amount: "100.5",
                tokenName: "Unknown Token",
                symbol: "UNK",
            });
            expect(json.delegatedTokens[1]).toEqual({
                mint: "mint-address-2",
                delegate: "delegate-address-2",
                amount: "0",
                tokenName: "Unknown Token",
                symbol: "UNK",
            });
        });

        it("should handle connection errors gracefully", async () => {
            const errorMessage = "Connection failed";
            mockConnection.getParsedTokenAccountsByOwner.mockRejectedValue(
                new Error(errorMessage)
            );

            const req = createGetRequest(
                "http://localhost:3000/api/delegations?public_key=test-pk&network=devnet"
            );
            const response = await GET(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.error).toBe("Failed to fetch token delegations");
            expect(json.message).toBe(errorMessage);
        });
    });

    describe("POST /api/delegations", () => {
        it("should return 400 when public_key is missing", async () => {
            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations?network=devnet&mint=mint-address",
                "POST"
            );
            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe(
                "one or both of required parameters (public_key, network, mint) are missing"
            );
        });

        it("should return 400 when network is missing", async () => {
            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations?public_key=test-pk&mint=mint-address",
                "POST"
            );
            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe(
                "one or both of required parameters (public_key, network, mint) are missing"
            );
        });

        it("should return 400 when mint is missing", async () => {
            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations?public_key=test-pk&network=devnet",
                "POST"
            );
            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe(
                "one or both of required parameters (public_key, network, mint) are missing"
            );
        });

        it("should create revocation transaction successfully", async () => {
            const mockTokenAccount = {
                pubkey: new PublicKey("token-account-pubkey"),
                account: {
                    data: {
                        parsed: {
                            info: {
                                mint: "mint-address",
                                delegate: "delegate-address",
                            },
                        },
                        program: "spl-token",
                        space: 165,
                    },
                    executable: false,
                    lamports: 2039280,
                    owner: new PublicKey(
                        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                    ),
                    rentEpoch: 361,
                },
            };

            mockConnection.getParsedTokenAccountsByOwner.mockResolvedValue({
                context: { slot: 123456 },
                value: [mockTokenAccount],
            });
            mockConnection.getLatestBlockhash.mockResolvedValue({
                blockhash: "test-blockhash",
                lastValidBlockHeight: 12345,
            });

            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations?public_key=test-pk&network=devnet&mint=mint-address",
                "POST"
            );
            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.message).toBe(
                "Revocation transaction created successfully"
            );
            expect(json.transaction).toBeDefined();
            expect(typeof json.transaction).toBe("string");

            // Verify the transaction was built correctly
            expect(mockedCreateRevokeInstruction).toHaveBeenCalledWith(
                mockTokenAccount.pubkey,
                expect.any(Object), // PublicKey instance
                []
            );
        });

        it("should handle errors when creating revocation transaction", async () => {
            const errorMessage = "Token account not found";
            mockConnection.getParsedTokenAccountsByOwner.mockRejectedValue(
                new Error(errorMessage)
            );

            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations?public_key=test-pk&network=devnet&mint=mint-address",
                "POST"
            );
            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe(
                "Failed to create revocation transaction"
            );
            expect(json.error).toBe(errorMessage);
        });

        it("should handle case when no token accounts are found", async () => {
            mockConnection.getParsedTokenAccountsByOwner.mockResolvedValue({
                context: { slot: 123456 },
                value: [],
            });

            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations?public_key=test-pk&network=devnet&mint=mint-address",
                "POST"
            );
            const response = await POST(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe(
                "Failed to create revocation transaction"
            );
        });
    });

    describe("PUT /api/delegations", () => {
        it("should return 400 when network is missing", async () => {
            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations",
                "PUT",
                { signedTransaction: "base64-transaction" }
            );
            const response = await PUT(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe(
                "one or both of required parameters (network, signedTransaction) are missing"
            );
        });

        it("should return 400 when signedTransaction is missing", async () => {
            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations?network=devnet",
                "PUT",
                {}
            );
            const response = await PUT(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe(
                "one or both of required parameters (network, signedTransaction) are missing"
            );
        });

        it("should confirm transaction successfully", async () => {
            mockConnection.getLatestBlockhash.mockResolvedValue({
                blockhash: "fresh-blockhash",
                lastValidBlockHeight: 54321,
            });
            mockConnection.sendRawTransaction.mockResolvedValue(
                "transaction-signature"
            );
            mockConnection.confirmTransaction.mockResolvedValue({
                context: { slot: 123456 },
                value: { err: null },
            });

            const signedTransaction = Buffer.from(
                "mock-signed-transaction"
            ).toString("base64");

            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations?network=devnet",
                "PUT",
                { signedTransaction }
            );
            const response = await PUT(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.message).toBe("Transaction confirmed");

            // Verify the flow
            expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
            expect(mockConnection.sendRawTransaction).toHaveBeenCalled();
            expect(mockConnection.confirmTransaction).toHaveBeenCalledWith(
                {
                    signature: "transaction-signature",
                    blockhash: "fresh-blockhash",
                    lastValidBlockHeight: 54321,
                },
                "confirmed"
            );
        });

        it("should handle transaction sending errors", async () => {
            const errorMessage = "Transaction failed to send";
            mockConnection.getLatestBlockhash.mockResolvedValue({
                blockhash: "fresh-blockhash",
                lastValidBlockHeight: 54321,
            });
            mockConnection.sendRawTransaction.mockRejectedValue(
                new Error(errorMessage)
            );

            const signedTransaction = Buffer.from(
                "mock-signed-transaction"
            ).toString("base64");

            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations?network=devnet",
                "PUT",
                { signedTransaction }
            );
            const response = await PUT(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe("Failed to confirm transaction");
            expect(json.error).toBe(errorMessage);
        });

        it("should handle transaction confirmation errors", async () => {
            const errorMessage = "Transaction confirmation timeout";
            mockConnection.getLatestBlockhash.mockResolvedValue({
                blockhash: "fresh-blockhash",
                lastValidBlockHeight: 54321,
            });
            mockConnection.sendRawTransaction.mockResolvedValue(
                "transaction-signature"
            );
            mockConnection.confirmTransaction.mockRejectedValue(
                new Error(errorMessage)
            );

            const signedTransaction = Buffer.from(
                "mock-signed-transaction"
            ).toString("base64");

            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations?network=devnet",
                "PUT",
                { signedTransaction }
            );
            const response = await PUT(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe("Failed to confirm transaction");
            expect(json.error).toBe(errorMessage);
        });

        it("should handle invalid base64 transaction data", async () => {
            const invalidTransaction = "invalid-base64-data";

            const req = createPostPutRequest(
                "http://localhost:3000/api/delegations?network=devnet",
                "PUT",
                {
                    signedTransaction: invalidTransaction,
                }
            );
            const response = await PUT(req);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json.success).toBe(false);
            expect(json.message).toBe("Failed to confirm transaction");
            expect(json.error).toBeDefined();
        });
    });
});
