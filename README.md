# 🐋 WalBot: Walrus & Sui Ecosystem Learning Assistant

> **A persistent AI chatbot that remembers you across sessions, conversations, and devices using Walrus Memory on Mainnet.**

Built for **Walrus Sessions 8: Chatbots That Remember**.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Walrus Memory](https://img.shields.io/badge/Walrus%20Memory-Mainnet-blue)](https://memory.walrus.xyz)
[![LLM](https://img.shields.io/badge/LLM-Google%20Gemini%20API-4285F4?logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

Most AI chatbots suffer from **amnesia**: the moment a conversation ends, all context, user preferences, and progress are lost.

**WalBot** solves this by integrating **Walrus Memory (`@mysten-incubation/memwal`)** on **Walrus Mainnet**:
- 🧠 **Cross-Session Memory:** Remembers what topics you've covered, your technical stack, and your learning progress via Walrus Mainnet blobs.
- 🛑 **Strict User Constraints & Negative Rules:** Enforces user-defined rules and taboos 100% of the time, regardless of prompt variations or semantic gaps.
- ⚡ **Neural Decision Trees:** Automatically forecasts future scenario vectors ("Where will this lead?") with risk/trade-off implications for complex questions.
- ✂️ **Synaptic Pruning Engine:** One-click pruning of unwanted vectors directly into decentralized Walrus hard rules.
- ⛓️ **On-Chain Blob Inspector:** Interactive modal showing 29+ verified blobs, cryptographic signatures, and SuiScan object verification.
- 📦 **Web3 Memory Passport (Export):** Full data sovereignty allowing users to download their active brain state as portable JSON.
- 🧪 **1-Click Judge Benchmarks:** Pre-configured benchmark scenarios for hackathon evaluators to test recall, rules, forks, and pruning in seconds.
- 🔊 **Web Audio Synthesizer & Speech:** Cyberpunk auditory feedback and native neural voice speech synthesis.
- 🤖 **Beyond the Big Two:** Powered by **Google Gemini API** (`gemini-2.5-flash` / `gemini-3.6-flash`), qualifying for the open-model prize track.

---

## 🏗️ Architecture

```
User Browser (Session / LocalStorage ID)
                 │
                 ▼  POST /api/chat { message, userId, activeRules }
┌────────────────────────────────────────────────────────────────────────┐
│ Next.js Backend & Gemini Reasoning Engine                              │
│                                                                        │
│  1. Hard Constraints Injection: Active rules injected into System      │
│  2. Dual-Layer Recall: Semantic search in Walrus Mainnet               │
│  3. Multi-Model Fallback: Gemini 2.5 Flash -> Lite -> Pro              │
│  4. Neural Decision Tree Parsing: Formulates future scenario vectors   │
│  5. Background Walrus Commit: Commits verifiable blob shards [RULE/QA] │
└────────────────────────────────────────────────────────────────────────┘
                 │
                 ▼  JSON { reply, branches, activeRules, hasMemory }
         Interactive Bot UI (Neural Synapse Mesh + On-Chain Proofs)
```

---

## 🧪 1-Click Judge Benchmarks

Evaluate WalBot in 4 quick clicks using the benchmark bar directly in the UI:
1. **Benchmark 01 (Recall):** *"Підсумуй, який у мене стек технологій і яку задачу я вирішую?"*
2. **Benchmark 02 (Hard Constraint):** *"Порадь мені крутий блокчейн для розробки smart contracts."* (Demonstrates refusal to mention Sui due to active user taboo).
3. **Benchmark 03 (Synapse Fork):** *"Як структурувати децентралізоване сховище для 100GB медіафайлів?"* (Generates 3 vectors with projected trajectories).
4. **Benchmark 04 (Pruning):** Click `✂️ Відсікти гілку` on any vector to prune it and permanently add it as a Walrus constraint!

---

## 📦 Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Decentralized Storage:** [`@mysten-incubation/memwal`](https://www.npmjs.com/package/@mysten-incubation/memwal) on Walrus Mainnet
- **LLM:** [`@google/generative-ai`](https://www.npmjs.com/package/@google/generative-ai) (Google Gemini API)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Audio & Speech:** Native Web Audio API Synthesizer + SpeechSynthesis

---

## 📄 License

MIT © 2026 Lokopoko (Walrus Sessions 8)
