# AI Agent Integration with x402 Protected Endpoints

## Overview

This document explains how to create AI agents that can interact with x402-protected API endpoints. The x402 protocol enables micropayment-gated content, where each API request requires a small cryptocurrency payment.

## Background

### What is x402?

x402 is a protocol for micropayment-gated content on the web. In this codebase:

- **Protected endpoints** require payment before returning content
- **Middleware** (`packages/nextjs/middleware.ts`) handles payment validation
- **Client libraries** (`x402-fetch`) handle payment signing and submission

### Protected Endpoints in this Codebase

| Endpoint | Price | Method | Description |
|----------|-------|--------|-------------|
| `/api/payment/builder` | $0.01 | GET | Returns a protected message |
| `/api/payment/chat` | $0.01 | POST | AI chat with payment |
| `/api/payment/store` | $0.05 | GET | File download |
| `/payment/builder` | $0.01 | GET | Protected page |

## The Challenge

How can an AI agent autonomously access these protected endpoints?

**Requirements:**
1. Agent needs a funded wallet on the target network (e.g., Base Sepolia)
2. Agent must sign payment transactions before each request
3. Agent should handle payment responses and extract transaction details
4. Solution should be framework-agnostic (work with any AI agent system)

## The Solution: X402Agent Class

We created a standalone TypeScript class that wraps the x402 payment flow in a simple API.

### Architecture

```
AI Agent → X402Agent → x402-fetch → Protected Endpoint
                ↓
         viem Account
                ↓
         Sign Payment TX
```

### Files Created

#### 1. `packages/hardhat/lib/x402Agent.ts`

The core agent tool class with the following methods:

**Constructor:**
```typescript
constructor(privateKey: string)
```
Initializes agent with a private key for signing transactions.

**Methods:**
- `callBuilderEndpoint(baseUrl)` - Convenience method for `/api/payment/builder`
- `callEndpoint(url, options)` - Generic method for any protected endpoint
- `logResponse(response)` - Pretty-print response data
- `address` - Get the agent's Ethereum address

**Response Format:**
```typescript
interface X402Response<T> {
  data: T;                    // API response body
  payment: {                  // Payment transaction details
    txHash?: string;
    amount?: string;
    recipient?: string;
    chainId?: number;
    raw: any;
  };
  status: number;
  statusText: string;
}
```

#### 2. `packages/hardhat/scripts/agentExample.ts`

Complete working example showing:
- How to initialize the agent
- Making requests to protected endpoints
- Processing responses
- Error handling
- Integration patterns for popular frameworks

#### 3. `packages/hardhat/lib/x402-fetch.d.ts`

TypeScript type declarations for the `x402-fetch` library.

## Usage Examples

### Basic Usage

```typescript
import { X402Agent } from "./lib/x402Agent";

// Initialize agent
const agent = new X402Agent("0x1234..."); // Your private key

// Call protected endpoint
const response = await agent.callBuilderEndpoint("http://localhost:3000");

// Access response
console.log(response.data.message);
console.log(response.payment.txHash);

// Pretty print
agent.logResponse(response);
```

### Generic Endpoint Call

```typescript
// GET request
const response = await agent.callEndpoint("http://localhost:3000/api/payment/builder", {
  method: "GET"
});

// POST request with body
const chatResponse = await agent.callEndpoint("http://localhost:3000/api/payment/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: {
    messages: [
      { role: "user", content: "Hello!" }
    ]
  }
});
```

### Running the Example

```bash
# Run the complete example script
yarn agent:example

# You'll be prompted for your wallet password to decrypt the private key
```

## AI Agent Framework Integration Patterns

### Framework-Agnostic Tool

The X402Agent is designed to work with any AI agent framework:

```typescript
// Define as a tool/function for your agent
const x402Tool = {
  name: "call_protected_endpoint",
  description: "Call x402-protected API that requires micropayment",
  parameters: {
    url: "string",
    method: "string",
    body: "object"
  },
  execute: async (params) => {
    const agent = new X402Agent(process.env.AGENT_PRIVATE_KEY);
    return await agent.callEndpoint(params.url, params);
  }
};
```

### Claude/Anthropic MCP Server Pattern

```typescript
// Create MCP server tool
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { X402Agent } from "./lib/x402Agent";

const server = new Server({
  name: "x402-agent",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "call_x402_endpoint") {
    const agent = new X402Agent(process.env.AGENT_PRIVATE_KEY);
    const response = await agent.callEndpoint(
      request.params.arguments.url,
      request.params.arguments.options
    );
    return {
      content: [{
        type: "text",
        text: JSON.stringify(response)
      }]
    };
  }
});
```

