"use client";

import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#232526] to-[#414345] text-gray-100 flex flex-col items-center justify-center">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-white">404</h1>
                <p className="text-2xl md:text-3xl font-light text-gray-300 mb-8">
                    Sorry, the page you are looking for does not exist.
                </p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-gradient-to-r from-[#232526] to-[#414345] hover:from-[#18181b] hover:to-[#232526] text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    Go back to Home
                </Link>
            </div>
        </div>
    );
}
