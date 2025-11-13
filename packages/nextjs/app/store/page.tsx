"use client";

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { wrapFetchWithPayment } from "x402-fetch";

export default function StorePage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const handleDownload = async () => {
    if (!isConnected || !walletClient) {
      setError("Please connect your wallet to download");
      return;
    }

    setIsDownloading(true);
    setError(null);
    setSuccess(false);

    try {
      // Wrap fetch with x402 payment handling
      // Type assertion needed due to viem version differences between wagmi and x402-fetch
      const fetchWithPayment = wrapFetchWithPayment(
        fetch,
        walletClient as any,
        BigInt(0.05 * 10 ** 6), // Max 0.05 USDC
      );

      const response = await fetchWithPayment("/api/payment/store", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      // Get the file blob
      const blob = await response.blob();

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume-wind-alpha.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError(err instanceof Error ? err.message : "Failed to download file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="my-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h1 className="font-semibold text-3xl lg:text-4xl mb-12">x402 Store</h1>

        <div className="max-w-2xl">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl">Resume Template</h2>
              <p className="text-base-content/70 my-2">
                Professional resume template designed for modern job seekers. Clean, minimalist design that highlights
                your experience and skills.
              </p>

              <div className="text-sm text-base-content/60">
                <p>✓ Secure payment via x402 protocol</p>
                <p>✓ Instant download after payment confirmation</p>
                <p>✓ Payment processed on Base Sepolia network</p>
              </div>

              <div className="flex items-center gap-2 my-2">
                <span className="badge badge-primary badge-lg">ZIP File</span>
                <span className="badge badge-outline badge-lg">7.7 KB</span>
              </div>

              <div className="divider"></div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/60">Price</p>
                  <p className="text-2xl font-bold">$0.05 USDC</p>
                </div>

                <button
                  onClick={handleDownload}
                  disabled={isDownloading || !isConnected}
                  className="btn btn-primary btn-lg"
                >
                  {isDownloading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Now
                    </>
                  )}
                </button>
              </div>

              {!isConnected && (
                <div className="alert alert-warning mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>Connect your wallet to download this file</span>
                </div>
              )}

              {error && (
                <div className="alert alert-error mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Download started! Check your downloads folder.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