### LangChain Integration

```typescript
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";
import { X402Agent } from "./lib/x402Agent";

const x402Tool = new DynamicStructuredTool({
  name: "x402_protected_endpoint",
  description: "Access x402-protected content with automatic payment",
  schema: z.object({
    url: z.string().describe("Protected endpoint URL"),
    method: z.string().optional().describe("HTTP method"),
    body: z.any().optional().describe("Request body"),
  }),
  func: async ({ url, method, body }) => {
    const agent = new X402Agent(process.env.AGENT_PRIVATE_KEY);
    const response = await agent.callEndpoint(url, { method, body });
    return JSON.stringify(response.data);
  },
});

// Use in agent
import { initializeAgentExecutorWithOptions } from "langchain/agents";

const executor = await initializeAgentExecutorWithOptions(
  [x402Tool],
  llm,
  { agentType: "openai-functions" }
);
```

### Custom Agent Loop

```typescript
async function autonomousAgent() {
  const agent = new X402Agent(process.env.AGENT_PRIVATE_KEY);

  const tasks = [
    { name: "Get builder content", url: "/api/payment/builder" },
    { name: "Chat with AI", url: "/api/payment/chat", method: "POST" },
  ];

  for (const task of tasks) {
    console.log(`Task: ${task.name}`);

    try {
      const response = await agent.callEndpoint(
        `http://localhost:3000${task.url}`,
        { method: task.method || "GET" }
      );

      console.log("Success:", response.data);
      console.log("Payment:", response.payment.txHash);

      // Agent decision making
      if (response.payment.txHash) {
        // Continue to next task
      } else {
        // Retry or alert
      }
    } catch (error) {
      console.error(`Failed: ${error.message}`);
      // Handle error
    }
  }
}
```

## Environment Setup

### Required Environment Variables

```bash
# .env file
DEPLOYER_PRIVATE_KEY_ENCRYPTED="..." # Encrypted wallet private key
NEXT_PUBLIC_FACILITATOR_URL="..."    # x402 facilitator endpoint
RESOURCE_WALLET_ADDRESS="..."        # Payment recipient
NETWORK="base-sepolia"                # Target network
```

### Wallet Requirements

1. **Create or import wallet:**
   ```bash
   yarn generate              # Create new wallet
   yarn account:import        # Import existing wallet
   ```

2. **Fund wallet:**
   - Get Base Sepolia testnet ETH from: https://faucet.circle.com/
   - Wallet needs enough ETH to pay for:
     - Gas fees (~$0.001 per transaction)
     - Content payments ($0.01-$0.05 per request)

3. **Check balance:**
   ```bash
   yarn account
   ```

## Security Considerations

### Private Key Management

**For development:**
- Use encrypted private key storage (current implementation)
- Password-protect key decryption
- Never commit unencrypted keys to git

**For production AI agents:**
- Use secure key management services (AWS KMS, HashiCorp Vault, etc.)
- Implement key rotation policies
- Use hardware security modules (HSM) for high-value operations
- Consider multi-signature wallets for large payments

### Payment Limits

Consider implementing:
- Maximum payment per request
- Daily spending limits
- Approval workflows for large amounts
- Transaction monitoring and alerts

Example implementation:
```typescript
class SafeX402Agent extends X402Agent {
  private dailySpent = 0;
  private readonly dailyLimit = 1000000; // 1M wei

  async callEndpoint(url: string, options: any) {
    const response = await super.callEndpoint(url, options);

    // Track spending
    const amount = parseInt(response.payment.amount || "0");
    this.dailySpent += amount;

    // Check limit
    if (this.dailySpent > this.dailyLimit) {
      throw new Error("Daily spending limit exceeded");
    }

    return response;
  }
}
```

## Testing

### Manual Testing

```bash
# Test the builder endpoint
yarn agent:example

# Test with existing scripts
yarn send402request  # Simple GET request
yarn send402chat     # Chat endpoint
```

### Expected Output

```
🤖 AI Agent X402 Example
============================================================

🔐 Loading agent credentials...
✅ Credentials loaded successfully
📍 Agent address: 0x1234...

🎯 Agent Task: Retrieve protected content from builder endpoint
📡 Target: http://localhost:3000/api/payment/builder

⏳ Making x402-authenticated request...

============================================================
Builder Endpoint Response
============================================================

📦 Response Data:
{
  "message": "To get *this* response, you paid $0.01. Thanks :D"
}

