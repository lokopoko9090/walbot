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

export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json();

    if (!message || !userId) {
      return NextResponse.json({ error: "Missing message or userId" }, { status: 400 });
    }

    // 1. Recall relevant memories for this user
    let memorySummary = "";
    let recalledSnippets: string[] = [];
    try {
      const recalled = await memwal.recall({ query: message, limit: 10, namespace: "walrus-tutor" });
      let userMemories = recalled.results?.filter((r: { text: string }) =>
        r.text.includes(`[${userId}]`)
      ) ?? [];

      // If specific query didn't find user memory, fallback to searching user profile
      if (userMemories.length === 0 && userId.startsWith("user_")) {
        try {
          const fallback = await memwal.recall({ query: userId, limit: 10, namespace: "walrus-tutor" });
          userMemories = fallback.results?.filter((r: { text: string }) =>
            r.text.includes(`[${userId}]`)
          ) ?? [];
        } catch {}
      }

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

    // 2. Build system prompt with memory
    const systemPrompt = `You are a knowledgeable and helpful Walrus & Sui ecosystem AI assistant named "WalBot".
You help users learn about Walrus (decentralized storage), Sui blockchain, and Web3 concepts.
Always answer in the same language the user writes in (Ukrainian, English, etc).

CRITICAL CONVERSATIONAL RULES:
- DO NOT repeatedly say hello or greet the user ("Привіт", "Hello", "Вітаю", "Радий бачити знову") at the start of every message! This is an active continuous dialogue, so get straight to the point and answer the user's question directly.
- Only greet the user if they explicitly greet you first (e.g., "Привіт", "Hello").
- When referencing memories from Walrus, seamlessly incorporate the facts into your answer without artificial or repetitive greetings.

${memorySummary
  ? `📚 Facts recalled about this user from Walrus Mainnet:\n${memorySummary}\n\nUse these facts to personalize your answer directly.`
  : "New session context."
}

Keep responses concise, informative, and well-structured. Use markdown formatting.`;

    // 3. Get Gemini response with model fallbacks
    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.1-pro-preview",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
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
          console.log(`Successfully generated response with model: ${modelName}`);
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

    // 4. Remember this interaction in Walrus (async background, non-blocking)
    memwal
      .remember(`[${userId}] Q: "${message.substring(0, 150)}" | A summary: "${response.substring(0, 200)}"`)
      .then(async (job) => {
        if (job?.job_id) {
          await memwal.waitForRememberJob(job.job_id);
          console.log(`Memory saved successfully for ${userId}`);
        }
      })
      .catch((e) => {
        console.warn("Remember background task warning:", e);
      });

    return NextResponse.json({
      reply: response,
      hasMemory: memorySummary.length > 0,
      recalledCount: recalledSnippets.length,
      recalledSnippets,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
