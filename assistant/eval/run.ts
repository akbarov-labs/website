// Runs the test conversations in eval/cases.json against one or more models,
// with the same prompt, knowledge and tools as the live assistant. Leads are
// recorded, never sent. Prints a summary and writes every answer to
// eval/results/<time>.md for a person to read: the checks catch invented
// prices and wrong tool use, but only a person can judge the Uzbek.
//
//   npm run eval                                  all cases, Opus 5.5, Sonnet 5.5 and Haiku 5.5
//   npm run eval -- --models claude-haiku-5-5     one model
//   npm run eval -- --only lead-full,price-site   some cases
//
// Needs ANTHROPIC_API_KEY (assistant/.env). Every run costs real money: about
// a dollar for all three models, printed at the end.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';
import { buildKnowledge } from '../src/knowledge.ts';
import { systemPrompt } from '../src/prompt.ts';
import { runTurn, type Lead } from '../src/chat.ts';

type Expect = {
  script?: 'latin' | 'cyrillic';
  noPrice?: boolean;
  noTimeline?: boolean;
  lead?: boolean;
  leadCount?: number;
  gap?: boolean;
  gapWithoutPersonal?: boolean;
  mustMatch?: string[];
  mustNotMatch?: string[];
};
type Case = { id: string; about: string; turns: string[]; expect: Expect };
type Outcome = {
  replies: string[];
  leads: Lead[];
  gaps: string[];
  costUsd: number;
  failures: string[];
  error?: string;
};

const { values } = parseArgs({
  options: {
    models: { type: 'string', default: 'claude-opus-5-5,claude-sonnet-5-5,claude-haiku-5-5' },
    only: { type: 'string' },
    concurrency: { type: 'string', default: '3' },
  },
});
const models = values.models.split(',').map((m) => m.trim());
const only = values.only?.split(',').map((id) => id.trim());

const allCases: Case[] = JSON.parse(await readFile(new URL('./cases.json', import.meta.url), 'utf8'));
const cases = only ? allCases.filter((c) => only.includes(c.id)) : allCases;
const knowledge = await buildKnowledge();
const system = systemPrompt(knowledge.text);
const client = new Anthropic();

const results = new Map<string, Map<string, Outcome>>();
for (const model of models) {
  const byCase = new Map<string, Outcome>();
  results.set(model, byCase);
  console.log(`\n${model}: ${cases.length} cases`);
  await pool(cases, Number(values.concurrency), async (c) => {
    const outcome = await runCase(model, c);
    byCase.set(c.id, outcome);
    const mark = outcome.error ? 'ERROR' : outcome.failures.length ? 'FAIL ' : 'pass ';
    console.log(`  ${mark} ${c.id}${outcome.failures.length ? ` — ${outcome.failures.join('; ')}` : ''}${outcome.error ? ` — ${outcome.error}` : ''}`);
  });
}

console.log('\nSummary');
for (const model of models) {
  const outcomes = [...results.get(model)!.values()];
  const passed = outcomes.filter((o) => !o.error && o.failures.length === 0).length;
  const cost = outcomes.reduce((sum, o) => sum + o.costUsd, 0);
  console.log(`  ${model.padEnd(18)} ${passed}/${outcomes.length} passed   $${cost.toFixed(3)} total   $${(cost / outcomes.length).toFixed(4)} per case`);
}
const report = await writeReport();
console.log(`\nEvery answer, for reading: ${report}`);

async function runCase(model: string, c: Case): Promise<Outcome> {
  const outcome: Outcome = { replies: [], leads: [], gaps: [], costUsd: 0, failures: [] };
  const history: Anthropic.Beta.BetaMessageParam[] = [];
  let leadSent = false;
  try {
    for (const message of c.turns) {
      history.push({ role: 'user', content: message });
      let reply = '';
      const turn = await runTurn(
        client,
        { model, system, history, leadAlreadySent: leadSent },
        {
          onText: (delta) => (reply += delta),
          sendLead: async (lead) => void outcome.leads.push(lead),
          logGap: (topic) => outcome.gaps.push(topic),
        },
      );
      leadSent = turn.leadSent;
      outcome.costUsd += turn.costUsd;
      outcome.replies.push(reply);
    }
  } catch (err) {
    outcome.error = err instanceof Error ? err.message : String(err);
    return outcome;
  }
  outcome.failures = check(c.expect, outcome);
  return outcome;
}

