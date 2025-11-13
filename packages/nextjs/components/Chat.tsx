"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelMessage } from "ai";

export function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ModelMessage = { role: "user", content: input };
    setMessages(currentMessages => [...currentMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/payment/chat", {
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
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally show error to user
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
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto border border-base-300 rounded-lg shadow-lg">
      {/* Messages Display Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-base-content/60 mt-8">
            <p className="text-lg">Start a conversation</p>
            <p className="text-sm mt-2">Each message costs a micropayment via x402</p>
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
            <button type="submit" disabled={isLoading || !input.trim()} className="btn btn-primary">
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
