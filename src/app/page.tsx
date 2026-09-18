"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "bot";
  text: string;
  hasMemory?: boolean;
}

function getUserId(): string {
  if (typeof window === "undefined") return "anon";
  let id = localStorage.getItem("walbot_user_id");
  if (!id) {
    id = "user_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("walbot_user_id", id);
  }
  return id;
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "👋 Hi! I'm **WalBot** — your Walrus & Sui learning assistant.\n\nI remember everything across our sessions. Ask me anything about Walrus, Sui, Web3, or just say hello!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userId = getUserId();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply || "Sorry, something went wrong.", hasMemory: data.hasMemory },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function renderText(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d1b3e] to-[#0a1628] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-2xl mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0066ff] flex items-center justify-center text-xl shadow-lg shadow-blue-500/30">
          🐋
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none">WalBot</h1>
          <p className="text-blue-300 text-xs">Walrus Learning Assistant · Remembers across sessions</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-medium">Walrus Memory ON</span>
        </div>
      </div>

      {/* Chat window */}
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-2xl shadow-blue-950/50"
        style={{ height: "65vh" }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {msg.role === "bot" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0066ff] flex items-center justify-center text-sm flex-shrink-0 mt-0.5 shadow-lg shadow-blue-500/20">
                  🐋
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-[#0066ff] to-[#0044cc] text-white rounded-tr-sm shadow-lg shadow-blue-500/20"
                  : "bg-white/8 border border-white/10 text-gray-100 rounded-tl-sm"
              }`}>
                {msg.hasMemory && (
                  <div className="flex items-center gap-1 text-[10px] text-cyan-400 mb-1.5 font-medium">
                    <span>🧠</span> <span>Using your memory</span>
                  </div>
                )}
                <span dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0066ff] flex items-center justify-center text-sm flex-shrink-0">
                🐋
              </div>
              <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="text-xs text-gray-400 ml-1">Thinking + saving memory…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/10">
          <div className="flex gap-2 items-end">
            <textarea
              className="flex-1 bg-white/8 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm px-4 py-2.5 resize-none outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all leading-relaxed"
              placeholder="Ask about Walrus, Sui, Web3…"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#0066ff] flex items-center justify-center text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all disabled:opacity-40 disabled:scale-100 flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-2">
            Powered by Walrus Memory · All conversations stored on Walrus Mainnet
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex gap-4 text-xs text-gray-600">
        <a href="https://github.com/MystenLabs/MemWal" target="_blank" rel="noopener" className="hover:text-gray-400 transition-colors">GitHub</a>
        <a href="https://memory.walrus.xyz" target="_blank" rel="noopener" className="hover:text-gray-400 transition-colors">Walrus Memory</a>
        <a href="https://docs.wal.app" target="_blank" rel="noopener" className="hover:text-gray-400 transition-colors">Docs</a>
      </div>
    </div>
  );
}
