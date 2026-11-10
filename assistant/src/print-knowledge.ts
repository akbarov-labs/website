// Prints the system prompt exactly as Claude receives it: `npm run knowledge`.

import { buildKnowledge } from './knowledge.ts';
import { systemPrompt } from './prompt.ts';

const knowledge = await buildKnowledge();
console.log(systemPrompt(knowledge.text));
if (knowledge.missing.length) {
  console.error(`\nFAQ questions without an answer (left out): ${knowledge.missing.join(' | ')}`);
}
