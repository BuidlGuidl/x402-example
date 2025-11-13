import { Network, Resource, paymentMiddleware } from "x402-next";

const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL as Resource;
const payTo = process.env.RESOURCE_WALLET_ADDRESS as `0x${string}`;
const network = process.env.NETWORK as Network;

export const middleware = paymentMiddleware(
  payTo,
  {
    "/api/payment/builder": {
      price: "$0.01",
      network,
      config: {
        description: "Access to protected content",
      },
    },
    "/api/payment/chat": {
      price: "$0.01",
      network,
      config: {
        description: "AI chat message",
      },
    },
    "/payment/builder": {
      price: "$0.01",
      network,
      config: {
        description: "Access to protected content",
      },
    },
  },
  {
    url: facilitatorUrl,
  },
  {
    appName: "Next x402 Demo",
    appLogo: "/x402-icon-blue.png",
  },
);

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/api/payment/:path*", "/payment/:path*"],
};
