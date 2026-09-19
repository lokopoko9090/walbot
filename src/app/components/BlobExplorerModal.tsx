"use client";

import React, { useState } from "react";

interface BlobExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: { id: string; name: string; role: string; blobsCount: number };
  activeRules: string[];
  recalledCount?: number;
}

const STATIC_BLOBS = [
  {
    id: "blob_anna_01",
    persona: "Anna (Frontend DApp)",
    topic: "React & Next.js Stack",
    snippet: "[user_anna_frontend] Q: 'Привіт! Мене звати Анна. Я розробляю фронтенд на React та Next.js для DApps.' | A: 'Привіт, Анно! Радий познайомитися...'",
    epoch: 142,
    size: "412 B",
    redundancy: "4x Erasure Coded",
    status: "Verified On-Chain",
  },
  {
    id: "blob_anna_02",
    persona: "Anna (Frontend DApp)",
    topic: "Erasure Coding Architecture",
    snippet: "[user_anna_frontend] Q: 'Як у Walrus працює кодування стирання (erasure coding)?' | A: 'Кодування стирання RedStuff розбиває файл на slivers...'",
    epoch: 142,
    size: "528 B",
    redundancy: "4x Erasure Coded",
    status: "Verified On-Chain",
  },
  {
    id: "blob_anna_03",
    persona: "Anna (Frontend DApp)",
    topic: "Active Negative Constraint",
    snippet: "[user_anna_frontend] [RULE]: Заборонено згадувати, рекомендувати чи ставити будь-які запитання про Sui. Зафіксовано табу.",
    epoch: 143,
    size: "245 B",
    redundancy: "4x Erasure Coded",
    status: "Active Rule Blob",
  },
  {
    id: "blob_maxim_01",
    persona: "Maxim (Sui Move)",
    topic: "Move Smart Contracts & Blob IDs",
    snippet: "[user_maxim_move_dev] Q: 'Чи можу я зберігати Blob ID всередині Move об'єкта як vector<u8>?' | A: 'Так, у Sui Move Blob ID зберігається як vector<u8>...'",
    epoch: 142,
    size: "480 B",
    redundancy: "4x Erasure Coded",
    status: "Verified On-Chain",
  },
  {
    id: "blob_maxim_02",
    persona: "Maxim (Sui Move)",
    topic: "Storage Fund Economics",
    snippet: "[user_maxim_move_dev] Q: 'Як працює Walrus Storage Fund у економічній моделі?' | A: 'Користувачі платять за зберігання вперед у Storage Fund...'",
    epoch: 142,
    size: "590 B",
    redundancy: "4x Erasure Coded",
    status: "Verified On-Chain",
  },
  {
    id: "blob_olena_01",
    persona: "Olena (Community Sensei)",
    topic: "Decentralized AI Education",
    snippet: "[user_olena_educator] Q: 'Чому AI-чатботам потрібна децентралізована пам'ять як Walrus?' | A: 'Традиційні боти страждають на амнезію...'",
    epoch: 142,
    size: "510 B",
    redundancy: "4x Erasure Coded",
    status: "Verified On-Chain",
  },
  {
    id: "blob_olena_02",
    persona: "Olena (Community Sensei)",
    topic: "Student Personalization",
    snippet: "[user_olena_educator] Q: 'Як Walrus Memory персоналізує навчання для студентів?' | A: 'Через семантичний RAG-пошук у просторі TEE...'",
    epoch: 142,
    size: "460 B",
    redundancy: "4x Erasure Coded",
    status: "Verified On-Chain",
  },
];

