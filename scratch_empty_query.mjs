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
  namespace: "walrus-tutor-test-proof",
});

async function testEmptyQuery() {
  console.log("=== ТЕСТУВАННЯ RECALL З ПОРОЖНІМ ЗАПИТОМ ===");

  const testCases = [
    { name: "Empty string", query: "" },
    { name: "Whitespace only", query: "   " },
    { name: "Tab and newline", query: "\t\n" },
  ];

  for (const tc of testCases) {
    console.log(`\nВиконуємо тест: [${tc.name}] з query = JSON.stringify("${tc.query}")...`);
    try {
      const result = await memwal.recall({ query: tc.query });
      console.log("Результат (успіх):", result);
    } catch (error) {
      console.log("❌ ОТРИМАНО EXCEPTION:");
      console.log("Назва помилки:", error.name);
      console.log("Повідомлення:", error.message);
      console.log("Код/Статус:", error.status || error.statusCode || error.response?.status);
      console.log("Повний стек трейс:", error.stack);
    }
  }
}

testEmptyQuery().catch(console.error);
