# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

x402 Chat is a Scaffold-ETH 2 extension demonstrating micropayment-gated content using the x402 protocol. Built as a yarn monorepo with Hardhat smart contract framework and Next.js frontend (App Router).

## Architecture

**Monorepo structure:**
- `packages/hardhat/`: Solidity contracts, deployment scripts, tests
- `packages/nextjs/`: Next.js 15 frontend with App Router

**Key technologies:**
- Smart contracts: Hardhat, ethers v6, OpenZeppelin
- Frontend: Next.js 15, React 19, RainbowKit, Wagmi, viem
- Micropayments: x402 protocol with `x402-next` middleware and `x402-fetch`
- AI: Vercel AI SDK with Google provider
- Styling: Tailwind CSS 4, DaisyUI

**x402 Integration:**
- `packages/nextjs/middleware.ts`: Payment middleware configures protected routes
- Protected routes:
  - `/api/payment/builder` - $0.01 (protected content)
  - `/api/payment/chat` - $0.01 (AI chat message)
  - `/api/payment/store` - $0.05 (file download)
  - `/payment/builder` - $0.01 (protected page)
- Environment variables: `NEXT_PUBLIC_FACILITATOR_URL`, `RESOURCE_WALLET_ADDRESS`, `NETWORK`

## Common Commands

**Development:**
```bash
yarn chain          # Start local Hardhat blockchain
yarn deploy         # Deploy contracts to current network
yarn start          # Start Next.js dev server (localhost:3000)
```

**Contract development:**
```bash
yarn compile                          # Compile Solidity contracts
yarn hardhat:test                     # Run Hardhat tests
yarn hardhat:deploy                   # Deploy contracts
yarn send402request                   # Send test request to protected API
yarn send402chat                      # Send test chat (default message)
CHAT_MESSAGE="text" yarn send402chat  # Send custom chat message
```

**Frontend:**
```bash
yarn next:build            # Build Next.js production bundle
yarn next:lint             # Run ESLint
yarn next:format           # Format with Prettier
yarn next:check-types      # TypeScript type checking
```

**Formatting & linting:**
```bash
yarn format         # Format both hardhat and nextjs packages
yarn lint           # Lint both packages
```

## Contract Interaction Patterns

**Reading contract data:**
```typescript
const { data } = useScaffoldReadContract({
  contractName: "YourContract",
  functionName: "functionName",
  args: [arg1, arg2],
});
```

**Writing to contracts:**
```typescript
const { writeContractAsync } = useScaffoldWriteContract({ contractName: "YourContract" });
await writeContractAsync({
  functionName: "functionName",
  args: [arg1, arg2],
  value: parseEther("0.1"),
});
```

**Reading events:**
```typescript
const { data: events } = useScaffoldEventHistory({
  contractName: "YourContract",
  eventName: "EventName",
  watch: true,
});
```

**NEVER use alternative contract interaction patterns.** Always use the scaffold-eth hooks listed above.

## Key Files

- `packages/nextjs/middleware.ts`: x402 payment middleware configuration
- `packages/nextjs/scaffold.config.ts`: Network configuration (default: baseSepolia)
- `packages/nextjs/app/chat/page.tsx`: AI chat interface with x402 payments
- `packages/nextjs/app/store/page.tsx`: File download store with x402 payments
- `packages/hardhat/deploy/`: Contract deployment scripts
- `packages/hardhat/scripts/send402request.ts`: Test script for protected API calls
- `packages/hardhat/scripts/send402chat.ts`: Test script for chat API with custom messages
- `packages/nextjs/contracts/deployedContracts.ts`: Auto-generated contract ABIs
- `packages/nextjs/hooks/scaffold-eth/`: Contract interaction hooks

## Development Workflow

1. Start local blockchain: `yarn chain`
2. Deploy contracts: `yarn deploy`
3. Start frontend: `yarn start`
4. Access features:
   - Debug UI: http://localhost:3000/debug
   - Chat interface: http://localhost:3000/chat
   - File store: http://localhost:3000/store
5. Write tests in `packages/hardhat/test/`
6. Build custom UI using scaffold-eth hooks and components

## Display Components

Always use scaffold-eth components for Ethereum data:
- `<Address>`: Display Ethereum addresses
- `<AddressInput>`: Input for Ethereum addresses
- `<Balance>`: Display ETH/USDC balances
- `<EtherInput>`: Number input with ETH/USD conversion

Located in: `packages/nextjs/components/scaffold-eth/`

## Environment Configuration

Required for x402 functionality:
- `NEXT_PUBLIC_FACILITATOR_URL`: x402 facilitator endpoint
- `RESOURCE_WALLET_ADDRESS`: Payment recipient address
- `NETWORK`: Target blockchain network (e.g., baseSepolia)

## Testing x402 Payments

**Command-line testing:**
- `yarn send402request` - Test protected builder API endpoint
- `yarn send402chat` - Test chat API with default message
- `CHAT_MESSAGE="text" yarn send402chat` - Test chat API with custom message

Requires funded wallet on target network (baseSepolia faucet: https://faucet.circle.com/). Tests use account from `packages/hardhat/.env` to sign x402 payment transactions.

**Examples:**
```bash
# Test with default message
yarn send402chat

# Test with custom message
CHAT_MESSAGE="What is blockchain technology?" yarn send402chat
CHAT_MESSAGE="Explain smart contracts in simple terms" yarn send402chat
```