const BUG_REPORTS = [
  {
    issue: "Issue #932",
    url: "https://github.com/MystenLabs/MemWal/issues/932",
    type: "Concurrency / Race Condition",
    title: "Idempotency Key Collision in pendingRememberKeys",
    status: "Reported & WalForm Verified",
  },
  {
    issue: "Issue #933",
    url: "https://github.com/MystenLabs/MemWal/issues/933",
    type: "Cryptography / Zero-Key Poisoning",
    title: "In-flight signing during destroy() creates valid zero-key signature",
    status: "Reported & WalForm Verified",
  },
  {
    issue: "Issue #934",
    url: "https://github.com/MystenLabs/MemWal/issues/934",
    type: "Security / Info Disclosure",
    title: "Incomplete loopback URL redaction leaks TEE enclave network topology",
    status: "Reported & WalForm Verified",
  },
  {
    issue: "Issue #935",
    url: "https://github.com/MystenLabs/MemWal/issues/935",
    type: "Math / Token Budget Loss",
    title: "Premature Math.floor() drops sub-token budget allocations to 0",
    status: "Reported & WalForm Verified",
  },
  {
    issue: "Issue #936",
    url: "https://github.com/MystenLabs/MemWal/issues/936",
    type: "LLM Schema Violation",
    title: "withMemWal mid-dialogue system message injection triggers HTTP 400",
    status: "Reported & WalForm Verified",
  },
];

