import fs from 'fs';

const title = "[Bug]: withMemWal middleware violates LLM API schema specs by injecting mid-conversation system roles and non-alternating user turns";

const body = `### Summary

In \`@mysten-incubation/memwal/ai\` (\`src/ai/middleware.ts\` / \`dist/ai/middleware.js\`), \`injectMemoryContext\` modifies multi-turn conversation arrays by splicing a \`{ role: "system" }\` instruction and an extra \`{ role: "user" }\` memory block directly prior to the final user prompt.

This violates core API messaging schemas across major LLM providers (Anthropic Claude, Google Gemini, AWS Bedrock, OpenAI Chat Completions), leading to immediate \`HTTP 400 Bad Request\` schema rejections during multi-turn chats, as well as prompt-injection defense bypass due to non-root instruction placement.

---

### Impact & Severity

1. **Fatal Runtime Crash in Multi-Turn Dialogs (\`HTTP 400\`):**  
   Anthropic Messages API and AWS Bedrock strictly enforce:
   - All \`system\` messages must reside solely at root index 0.
   - Roles must strictly alternate between \`user\` and \`assistant\`.  
   When a conversation reaches Turn 2+ (\`[system, user, assistant, user]\`), \`withMemWal\` transforms it into \`[system, user, assistant, SYSTEM, USER, USER]\`. The downstream provider immediately aborts with \`Invalid prompt: consecutive user messages or mid-dialogue system message\`.

2. **Security Degradation (Prompt Injection):**  
   The \`UNTRUSTED_MEMORY_SYSTEM_INSTRUCTION\` boundary policy is intended to prevent adversarial memory payloads from overriding LLM system instructions. Placing \`system\` instructions mid-dialogue causes LLMs to demote their precedence, allowing malicious memory blobs to hijack execution flow.

---

### 4 Independent Verification Tests (Proof)

Executing tests against \`dist/ai/middleware.js\`:

#### Test 1: Mid-Conversation System Role Injection
\`\`\`javascript
const { injectMemoryContext } = require('@mysten-incubation/memwal/dist/ai/middleware.js');

const multiTurnPrompt = [
  { role: 'system', content: 'Base instruction' },
  { role: 'user', content: 'Turn 1 user' },
  { role: 'assistant', content: 'Turn 1 assistant' },
  { role: 'user', content: 'Turn 2 user query' }
];

const result = injectMemoryContext(multiTurnPrompt, 'Recalled Memory');
console.log(result.map(m => m.role).join(' -> '));
// Output: system -> user -> assistant -> system -> user -> user
// Result: System message placed at index 3 (violates provider constraints)
\`\`\`

#### Test 2: Non-Alternating Consecutive User Messages
\`\`\`javascript
const userIndices = result.map((m, i) => m.role === 'user' ? i : -1).filter(i => i !== -1);
console.log('User message indices:', userIndices);
// Output: [ 1, 4, 5 ]
// Result: Consecutive user turns at indices 4 and 5 break strict alternation requirements
\`\`\`

#### Test 3: Fragmented System Instructions on Turn 1
\`\`\`javascript
const promptWithSys = [
  { role: 'system', content: 'You are a code reviewer' },
  { role: 'user', content: 'Review my Move contract' }
];
const result3 = injectMemoryContext(promptWithSys, 'Context');
console.log(result3.map(m => m.role).join(' -> '));
// Output: system -> system -> user -> user
// Result: Produces duplicate adjacent system objects and splits user turn into two separate messages
\`\`\`

#### Test 4: First-Turn Schema Inversion (lastUserIndex === 0)
\`\`\`javascript
const firstTurnPrompt = [{ role: 'user', content: 'Initial question' }];
const result4 = injectMemoryContext(firstTurnPrompt, 'Context');
console.log(result4.map(m => m.role).join(' -> '));
// Output: system -> user -> user
// Result: Splits memory context and query into disconnected user envelopes
\`\`\`

---

### Suggested Fix

1. Consolidate \`UNTRUSTED_MEMORY_SYSTEM_INSTRUCTION\` into the existing root \`system\` message at index 0 (or prepend if none exists).
2. Inject the untrusted memory block directly into the content of the target \`lastUserMessage\`, preserving pristine role alternation.

\`\`\`typescript
export function injectMemoryContext(prompt: any[], memoryContext: string): any[] {
    if (!Array.isArray(prompt) || prompt.length === 0) return prompt;

    const result = [...prompt];

    // 1. Ensure system instruction is anchored at root (index 0)
    const systemIdx = result.findIndex(m => m.role === 'system');
    if (systemIdx >= 0) {
        const existing = typeof result[systemIdx].content === 'string'
            ? result[systemIdx].content
            : JSON.stringify(result[systemIdx].content);
        result[systemIdx] = {
            ...result[systemIdx],
            content: \`\${existing}\\n\\n\${UNTRUSTED_MEMORY_SYSTEM_INSTRUCTION}\`
        };
    } else {
        result.unshift({
            role: 'system',
            content: UNTRUSTED_MEMORY_SYSTEM_INSTRUCTION
        });
    }

    // 2. Prepend memory block inside the target user message content
    for (let i = result.length - 1; i >= 0; i--) {
        if (result[i].role === 'user') {
            const userMsg = result[i];
            if (typeof userMsg.content === 'string') {
                result[i] = {
                    ...userMsg,
                    content: \`\${memoryContext}\\n\\n\${userMsg.content}\`
                };
            } else if (Array.isArray(userMsg.content)) {
                result[i] = {
                    ...userMsg,
                    content: [
                        { type: 'text', text: memoryContext },
                        ...userMsg.content
                    ]
                };
            }
            break;
        }
    }

    return result;
}
\`\`\`
`;

const fullUrl = `https://github.com/MystenLabs/MemWal/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
fs.writeFileSync('c:/Users/АННА/Desktop/8 сезон/walrus-memory-bot/issue5_url.txt', fullUrl, 'utf8');
console.log('SUCCESS');
