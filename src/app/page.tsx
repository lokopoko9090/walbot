"use client";

import { useState, useRef, useEffect } from "react";

interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  badge: string;
  description: string;
  blobsCount: number;
  prompts: string[];
}

const PERSONAS: Persona[] = [
  {
    id: "user_anna_frontend",
    name: "Anna",
    role: "Frontend DApp Dev",
    avatar: "👩‍💻",
    badge: "10 Mainnet Blobs",
    description: "Next.js, React, Tailwind CSS, Erasure coding & Walrus SDK",
    blobsCount: 10,
    prompts: [
      "What is my tech stack and what project am I working on?",
      "Why did I choose Walrus over IPFS or AWS S3?",
      "How does erasure coding in Walrus protect my assets?",
    ],
  },
  {
    id: "user_maxim_move_dev",
    name: "Maxim",
    role: "Sui Move Engineer",
    avatar: "👨‍💻",
    badge: "10 Mainnet Blobs",
    description: "Sui Move smart contracts, Blob IDs, NFT metadata & Storage Fund",
    blobsCount: 10,
    prompts: [
      "What programming language and blockchain do I use?",
      "Can I store Blob ID inside a Move object as vector<u8>?",
      "How does the Walrus Storage Fund work in the economic model?",
    ],
  },
  {
    id: "user_olena_educator",
    name: "Olena",
    role: "Web3 Educator",
    avatar: "👩‍🏫",
    badge: "10 Mainnet Blobs",
    description: "Web3 community tutorials, student personalization & workshops",
    blobsCount: 10,
    prompts: [
      "What is my activity and what educational topics did we discuss?",
      "Why do AI chatbots need decentralized memory like Walrus?",
      "How does Walrus Memory personalize learning for students?",
    ],
  },
  {
    id: "user_guest",
    name: "Guest (You)",
    role: "New Live Session",
    avatar: "✨",
    badge: "Live Testing",
    description: "Chat freely — WalBot commits your memories to Walrus Mainnet live!",
    blobsCount: 0,
    prompts: [
      "Hi! My name is Alex, I'm building an on-chain game on Sui",
      "Explain Walrus Protocol and decentralized storage in 2 sentences",
      "Why is Google Gemini used instead of standard models here?",
    ],
  },
];

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  hasMemory?: boolean;
  recalledCount?: number;
  recalledSnippets?: string[];
  timestamp: string;
}