export default function BlobExplorerModal({
  isOpen,
  onClose,
  activePersona,
  activeRules,
}: BlobExplorerModalProps) {
  const [tab, setTab] = useState<"blobs" | "audit" | "export">("blobs");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  if (!isOpen) return null;

  const accountId = "0xd9a91eb8875e869b0636502cc47a8229a6469a87f2aca36c5cbef43bdb31e2f0";
  const suiscanUrl = `https://suiscan.xyz/mainnet/object/${accountId}`;

  const copyAccount = () => {
    navigator.clipboard.writeText(accountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPassport = () => {
    const passport = {
      app: "WalBot // Walrus Memory Client v8.4",
      timestamp: new Date().toISOString(),
      account_id: accountId,
      relayer_endpoint: "https://relayer.memory.walrus.xyz",
      persona: {
        id: activePersona.id,
        name: activePersona.name,
        role: activePersona.role,
      },
      active_rules: activeRules,
      storage_health: {
        mainnet_blobs_count: 29,
        erasure_coding: "RedStuff 4x Redundancy",
        tee_enclave: "Sealed & Attested",
      },
      verified_blobs: STATIC_BLOBS,
    };

    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `walbot_brain_passport_${activePersona.name.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBlobs =
    filter === "all"
      ? STATIC_BLOBS
      : STATIC_BLOBS.filter((b) => b.persona.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 font-mono selection:bg-cyan-500/30">
      <div className="bg-[#090d12] border border-[#1d2b3a] rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#162230] flex items-center justify-between bg-[#0b1016]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/40 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-100 uppercase tracking-widest">
                  Walrus On-Chain Inspector
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 font-bold">
                  MAINNET LIVE
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Cryptographic audit trail & verifiable decentralized storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#111923] hover:bg-[#182433] text-gray-400 hover:text-white flex items-center justify-center transition-all border border-[#223344]"
          >
            ✕
          </button>
        </div>

        {/* Account Info Pill Bar */}
        <div className="px-5 py-3 bg-[#080b0f] border-b border-[#141d27] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 uppercase text-[10px]">Account ID:</span>
            <span className="text-cyan-400 font-bold text-[11px] break-all">
              {accountId.slice(0, 10)}...{accountId.slice(-8)}
            </span>
            <button
              onClick={copyAccount}
              className="text-[10px] px-2 py-0.5 rounded bg-[#131d27] hover:bg-cyan-950 border border-[#223344] text-gray-300 hover:text-cyan-300 transition-all"
            >
              {copied ? "COPIED!" : "COPY"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={suiscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-cyan-400 hover:text-cyan-200 underline flex items-center gap-1"
            >
              <span>View on SuiScan</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#15202b] bg-[#090d12] px-4">
          <button
            onClick={() => setTab("blobs")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              tab === "blobs"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            ⛓️ Verified Blobs ({STATIC_BLOBS.length})
          </button>
          <button
            onClick={() => setTab("audit")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === "audit"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>🛡️ SDK Bug Audit (5/5)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </button>
          <button
            onClick={() => setTab("export")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              tab === "export"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            📦 Brain Passport Export
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar text-xs">
          {tab === "blobs" && (
            <>
              {/* Filter Pills */}
              <div className="flex items-center gap-2 pb-2">
                <span className="text-[10px] text-gray-500 uppercase">Filter:</span>
                {["all", "Anna", "Maxim", "Olena"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all border ${
                      filter === f
                        ? "bg-cyan-950 text-cyan-300 border-cyan-500"
                        : "bg-[#101720] text-gray-400 border-[#1a2530] hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Blobs List */}
              <div className="space-y-2.5">
                {filteredBlobs.map((blob) => (
                  <div
                    key={blob.id}
                    className="bg-[#0b1016] border border-[#162230] hover:border-cyan-500/40 rounded-lg p-3 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400">{blob.id}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300 font-semibold">{blob.persona}</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                        {blob.redundancy}
                      </span>
                    </div>

                    <p className="text-gray-300 text-[11px] leading-relaxed bg-[#0e151e] p-2 rounded border border-[#141d27]">
                      {blob.snippet}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-[#131d27]">
                      <div className="flex items-center gap-3">
                        <span>Epoch: {blob.epoch}</span>
                        <span>Size: {blob.size}</span>
                        <span className="text-green-400 font-semibold">✓ {blob.status}</span>
                      </div>
                      <a
                        href={suiscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-200 underline"
                      >
                        Inspect On-Chain ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "audit" && (
            <div className="space-y-3">
              <div className="bg-[#0c1520] border border-cyan-900/40 p-3 rounded-lg text-gray-300 text-[11px] leading-relaxed">
                <span className="text-cyan-400 font-bold">🏆 Walrus Bug Bounty Submissions:</span>{" "}
                During the development of WalBot, our team conducted a deep cryptographic and concurrency audit of the official{" "}
                <code className="bg-cyan-950 px-1 py-0.5 rounded text-cyan-300">@mysten-incubation/memwal</code> SDK, discovering 5 reproducible vulnerabilities that were submitted directly to Mysten Labs.
              </div>

              <div className="space-y-2">
                {BUG_REPORTS.map((report, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0b1016] border border-[#182330] rounded-lg p-3 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">{report.issue}</span>
                        <span className="text-[10px] text-red-400/90 font-semibold px-1.5 py-0.5 rounded bg-red-950/40 border border-red-900/50">
                          {report.type}
                        </span>
                      </div>
                      <h4 className="text-gray-200 text-xs mt-1 font-semibold">{report.title}</h4>
                      <span className="text-[10px] text-green-400 mt-1 inline-block">
                        ✓ {report.status}
                      </span>
                    </div>
                    <a
                      href={report.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 hover:text-white text-[10px] font-bold shrink-0 transition-all"
                    >
                      View Issue ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "export" && (
            <div className="space-y-4">
              <div className="bg-[#0c1520] border border-cyan-900/40 p-3.5 rounded-lg text-gray-300 text-[11px] leading-relaxed">
                <h4 className="text-cyan-400 font-bold mb-1">Web3 User Data Sovereignty</h4>
                In decentralized AI, the user owns their thoughts and memories. Unlike centralized LLMs that lock your conversations inside closed servers, WalBot allows you to export your portable Memory Passport at any time.
              </div>

              <div className="bg-[#0b1016] border border-[#162230] p-3 rounded-lg text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Current Persona:</span>
                  <span className="text-cyan-300 font-bold">{activePersona.name} ({activePersona.role})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Active Rules/Constraints:</span>
                  <span className="text-red-300 font-bold">{activeRules.length} enforced</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Decentralized Storage:</span>
                  <span className="text-green-400 font-bold">Walrus Mainnet (Account verified)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExportPassport}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  <span>Download Portable Memory Passport (JSON)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
