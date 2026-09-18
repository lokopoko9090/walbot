import { redactInternalUrls } from "./node_modules/@mysten-incubation/memwal/dist/utils.js";
import { truncateToTokenBudget, estimateTokens } from "./node_modules/@mysten-incubation/memwal/dist/tokens.js";

async function testNewDeepFindings() {
  console.log("================================================================================");
  console.log("🔬 ТЕСТУВАННЯ НОВИХ ГЛИБОКИХ БАГІВ У МОДУЛЯХ UTILS ТА TOKENS");
  console.log("================================================================================\n");

  // ===========================================================================
  // НАПРЯМОК 3: Security & Information Disclosure (Topology Leak in redactInternalUrls)
  // ===========================================================================
  console.log("--- [НАПРЯМОК 3: Incomplete Loopback Redaction Regex / Topology Leak] ---");
  const testErrors = [
    "Error connecting to http://localhost:8080/api/v1/keys",
    "Error connecting to http://127.0.0.1:9000/internal",
    "Error connecting to http://::1:8080/internal/sidecar-token",
    "Error connecting to http://sidecar.localhost:4000/sui-rpc",
    "Error connecting to http://127.0.0.2:8000/tee-enclave",
  ];

  for (const err of testErrors) {
    const redacted = redactInternalUrls(err);
    const leaked = redacted.includes("http://");
    console.log(`Вхід:  "${err}"`);
    console.log(`Вихід: "${redacted}"`);
    console.log(`Статус: ${leaked ? "🚨 ВИТІК ВНУТРІШНЬОГО URL (Не заблоковано!)" : "✅ Заблоковано [internal]"}\n`);
  }

  // ===========================================================================
  // НАПРЯМОК 4: Token Budgeting Math Precision Bug (Premature Math.floor)
  // ===========================================================================
  console.log("--- [НАПРЯМОК 4: Premature Math.floor in truncateToTokenBudget] ---");
  const sampleText = "abcdefghijklmnop"; // 16 chars
  const floatBudget = 2.75; // 2.75 tokens * 4 = 11 chars
  const truncated = truncateToTokenBudget(sampleText, floatBudget);
  console.log(`Текст: "${sampleText}" (16 chars)`);
  console.log(`Бюджет токенів: ${floatBudget}`);
  console.log(`Очікувалось символів: Math.floor(2.75 * 4) = 11 символів`);
  console.log(`Фактично обрізано до: ${truncated.length} символів ("${truncated}")`);
  if (truncated.length === 8) {
    console.log(`🚨 ЗНАЙДЕНО МАТЕМАТИЧНИЙ БАГ: Через Math.floor(maxTokens) * 4 замість Math.floor(maxTokens * 4) втрачено 3 допустимих символи бюджету!`);
  }
}

testNewDeepFindings();
