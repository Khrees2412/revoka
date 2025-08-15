import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//     const rpcUrl = process.env.MAINNET_RPC;

//     if (!rpcUrl) {
//         return NextResponse.json(
//             { error: "RPC URL not configured" },
//             { status: 500 }
//         );
//     }
//     return NextResponse.json({ rpcUrl });
// }

export async function POST(request: Request) {
    const rpcUrl = process.env.MAINNET_RPC;

    if (!rpcUrl) {
        return NextResponse.json(
            { error: "RPC URL not configured" },
            { status: 500 }
        );
    }
    return NextResponse.json({ rpcUrl });
}

// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//     const body = await req.text(); // must be raw text, not JSON!

//     // Forward all headers except host
//     const headers = new Headers();
//     headers.set("Content-Type", "application/json");

//     // Forward the request to your Cloudflare Worker or actual node
//     const response = await fetch("https://rpc-proxy.khrees.workers.dev", {
//         method: "POST",
//         headers,
//         body,
//     });

//     const data = await response.text();

//     // Return the raw JSON-RPC response
//     return new NextResponse(data, {
//         status: response.status,
//         headers: { "Content-Type": "application/json" },
//     });
// }
