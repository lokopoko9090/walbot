import { NextRequest, NextResponse } from "next/server";
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: process.env.MEMWAL_PRIVATE_KEY!,
  accountId: process.env.MEMWAL_ACCOUNT_ID!,
  serverUrl: process.env.MEMWAL_SERVER_URL!,
  namespace: "walrus-tutor",
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    let userMemories: { text: string }[] = [];
    try {
      const recalled = await memwal.recall({ query: userId, limit: 15, namespace: "walrus-tutor" });
      userMemories = recalled.results?.filter((r: { text: string }) =>
        r.text.includes(`[${userId}]`)
      ) ?? [];
    } catch (e) {
      console.warn("Recall failed:", e);
    }

    return NextResponse.json({
      history: userMemories.map((m) => m.text),
    });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
