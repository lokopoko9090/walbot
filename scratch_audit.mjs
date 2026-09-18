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
  namespace: "walrus-tutor-test-audit",
});

async function testVulnerabilities() {
  console.log("🕵️‍♂️ ПОЧАТОК ГЛИБОКОГО ТЕСТУВАННЯ МEMWAL SDK НА БАГИ ТА ДІРКИ...");

  // ТЕСТ 1: Cross-User Memory Bleed / Isolation Test
  console.log("\n--- [ТЕСТ 1: Cross-User Data Isolation & Injection] ---");
  try {
    const userSecret = `[user_secret_victim_999] Secret SSN/Password: WALRUS_SUPER_SECRET_TOKEN_XYZ`;
    console.log("1.1 Записуємо секретну пам'ять користувача 1...");
    const job1 = await memwal.remember(userSecret);
    console.log("Job 1 ID:", job1.job_id);

    console.log("1.2 Зловмисник (user_attacker) намагається знайти чужі секрети через семантичний запит...");
    const recallAttempt = await memwal.recall({ query: "Secret SSN Password TOKEN" });
    console.log("Результати пошуку recall():", JSON.stringify(recallAttempt, null, 2));
    
    // Аналіз вразливості: чи повертає MemWal чужі спогади, якщо вони в одному namespace
    const leaked = recallAttempt.results?.some(r => r.text?.includes("user_secret_victim_999"));
    if (leaked) {
      console.log("🚨 ЗНАЙДЕНО ДІРКУ БЕЗПЕКИ: Cross-Tenant Embedding Leakage! SDK не ізолює спогади всередині одного namespace без клієнтської фільтрації!");
    }
  } catch (e) {
    console.log("Тест 1 помилка/поведінка:", e);
  }

  // ТЕСТ 2: Null Byte & Control Characters Injection
  console.log("\n--- [ТЕСТ 2: Null Byte & Control Chars Injection] ---");
  try {
    const corruptPayload = "Test\x00\x01\x02\u0000Corrupted\n\r\tBufferInjection";
    console.log("2.1 Відправка null-байтів у remember()...");
    const job2 = await memwal.remember(corruptPayload);
    console.log("Job 2 ID:", job2.job_id);
    const recall2 = await memwal.recall({ query: "Corrupted BufferInjection" });
    console.log("Recall 2 результат:", recall2);
  } catch (e) {
    console.log("🚨 ЗНАЙДЕНО БАГ при обробці Control Characters:", e.message);
  }

  // ТЕСТ 3: Empty query / Boundary edge cases
  console.log("\n--- [ТЕСТ 3: Boundary Query Edge Cases] ---");
  try {
    console.log("3.1 Відправка порожнього recall({ query: '' })...");
    const emptyRecall = await memwal.recall({ query: "" });
    console.log("Empty query результат:", emptyRecall);
  } catch (e) {
    console.log("🚨 ЗНАЙДЕНО БАГ при empty query:", e.message);
  }

  // ТЕСТ 4: Parallel Race Condition Stress Test
  console.log("\n--- [ТЕСТ 4: Parallel Race Condition Stress Test] ---");
  try {
    console.log("4.1 Запуск 5 паралельних remember() одночасно...");
    const promises = [1, 2, 3, 4, 5].map(i => memwal.remember(`[stress_user] Parallel memory payload #${i} timestamp: ${Date.now()}`));
    const results = await Promise.allSettled(promises);
    console.log("Результати 5 паралельних записів:", results.map(r => ({ status: r.status, value: r.value?.job_id, reason: r.reason?.message })));
  } catch (e) {
    console.log("🚨 ЗНАЙДЕНО БАГ при паралельному записі:", e.message);
  }

  // ТЕСТ 5: GDPR / Inability to delete granular memory
  console.log("\n--- [ТЕСТ 5: Granular Memory Deletion Audit] ---");
  const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(memwal));
  console.log("Доступні методи в SDK:", availableMethods);
  const hasDeleteOrForget = availableMethods.some(m => m.includes("delete") || m.includes("forget") || m.includes("remove"));
  console.log("Чи є в SDK метод видалення окремого спогаду (forget/delete):", hasDeleteOrForget);
  if (!hasDeleteOrForget) {
    console.log("🚨 АРХІТЕКТУРНА ПРОБЛЕМА: Відсутній метод гранулярного видалення/інвалідації спогаду (GDPR compliance issue)!");
  }
}

testVulnerabilities();
