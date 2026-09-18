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
    avatar: "⚙️",
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
    avatar: "🌐",
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
    avatar: "👤",
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeRules, setActiveRules] = useState<string[]>([]);
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

  // Load and synchronize active rules for the selected persona
  useEffect(() => {
    const saved = localStorage.getItem("walbot_rules_" + selectedPersona.id);
    if (saved) {
      try {
        setActiveRules(JSON.parse(saved));
      } catch {
        setActiveRules([]);
      }
    } else {
      if (selectedPersona.id === "user_anna_frontend") {
        const defaultRules = ["Заборонено згадувати, рекомендувати чи ставити будь-які запитання про Sui."];
        setActiveRules(defaultRules);
        localStorage.setItem("walbot_rules_" + selectedPersona.id, JSON.stringify(defaultRules));
      } else {
        setActiveRules([]);
      }
    }
  }, [selectedPersona.id]);

  // Update initial welcome message on persona change and load history
  useEffect(() => {
    const isGuest = selectedPersona.id === "user_guest";
    const welcomeText = isGuest
      ? `[SYS_INIT] GUEST MODE ENABLED.\n\nConnection to Walrus Mainnet active. Real-time blob sync enabled. Awaiting input.`
      : `[SYS_LINK] ${selectedPersona.name.toUpperCase()} AUTHENTICATED.\n\nSynchronized with ${selectedPersona.blobsCount} on-chain memories on Walrus Mainnet. Profile loaded successfully.`;

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
    
    // Close sidebar on mobile after selection
    setSidebarOpen(false);
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
        body: JSON.stringify({ message: textToSend, userId: currentUserId, activeRules }),
      });

      const data = await res.json();
      if (data.activeRules) {
        setActiveRules(data.activeRules);
        localStorage.setItem("walbot_rules_" + selectedPersona.id, JSON.stringify(data.activeRules));
      }

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
      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-cyan-400 font-semibold'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='bg-[#112233] text-cyan-300 px-1.5 py-0.5 rounded text-[11px] border border-cyan-500/30 font-mono'>$1</code>")
      .replace(/\n/g, "<br/>");
  }

  return (
    <div className="flex h-screen bg-[#050505] text-gray-200 font-sans overflow-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Mobile Header (Sidebar Toggle) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0a0a0a] border-b border-[#1a1a1a] z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="font-mono text-xs text-gray-400 font-bold uppercase">WalBot_OS</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:relative top-0 left-0 h-full w-72 bg-[#0a0a0a] border-r border-[#151515] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-[#151515]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#111] border border-[#222] flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest text-gray-100 uppercase font-mono">WalBot</h1>
              <div className="text-[10px] text-gray-500 font-mono">MEM_SYS v8.4.1</div>
            </div>
          </div>
        </div>

        {/* Personas List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          <div className="text-[10px] font-mono text-gray-600 font-bold uppercase tracking-widest mb-4 px-2">Active Entities</div>
          {PERSONAS.map((p) => {
            const active = selectedPersona.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex flex-col gap-1 group ${
                  active
                    ? "bg-[#111] border-l-2 border-cyan-500 shadow-sm shadow-cyan-900/10"
                    : "hover:bg-[#0c0c0c] border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-80">{p.avatar}</span>
                    <span className={`font-mono text-xs font-semibold ${active ? "text-cyan-400" : "text-gray-300 group-hover:text-gray-100"}`}>
                      {p.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-gray-600">{p.jpName}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono ml-7">{p.role}</div>
                {active && (
                  <div className="ml-7 mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/30 border border-cyan-900/50 text-[9px] font-mono text-cyan-400">
                    <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                    {p.blobsCount > 0 ? `${p.blobsCount} BLOB_REFS` : "LIVE_SYNC"}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* User / Settings / Proofs */}
        <div className="p-4 border-t border-[#151515] bg-[#080808]">
          <button
            onClick={() => setShowProofs(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#111] hover:bg-[#161616] border border-[#222] text-gray-400 hover:text-cyan-400 text-xs px-3 py-2.5 rounded-lg transition-all font-mono"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            System Proofs
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#050505] pt-14 md:pt-0">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] pointer-events-none" />

        {/* Top Bar for Chat */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#111] bg-[#050505]/80 backdrop-blur-sm z-10 hidden md:flex">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-mono text-xs">TARGET:</span>
            <span className="font-mono text-sm font-semibold text-cyan-400">{selectedPersona.name.toUpperCase()}</span>
            <span className="text-gray-600 text-xs px-2">|</span>
            <span className="text-gray-500 text-xs font-mono">{selectedPersona.description}</span>
          </div>
          <button
            onClick={() => setMessages([{ id: "sys-" + Date.now(), role: "bot", text: "[SYS_CLEAR] Terminal purged.", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }])}
            className="text-[10px] text-gray-500 hover:text-cyan-400 font-mono px-2 py-1 rounded hover:bg-[#111] transition-all"
          >
            /clear
          </button>
        </div>

        {/* Active Constraints / Rules Banner */}
        {activeRules.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-6 py-2 bg-[#090909] border-b border-[#161616] text-xs font-mono z-10">
            <span className="text-cyan-400 font-semibold flex items-center gap-1.5 text-[10px] tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Active Constraints:
            </span>
            {activeRules.map((rule, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-950/30 border border-red-900/50 text-red-300 text-[11px]"
              >
                <span>🛑 {rule}</span>
                <button
                  title="Скасувати це правило"
                  onClick={() => {
                    const updated = activeRules.filter((_, i) => i !== idx);
                    setActiveRules(updated);
                    localStorage.setItem("walbot_rules_" + selectedPersona.id, JSON.stringify(updated));
                  }}
                  className="hover:text-white ml-1 text-gray-500 font-bold transition-colors"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:px-12 space-y-6 scroll-smooth z-10 custom-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const isBot = msg.role === "bot";
            const hasSnippets = msg.recalledSnippets && msg.recalledSnippets.length > 0;
            const isExpanded = expandedSnippets[msg.id];

            return (
              <div key={msg.id} className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"} items-start w-full max-w-4xl mx-auto`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                  isUser ? "bg-cyan-900/30 border-cyan-700/50 text-cyan-400" : "bg-[#111] border-[#222] text-gray-400"
                }`}>
                  {isUser ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> : "🦭"}
                </div>

                <div className={`flex flex-col gap-1.5 min-w-[10%] max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">{isUser ? "You" : selectedPersona.name}</span>
                    <span className="text-[9px] font-mono text-gray-600">{msg.timestamp}</span>
                  </div>

                  {msg.hasMemory && isBot && (
                    <div className="flex items-center gap-2 bg-[#0c1218] border border-cyan-900/40 rounded px-2.5 py-1 text-[10px] text-cyan-500 font-mono">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span>WALRUS_SYNC</span>
                      {hasSnippets && (
                        <button onClick={() => toggleSnippet(msg.id)} className="ml-2 text-cyan-600 hover:text-cyan-300">
                          {isExpanded ? "[-]" : "[+]"}
                        </button>
                      )}
                    </div>
                  )}

                  {isExpanded && hasSnippets && (
                    <div className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-3 text-[11px] font-mono text-gray-400 space-y-2 mt-1">
                      <div className="text-cyan-600/80 uppercase">Decoded blob shards:</div>
                      {msg.recalledSnippets!.map((snip, idx) => (
                        <div key={idx} className="bg-[#111] p-2 rounded border border-[#1a1a1a] text-gray-300 border-l-2 border-l-cyan-900">
                          {snip}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`px-4 py-3 text-[13px] leading-relaxed rounded-xl ${
                    isUser
                      ? "bg-cyan-950/20 border border-cyan-900/30 text-gray-100 rounded-tr-none"
                      : "bg-[#0a0a0a] border border-[#1a1a1a] text-gray-300 rounded-tl-none shadow-sm"
                  }`}>
                    <div dangerouslySetInnerHTML={{ __html: renderFormatted(msg.text) }} />
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-4 items-start w-full max-w-4xl mx-auto">
              <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center flex-shrink-0 text-gray-400">
                🦭
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse delay-75" />
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse delay-150" />
                <span className="text-[10px] font-mono text-gray-500 ml-2">AWAITING_RESPONSE...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-20 shrink-0">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
            
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedPersona.prompts.map((pt, i) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => handleSend(pt)}
                  className="bg-[#0a0a0a] hover:bg-[#111] border border-[#1a1a1a] hover:border-cyan-900/50 text-gray-400 hover:text-cyan-400 text-[11px] px-3 py-1.5 rounded-full transition-all font-mono disabled:opacity-50"
                >
                  {pt}
                </button>
              ))}
            </div>

            <div className="relative group">
              <textarea
                className="w-full bg-[#0a0a0a] border border-[#222] focus:border-cyan-500/50 rounded-xl text-gray-100 placeholder-gray-600 text-sm px-4 py-4 pr-14 resize-none outline-none transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-sans"
                placeholder="Type a message..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="absolute right-2.5 top-2.5 w-9 h-9 rounded-lg bg-[#111] hover:bg-cyan-950 border border-[#222] hover:border-cyan-800 text-gray-400 hover:text-cyan-400 flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-[#111] disabled:hover:border-[#222] disabled:hover:text-gray-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V6m0 0l-7 7m7-7l7 7" /></svg>
              </button>
            </div>
            <div className="text-center text-[9px] font-mono text-gray-600 mt-1">
              Powered by Walrus Protocol • Google Gemini • {selectedPersona.id === 'user_guest' ? 'Live Mode' : 'History Loaded'}
            </div>
          </div>
        </div>
      </main>

      {/* Proofs Modal */}
      {showProofs && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#222] rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowProofs(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300">✕</button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-cyan-950/30 text-cyan-500 flex items-center justify-center">⛓️</div>
              <div>
                <h3 className="text-sm font-bold text-gray-100 uppercase tracking-widest font-mono">System Integrity</h3>
                <p className="text-[10px] text-gray-500 font-mono">Cryptographic storage proofs & audit trail</p>
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="bg-[#111] p-3 rounded border border-[#1a1a1a]">
                <div className="text-gray-500 text-[10px] uppercase mb-1">Walrus Account ID:</div>
                <div className="text-cyan-400 break-all">0xd9a91eb8875e869b0636502cc47a8229a6469a87f2aca36c5cbef43bdb31e2f0</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111] p-3 rounded border border-[#1a1a1a]">
                  <div className="text-gray-500 text-[10px] uppercase mb-1">Status:</div>
                  <div className="text-gray-200">29 Blobs Verified</div>
                </div>
                <div className="bg-[#111] p-3 rounded border border-[#1a1a1a]">
                  <div className="text-gray-500 text-[10px] uppercase mb-1">Endpoint:</div>
                  <div className="text-gray-200">relayer.memory.walrus.xyz</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
