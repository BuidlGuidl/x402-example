import { privateKeyToAccount } from "viem/accounts";
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import type { Account } from "viem";

/**
 * Response from an x402-protected endpoint
 */
export interface X402Response<T = any> {
  /** The response body (parsed as JSON) */
  data: T;
  /** Payment transaction details from the x402 protocol */
  payment: {
    /** Transaction hash of the payment */
    txHash?: string;
    /** Amount paid in wei */
    amount?: string;
    /** Payment recipient address */
    recipient?: string;
    /** Network/chain ID */
    chainId?: number;
    /** Raw payment response object */
    raw: any;
  };
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
}

/**
 * Options for making x402 requests
 */
export interface X402RequestOptions {
  /** HTTP method (GET, POST, etc.) */
  method?: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (will be JSON stringified if object) */
  body?: any;
  /** Whether to parse response as JSON (default: true) */
  parseJson?: boolean;
}

/**
 * X402Agent - A framework-agnostic tool for AI agents to interact with x402-protected endpoints
 *
 * This class provides a simple interface for making authenticated requests to endpoints
 * protected by the x402 micropayment protocol. It handles payment signing, transaction
 * submission, and response parsing automatically.
 *
 * @example
 * ```typescript
 * // Create agent with private key
 * const agent = new X402Agent("0x1234...");
 *
 * // Call a protected endpoint
 * const response = await agent.callBuilderEndpoint("http://localhost:3000/api/payment/builder");
 * console.log(response.data); // API response
 * console.log(response.payment); // Payment details
 * ```
 */
export class X402Agent {
  private account: Account;
  private fetchWithPayment: typeof fetch;

  /**
   * Creates a new X402Agent instance
   *
   * @param privateKey - The private key to use for signing payment transactions (must start with 0x)
   * @throws Error if private key is invalid
   */
  constructor(privateKey: string) {
    if (!privateKey.startsWith("0x")) {
      throw new Error("Private key must start with 0x");
    }

    this.account = privateKeyToAccount(privateKey as `0x${string}`);
    this.fetchWithPayment = wrapFetchWithPayment(fetch, this.account);
  }

  /**
   * Gets the Ethereum address associated with this agent
   */
  get address(): string {
    return this.account.address;
  }

  /**
   * Calls the /api/payment/builder endpoint (protected with $0.01 payment)
   *
   * This is a convenience method for the builder endpoint specifically.
   * For other endpoints, use `callEndpoint()` instead.
   *
   * @param baseUrl - The base URL of the application (e.g., "http://localhost:3000")
   * @returns Response with message and payment details
   *
   * @example
   * ```typescript
   * const response = await agent.callBuilderEndpoint("http://localhost:3000");
   * console.log(response.data.message); // "To get *this* response, you paid $0.01. Thanks :D"
   * console.log(response.payment.txHash); // Transaction hash
   * ```
   */
  async callBuilderEndpoint(baseUrl: string): Promise<X402Response<{ message: string }>> {
    const url = `${baseUrl}/api/payment/builder`;
    return this.callEndpoint(url, { method: "GET" });
  }

  /**
   * Calls any x402-protected endpoint
   *
   * This is the generic method for calling any endpoint protected by x402.
   * It handles payment signing, submission, and response parsing.
   *
   * @param url - The full URL of the protected endpoint
   * @param options - Request options (method, headers, body, etc.)
   * @returns Response with data and payment details
   * @throws Error if the request fails
   *
   * @example
   * ```typescript
   * // GET request
   * const response = await agent.callEndpoint("http://localhost:3000/api/payment/builder");
   *
   * // POST request with body
   * const chatResponse = await agent.callEndpoint("http://localhost:3000/api/payment/chat", {
   *   method: "POST",
   *   headers: { "Content-Type": "application/json" },
   *   body: { messages: [{ role: "user", content: "Hello!" }] }
   * });
   * ```
   */
  async callEndpoint<T = any>(url: string, options: X402RequestOptions = {}): Promise<X402Response<T>> {
    const { method = "GET", headers = {}, body, parseJson = true } = options;

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Add body if provided
    if (body) {
      if (typeof body === "object") {
        fetchOptions.body = JSON.stringify(body);
        // Ensure Content-Type is set for JSON bodies
        if (!fetchOptions.headers) {
          fetchOptions.headers = {};
        }
        (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
      } else {
        fetchOptions.body = body;
      }
    }

    try {
      // Make the x402-authenticated request
      const response = await this.fetchWithPayment(url, fetchOptions);

      // Parse response body
      const data = parseJson ? await response.json() : await response.text();

      // Decode payment response
      const paymentResponseHeader = response.headers.get("x-payment-response");
      const paymentResponse = paymentResponseHeader ? decodeXPaymentResponse(paymentResponseHeader) : null;

      return {
        data,
        payment: {
          txHash: paymentResponse?.txHash,
          amount: paymentResponse?.amount,
          recipient: paymentResponse?.recipient,
          chainId: paymentResponse?.chainId,
          raw: paymentResponse,
        },
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error: any) {
      // Enhance error with useful context
      const errorMessage = error.message || error.response?.data?.error || "Unknown error";
      throw new Error(`X402 request failed: ${errorMessage}`);
    }
  }

  /**
   * Logs a formatted response to the console
   *
   * This is a convenience method for displaying x402 responses in a readable format.
   * Useful for debugging and monitoring agent activity.
   *
   * @param response - The x402 response to log
   * @param customLabel - Optional custom label for the log output
   *
   * @example
   * ```typescript
   * const response = await agent.callBuilderEndpoint("http://localhost:3000");
   * agent.logResponse(response, "Builder Endpoint Response");
   * ```
   */
  logResponse(response: X402Response, customLabel?: string): void {
    console.log("\n" + "=".repeat(60));
    console.log(customLabel || "X402 Response");
    console.log("=".repeat(60));

    console.log("\n📦 Response Data:");
    console.log(JSON.stringify(response.data, null, 2));

    console.log("\n💳 Payment Details:");
    console.log(`  Transaction Hash: ${response.payment.txHash || "N/A"}`);
    console.log(`  Amount: ${response.payment.amount || "N/A"} wei`);
    console.log(`  Recipient: ${response.payment.recipient || "N/A"}`);
    console.log(`  Chain ID: ${response.payment.chainId || "N/A"}`);

    console.log("\n📡 HTTP Status:");
    console.log(`  ${response.status} ${response.statusText}`);

    console.log("\n" + "=".repeat(60) + "\n");
  }
}
