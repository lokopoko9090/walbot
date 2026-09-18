import { MemWal } from "@mysten-incubation/memwal";
import fs from "fs";

// Завантажуємо конфігурацію
const envConfig = fs.readFileSync(".env.local", "utf8");
envConfig.split("\n").forEach(line => {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
});

const memwal = MemWal.create({
  key: process.env.MEMWAL_PRIVATE_KEY,
  accountId: process.env.MEMWAL_ACCOUNT_ID,
  serverUrl: process.env.MEMWAL_SERVER_URL,
  namespace: "walrus-tutor-test-proof",
});

async function runProof() {
  console.log("=== ТЕСТУВАННЯ МЕХАНІЗМУ RECALL У WALRUS MEMORY ===");

  // Крок 1: Запис даних першого користувача
  console.log("\n1. Записуємо дані Користувача 1 (Alice)...");
  const job = await memwal.remember("User [Alice]: My private project is SecretProjectX and my email is alice@xyz.com");
  console.log("Очікуємо підтвердження запису у Walrus (job_id: " + job.job_id + ")...");
  await memwal.waitForRememberJob(job.job_id);
  console.log("✅ Запис підтверджено у Walrus Mainnet!");

  // Крок 2: Запит recall за схожими ключовими словами
  console.log("\n2. Робимо семантичний запит: 'What is the secret project and email?'...");
  const recallResult = await memwal.recall({ query: "What is the secret project and email?" });

  console.log("\n=== СИРА ВІДПОВІДЬ ВІД СЕРВЕРА WALRUS ===");
  console.log(JSON.stringify(recallResult, null, 2));

  // Крок 3: Аналіз результату
  if (recallResult.results && recallResult.results.length > 0) {
    console.log("\n📌 ФАКТ: Метод memwal.recall() повернув текст:", recallResult.results[0].text);
    console.log("📌 ВИСНОВОК: Запит у межах одного namespace повертає всі семантично схожі тексти цього простору, тому фільтрація по userId має відбуватися на рівні коду бота.");
  } else {
    console.log("\n📌 ФАКТ: Результатів не знайдено (індексація ще триває або запит порожній).");
  }
}

runProof().catch(console.error);