export default function HomePage() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [guestId, setGuestId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProofs, setShowProofs] = useState(false);
  const [expandedSnippets, setExpandedSnippets] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize or restore guest ID
  useEffect(() => {
    let savedGuest = localStorage.getItem("walbot_guest_id");
    if (!savedGuest) {
      savedGuest = "user_guest_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("walbot_guest_id", savedGuest);
    }
    setGuestId(savedGuest);
  }, []);

  // Update initial welcome message when persona changes
  useEffect(() => {
    const isGuest = selectedPersona.id === "user_guest";
    const welcomeText = isGuest
      ? `👋 Welcome! You are in **Guest Mode**. Any message you send will be indexed and stored into **Walrus Mainnet** in real time. Try introducing yourself or asking about Sui & Walrus!`
      : `👋 Switched to **${selectedPersona.name}** (${selectedPersona.role}).\n\nI have **${selectedPersona.blobsCount} verified memories** stored for ${selectedPersona.name} on **Walrus Mainnet**. Click any suggested question below or ask me about our previous discussions!`;

    setMessages([
      {
        id: "welcome-" + selectedPersona.id,
        role: "bot",
        text: welcomeText,
        hasMemory: !isGuest,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [selectedPersona]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const currentUserId =
    selectedPersona.id === "user_guest" ? guestId || "user_guest_live" : selectedPersona.id;

  async function handleSend(customText?: string) {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    const userMsgId = "user-" + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: textToSend, timestamp: timeStr },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, userId: currentUserId }),
      });

      const data = await res.json();
      const botMsgId = "bot-" + Date.now();

      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          role: "bot",
          text: data.reply || "Sorry, I could not generate a response. Please check your API configuration.",
          hasMemory: data.hasMemory,
          recalledCount: data.recalledCount,
          recalledSnippets: data.recalledSnippets,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "bot",
          text: "⚠️ Connection error to Walrus Relayer or Gemini API. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function toggleSnippet(msgId: string) {
    setExpandedSnippets((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  }

  function renderFormatted(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='bg-cyan-950/60 text-cyan-300 px-1.5 py-0.5 rounded text-xs border border-cyan-500/20 font-mono'>$1</code>")
      .replace(/\n/g, "<br/>");
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-gray-100 flex flex-col items-center justify-between p-3 sm:p-6 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background radial glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-600/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-40 right-10 w-[500px] h-[500px] bg-indigo-600/10 blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-xl shadow-cyan-500/20 ring-1 ring-white/20">
              🐋
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#060b14] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                WalBot
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Mainnet Live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Persistent AI Assistant · Powered by <span className="text-cyan-400 font-medium">Walrus Memory</span> &amp; <span className="text-indigo-400 font-medium">Google Gemini</span>
            </p>
          </div>
        </div>

        {/* Network & Proof Badges */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-[11px] text-emerald-300">29 Mainnet Blobs</span>
          </div>

          <button
            onClick={() => setShowProofs(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 text-cyan-300 text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm hover:shadow-cyan-500/10 cursor-pointer"
          >
            <span>📜</span>
            <span className="font-medium">On-chain Proofs</span>
          </button>

          <a
            href="https://github.com/lokopoko9090/walbot"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs px-3 py-1.5 rounded-xl text-slate-300 transition-all flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Code</span>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-5xl flex-1 flex flex-col gap-4 my-4">
        {/* Persona Switcher Section */}
        <section className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 text-sm">👥</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Select Persona (Hackathon Test Profiles)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Instant recall from 29 Mainnet Blobs
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {PERSONAS.map((p) => {
              const active = selectedPersona.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersona(p)}
                  className={`relative text-left p-3 rounded-xl transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                    active
                      ? "bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                      : "bg-slate-950/40 hover:bg-slate-800/40 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.avatar}</span>
                      <span className={`font-bold text-sm ${active ? "text-cyan-200" : "text-slate-200"}`}>
                        {p.name}
                      </span>
                    </div>
                    {active && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 line-clamp-1 mb-1">
                    {p.role}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      active
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {p.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Chat Window */}
        <section className="flex-1 bg-slate-900/50 backdrop-blur-2xl border border-slate-800/90 rounded-3xl flex flex-col shadow-2xl overflow-hidden min-h-[480px]">
          {/* Active persona banner */}
          <div className="bg-slate-950/60 px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-base">{selectedPersona.avatar}</span>
              <span>Active Context: <strong className="text-cyan-300 font-semibold">{selectedPersona.name}</strong></span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">{selectedPersona.description}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMessages([
                    {
                      id: "welcome-" + Date.now(),
                      role: "bot",
                      text: `Memory context cleared for this session. Ask anything or pick a prompt below!`,
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    },
                  ]);
                }}
                className="text-[11px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="Clear current dialogue view"
              >
                Clear Screen
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const isBot = msg.role === "bot";
              const hasSnippets = msg.recalledSnippets && msg.recalledSnippets.length > 0;
              const isExpanded = expandedSnippets[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} items-start`}
                >
                  {isBot && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-sm shadow-md shadow-cyan-500/20 flex-shrink-0 mt-1">
                      🐋
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    {/* On-chain Memory Badge for Bot */}
                    {msg.hasMemory && isBot && (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-indigo-500/15 border border-cyan-500/30 rounded-lg px-2.5 py-1 text-[11px] text-cyan-300 font-medium mb-1.5 shadow-sm">
                        <span>🧠</span>
                        <span>Recalled from Walrus Mainnet Shards</span>
                        {hasSnippets && (
                          <button
                            onClick={() => toggleSnippet(msg.id)}
                            className="ml-1 underline hover:text-white cursor-pointer text-[10px]"
                          >
                            {isExpanded ? "[Hide Proof]" : "[View On-Chain Snippet]"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Expandable Memory Proof Snippet */}
                    {isExpanded && hasSnippets && (
                      <div className="w-full mb-2 p-3 bg-slate-950/90 border border-cyan-500/40 rounded-xl text-xs font-mono text-cyan-200/90 space-y-1.5 shadow-inner">
                        <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                          Verified Mainnet Memory Records:
                        </div>
                        {msg.recalledSnippets!.map((snip, idx) => (
                          <div key={idx} className="bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px] text-slate-300">
                            {snip}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-xs shadow-lg shadow-blue-600/20"
                          : "bg-slate-950/80 border border-slate-800 text-slate-100 rounded-tl-xs shadow-md"
                      }`}
                    >
                      <div dangerouslySetInnerHTML={{ __html: renderFormatted(msg.text) }} />
                    </div>

                    <span className="text-[10px] text-slate-500 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Thinking indicator */}
            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-sm shadow-md shadow-cyan-500/20 flex-shrink-0 animate-pulse">
                  🐋
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-cyan-300/80 font-mono text-[11px]">
                    Querying Walrus Memory &amp; Gemini Flash...
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
              <span>💡</span>
              <span className="font-semibold uppercase tracking-wider text-[10px]">Suggested Prompts:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedPersona.prompts.map((promptText, i) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => handleSend(promptText)}
                  className="bg-slate-900/90 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 text-xs px-3 py-1.5 rounded-xl transition-all text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &ldquo;{promptText}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Form */}
          <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800">
            <div className="flex gap-2 items-end">
              <textarea
                className="flex-1 bg-slate-900/90 border border-slate-800 focus:border-cyan-500/50 rounded-2xl text-white placeholder-slate-500 text-sm px-4 py-3 resize-none outline-none transition-all leading-relaxed shadow-inner"
                placeholder={`Ask WalBot as ${selectedPersona.name} (or test memory retrieval)...`}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="w-11 h-11 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-40 disabled:scale-100 hover:scale-105 cursor-pointer flex-shrink-0"
                title="Send message"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 px-1">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Shift+Enter</kbd> for newline</span>
              <span className="text-cyan-400/80">Every message committed to Walrus Mainnet</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div>
          WalBot · Built for <strong className="text-slate-400 font-semibold">Walrus Sessions 8</strong> ($2,500 WAL Hackathon)
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://memory.walrus.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors"
          >
            Walrus Memory Docs
          </a>
          <a
            href="https://github.com/MystenLabs/MemWal"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors"
          >
            MemWal SDK
          </a>
          <a
            href="https://thewalrussessions.wal.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors"
          >
            Sessions 8 Rules
          </a>
        </div>
      </footer>

      {/* On-Chain Proofs Modal */}
      {showProofs && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl shadow-cyan-500/10 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowProofs(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl">
                ⛓️
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Walrus Mainnet Verification Proofs</h3>
                <p className="text-xs text-slate-400">Cryptographic storage proofs &amp; hackathon audit trail</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 mb-1 font-medium">Walrus Memory Account ID (Mainnet):</div>
                <div className="font-mono text-cyan-300 text-[11px] break-all select-all bg-slate-900 p-2 rounded border border-slate-800/80">
                  0xd9a91eb8875e869b0636502cc47a8229a6469a87f2aca36c5cbef43bdb31e2f0
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Total Mainnet Blobs:</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">29 Blobs Verified</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">(Requirement: ≥10 blobs)</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Relayer Endpoint:</span>
                  <span className="text-sm font-semibold text-cyan-300 font-mono">relayer.memory.walrus.xyz</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Namespace: walrus-tutor</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 mb-2 font-medium">5x Bug Bounty Submissions (MystenLabs/MemWal):</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11px]">
                  <a href="https://github.com/MystenLabs/MemWal/issues/932" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                    <span>↗</span> Issue #932 (Race Condition)
                  </a>
                  <a href="https://github.com/MystenLabs/MemWal/issues/933" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                    <span>↗</span> Issue #933 (Zero-Key Signing)
                  </a>
                  <a href="https://github.com/MystenLabs/MemWal/issues/934" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                    <span>↗</span> Issue #934 (Loopback Redaction)
                  </a>
                  <a href="https://github.com/MystenLabs/MemWal/issues/935" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                    <span>↗</span> Issue #935 (Token Truncation)
                  </a>
                  <a href="https://github.com/MystenLabs/MemWal/issues/936" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1 sm:col-span-2">
                    <span>↗</span> Issue #936 (System Injection Violation)
                  </a>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 mb-1 font-medium">Payout Sui Wallet:</div>
                <div className="font-mono text-emerald-300 text-[11px] break-all select-all bg-slate-900 p-2 rounded border border-slate-800/80">
                  0x60c3ff34deba7ca5d6fff940f32c50cf0681396390565707751489cc72bab208
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowProofs(false)}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Proofs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