💳 Payment Details:
  Transaction Hash: 0xabc...
  Amount: 10000000000000 wei
  Recipient: 0x5678...
  Chain ID: 84532

📡 HTTP Status:
  200 OK

============================================================
```

## Troubleshooting

### Common Issues

**Error: "Failed to decrypt private key"**
- Check password is correct
- Verify `DEPLOYER_PRIVATE_KEY_ENCRYPTED` exists in .env

**Error: "Insufficient funds"**
- Fund wallet with testnet ETH
- Check balance: `yarn account`

**Error: "X402 request failed"**
- Ensure Next.js dev server is running: `yarn start`
- Check middleware is configured correctly
- Verify network matches (baseSepolia)

**TypeScript errors**
- Run `yarn check-types` to verify
- Ensure `x402-fetch.d.ts` declarations are present

## API Reference

### X402Agent Class

#### Constructor

```typescript
new X402Agent(privateKey: string)
```

**Parameters:**
- `privateKey` - Ethereum private key (must start with `0x`)

**Throws:**
- Error if private key format is invalid

#### Properties

```typescript
agent.address: string
```
Returns the Ethereum address associated with the agent's private key.

#### Methods

##### callBuilderEndpoint

```typescript
async callBuilderEndpoint(baseUrl: string): Promise<X402Response<{ message: string }>>
```

Convenience method for calling `/api/payment/builder` endpoint.

**Parameters:**
- `baseUrl` - Base URL of the application (e.g., "http://localhost:3000")

**Returns:** Response with message and payment details

**Example:**
```typescript
const response = await agent.callBuilderEndpoint("http://localhost:3000");
console.log(response.data.message);
```

##### callEndpoint

```typescript
async callEndpoint<T = any>(
  url: string,
  options?: X402RequestOptions
): Promise<X402Response<T>>
```

Generic method for calling any x402-protected endpoint.

**Parameters:**
- `url` - Full URL of protected endpoint
- `options` - Request configuration:
  - `method` - HTTP method (GET, POST, etc.)
  - `headers` - Request headers
  - `body` - Request body (auto-stringified if object)
  - `parseJson` - Parse response as JSON (default: true)

**Returns:** Response with data and payment details

**Throws:** Error if request fails

**Example:**
```typescript
const response = await agent.callEndpoint("http://localhost:3000/api/payment/chat", {
  method: "POST",
  body: { messages: [{ role: "user", content: "Hello" }] }
});
```

##### logResponse

```typescript
logResponse(response: X402Response, customLabel?: string): void
```

Logs formatted response to console.

**Parameters:**
- `response` - The x402 response to log
- `customLabel` - Optional custom label for output

**Example:**
```typescript
agent.logResponse(response, "Chat Response");
```

### Types

#### X402Response<T>

```typescript
interface X402Response<T = any> {
  data: T;                    // Response body (parsed)
  payment: {                  // Payment details
    txHash?: string;          // Transaction hash
    amount?: string;          // Amount in wei
    recipient?: string;       // Recipient address
    chainId?: number;         // Chain ID
    raw: any;                 // Raw payment response
  };
  status: number;             // HTTP status code
  statusText: string;         // HTTP status text
}
```

#### X402RequestOptions

```typescript
interface X402RequestOptions {
  method?: string;                    // HTTP method
  headers?: Record<string, string>;   // Request headers
  body?: any;                         // Request body
  parseJson?: boolean;                // Parse as JSON (default: true)
}
```

## Additional Resources

### Related Files

- **Middleware config:** `packages/nextjs/middleware.ts`
- **Test scripts:** `packages/hardhat/scripts/send402*.ts`
- **Example endpoints:** `packages/nextjs/app/api/payment/*/route.ts`

### External Documentation

- [x402 Protocol](https://docs.x402.org/) - Protocol documentation
- [Base Sepolia Faucet](https://faucet.circle.com/) - Get testnet ETH
- [viem Documentation](https://viem.sh/) - Ethereum library used for accounts

## Summary

This x402 agent integration provides a clean, framework-agnostic way for AI agents to interact with micropayment-protected APIs. Key benefits:

✅ Simple API - Just 3 main methods
✅ Type-safe - Full TypeScript support
✅ Framework-agnostic - Works with any agent system
✅ Production-ready - Error handling, logging, structured responses
✅ Extensible - Easy to add payment limits, monitoring, etc.

The agent handles all payment complexity internally, allowing AI systems to focus on their core logic while seamlessly accessing protected content.
