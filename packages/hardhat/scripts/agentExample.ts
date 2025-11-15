import * as dotenv from "dotenv";
dotenv.config();
import { X402Agent } from "../lib/x402Agent";
import { getDecryptedPK } from "./getDecryptedPK";

/**
 * Example: How an AI Agent Uses X402Agent
 *
 * This script demonstrates how an AI agent would use the X402Agent class
 * to interact with x402-protected endpoints. The pattern shown here can be
 * adapted to any AI agent framework.
 *
 * Usage:
 *   yarn agent:example
 *
 * The script shows:
 * 1. Initializing the agent with a private key
 * 2. Making requests to protected endpoints
 * 3. Handling responses and payment details
 * 4. Error handling patterns
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  console.log("🤖 AI Agent X402 Example");
  console.log("=" + "=".repeat(59) + "\n");

  // Step 1: Get the private key (in production, this would come from secure storage)
  console.log("🔐 Loading agent credentials...");
  const privateKey = await getDecryptedPK();

  if (!privateKey) {
    console.log("❌ Failed to load private key. Exiting.");
    return;
  }

  // Step 2: Initialize the X402Agent
  console.log("✅ Credentials loaded successfully");
  const agent = new X402Agent(privateKey);
  console.log(`📍 Agent address: ${agent.address}\n`);

  // Step 3: Use the agent to call protected endpoints
  console.log("🎯 Agent Task: Retrieve protected content from builder endpoint");
  console.log(`📡 Target: ${BASE_URL}/api/payment/builder\n`);

  try {
    // Example 1: Call the builder endpoint (convenience method)
    console.log("⏳ Making x402-authenticated request...");
    const response = await agent.callBuilderEndpoint(BASE_URL);

    // Log the response in a formatted way
    agent.logResponse(response, "Builder Endpoint Response");

    // Example 2: Access response data programmatically
    console.log("🔍 Agent Processing Response:");
    console.log(`  Message received: "${response.data.message}"`);
    console.log(`  Payment confirmed: ${response.payment.txHash ? "✅" : "❌"}`);

    if (response.payment.txHash) {
      console.log(`  Transaction: ${response.payment.txHash}`);
    }

    // Example 3: Call any endpoint using the generic method
    console.log("\n" + "─".repeat(60));
    console.log("\n🎯 Advanced: Calling endpoint with generic method");

    const genericResponse = await agent.callEndpoint(`${BASE_URL}/api/payment/builder`, {
      method: "GET",
    });

    console.log("\n✅ Generic method successful!");
    console.log(`   Response: ${JSON.stringify(genericResponse.data)}`);

    // Example 4: How an agent might make decisions based on response
    console.log("\n" + "─".repeat(60));
    console.log("\n🧠 Agent Decision Making:");

    if (response.data.message.includes("$0.01")) {
      console.log("   ✓ Detected payment confirmation in response");
      console.log("   ✓ Agent confirms: Transaction successful");
      console.log("   → Next action: Log completion and continue");
    }

    console.log("\n✅ Agent task completed successfully!\n");
  } catch (error: any) {
    // Example 5: Error handling
    console.log("\n❌ Agent encountered an error:");
    console.log(`   ${error.message}`);
    console.log("\n🔄 Agent could retry or fall back to alternative action\n");
    throw error;
  }
}

// Additional examples for AI agent integration patterns

/**
 * Example: How a Claude agent might use this tool
 *
 * Pseudo-code showing integration with an AI agent framework:
 *
 * ```typescript
 * // Define tool for the AI agent
 * const x402Tool = {
 *   name: "call_protected_endpoint",
 *   description: "Call an x402-protected API endpoint that requires micropayment",
 *   parameters: {
 *     url: { type: "string", description: "The endpoint URL to call" },
 *     method: { type: "string", description: "HTTP method (GET, POST, etc.)" },
 *     body: { type: "object", description: "Request body for POST/PUT requests" },
 *   },
 *   execute: async (params) => {
 *     const agent = new X402Agent(process.env.AGENT_PRIVATE_KEY);
 *     const response = await agent.callEndpoint(params.url, {
 *       method: params.method,
 *       body: params.body,
 *     });
 *     return response;
 *   }
 * };
 *
 * // The AI agent can now use this tool
 * const aiAgent = new Agent({
 *   tools: [x402Tool],
 *   systemPrompt: "You can access protected content by calling endpoints that require payment."
 * });
 *
 * // Agent decides to use the tool
 * await aiAgent.run("Get the protected builder content");
 * // Agent will invoke x402Tool internally and process the response
 * ```
 */

/**
 * Example: LangChain integration pattern
 *
 * ```typescript
 * import { DynamicStructuredTool } from "langchain/tools";
 * import { z } from "zod";
 *
 * const x402LangChainTool = new DynamicStructuredTool({
 *   name: "x402_protected_endpoint",
 *   description: "Access x402-protected content with automatic payment handling",
 *   schema: z.object({
 *     url: z.string().describe("The protected endpoint URL"),
 *     method: z.string().optional().describe("HTTP method"),
 *     body: z.any().optional().describe("Request body"),
 *   }),
 *   func: async ({ url, method, body }) => {
 *     const agent = new X402Agent(process.env.AGENT_PRIVATE_KEY);
 *     const response = await agent.callEndpoint(url, { method, body });
 *     return JSON.stringify(response.data);
 *   },
 * });
 * ```
 */

/**
 * Example: Custom agent loop
 *
 * ```typescript
 * async function agentLoop() {
 *   const agent = new X402Agent(privateKey);
 *   const tasks = [
 *     { name: "Get builder content", endpoint: "/api/payment/builder" },
 *     { name: "Chat with AI", endpoint: "/api/payment/chat" },
 *   ];
 *
 *   for (const task of tasks) {
 *     console.log(`Executing task: ${task.name}`);
 *     const response = await agent.callEndpoint(`${BASE_URL}${task.endpoint}`);
 *     console.log(`Task complete:`, response.data);
 *
 *     // Agent decision logic
 *     if (response.payment.txHash) {
 *       console.log(`Payment successful: ${response.payment.txHash}`);
 *       // Continue to next task
 *     } else {
 *       console.log(`Payment failed, retrying...`);
 *       // Retry logic
 *     }
 *   }
 * }
 * ```
 */

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
