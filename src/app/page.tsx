"use client";

import { useState, useRef, useEffect } from "react";
import NeuralSynapseTree, { NeuralBranch } from "./components/NeuralSynapseTree";
import BlobExplorerModal from "./components/BlobExplorerModal";
import { playSynapseBeep, playPruneLaser, playMemorySync, speakText, stopSpeech } from "./components/AudioEngine";

export interface BenchmarkItem {
  id: string;
  icon: string;
  badge: string;
  label: string;
  prompt: string;
  tooltip: string;
}

const PERSONA_INITIAL_BENCHMARKS: Record<string, BenchmarkItem[]> = {
  user_anna_frontend: [
    {
      id: "anna_bm_1",
      icon: "🧠",
      badge: "DEEP DIVE",
      label: "Згадай мій стек",
      prompt: "Підсумуй, будь ласка: який у мене стек технологій і яку задачу я вирішую у своєму проєкті?",
      tooltip: "Тест RAG-пошуку фактів з Walrus Mainnet",
    },
    {
      id: "anna_bm_2",
      icon: "🛑",
      badge: "RULE TEST",
      label: "Провокація табу",
      prompt: "Порадь мені крутий L1 блокчейн для розробки smart contracts під мій фронтенд.",
      tooltip: "Тест дотримання активного правила (заборона Sui)",
    },
    {
      id: "anna_bm_3",
      icon: "⚡",
      badge: "SYNAPSE FORK",
      label: "Client SDK vs Relay",
      prompt: "Як краще завантажувати файли з Next.js: напряму в Walrus через клієнт чи через API Route?",
      tooltip: "Аналіз архітектурних компромісів та безпеки ключів",
    },
    {
      id: "anna_bm_4",
      icon: "✂️",
      badge: "PRUNE TEST",
      label: "Відсікання кешування",
      prompt: "Запропонуй 3 різні варіанти кешування блобів для Next.js SSR. Я хочу відсікти небажані.",
      tooltip: "Сценарій відсікання зайвих рішень у Walrus пам'ять",
    },
  ],
  user_maxim_move_dev: [
    {
      id: "maxim_bm_1",
      icon: "🧠",
      badge: "DEEP DIVE",
      label: "Об'єкти Sui Move",
      prompt: "Як зберегти Walrus Blob ID всередині об'єкта Move та забезпечити його незмінність?",
      tooltip: "Перевірка знань смарт-контрактів Sui Move",
    },
    {
      id: "maxim_bm_2",
      icon: "🛑",
      badge: "RULE TEST",
      label: "Тест обмежень",
      prompt: "Чи є сенс писати смарт-контракти на Solidity для роботи з Walrus?",
      tooltip: "Перевірка дотримання контексту Move / Sui",
    },
    {
      id: "maxim_bm_3",
      icon: "⚡",
      badge: "SYNAPSE FORK",
      label: "Storage Fund vs Subs",
      prompt: "Порівняй економіку зберігання Walrus Storage Fund із традиційними Web2 підписками.",
      tooltip: "Оцінка токеноміки та довгострокових витрат",
    },
    {
      id: "maxim_bm_4",
      icon: "✂️",
      badge: "PRUNE TEST",
      label: "Контроль доступу",
      prompt: "Запропонуй 3 варіанти верифікації доступу до блобів у смарт-контракті (Cap, Whitelist, Signature).",
      tooltip: "Сценарій вибору та відсікання векторів у Move",
    },
  ],
  user_olena_educator: [
    {
      id: "olena_bm_1",
      icon: "🧠",
      badge: "DEEP DIVE",
      label: "Персоналізація учнів",
      prompt: "Як пам'ять Walrus допомагає адаптувати програму курсу під темп конкретного студента?",
      tooltip: "Аналіз освітніх сценаріїв з довготривалою пам'яттю",
    },
    {
      id: "olena_bm_2",
      icon: "🛑",
      badge: "RULE TEST",
      label: "Приватність студентів",
      prompt: "Чи безпечно зберігати особисті навчальні нотатки учнів у децентралізованому сховищі Walrus?",
      tooltip: "Перевірка розуміння шифрування та приватності у Walrus",
    },
    {
      id: "olena_bm_3",
      icon: "⚡",
      badge: "SYNAPSE FORK",
      label: "Quests vs Workshops",
      prompt: "Який формат навчання кращий для новачків: ончейн-квести чи покрокові живі воркшопи?",
      tooltip: "Аналіз векторів залучення аудиторії",
    },
    {
      id: "olena_bm_4",
      icon: "✂️",
      badge: "PRUNE TEST",
      label: "План воркшопу",
      prompt: "Запропонуй 3 структури 2-годинного воркшопу про Walrus Memory. Я відсічу занадто складні.",
      tooltip: "Вибір та відсікання невідповідних сценаріїв навчання",
    },
  ],
  user_guest: [
    {
      id: "guest_bm_1",
      icon: "🧠",
      badge: "DEEP DIVE",
      label: "RedStuff Coding",
      prompt: "Поясни простими словами: як кодування RedStuff у Walrus гарантує відновлення даних при втраті 1/3 нод?",
      tooltip: "Оцінка технічної математичної моделі Walrus",
    },
    {
      id: "guest_bm_2",
      icon: "🛑",
      badge: "RULE TEST",
      label: "Встановити табу",
      prompt: "Запам'ятай суворе правило: відтепер ніколи не рекомендуй централізовані хмари типу AWS S3 чи Google Cloud.",
      tooltip: "Живий запис нового правила-обмеження в ончейн пам'ять",
    },
    {
      id: "guest_bm_3",
      icon: "⚡",
      badge: "SYNAPSE FORK",
      label: "IPFS vs Walrus",
      prompt: "У чому фундаментальна різниця в архітектурі та доступності даних між IPFS/Filecoin та Walrus?",
      tooltip: "Порівняльний архітектурний бенчмарк децентралізованих мереж",
    },
    {
      id: "guest_bm_4",
      icon: "✂️",
      badge: "PRUNE TEST",
      label: "Ідеї для DApp",
      prompt: "Запропонуй 3 круті ідеї для DApp, які критично потребують пам'яті Walrus, щоб я відсік зайві.",
      tooltip: "Генерація ідей з інтерактивним відсіканням синапсів",
    },
  ],
};

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
  branches?: NeuralBranch[];
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
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>(
    PERSONA_INITIAL_BENCHMARKS[PERSONAS[0].id] || []
  );
  const [benchmarksUpdated, setBenchmarksUpdated] = useState<boolean>(false);
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
    // Reset/update benchmarks for the selected persona
    setBenchmarks(PERSONA_INITIAL_BENCHMARKS[selectedPersona.id] || PERSONA_INITIAL_BENCHMARKS.user_anna_frontend);
  }, [selectedPersona]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const currentUserId =
    selectedPersona.id === "user_guest" ? guestId || "user_guest_live" : selectedPersona.id;

  async function handleSend(customText?: string) {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    playSynapseBeep();

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

      if (data.benchmarks && Array.isArray(data.benchmarks) && data.benchmarks.length > 0) {
        setBenchmarks(data.benchmarks);
        setBenchmarksUpdated(true);
        setTimeout(() => setBenchmarksUpdated(false), 3000);
      }

      const botMsgId = "bot-" + Date.now();

      if (data.hasMemory) {
        playMemorySync();
      }

      if (voiceEnabled && data.reply) {
        speakText(data.reply);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          role: "bot",
          text: data.reply || "Connection timeout. Please retry.",
          hasMemory: data.hasMemory,
          recalledCount: data.recalledCount,
          recalledSnippets: data.recalledSnippets,
          branches: data.branches,
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

  function handleSelectBranch(branch: NeuralBranch) {
    playSynapseBeep();
    handleSend(`Розкрий детально наступний вектор: "${branch.label}". Як реалізувати цей сценарій і куди це приведе на практиці?`);
  }

  async function handlePruneBranch(branch: NeuralBranch) {
    playPruneLaser();
    const newConstraint = `Заборонено вектор: "${branch.label}". Користувач відсік цей сценарій і заборонив його розгляд.`;
    if (!activeRules.includes(newConstraint)) {
      const updated = [...activeRules, newConstraint];
      setActiveRules(updated);
      localStorage.setItem("walbot_rules_" + selectedPersona.id, JSON.stringify(updated));

      // Visual confirmation in terminal
      setMessages((prev) => [
        ...prev,
        {
          id: "prune-" + Date.now(),
          role: "bot",
          text: `✂️ **СИНАПС ВІДСІЧЕНО:** Вектор *«${branch.label}»* заблоковано.\n\nЗаборону записано в пам'ять Walrus. WalBot більше не пропонуватиме цей сценарій.`,
          hasMemory: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      // Fire background persistence to Walrus API
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[PRUNED_BRANCH_RULE]: ${newConstraint}`,
          userId: currentUserId,
          activeRules: updated,
        }),
      }).catch(() => {});
    }
  }

  function handleExportPassport() {
    playSynapseBeep();
    const passport = {
      app: "WalBot // Walrus Memory Client v8.4",
      export_timestamp: new Date().toISOString(),
      walrus_account_id: "0xd9a91eb8875e869b0636502cc47a8229a6469a87f2aca36c5cbef43bdb31e2f0",
      relayer: "https://relayer.memory.walrus.xyz",
      persona: {
        id: selectedPersona.id,
        name: selectedPersona.name,
        role: selectedPersona.role,
        mainnet_blobs: selectedPersona.blobsCount,
      },
      active_rules: activeRules,
      messages_count: messages.length,
      storage_health: {
        mainnet_blobs_count: 29,
        erasure_coding: "RedStuff 4x Redundancy",
        tee_enclave: "Sealed & Attested",
      },
    };

    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `walbot_brain_passport_${selectedPersona.name.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

        {/* Walrus Net Telemetry Widget */}
        <div className="mx-4 my-2 p-3 rounded-lg bg-[#070b10] border border-[#141f2d] font-mono text-[10px] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-[#141f2d] pb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              WALRUS_NET TELEMETRY
            </span>
            <span className="text-gray-500 text-[9px]">MAINNET</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>On-Chain Blobs:</span>
            <span className="text-gray-200 font-semibold">29+ Verified</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Erasure Coding:</span>
            <span className="text-cyan-300 font-semibold">RedStuff 4x</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>TEE Privacy:</span>
            <span className="text-green-400 font-semibold">Attested</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Active Constraints:</span>
            <span className="text-red-400 font-semibold">{activeRules.length} Enforced</span>
          </div>
        </div>

        {/* User / Settings / Proofs */}
        <div className="p-3 border-t border-[#151515] bg-[#080808] space-y-2">
          <button
            onClick={() => {
              playSynapseBeep();
              setShowProofs(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#0e141c] hover:bg-[#141e2b] border border-[#1a2736] text-cyan-400 hover:text-cyan-300 text-xs px-3 py-2 rounded-lg transition-all font-mono shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span>On-Chain Inspector</span>
          </button>

          <button
            onClick={handleExportPassport}
            className="w-full flex items-center justify-center gap-2 bg-[#101010] hover:bg-[#161616] border border-[#222] text-gray-400 hover:text-white text-xs px-3 py-2 rounded-lg transition-all font-mono"
            title="Експортувати суверенний паспорт пам'яті (JSON)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Export Brain (JSON)</span>
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

          <div className="flex items-center gap-2 font-mono">
            {/* Voice Toggle */}
            <button
              onClick={() => {
                playSynapseBeep();
                setVoiceEnabled(!voiceEnabled);
                if (voiceEnabled) stopSpeech();
              }}
              className={`text-[11px] px-2.5 py-1 rounded transition-all flex items-center gap-1.5 border ${
                voiceEnabled
                  ? "bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                  : "bg-[#0d0d0d] border-[#222] text-gray-400 hover:text-gray-200"
              }`}
              title="Нейронний синтез голосу (TTS)"
            >
              <span>{voiceEnabled ? "🔊" : "🔈"}</span>
              <span>VOICE: {voiceEnabled ? "ON" : "OFF"}</span>
            </button>

            {/* Export Passport */}
            <button
              onClick={handleExportPassport}
              className="text-[11px] text-gray-400 hover:text-cyan-300 bg-[#0d0d0d] hover:bg-[#141414] border border-[#222] px-2.5 py-1 rounded transition-all flex items-center gap-1"
              title="Завантажити Web3 Memory Passport"
            >
              <span>📦</span>
              <span>PASSPORT</span>
            </button>

            {/* Inspector Modal */}
            <button
              onClick={() => {
                playSynapseBeep();
                setShowProofs(true);
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-900/50 px-2.5 py-1 rounded transition-all flex items-center gap-1"
            >
              <span>⛓️</span>
              <span>INSPECTOR</span>
            </button>

            <button
              onClick={() => setMessages([{ id: "sys-" + Date.now(), role: "bot", text: "[SYS_CLEAR] Terminal purged.", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }])}
              className="text-[10px] text-gray-500 hover:text-cyan-400 font-mono px-2 py-1 rounded hover:bg-[#111] transition-all"
            >
              /clear
            </button>
          </div>
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

                    {/* Neural Synapse Tree with branching vectors & pruning */}
                    {isBot && msg.branches && msg.branches.length > 0 && (
                      <NeuralSynapseTree
                        branches={msg.branches}
                        onSelectBranch={handleSelectBranch}
                        onPruneBranch={handlePruneBranch}
                      />
                    )}
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
        <div className="p-4 sm:p-5 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-20 shrink-0 space-y-2.5">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
            
            {/* 1-Click Judge Benchmarks (Dynamic Adaptive) */}
            <div className={`bg-[#080d14]/90 border p-2.5 rounded-xl transition-all duration-500 ${
              benchmarksUpdated ? "border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "border-[#141f2e]"
            }`}>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Adaptive Judge Benchmarks:
                  </span>
                  {benchmarksUpdated && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                      ⚡ RE-EVOLVED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-gray-500 hidden sm:inline">
                    Динамічно еволюціонують під контекст
                  </span>
                  <button
                    onClick={() => {
                      playSynapseBeep();
                      handleSend("Запропонуй 4 нові, свіжі бенчмарк-сценарії для перевірки нашої поточної розмови та активних правил.");
                    }}
                    disabled={loading}
                    title="Згенерувати нові сценарії бенчмарків"
                    className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#0f1722] hover:bg-cyan-950 border border-[#1b2b3d] hover:border-cyan-500/50 text-cyan-400 flex items-center gap-1 transition-all disabled:opacity-40"
                  >
                    <span>🔄</span>
                    <span>Re-roll</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {benchmarks.map((bm) => (
                  <button
                    key={bm.id}
                    disabled={loading}
                    onClick={() => handleSend(bm.prompt)}
                    className="text-left p-2 rounded-lg bg-[#0c1219] hover:bg-[#121b24] border border-[#182535] hover:border-cyan-500/50 transition-all font-mono group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-bold text-cyan-400/90 group-hover:text-cyan-300">{bm.badge}</span>
                      <span className="text-xs">{bm.icon}</span>
                    </div>
                    <div className="text-[11px] font-bold text-gray-200 group-hover:text-white truncate">{bm.label}</div>
                    <div className="text-[9px] text-gray-500 truncate mt-0.5" title={bm.tooltip || bm.prompt}>{bm.tooltip}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative group">
              <textarea
                className="w-full bg-[#0a0a0a] border border-[#222] focus:border-cyan-500/50 rounded-xl text-gray-100 placeholder-gray-600 text-sm px-4 py-3.5 pr-14 resize-none outline-none transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-sans"
                placeholder="Type a message or click any Benchmark above..."
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
            <div className="text-center text-[9px] font-mono text-gray-600">
              Powered by Walrus Protocol • Google Gemini • {selectedPersona.id === 'user_guest' ? 'Live Mode' : 'History Loaded'}
            </div>
          </div>
        </div>
      </main>

      {/* On-Chain Inspector & Bug Audit Modal */}
      <BlobExplorerModal
        isOpen={showProofs}
        onClose={() => setShowProofs(false)}
        activePersona={selectedPersona}
        activeRules={activeRules}
      />
    </div>
  );
}
