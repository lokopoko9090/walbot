import { MemWal } from "@mysten-incubation/memwal";
import fs from "fs";

const envConfig = fs.readFileSync(".env.local", "utf8");
envConfig.split("\n").forEach(line => {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
});

async function testDeepBugs() {
  console.log("================================================================================");
  console.log("🔬 ГЛИБОКИЙ АУДИТ АРХІТЕКТУРИ ТА КРИПТОГРАФІЇ В SDK (MEMWAL)");
  console.log("================================================================================\n");

  // ===========================================================================
  // ГЛИБОКИЙ БАГ #1: Race Condition & Idempotency Key Hijack між rememberAndWait
  // ===========================================================================
  console.log("--- [ГЛИБОКИЙ БАГ 1: Idempotency Map Collision on Concurrent Writes] ---");
  const memwal1 = MemWal.create({
    key: process.env.MEMWAL_PRIVATE_KEY,
    accountId: process.env.MEMWAL_ACCOUNT_ID,
    serverUrl: process.env.MEMWAL_SERVER_URL,
    namespace: "test-race-idempotency",
  });

  const duplicateText = "Identical message sent by two background workers simultaneously";
  console.log("Запускаємо 2 паралельні rememberAsync з однаковим текстом без явного ключа...");
  const [p1, p2] = await Promise.all([
    memwal1.rememberAsync(duplicateText),
    memwal1.rememberAsync(duplicateText),
  ]);

  console.log("Job 1 ID:", p1.job_id);
  console.log("Job 2 ID:", p2.job_id);
  if (p1.job_id === p2.job_id) {
    console.log("🚨 ЗНАЙДЕНО ГЛИБОКИЙ БАГ: Дві незалежні паралельні операції колапсували в ОДИН job_id через shared requestIdentity Map!");
  } else {
    console.log("Різні job IDs:", p1.job_id, p2.job_id);
  }

  // ===========================================================================
  // ГЛИБОКИЙ БАГ #2: Zero-Key Signature Corruption після destroy() під час асинхронного запиту
  // ===========================================================================
  console.log("\n--- [ГЛИБОКИЙ БАГ 2: Destroy Key Poisoning during in-flight async signing] ---");
  const memwal2 = MemWal.create({
    key: process.env.MEMWAL_PRIVATE_KEY,
    accountId: process.env.MEMWAL_ACCOUNT_ID,
    serverUrl: process.env.MEMWAL_SERVER_URL,
    namespace: "test-destroy",
  });

  try {
    const promise = memwal2.recall({ query: "active query" });
    memwal2.destroy(); // зануляє privateKey.fill(0) прямо під час польоту
    const res = await promise;
    console.log("Результат після destroy():", res);
  } catch (err) {
    console.log("Поведінка при destroy():", err.message);
    if (err.message.includes("signature") || err.message.includes("401") || err.message.includes("Unauthorized")) {
      console.log("🚨 ЗНАЙДЕНО ГЛИБОКИЙ БАГ: destroy() генерує підпис нульовим ключем [0x00...00], замість чинної перевірки `if (this.destroyed) throw new Error('Client destroyed')`!");
    }
  }

  // ===========================================================================
  // ГЛИБОКИЙ БАГ #3: scoringWeightsToWire Serializer Dropping Float Precision / NaN
  // ===========================================================================
  console.log("\n--- [ГЛИБОКИЙ БАГ 3: Scoring Weights Wire Serializer Edge Cases] ---");
  try {
    const resWeights = await memwal1.recall("query", {
      scoringWeights: {
        recency: -0.5,
        relevance: 1.5,
      }
    });
    console.log("Результат з від'ємними вагами recency:", resWeights);
  } catch (err) {
    console.log("❌ Знайдено помилку валідації ваг:", err.message);
  }

  console.log("\n🏁 АУДИТ ЗАВЕРШЕНО!");
}

testDeepBugs().catch(console.error);
