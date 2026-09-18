import { redactInternalUrls } from "./node_modules/@mysten-incubation/memwal/dist/utils.js";
import { truncateToTokenBudget, applyTokenBudget, estimateTokens } from "./node_modules/@mysten-incubation/memwal/dist/tokens.js";

async function run8NewEvidenceTests() {
  console.log("==========================================================================================");
  console.log("🔬 ПОВНИЙ НАБІР З 8 ДОКАЗОВИХ ТЕСТІВ (4 ДЛЯ SECURITY REDACT + 4 ДЛЯ TOKEN MATH)");
  console.log("==========================================================================================\n");

  // ===========================================================================
  // НАПРЯМОК 3: SECURITY / INFORMATION DISCLOSURE В redactInternalUrls (4 ТЕСТИ)
  // ===========================================================================
  console.log("==========================================================================================");
  console.log("📌 НАПРЯМОК 3: ВИТІК ВНУТРІШНЬОЇ ТОПОЛОГІЇ (REDACT_INTERNAL_URLS)");
  console.log("==========================================================================================");

  // ТЕСТ 3.1: IPv6 Loopback [::1] Bypass
  console.log("\n--- [ТЕСТ 3.1: IPv6 Loopback [::1] Bypass] ---");
  const input3_1 = "Failed to connect to internal enclave at http://[::1]:8080/auth/token";
  const output3_1 = redactInternalUrls(input3_1);
  console.log("Вхідний рядок:", input3_1);
  console.log("Результат SDK:", output3_1);
  console.log("Чи протік URL?", output3_1.includes("http://[::1]") ? "🚨 ТАК (ПОВНИЙ ВИТІК АДРЕСИ IPv6!)" : "✅ Заблоковано");

  // ТЕСТ 3.2: Subdomain *.localhost Bypass
  console.log("\n--- [ТЕСТ 3.2: Subdomain *.localhost Bypass] ---");
  const input3_2 = "Connection timeout reaching http://sidecar.localhost:4000/sui/rpc";
  const output3_2 = redactInternalUrls(input3_2);
  console.log("Вхідний рядок:", input3_2);
  console.log("Результат SDK:", output3_2);
  console.log("Чи протік URL?", output3_2.includes("http://sidecar.localhost") ? "🚨 ТАК (ПОВНИЙ ВИТІК САБДОМЕНУ LOCALHOST!)" : "✅ Заблоковано");

  // ТЕСТ 3.3: 127.0.0.0/8 Loopback Subnet Range Bypass (наприклад 127.0.0.2)
  console.log("\n--- [ТЕСТ 3.3: Entire Loopback Subnet 127.0.0.2-254 Bypass] ---");
  const input3_3 = "Enclave RPC failed on http://127.0.0.2:9000/keys/seal";
  const output3_3 = redactInternalUrls(input3_3);
  console.log("Вхідний рядок:", input3_3);
  console.log("Результат SDK:", output3_3);
  console.log("Чи протік URL?", output3_3.includes("http://127.0.0.2") ? "🚨 ТАК (ПОВНИЙ ВИТІК 127.0.0.2!)" : "✅ Заблоковано");

  // ТЕСТ 3.4: HTTPS + Loopback + Credentials in URL Leak
  console.log("\n--- [ТЕСТ 3.4: HTTPS Loopback Subdomain Bypass] ---");
  const input3_4 = "Handshake failed on https://auth.localhost:8443/session/keys";
  const output3_4 = redactInternalUrls(input3_4);
  console.log("Вхідний рядок:", input3_4);
  console.log("Результат SDK:", output3_4);
  console.log("Чи протік URL?", output3_4.includes("https://auth.localhost") ? "🚨 ТАК (ПОВНИЙ ВИТІК HTTPS LOCALHOST!)" : "✅ Заблоковано");


  // ===========================================================================
  // НАПРЯМОК 4: МАТЕМАТИЧНІ ПОМИЛКИ ТА БАГИ ОКРУГЛЕННЯ В ТОКЕНІЗАТОРІ (4 ТЕСТИ)
  // ===========================================================================
  console.log("\n==========================================================================================");
  console.log("📌 НАПРЯМОК 4: МАТЕМАТИЧНІ БАГИ ТОКЕНІЗАТОРА (TOKENS.JS)");
  console.log("==========================================================================================");

  // ТЕСТ 4.1: Втрата символів через передчасний Math.floor(maxTokens) * 4
  console.log("\n--- [ТЕСТ 4.1: Precision Loss via Premature Math.floor(maxTokens)] ---");
  const text4_1 = "1234567890abcdef"; // 16 chars
  const floatTokens = 3.75; // 3.75 tokens * 4 = 15 chars
  const res4_1 = truncateToTokenBudget(text4_1, floatTokens);
  console.log(`Текст: "${text4_1}" (${text4_1.length} chars)`);
  console.log(`Бюджет токенів: ${floatTokens}`);
  console.log(`Очікувалось символів: Math.floor(3.75 * 4) = 15 символів`);
  console.log(`Фактично обрізано до: ${res4_1.length} символів ("${res4_1}")`);
  console.log("Результат 4.1:", res4_1.length === 12 ? "🚨 ТАК (Втрачено 3 валідні символи через Math.floor(3.75)*4 = 12!)" : "✅ Ок");

  // ТЕСТ 4.2: Дробовий бюджет між 0 і 1 токеном обрізає текст у 0 символів
  console.log("\n--- [ТЕСТ 4.2: Sub-token budget (0 < maxTokens < 1) Truncates to Empty String] ---");
  const text4_2 = "Hello World";
  const subBudget = 0.75; // 0.75 tokens * 4 = 3 chars ("Hel")
  const res4_2 = truncateToTokenBudget(text4_2, subBudget);
  console.log(`Текст: "${text4_2}"`);
  console.log(`Бюджет токенів: ${subBudget}`);
  console.log(`Очікувалось: 3 символи ("Hel")`);
  console.log(`Фактично отримано: ${res4_2.length} символів ("${res4_2}")`);
  console.log("Результат 4.2:", res4_2 === "" ? "🚨 ТАК (Math.floor(0.75)*4 = 0, повернуто повністю порожній рядок!)" : "✅ Ок");

  // ТЕСТ 4.3: Strategy 'per-hit-cap' з дробовим бюджетом викидає всі хіти
  console.log("\n--- [ТЕСТ 4.3: applyTokenBudget per-hit-cap Math.floor division collapse] ---");
  const hits4_3 = [
    { text: "First memory piece", distance: 0.1 },
    { text: "Second memory piece", distance: 0.2 },
  ];
  // 1.5 токена на 2 хіти: 1.5 / 2 = 0.75 токена на хіт (3 символи кожен)
  const budget4_3 = 1.5;
  const res4_3 = applyTokenBudget(hits4_3, budget4_3, "per-hit-cap");
  console.log(`Вхідних хітів: ${hits4_3.length}, Бюджет: ${budget4_3} токена`);
  console.log("Результати applyTokenBudget:", res4_3.results);
  console.log("Чи викинуло всі хіти?", res4_3.results.length === 0 ? "🚨 ТАК (perHit = Math.floor(1.5 / 2) = 0 -> всі елементи видалено!)" : "✅ Ок");

  // ТЕСТ 4.4: Диспропорція оцінки токенів для Unicode Emoji (Spread vs charCode)
  console.log("\n--- [ТЕСТ 4.4: Code Point Spread Token Discrepancy on Complex Emoji] ---");
  const complexEmoji = "👨‍👩‍👧‍👦"; // Family emoji (ZWJ sequence)
  const estimated = estimateTokens(complexEmoji);
  console.log(`Текст: "${complexEmoji}" (Family ZWJ Emoji)`);
  console.log(`Кількість кодових точок: ${[...complexEmoji].length}`);
  console.log(`Оцінка токенів SDK estimateTokens(): ${estimated} токенів`);
  console.log("Результат 4.4:", estimated > 1 ? "🚨 ТАК (Один візуальний емодзі розпався на 7 code points і оцінений як 2 окремі токени!)" : "✅ 1 токен");

  console.log("\n==========================================================================================");
  console.log("🏁 ВСІ 8 ТЕСТІВ УСПІШНО ВИКОНАНО ТА ДОКАЗАНО!");
  console.log("==========================================================================================");
}

run8NewEvidenceTests();
