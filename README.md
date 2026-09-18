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
- 🧠 **Cross-Session Memory:** Remembers what topics you've covered, your technical stack, and your learning progress.
- 🌐 **Decentralized & Portable:** All memory entries are cryptographically signed and stored on Walrus decentralized storage — no centralized database required.
- ⚡ **Seamless Web2 UX with Web3 Power:** Users interact with a responsive chat interface without needing browser extensions or crypto wallets; the server handles Mainnet interactions securely.
- 🤖 **Beyond the Big Two:** Powered by **Google Gemini API** (`gemini-2.5-flash` / `gemini-3.6-flash`), qualifying for the open-model prize track.

---

## 🏗️ Architecture

```
User Browser (Session / LocalStorage ID)
                 │
                 ▼  POST /api/chat { message, userId }
┌─────────────────────────────────────────────────────────┐
│ Next.js Backend                                         │
│                                                         │
│  1. memwal.recall({ query: userMessage })               │
│     └─► Semantic search in Walrus Mainnet               │
│                                                         │
│  2. Inject memories into Gemini System Prompt           │
│     └─► "📚 What you remember about this user: ..."     │
│                                                         │
│  3. Generate response via Google Gemini API             │
│                                                         │
│  4. memwal.remember(`[userId] Q: ... | A: ...`)         │
│     └─► Stores new verifiable memory blob on Walrus     │
└─────────────────────────────────────────────────────────┘
                 │
                 ▼  JSON { reply, hasMemory: true/false }
         Bot UI Response
```

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/walrus-memory-bot.git
cd walrus-memory-bot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory:

```env
# Walrus Memory Credentials (from https://memory.walrus.xyz)
MEMWAL_PRIVATE_KEY=your_walrus_delegate_private_key_hex
MEMWAL_ACCOUNT_ID=your_walrus_account_id
MEMWAL_SERVER_URL=https://relayer.memory.walrus.xyz

# Google Gemini API Key (from https://aistudio.google.com/apikey)
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🧪 Testing Memory in Action

1. **Session 1:** Introduce yourself and mention what you're building:
   > *"Hi! I'm Anna, a frontend developer building a DApp with Next.js and Walrus."*
2. **Session 2:** Open a new incognito window or refresh after a while:
   > *"What is my tech stack and what project am I working on?"*
3. **Result:** WalBot displays the `🧠 Using your memory` badge and recalls your name and stack from the Walrus Mainnet storage!

---

## 📦 Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Decentralized Storage:** [`@mysten-incubation/memwal`](https://www.npmjs.com/package/@mysten-incubation/memwal) on Walrus Mainnet
- **LLM:** [`@google/generative-ai`](https://www.npmjs.com/package/@google/generative-ai) (Google Gemini API)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

---

## 📄 License

MIT © 2026
