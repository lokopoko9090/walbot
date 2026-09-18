import { MemWal } from '@mysten-incubation/memwal';
import fs from 'fs';

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

async function run() {
  const memwal = MemWal.create({
    key: env.MEMWAL_PRIVATE_KEY,
    accountId: env.MEMWAL_ACCOUNT_ID,
    serverUrl: env.MEMWAL_SERVER_URL || 'https://relayer.memory.walrus.xyz',
    namespace: 'walrus-tutor',
  });

  console.log('Connecting to Walrus Memory Mainnet relayer...');
  console.log('Account ID:', env.MEMWAL_ACCOUNT_ID);
  console.log('Namespace: walrus-tutor');

  const queries = [
    'user_anna_frontend',
    'user_maxim_move_dev',
    'user_olena_educator',
    'Anna Next.js React',
    'Maxim Sui Move smart contract',
    'Olena educator workshop',
    'Walrus decentralized storage',
    'Sui blockchain memory',
    'erasure coding RedStuff',
    'Blob ID NFT metadata'
  ];

  const allMemories = new Map();

  for (const q of queries) {
    try {
      const res = await memwal.recall({ query: q, limit: 30, namespace: 'walrus-tutor' });
      if (res.results) {
        for (const item of res.results) {
          if (!allMemories.has(item.text)) {
            allMemories.set(item.text, item);
          }
        }
      }
    } catch (e) {
      console.log('Recall error for query ' + q + ':', e.message);
    }
  }

  console.log('====================================================');
  console.log(`📊 TOTAL UNIQUE MAINNET BLOBS RETRIEVED: ${allMemories.size}`);
  console.log('====================================================\n');

  let i = 1;
  for (const [text, item] of allMemories.entries()) {
    console.log(`[Blob #${i++}] Distance: ${item.distance.toFixed(4)} | Text:\n  "${text}"\n`);
  }
}

run();
