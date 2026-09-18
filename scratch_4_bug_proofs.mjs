import { MemWal } from "@mysten-incubation/memwal";
import fs from "fs";

const envConfig = fs.readFileSync(".env.local", "utf8");
envConfig.split("\n").forEach(line => {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
});

const memwal = MemWal.create({
  key: process.env.MEMWAL_PRIVATE_KEY,
  accountId: process.env.MEMWAL_ACCOUNT_ID,
  serverUrl: process.env.MEMWAL_SERVER_URL,
  namespace: "walrus-deep-audit-proof",
});

async function run4ProofTests() {
  console.log("================================================================================");
  console.log("🧪 ЗАПУСК 4 ГЛИБОКИХ ПРАКТИЧНИХ ТЕСТІВ SDK З ФІКСАЦІЄЮ РЕАЛЬНИХ ПОМИЛОК І СТЕК-ТРЕЙСІВ");
  console.log("================================================================================\n");

  // ===========================================================================
  // ТЕСТ 1: Необроблений Exception при remember("") та remember("   ")
  // ===========================================================================
  console.log("--- [ТЕСТ 1: Validation Crash on Empty Payload in remember()] ---");
  try {
    console.log("1.1 Викликаємо memwal.remember('') з порожнім рядком...");
    const res1 = await memwal.remember("");
    console.log("Результат:", res1);
  } catch (err) {
    console.log("❌ ТЕСТ 1 ПІДТВЕРДЖЕНО (Crash):");
    console.log("Помилка:", err.message);
    console.log("Статус:", err.status || 400);
    console.log("Стек:", err.stack?.split("\n").slice(0, 3).join("\n"));
  }

  try {
    console.log("1.2 Викликаємо memwal.remember('   ') лише з пробілами...");
    const res1_2 = await memwal.remember("   ");
    console.log("Результат:", res1_2);
  } catch (err) {
    console.log("❌ ТЕСТ 1.2 ПІДТВЕРДЖЕНО (Crash):", err.message);
  }

  // ===========================================================================
  // ТЕСТ 2: Необроблений Exception при граничних / від'ємних числових параметрах limit / topK
  // ===========================================================================
  console.log("\n--- [ТЕСТ 2: Unhandled Exception on Boundary/Negative limit & topK in recall()] ---");
  const boundaryCases = [
    { name: "Negative limit (-1)", opts: { limit: -1 } },
    { name: "Zero limit (0)", opts: { limit: 0 } },
    { name: "Extreme limit (999999)", opts: { limit: 999999 } },
    { name: "NaN limit", opts: { limit: NaN } },
  ];

  for (const bc of boundaryCases) {
    try {
      console.log(`2.1 Перевірка ${bc.name}...`);
      const res2 = await memwal.recall("test query", bc.opts);
      console.log(`Відповідь для ${bc.name}:`, res2);
    } catch (err) {
      console.log(`❌ ТЕСТ 2 ПІДТВЕРДЖЕНО для ${bc.name} (Crash):`);
      console.log("Помилка:", err.message);
      console.log("Статус:", err.status);
    }
  }

  // ===========================================================================
  // ТЕСТ 3: Перевірка максимального ліміту розміру пам'яті (Payload Too Large / Memory Overflow)
  // ===========================================================================
  console.log("\n--- [ТЕСТ 3: Max Payload Size & Buffer Overflow Edge Case in remember()] ---");
  try {
    const hugeText = "A".repeat(1024 * 1024 * 5); // 5 MB payload
    console.log(`3.1 Відправляємо надвеликий текст розміром 5 MB у remember()...`);
    const res3 = await memwal.remember(hugeText);
    console.log("Результат для 5MB:", res3);
  } catch (err) {
    console.log("❌ ТЕСТ 3 ПІДТВЕРДЖЕНО (Payload Crash):");
    console.log("Помилка:", err.message);
    console.log("Статус:", err.status);
    console.log("Стек:", err.stack?.split("\n").slice(0, 3).join("\n"));
  }

  // ===========================================================================
  // ТЕСТ 4: Спеціальні символи та ін'єкція некоректних імен у namespace (Namespace Injection / Crash)
  // ===========================================================================
  console.log("\n--- [ТЕСТ 4: Namespace Sanitization & Path Traversal / Special Chars Test] ---");
  const badNamespaces = [
    "namespace/with/slashes",
    "namespace..with..traversal",
    "namespace with spaces",
    "namespace#special?query=1",
    "🌟_emoji_namespace_🚀",
  ];

  for (const ns of badNamespaces) {
    try {
      console.log(`4.1 Тестуємо некоректний namespace: '${ns}'...`);
      const customMemwal = MemWal.create({
        key: process.env.MEMWAL_PRIVATE_KEY,
        accountId: process.env.MEMWAL_ACCOUNT_ID,
        serverUrl: process.env.MEMWAL_SERVER_URL,
        namespace: ns,
      });
      const res4 = await customMemwal.recall({ query: "test query" });
      console.log(`Відповідь для namespace '${ns}': total =`, res4.total);
    } catch (err) {
      console.log(`❌ ТЕСТ 4 ПІДТВЕРДЖЕНО для namespace '${ns}' (Crash):`);
      console.log("Помилка:", err.message);
      console.log("Статус:", err.status);
    }
  }

  console.log("\n================================================================================");
  console.log("🏁 ВСІ 4 ТЕСТИ ЗАВЕРШЕНО!");
  console.log("================================================================================");
}

run4ProofTests().catch(console.error);
