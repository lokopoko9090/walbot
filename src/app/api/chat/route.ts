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
    try {
      const recalled = await memwal.recall({ query: message });
      const userMemories = recalled.results?.filter((r: { text: string }) =>
        r.text.includes(`[${userId}]`)
      ) ?? [];

      if (userMemories.length > 0) {
        memorySummary = userMemories
          .slice(0, 5)
          .map((m: { text: string }) => `- ${m.text}`)
          .join("\n");
      }
    } catch (e) {
      console.warn("Recall failed:", e);
    }

    // 2. Build system prompt with memory
    const systemPrompt = `You are a friendly Walrus & Sui ecosystem learning assistant named "WalBot".
You help users learn about Walrus (decentralized storage), Sui blockchain, and Web3 concepts.
You are enthusiastic, encouraging, and adapt to each user's level.
Always answer in the same language the user writes in (Ukrainian, English, etc).

${memorySummary
  ? `📚 What you remember about this user:\n${memorySummary}\n\nUse this context to personalize your response. Reference their progress when relevant.`
  : "This appears to be a new user. Greet them warmly and ask about their background."
}

Keep responses concise (max 3-4 paragraphs). Use emoji sparingly to keep it friendly.`;

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
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
