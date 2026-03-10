const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../app/api/ai/chat/route.ts');
let c = fs.readFileSync(file, 'utf8');

// 1. Add routeAI import after callAI import
if (!c.includes("from '@/lib/ai-router'")) {
  c = c.replace(
    "import { callAI } from '@/lib/ai-client';",
    "import { callAI } from '@/lib/ai-client';\nimport { routeAI } from '@/lib/ai-router';"
  );
  console.log('Added routeAI import');
}

// 2. Replace main chat callAI with routeAI (line 733)
if (c.includes("await callAI(llmMessages, { maxTokens: 2000, temperature: 0.7 })")) {
  c = c.replace(
    "const result = await callAI(llmMessages, { maxTokens: 2000, temperature: 0.7 });",
    "const result = await routeAI('chat', llmMessages, { maxTokens: 4096, temperature: 0.7 });"
  );
  console.log('Replaced callAI with routeAI in chat handler');
}

fs.writeFileSync(file, c);
console.log('Done. routeAI present:', c.includes('routeAI'));
