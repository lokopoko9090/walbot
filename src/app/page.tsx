"use client";

import { useState, useRef, useEffect } from "react";

interface Persona {
  id: string;
  name: string;
  jpName: string;
  role: string;
  avatar: string;
  tag: string;
  badge: string;
  description: string;
  blobsCount: number;
  prompts: string[];
}

const PERSONAS: Persona[] = [
  {
    id: "user_anna_frontend",
    name: "Anna",
    jpName: "アンナ",
    role: "Frontend DApp Engineer",
    avatar: "⚡",
    tag: "01 // NEXT.JS",
    badge: "10 Mainnet Blobs",
    description: "Next.js, React, Tailwind CSS, Erasure Coding & Walrus SDK",
    blobsCount: 10,
    prompts: [
      "What is my tech stack and what project am I working on?",
      "Why did I choose Walrus over IPFS or AWS S3?",
      "How does erasure coding in Walrus protect my frontend assets?",
    ],
  },
  {
    id: "user_maxim_move_dev",
    name: "Maxim",
    jpName: "マキシム",
    role: "Sui Move Engineer",
    avatar: "⚔️",
    tag: "02 // MOVE DEV",
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
    jpName: "オレナ",
    role: "Web3 Community Sensei",
    avatar: "🌸",
    tag: "03 // EDUCATOR",
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
    name: "Guest",
    jpName: "ゲスト",
    role: "Live Human Agent",
    avatar: "✨",
    tag: "04 // YOU",
    badge: "Live Testing",
    description: "Your live messages are committed to Walrus Mainnet in real time!",
    blobsCount: 0,
    prompts: [
      "Привіт! Я розробляю новий DApp на Sui, розкажи про Walrus",
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

  // Initialize guest ID
  useEffect(() => {
    let savedGuest = localStorage.getItem("walbot_guest_id");
    if (!savedGuest) {
      savedGuest = "user_guest_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("walbot_guest_id", savedGuest);
    }
    setGuestId(savedGuest);
  }, []);

  // Update initial welcome message on persona change and load history
  useEffect(() => {
    const isGuest = selectedPersona.id === "user_guest";
    const welcomeText = isGuest
      ? `✦ **GUEST MODE // セッション開始**\n\nПривіт! Будь-яке повідомлення, яке ти надішлеш, синхронізується з **Walrus Mainnet** у режимі реального часу. Напиши своє запитання або обери швидку підказку нижче!`
      : `✦ **PERSONA LINKED // ${selectedPersona.name.toUpperCase()} (${selectedPersona.jpName})**\n\nСинхронізовано з **${selectedPersona.blobsCount} ончейн-спогадами** на Walrus Mainnet. Я пам'ятаю весь твій стек та історію навчання. Тисни підказку або запитуй будь-що!`;

    setMessages([
      {
        id: "welcome-" + selectedPersona.id,
        role: "bot",
        text: welcomeText,
        hasMemory: !isGuest,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    if (!isGuest) {
      setLoading(true);
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedPersona.id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.history && data.history.length > 0) {
            const historyMessages = data.history.reverse().map((hist: string, i: number) => ({
              id: "hist-" + Date.now() + "-" + i,
              role: "bot" as const,
              text: `*Recalled memory from Mainnet:*\n\n${hist}`,
              hasMemory: true,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }));
            setMessages((prev) => [...prev, ...historyMessages]);
          }
        })
        .catch((err) => console.warn("Failed to load history", err))
        .finally(() => setLoading(false));
    }
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
          text: data.reply || "Connection timeout. Please retry.",
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
          text: "⚠️ [SYS_ERR] Connection to Walrus Relayer failed. Please try again.",
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
      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-pink-300 font-semibold'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='bg-[#220d29] text-[#ff3399] px-1.5 py-0.5 rounded text-xs border border-[#ff007f]/30 font-mono'>$1</code>")
      .replace(/\n/g, "<br/>");
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-gray-100 flex flex-col items-center justify-between p-3 sm:p-6 font-sans relative overflow-x-hidden selection:bg-[#ff007f] selection:text-white">
      {/* Background Anime Neon Glow & Tech Grid */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-[#ff007f]/15 via-[#9333ea]/8 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-20 right-0 w-[450px] h-[450px] bg-[#ff007f]/10 blur-[120px] pointer-events-none -z-10" />

      {/* Cyber Grid Lines Header Decor */}
      <div className="w-full max-w-5xl flex items-center justify-between text-[10px] font-mono text-[#ff007f]/60 tracking-widest uppercase mb-2 px-1">
        <span>// WALRUS PROTOCOL SESSIONS 8</span>
        <span className="hidden sm:inline">記憶ストレージ MATRIX · VER: 8.4.1</span>
        <span>SYS.STATUS: [ONLINE]</span>
      </div>

      {/* Top Navbar */}
      <header className="w-full max-w-5xl bg-[#0d0c14]/90 backdrop-blur-xl border border-[#2b1b36] rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl shadow-[#ff007f]/5">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff007f] via-[#c026d3] to-[#4f46e5] flex items-center justify-center text-2xl shadow-lg shadow-[#ff007f]/30 ring-1 ring-pink-400/40 group-hover:scale-105 transition-transform">
              🦭
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#ff007f] border-2 border-[#07070b] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-pink-100 to-[#ff3399] bg-clip-text text-transparent uppercase font-mono">
                WalBot
              </h1>
              <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-[#ff007f]/15 text-[#ff3399] border border-[#ff007f]/40">
                ウォルボット
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Persistent AI · Powered by <span className="text-[#ff3399] font-semibold">Walrus Mainnet</span> &amp; <span className="text-pink-300 font-medium">Gemini</span>
            </p>
          </div>
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-2 flex-wrap justify-center font-mono">
          <div className="flex items-center gap-2 bg-[#140f1d] border border-[#ff007f]/30 rounded-xl px-3 py-1.5 text-xs text-pink-200 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#ff007f] animate-ping" />
            <span className="text-[11px] font-bold text-pink-300">29 MAINNET BLOBS</span>
          </div>

          <button
            onClick={() => setShowProofs(true)}
            className="flex items-center gap-1.5 bg-[#ff007f]/10 hover:bg-[#ff007f]/20 border border-[#ff007f]/40 hover:border-[#ff007f] text-[#ff3399] hover:text-white text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm hover:shadow-[#ff007f]/20 cursor-pointer"
          >
            <span>📜</span>
            <span className="font-semibold">On-Chain Proofs</span>
          </button>

          <a
            href="https://github.com/lokopoko9090/walbot"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#140f1d] hover:bg-[#1f172d] border border-slate-800 hover:border-pink-500/40 text-xs px-3 py-1.5 rounded-xl text-slate-300 hover:text-pink-200 transition-all flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-5xl flex-1 flex flex-col gap-3.5 my-3">
        {/* Strict Cyber-Manga Persona Selector */}
        <section className="bg-[#0d0c14]/90 backdrop-blur-xl border border-[#2b1b36] rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2.5 px-1 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#ff007f] font-bold">✦</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                PERSONA MATRIX // 記憶マトリックス
              </span>
            </div>
            <span className="text-[10px] text-[#ff3399]/80 font-bold uppercase tracking-wider hidden sm:inline">
              Instant On-Chain Recall
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
                      ? "bg-gradient-to-b from-[#240e2b] to-[#160a1c] border-[#ff007f] shadow-lg shadow-[#ff007f]/20 ring-1 ring-[#ff007f]"
                      : "bg-[#110e17] hover:bg-[#1b1424] border-[#22182d] hover:border-[#ff007f]/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{p.avatar}</span>
                      <span className={`font-bold font-mono text-sm tracking-wide ${active ? "text-[#ff3399]" : "text-slate-200"}`}>
                        {p.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{p.jpName}</span>
                  </div>

                  <div className="text-[11px] font-medium text-slate-400 line-clamp-1 mb-1 font-mono">
                    {p.role}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      active
                        ? "bg-[#ff007f]/25 text-[#ff3399] border border-[#ff007f]/50"
                        : "bg-slate-900 text-slate-400 border border-slate-800"
                    }`}>
                      {p.tag}
                    </span>
                    <span className="text-[9px] font-mono text-pink-300/80 font-semibold">
                      {p.blobsCount > 0 ? `${p.blobsCount} BLOBS` : "LIVE"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Chat Window */}
        <section className="flex-1 bg-[#0d0c14]/95 backdrop-blur-2xl border border-[#2b1b36] rounded-2xl flex flex-col shadow-2xl overflow-hidden min-h-[480px]">
          {/* Active persona banner */}
          <div className="bg-[#110e17] px-4 py-2.5 border-b border-[#22182d] flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-[#ff007f] font-bold">►</span>
              <span>ACTIVE USER: <strong className="text-[#ff3399] font-bold">{selectedPersona.name.toUpperCase()}</strong> ({selectedPersona.jpName})</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">{selectedPersona.description}</span>
            </div>

            <button
              onClick={() => {
                setMessages([
                  {
                    id: "welcome-" + Date.now(),
                    role: "bot",
                    text: `✦ Screen cleared. Ready for next query, ${selectedPersona.name}!`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ]);
              }}
              className="text-[10px] text-slate-400 hover:text-[#ff007f] hover:bg-[#ff007f]/10 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              [CLEAR SCREEN]
            </button>
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff007f] to-[#7928ca] flex items-center justify-center text-sm shadow-md shadow-[#ff007f]/20 flex-shrink-0 mt-0.5">
                      🦭
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    {/* On-Chain Wild Pink Memory Badge */}
                    {msg.hasMemory && isBot && (
                      <div className="flex items-center gap-1.5 bg-[#250d2e] border border-[#ff007f]/40 rounded-lg px-2.5 py-1 text-[11px] text-[#ff3399] font-mono font-medium mb-1.5 shadow-sm shadow-[#ff007f]/10">
                        <span>🌸</span>
                        <span>RECALLED FROM WALRUS MAINNET SHARDS</span>
                        {hasSnippets && (
                          <button
                            onClick={() => toggleSnippet(msg.id)}
                            className="ml-1 underline hover:text-white cursor-pointer text-[10px]"
                          >
                            {isExpanded ? "[HIDE PROOF]" : "[VIEW ON-CHAIN RECORD]"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Expandable Memory Proof Snippet */}
                    {isExpanded && hasSnippets && (
                      <div className="w-full mb-2 p-3 bg-[#0a080e] border border-[#ff007f]/40 rounded-xl text-xs font-mono text-pink-200/90 space-y-1.5 shadow-inner">
                        <div className="text-[10px] text-[#ff3399] font-bold uppercase tracking-wider">
                          Verified Mainnet Memory Records:
                        </div>
                        {msg.recalledSnippets!.map((snip, idx) => (
                          <div key={idx} className="bg-[#140f1d] p-2 rounded border border-[#2b1b36] text-[11px] text-pink-100/90">
                            {snip}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? "bg-gradient-to-r from-[#ff007f] to-[#be185d] text-white rounded-tr-xs shadow-lg shadow-[#ff007f]/20 font-medium"
                          : "bg-[#13101c] border border-[#261d31] text-slate-200 rounded-tl-xs shadow-md"
                      }`}
                    >
                      <div dangerouslySetInnerHTML={{ __html: renderFormatted(msg.text) }} />
                    </div>

                    <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Thinking indicator */}
            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff007f] to-[#7928ca] flex items-center justify-center text-sm shadow-md shadow-[#ff007f]/30 flex-shrink-0 animate-pulse">
                  🦭
                </div>
                <div className="bg-[#13101c] border border-[#261d31] rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[#ff3399] text-[11px]">
                    QUERYING WALRUS MAINNET SHARDS &amp; GEMINI...
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 py-2.5 bg-[#0a080e] border-t border-[#22182d]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#ff007f] mb-2 font-bold uppercase tracking-wider">
              <span>✦</span>
              <span>SUGGESTED PROMPTS // 推奨プロンプト:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedPersona.prompts.map((promptText, i) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => handleSend(promptText)}
                  className="bg-[#140f1d] hover:bg-[#260f33] border border-[#2b1b36] hover:border-[#ff007f] text-pink-200/90 hover:text-white text-xs px-3 py-1.5 rounded-xl transition-all text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                >
                  &ldquo;{promptText}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Form */}
          <div className="p-3 sm:p-4 bg-[#0e0c15] border-t border-[#261d31]">
            <div className="flex gap-2 items-end">
              <textarea
                className="flex-1 bg-[#14101e] border border-[#2b1b36] focus:border-[#ff007f] rounded-2xl text-white placeholder-slate-500 text-sm px-4 py-3 resize-none outline-none transition-all leading-relaxed shadow-inner font-sans"
                placeholder={`Напишіть повідомлення як ${selectedPersona.name} (або поставте запитання)...`}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="w-11 h-11 rounded-2xl bg-gradient-to-r from-[#ff007f] via-[#ec4899] to-[#be185d] hover:from-[#ff1493] hover:to-[#e11d48] flex items-center justify-center text-white shadow-lg shadow-[#ff007f]/30 transition-all disabled:opacity-40 disabled:scale-100 hover:scale-105 cursor-pointer flex-shrink-0"
                title="Send message"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 px-1 font-mono">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-[#1c1628] text-pink-300 font-mono">Enter</kbd> to send</span>
              <span className="text-[#ff3399]/80 font-semibold">ALL DIALOGUES COMMITTED TO WALRUS MAINNET</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 font-mono">
        <div>
          WalBot // Built for <strong className="text-pink-300 font-semibold">Walrus Sessions 8</strong> ($2,500 WAL Hackathon)
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://memory.walrus.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#ff007f] transition-colors"
          >
            Walrus Memory Docs
          </a>
          <a
            href="https://github.com/MystenLabs/MemWal"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#ff007f] transition-colors"
          >
            MemWal SDK
          </a>
          <a
            href="https://thewalrussessions.wal.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#ff007f] transition-colors"
          >
            Sessions 8 Rules
          </a>
        </div>
      </footer>

      {/* On-Chain Proofs Modal */}
      {showProofs && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono">
          <div className="bg-[#0f0c18] border border-[#ff007f]/50 rounded-3xl max-w-2xl w-full p-6 shadow-2xl shadow-[#ff007f]/15 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowProofs(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1e142b] hover:bg-[#ff007f]/20 flex items-center justify-center text-slate-400 hover:text-[#ff007f] transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#ff007f]/20 text-[#ff007f] flex items-center justify-center text-xl">
                ⛓️
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Walrus Mainnet Verification Proofs</h3>
                <p className="text-xs text-slate-400">Cryptographic storage proofs &amp; hackathon audit trail</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-[#08060c] p-3.5 rounded-xl border border-[#2b1b36]">
                <div className="text-slate-400 mb-1 font-medium">Walrus Memory Account ID (Mainnet):</div>
                <div className="font-mono text-pink-300 text-[11px] break-all select-all bg-[#140f1d] p-2 rounded border border-[#2b1b36]">
                  0xd9a91eb8875e869b0636502cc47a8229a6469a87f2aca36c5cbef43bdb31e2f0
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#08060c] p-3 rounded-xl border border-[#2b1b36]">
                  <span className="text-slate-400 block mb-1">Total Mainnet Blobs:</span>
                  <span className="text-lg font-bold text-[#ff3399] font-mono">29 Blobs Verified</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">(Requirement: ≥10 blobs)</span>
                </div>

                <div className="bg-[#08060c] p-3 rounded-xl border border-[#2b1b36]">
                  <span className="text-slate-400 block mb-1">Relayer Endpoint:</span>
                  <span className="text-sm font-semibold text-pink-300 font-mono">relayer.memory.walrus.xyz</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Namespace: walrus-tutor</span>
                </div>
              </div>

              <div className="bg-[#08060c] p-3.5 rounded-xl border border-[#2b1b36]">
                <div className="text-slate-400 mb-2 font-medium">5x Bug Bounty Submissions (MystenLabs/MemWal):</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11px]">
                  <a href="https://github.com/MystenLabs/MemWal/issues/932" target="_blank" rel="noopener noreferrer" className="text-[#ff3399] hover:underline flex items-center gap-1">
                    <span>↗</span> Issue #932 (Race Condition)
                  </a>
                  <a href="https://github.com/MystenLabs/MemWal/issues/933" target="_blank" rel="noopener noreferrer" className="text-[#ff3399] hover:underline flex items-center gap-1">
                    <span>↗</span> Issue #933 (Zero-Key Signing)
                  </a>
                  <a href="https://github.com/MystenLabs/MemWal/issues/934" target="_blank" rel="noopener noreferrer" className="text-[#ff3399] hover:underline flex items-center gap-1">
                    <span>↗</span> Issue #934 (Loopback Redaction)
                  </a>
                  <a href="https://github.com/MystenLabs/MemWal/issues/935" target="_blank" rel="noopener noreferrer" className="text-[#ff3399] hover:underline flex items-center gap-1">
                    <span>↗</span> Issue #935 (Token Truncation)
                  </a>
                  <a href="https://github.com/MystenLabs/MemWal/issues/936" target="_blank" rel="noopener noreferrer" className="text-[#ff3399] hover:underline flex items-center gap-1 sm:col-span-2">
                    <span>↗</span> Issue #936 (System Injection Violation)
                  </a>
                </div>
              </div>

              <div className="bg-[#08060c] p-3.5 rounded-xl border border-[#2b1b36]">
                <div className="text-slate-400 mb-1 font-medium">Payout Sui Wallet:</div>
                <div className="font-mono text-pink-300 text-[11px] break-all select-all bg-[#140f1d] p-2 rounded border border-[#2b1b36]">
                  0x60c3ff34deba7ca5d6fff940f32c50cf0681396390565707751489cc72bab208
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowProofs(false)}
                className="bg-gradient-to-r from-[#ff007f] to-[#e11d48] hover:from-[#ff1493] hover:to-[#be185d] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-[#ff007f]/30"
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
