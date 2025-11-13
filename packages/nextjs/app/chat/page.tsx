import { Chat } from "~~/components/Chat";

export default function ChatPage() {
  return (
    <div className="my-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h1 className="font-semibold text-3xl lg:text-4xl mb-12">x402 Chatbot</h1>
        <Chat />
      </div>
    </div>
  );
}
