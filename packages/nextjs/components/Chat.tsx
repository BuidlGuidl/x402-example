"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelMessage } from "ai";
import { useAccount, useWalletClient } from "wagmi";
import { wrapFetchWithPayment } from "x402-fetch";

export function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check wallet connection
    if (!isConnected || !walletClient) {
      setError("Please connect your wallet to send messages");
      return;
    }

    const userMessage: ModelMessage = { role: "user", content: input };
    setMessages(currentMessages => [...currentMessages, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Wrap fetch with x402 payment handling
      // Type assertion needed due to viem version differences between wagmi and x402-fetch
      const fetchWithPayment = wrapFetchWithPayment(
        fetch,
        walletClient as any,
        BigInt(0.01 * 10 ** 6), // Max 0.01 USDC
      );

      const response = await fetchWithPayment("/api/payment/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const { messages: newMessages } = await response.json();
      setMessages(currentMessages => [...currentMessages, ...newMessages]);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
      // Remove the user message on error
      setMessages(currentMessages => currentMessages.filter(m => m !== userMessage));
      setInput(input); // Restore input
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content: ModelMessage["content"]) => {
    if (typeof content === "string") {
      return content;
    }
    return content
      .filter(part => part.type === "text")
      .map((part, partIndex) => <span key={partIndex}>{part.text}</span>);
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto bg-base-100 border border-base-300 rounded-lg shadow-lg">
      {/* Messages Display Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-base-content/60 mt-8">
            <p className="text-lg">Start a conversation</p>
            <p className="text-sm mt-2">Each message costs a micropayment via x402</p>
            {!isConnected && <p className="text-sm mt-2 text-warning">⚠️ Connect your wallet to send messages</p>}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === "user" ? "bg-primary text-primary-content" : "bg-base-200 text-base-content"}`}
              >
                <div className="text-xs font-semibold mb-1 opacity-70">
                  {message.role === "user" ? "You" : "Assistant"}
                </div>
                <div className="whitespace-pre-wrap">{renderMessageContent(message.content)}</div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-base-200 text-base-content max-w-[80%] rounded-lg px-4 py-2">
              <div className="text-xs font-semibold mb-1 opacity-70">Assistant</div>
              <div className="flex gap-1">
                <span className="loading loading-dots loading-sm"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-base-300 p-4">
        {error && (
          <div className="alert alert-error mb-4">
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message... (Shift+Enter for new line, Enter to send)"
            className="textarea textarea-bordered w-full min-h-[80px] resize-none"
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <button type="submit" disabled={isLoading || !input.trim() || !isConnected} className="btn btn-primary">
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
