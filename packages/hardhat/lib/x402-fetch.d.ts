// Type declarations for x402-fetch
declare module "x402-fetch" {
  import type { Account } from "viem";

  /**
   * Wraps a fetch function with x402 payment functionality
   * @param fetchFn - The fetch function to wrap
   * @param account - The viem Account to use for signing payments
   * @returns A fetch function that automatically handles x402 payments
   */
  export function wrapFetchWithPayment(fetchFn: typeof fetch, account: Account): typeof fetch;

  /**
   * Decodes the x-payment-response header from an x402 response
   * @param header - The x-payment-response header value
   * @returns Decoded payment response object
   */
  export function decodeXPaymentResponse(header: string): {
    txHash?: string;
    amount?: string;
    recipient?: string;
    chainId?: number;
    [key: string]: any;
  };
}
