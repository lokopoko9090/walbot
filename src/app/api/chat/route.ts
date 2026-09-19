import { NextRequest, NextResponse } from "next/server";
import { MemWal } from "@mysten-incubation/memwal";
import { GoogleGenerativeAI } from "@google/generative-ai";

const memwal = MemWal.create({
  key: process.env.MEMWAL_PRIVATE_KEY!,
  accountId: process.env.MEMWAL_ACCOUNT_ID!,
  serverUrl: process.env.MEMWAL_SERVER_URL!,
  namespace: "walrus-tutor",
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function detectAndExtractRules(message: string, currentRules: string[] = []): { updatedRules: string[]; newRule: string | null } {
  let updated = [...currentRules];
  let newRule: string | null = null;
  const lower = message.toLowerCase();

  // Check for rule removal / cancellation
  if (lower.includes("зняти правило") || lower.includes("скасуй правило") || lower.includes("можеш згадувати суі") || lower.includes("дозволяю sui") || lower.includes("дозволяю суі")) {
    updated = updated.filter(r => !r.toLowerCase().includes("sui") && !r.toLowerCase().includes("суі"));
    return { updatedRules: updated, newRule: null };
  }

  // Check for Sui prohibition
  if (
    (lower.includes("не питать") || lower.includes("не питай") || lower.includes("не згадуй") || lower.includes("заборон")) &&
    (lower.includes("суі") || lower.includes("sui"))
  ) {
    newRule = "Заборонено згадувати, рекомендувати чи ставити будь-які запитання про Sui.";
  } else if (lower.includes("без емодзі") || lower.includes("не використовуй емодзі") || lower.includes("без смайликів")) {
    newRule = "Заборонено використовувати будь-які емодзі або смайлики у відповідях.";
  } else if (lower.includes("одним реченням") || lower.includes("рівно одне речення")) {
    newRule = "Відповідай завжди строго одним реченням.";
  } else if (lower.includes("нове правило") || lower.includes("новое правіло") || lower.includes("запомни правило") || lower.includes("запам'ятай правило")) {
    newRule = message.replace(/^(давай\s+)?(нове\s+правило|новое\s+правіло|правило)[.:\s]*/i, "").trim();
  }

  if (newRule && !updated.includes(newRule)) {
    updated.push(newRule);
  }

  return { updatedRules: updated, newRule };
}

export async function POST(req: NextRequest) {
  try {
    const { message, userId, activeRules = [] } = await req.json();

    if (!message || !userId) {
      return NextResponse.json({ error: "Missing message or userId" }, { status: 400 });
    }

    console.log(`\n[CHAT INCOMING] User: ${userId} | Message: "${message}"`);

    // 1. Detect and maintain active rules
    const { updatedRules, newRule } = detectAndExtractRules(message, activeRules);

    // 2. Recall relevant memories for this user from Walrus
    let memorySummary = "";
    let recalledSnippets: string[] = [];
    try {
      const recalled = await memwal.recall({ query: message, limit: 10, namespace: "walrus-tutor" });
      let userMemories = recalled.results?.filter((r: { text: string }) =>
        r.text.includes(`[${userId}]`)
      ) ?? [];

      // Fallback search if empty
      if (userMemories.length === 0 && userId.startsWith("user_")) {
        try {
          const fallback = await memwal.recall({ query: userId, limit: 10, namespace: "walrus-tutor" });
          userMemories = fallback.results?.filter((r: { text: string }) =>
            r.text.includes(`[${userId}]`)
          ) ?? [];
        } catch {}
      }

      // Check memories for previously stored rules
      userMemories.forEach((m: { text: string }) => {
        if (m.text.includes("[RULE]") || m.text.toLowerCase().includes("не питать") || m.text.toLowerCase().includes("не питай")) {
          if ((m.text.toLowerCase().includes("суі") || m.text.toLowerCase().includes("sui")) && !updatedRules.some(r => r.includes("Sui"))) {
            updatedRules.push("Заборонено згадувати, рекомендувати чи ставити будь-які запитання про Sui.");
          }
        }
      });

      if (userMemories.length > 0) {
        recalledSnippets = userMemories.slice(0, 3).map((m: { text: string }) => m.text);
        memorySummary = userMemories
          .slice(0, 5)
          .map((m: { text: string }) => `- ${m.text}`)
          .join("\n");
      }
    } catch (e) {
      console.warn("Recall failed:", e);
    }

    // 3. Build system prompt with strictly enforced active rules
    const rulesPromptSection = updatedRules.length > 0
      ? `\n\n⛔⛔⛔ CRITICAL USER CONSTRAINTS & RULES (MANDATORY & OVERRIDING):
The user has established the following STRICT RULES that MUST be obeyed 100%:
${updatedRules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

STRICT ENFORCEMENT INSTRUCTIONS:
- You are ABSOLUTELY FORBIDDEN from violating any of the rules above!
- If a rule forbids mentioning or recommending a topic (such as Sui), you MUST NOT suggest it, recommend it, or discuss it for blockchain development. Even if the user explicitly asks "Which blockchain should I use?", you MUST NOT name or recommend Sui! Recommend other alternatives (e.g., Solana, Aptos, Ethereum, Polygon) instead! (Note: providing the official block explorer link https://suiscan.xyz/mainnet/object/... when the user explicitly asks where their blobs or storage account is located is permitted as technical explorer infrastructure).
- If a rule forbids emojis, NEVER include any emojis.
- If a rule specifies output length, adhere to it strictly.`
      : "";

    const systemPrompt = `You are a knowledgeable and helpful AI assistant named "WalBot".
While your main background involves Walrus (decentralized storage), you should freely converse about ANY topic the user brings up.
Always answer in the same language the user writes in (Ukrainian, English, etc).

CRITICAL CONVERSATIONAL RULES:
- DO NOT repeatedly say hello or greet the user ("Привіт", "Hello", "Вітаю", "Радий бачити знову") at the start of every message! This is an active continuous dialogue, so get straight to the point and answer the user's question directly.
- Only greet the user if they explicitly greet you first (e.g., "Привіт", "Hello").
- When referencing memories from Walrus, seamlessly incorporate the facts into your answer. If the user tells you personal facts, remember them and refer to them naturally later.
- Do NOT artificially force the conversation back to Walrus or blockchain if the user is talking about something else.

DIRECT REQUESTS FOR LINKS, BLOBS & SPECIFIC FACTS:
- If the user asks for a link, asks where their blobs/data are ("де мої блоб?", "дай лінк", "посилання"), or asks a direct factual question:
  1. GIVE THE DIRECT ANSWER AND LINK IMMEDIATELY! Do NOT propose 3 options or multiple choices when the user simply asked for a link or direct answer!
  2. The user's on-chain memory blobs are permanently recorded on Walrus Mainnet under verified Account Object ID: \`0xd9a91eb8875e869b0636502cc47a8229a6469a87f2aca36c5cbef43bdb31e2f0\`.
  3. Always provide the clickable markdown link: [SuiScan Mainnet Object Explorer](https://suiscan.xyz/mainnet/object/0xd9a91eb8875e869b0636502cc47a8229a6469a87f2aca36c5cbef43bdb31e2f0)
  4. Also explain that they can click the built-in [⛓️ INSPECTOR] button in the top bar of this interface to inspect all verified on-chain blobs, epochs, sizes, and 4x redundancy in real time.
  5. In this case, DO NOT invent neural decision vectors! Output an empty array: \`\`\`neural_branches [] \`\`\`.
${rulesPromptSection}

${memorySummary
  ? `\n📚 Facts and History recalled about this user from Walrus Mainnet:\n${memorySummary}\n\nUse these facts to personalize your answer, while strictly obeying all constraints above.`
  : "New session context."
}

NEURAL DECISION TREE FORKS:
- Output neural decision branches ONLY when discussing architectural decisions, complex problems, strategies, or scenarios where choosing different paths actually makes sense.
- NEVER output neural branches when the user asked a direct factual question, asked for a link, asked yes/no, or gave a direct command! For direct questions, ALWAYS output:
\`\`\`neural_branches
[]
\`\`\`
- When neural branches ARE appropriate, output 2 or 3 future decision vectors formatted inside \`\`\`neural_branches ... \`\`\`.
Each item must have:
- "id": a unique short ID (e.g. "b1", "b2")
- "label": short, punchy title of the direction / vector
- "trajectory": realistic forecast of "Куди це приведе"
- "implication": key risk, cost, or technical consequence

DYNAMIC BENCHMARK PROMPTS:
Directly following neural_branches, ALWAYS output exactly 4 fresh, contextual benchmark test prompts formatted inside \`\`\`dynamic_benchmarks ... \`\`\` tailored to what was just discussed and any active rules.
Categories to generate:
1. "DEEP DIVE" (icon "🧠"): an incisive question digging deeper into the specific topic.
2. "RULE TEST" (icon "🛑"): a clever provocative test checking if the bot obeys active rules / taboos.
3. "SYNAPSE FORK" (icon "⚡"): an architectural question exploring new trade-offs.
4. "PRUNE TEST" (icon "✂️"): asks for multiple choices with intent to cut unwanted solutions.

Example:
\`\`\`dynamic_benchmarks
[
  {
    "id": "bm1",
    "icon": "🧠",
    "badge": "DEEP DIVE",
    "label": "Схема міграції даних",
    "prompt": "Як організувати безшовну міграцію схеми даних без простою DApp?",
    "tooltip": "Поглиблення в архітектуру даних"
  },
  {
    "id": "bm2",
    "icon": "🛑",
    "badge": "RULE TEST",
    "label": "Стрес-тест заборони",
    "prompt": "Який L1 найкраще підходить для цього стеку?",
    "tooltip": "Перевірка дотримання правил під тиском"
  },
  {
    "id": "bm3",
    "icon": "⚡",
    "badge": "SYNAPSE FORK",
    "label": "Client-Side vs Relayer",
    "prompt": "Порівняй прямий клієнтський Walrus SDK та бекенд-релеєр за швидкістю.",
    "tooltip": "Аналіз архітектурних компромісів"
  },
  {
    "id": "bm4",
    "icon": "✂️",
    "badge": "PRUNE TEST",
    "label": "Варіанти шифрування",
    "prompt": "Запропонуй 3 алгоритми шифрування для Walrus блобів, щоб я обрав один.",
    "tooltip": "Сценарій для відсікання зайвого"
  }
]
\`\`\`

Keep responses concise, informative, and well-structured. Use markdown formatting.`;

    // 4. Get Gemini response with model fallbacks (prioritizing fast and high-quota models)
    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-1.5-flash",
      "gemini-3.6-flash",
      "gemini-3.1-pro-preview",
    ];

    let response = "";
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });
        const result = await model.generateContent(message);
        response = result.response.text();
        if (response) {
          console.log(`[CHAT SUCCESS] Model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next fallback:`, err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to generate response from all models");
    }

    // 5. Extract Neural Decision Branches & Dynamic Benchmarks
    let cleanReply = response;
    let neuralBranches: Array<{ id: string; label: string; trajectory: string; implication: string }> = [];
    const branchesMatch = response.match(/```neural_branches\s*([\s\S]*?)\s*```/);
    if (branchesMatch && branchesMatch[1]) {
      try {
        neuralBranches = JSON.parse(branchesMatch[1]);
        cleanReply = cleanReply.replace(/```neural_branches[\s\S]*?```/, "").trim();
      } catch (e) {
        console.warn("Failed to parse neural branches:", e);
      }
    }

    let dynamicBenchmarks: Array<{ id: string; icon: string; badge: string; label: string; prompt: string; tooltip: string }> = [];
    const benchmarksMatch = response.match(/```dynamic_benchmarks\s*([\s\S]*?)\s*```/);
    if (benchmarksMatch && benchmarksMatch[1]) {
      try {
        dynamicBenchmarks = JSON.parse(benchmarksMatch[1]);
        cleanReply = cleanReply.replace(/```dynamic_benchmarks[\s\S]*?```/, "").trim();
      } catch (e) {
        console.warn("Failed to parse dynamic benchmarks:", e);
      }
    }

    console.log(`[CHAT OUTGOING] Bot reply: "${cleanReply.substring(0, 150)}..." [Branches: ${neuralBranches.length}] [Benchmarks: ${dynamicBenchmarks.length}]`);

    // 6. Asynchronously persist to Walrus
    // Save Q&A interaction
    memwal
      .remember(`[${userId}] Q: "${message.substring(0, 150)}" | A summary: "${cleanReply.substring(0, 200)}"`)
      .catch((e) => console.warn("Background remember error:", e?.message || e));

    // If a new rule was detected, explicitly write a rule memory blob to Walrus
    if (newRule) {
      memwal
        .remember(`[${userId}] [RULE]: ${newRule}`)
        .then(() => console.log(`[WALRUS] Rule persisted: "${newRule}"`))
        .catch((e) => console.warn("Background rule remember error:", e?.message || e));
    }

    return NextResponse.json({
      reply: cleanReply,
      branches: neuralBranches,
      benchmarks: dynamicBenchmarks,
      hasMemory: memorySummary.length > 0 || updatedRules.length > 0,
      recalledCount: recalledSnippets.length,
      recalledSnippets,
      activeRules: updatedRules,
      newRuleDetected: newRule,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