function check(expect: Expect, o: Outcome): string[] {
  const failures: string[] = [];
  const all = o.replies.join('\n');
  const last = o.replies.at(-1) ?? '';
  if (expect.script) {
    const share = cyrillicShare(last);
    if (expect.script === 'cyrillic' && share < 0.6) failures.push('not in Cyrillic');
    if (expect.script === 'latin' && share > 0.2) failures.push('not in Latin');
  }
  // A number with a currency or "million": an invented price.
  if (expect.noPrice && /\d[\d\s.,]*\s*(so['ʻ’‘`]?m|сум|sum\b|\$|usd|dollar|долл|mln|million|млн|миллион|ming\b)|\$\s*\d/i.test(all)) {
    failures.push('names a price');
  }
  // A number of days, weeks or months: an invented timeline.
  if (expect.noTimeline && /\d+\s*([-–]\s*\d+\s*)?(kun|hafta|oy\b|soat|дн|день|недел|месяц|day|week|month|hour)/i.test(all)) {
    failures.push('names a timeline');
  }
  if (expect.lead !== undefined && expect.lead !== o.leads.length > 0) {
    failures.push(expect.lead ? 'lead not sent' : 'lead sent without a clear yes');
  }
  if (expect.leadCount !== undefined && o.leads.length !== expect.leadCount) {
    failures.push(`${o.leads.length} leads sent, expected ${expect.leadCount}`);
  }
  if (expect.gap && o.gaps.length === 0) failures.push('gap not logged');
  if (expect.gapWithoutPersonal && o.gaps.some((g) => /\d{5,}|kamola/i.test(g.replace(/\s/g, '')))) {
    failures.push('personal details in a logged gap');
  }
  for (const pattern of expect.mustMatch ?? []) {
    if (!new RegExp(pattern, 'i').test(all)) failures.push(`missing /${pattern}/`);
  }
  for (const pattern of expect.mustNotMatch ?? []) {
    if (new RegExp(pattern, 'i').test(all)) failures.push(`contains /${pattern}/`);
  }
  return failures;
}

function cyrillicShare(text: string): number {
  const cyrillic = (text.match(/[Ѐ-ӿ]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return cyrillic + latin === 0 ? 0 : cyrillic / (cyrillic + latin);
}

async function writeReport(): Promise<string> {
  const lines = [`# Eval ${new Date().toISOString()}`, ''];
  lines.push('| Case | ' + models.join(' | ') + ' |', '|---|' + models.map(() => '---').join('|') + '|');
  for (const c of cases) {
    const cells = models.map((m) => {
      const o = results.get(m)!.get(c.id)!;
      return o.error ? 'error' : o.failures.length ? `fail: ${o.failures.join('; ')}` : 'pass';
    });
    lines.push(`| ${c.id} | ${cells.join(' | ')} |`);
  }
  for (const c of cases) {
    lines.push('', `## ${c.id}`, '', c.about);
    for (const model of models) {
      const o = results.get(model)!.get(c.id)!;
      lines.push('', `### ${model} — $${o.costUsd.toFixed(4)}`);
      c.turns.forEach((message, i) => {
        lines.push('', `**Visitor:** ${message}`, '', `**Assistant:** ${o.replies[i] ?? '(no reply)'}`);
      });
      if (o.leads.length) lines.push('', `Leads: ${JSON.stringify(o.leads)}`);
      if (o.gaps.length) lines.push('', `Gaps: ${o.gaps.join('; ')}`);
      if (o.error) lines.push('', `Error: ${o.error}`);
    }
  }
  const dir = new URL('./results/', import.meta.url);
  await mkdir(dir, { recursive: true });
  const file = new URL(`${new Date().toISOString().replace(/[:.]/g, '-')}.md`, dir);
  await writeFile(file, lines.join('\n') + '\n');
  return file.pathname;
}

// Runs `work` over `items`, at most `size` at a time.
async function pool<T>(items: T[], size: number, work: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(size, queue.length) }, async () => {
      for (let item = queue.shift(); item; item = queue.shift()) await work(item);
    }),
  );
}
