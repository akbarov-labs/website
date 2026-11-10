// The assistant's HTTP service. nginx in the web container forwards
// /api/assistant/ here; nothing else reaches it.
//
//   GET  /api/assistant/config  → { enabled, turnstileSiteKey } for the widget
//   GET  /api/assistant/health  → "ok"
//   POST /api/assistant/chat    → the reply as server-sent events
//
// Conversations live in memory for an hour after their last message and are
// never written anywhere. Logs carry token counts and costs, never what anyone
// typed.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { buildKnowledge } from './knowledge.ts';
import { systemPrompt } from './prompt.ts';
import { runTurn } from './chat.ts';
import { DailyBudget, RateLimiter } from './limits.ts';
import { checkTurnstile, sendLeadToTelegram } from './outside.ts';

const env = process.env;
const config = {
  port: Number(env.PORT ?? 8080),
  enabled: env.ASSISTANT_ENABLED === 'true' && Boolean(env.ANTHROPIC_API_KEY),
  model: env.ASSISTANT_MODEL || 'claude-opus-5-5',
  dailyBudgetUsd: Number(env.ASSISTANT_DAILY_BUDGET_USD ?? 2),
  turnstileSiteKey: env.TURNSTILE_SITE_KEY || null,
  turnstileSecret: env.TURNSTILE_SECRET_KEY || null,
  leadBotToken: env.LEAD_BOT_TOKEN || null,
  leadChatId: env.LEAD_CHAT_ID || null,
};

const limits = {
  messageChars: 1000,
  messagesPerConversation: 12,
  messagesPerIpPerHour: 20,
  conversationsPerIpPerHour: 5,
  concurrentReplies: 6,
  conversationIdleMs: 60 * 60_000,
  conversations: 5000,
};

type Conversation = {
  history: Anthropic.Beta.BetaMessageParam[];
  userMessages: number;
  leadSent: boolean;
  busy: boolean;
  lastAt: number;
};

const conversations = new Map<string, Conversation>();
const messagesPerIp = new RateLimiter(limits.messagesPerIpPerHour, 3600_000);
const newConversationsPerIp = new RateLimiter(limits.conversationsPerIpPerHour, 3600_000);
const budget = new DailyBudget(config.dailyBudgetUsd);
let replying = 0;

const knowledge = await buildKnowledge();
const system = systemPrompt(knowledge.text);
const client = config.enabled ? new Anthropic() : null;

log('start', {
  enabled: config.enabled,
  model: config.model,
  knowledgeChars: knowledge.text.length,
  turnstile: Boolean(config.turnstileSecret),
  leads: Boolean(config.leadBotToken && config.leadChatId),
  faqWithoutAnswer: knowledge.missing,
});

setInterval(() => {
  const now = Date.now();
  for (const [id, c] of conversations) {
    if (!c.busy && now - c.lastAt > limits.conversationIdleMs) conversations.delete(id);
  }
  messagesPerIp.sweep(now);
  newConversationsPerIp.sweep(now);
}, 5 * 60_000).unref();

createServer((req, res) => {
  handle(req, res).catch((err) => {
    log('error', { where: 'handle', message: String(err) });
    if (!res.headersSent) sendJson(res, 500, { error: 'unavailable' });
    else res.end();
  });
}).listen(config.port, () => log('listening', { port: config.port }));

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const path = (req.url ?? '').split('?')[0];
  if (req.method === 'GET' && path === '/api/assistant/health') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
    return;
  }
  if (req.method === 'GET' && path === '/api/assistant/config') {
    sendJson(res, 200, { enabled: config.enabled, turnstileSiteKey: config.turnstileSiteKey });
    return;
  }
  if (req.method === 'POST' && path === '/api/assistant/chat') {
    await chat(req, res);
    return;
  }
  sendJson(res, 404, { error: 'not_found' });
}

async function chat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!config.enabled || !client) return sendJson(res, 503, { error: 'disabled' });

  const body = await readJson(req, 8 * 1024);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) return sendJson(res, 400, { error: 'bad_request' });
  if (message.length > limits.messageChars) return sendJson(res, 400, { error: 'too_long' });

  const ip = clientIp(req);
  let id = typeof body?.conversationId === 'string' ? body.conversationId : '';
  let conversation = conversations.get(id);
  if (!conversation) {
    if (!newConversationsPerIp.take(ip)) return sendJson(res, 429, { error: 'rate_limited' });
    if (config.turnstileSecret) {
      const token = typeof body?.turnstileToken === 'string' ? body.turnstileToken : undefined;
      if (!(await checkTurnstile(config.turnstileSecret, token, ip))) return sendJson(res, 403, { error: 'captcha' });
    }
    if (conversations.size >= limits.conversations) return sendJson(res, 503, { error: 'busy' });
    id = randomUUID();
    conversation = { history: [], userMessages: 0, leadSent: false, busy: false, lastAt: Date.now() };
    conversations.set(id, conversation);
  }
  if (conversation.busy) return sendJson(res, 409, { error: 'busy' });
  if (conversation.userMessages >= limits.messagesPerConversation) return sendJson(res, 429, { error: 'conversation_full' });
  if (!messagesPerIp.take(ip)) return sendJson(res, 429, { error: 'rate_limited' });
  if (budget.exhausted()) return sendJson(res, 503, { error: 'budget' });
  if (replying >= limits.concurrentReplies) return sendJson(res, 503, { error: 'busy' });

  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    'x-accel-buffering': 'no',
  });
  const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  send('start', { conversationId: id });

  // Stop paying for a reply nobody is reading.
  const abort = new AbortController();
  res.on('close', () => abort.abort());

  conversation.busy = true;
  conversation.userMessages++;
  conversation.lastAt = Date.now();
  conversation.history.push({ role: 'user', content: message });
  replying++;
  const started = Date.now();
  try {
    const turn = await runTurn(
      client,
      { model: config.model, system, history: conversation.history, leadAlreadySent: conversation.leadSent, signal: abort.signal },
      {
        onText: (delta) => send('text', { delta }),
        sendLead: async (lead) => {
          if (!config.leadBotToken || !config.leadChatId) throw new Error('leads bot not configured');
          await sendLeadToTelegram(config.leadBotToken, config.leadChatId, lead);
          send('lead', {});
        },
        logGap: (topic) => log('gap', { topic }),
      },
    );
    budget.add(turn.costUsd);
    if (turn.leadSent && !conversation.leadSent) log('lead', {});
    conversation.leadSent = turn.leadSent;
    log('turn', {
      model: config.model,
      ms: Date.now() - started,
      costUsd: round(turn.costUsd),
      outputTokens: turn.outputTokens,
      refused: turn.refused,
      todayUsd: round(budget.spentToday),
    });
    send('done', { left: limits.messagesPerConversation - conversation.userMessages });
  } catch (err) {
    if (!abort.signal.aborted) {
      log('error', {
        where: 'turn',
        status: err instanceof Anthropic.APIError ? err.status : undefined,
        message: err instanceof Error ? err.message : String(err),
      });
      send('error', { error: 'unavailable' });
    }
  } finally {
    replying--;
    conversation.busy = false;
    conversation.lastAt = Date.now();
    res.end();
  }
}

// The visitor's address. Behind Cloudflare, the edge Caddy puts the real one
// first in X-Forwarded-For (with the label from cloudflare-real-ip.md in
// akbarov-labs/reads) and nginx passes it on.
function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.socket.remoteAddress || 'unknown';
}

async function readJson(req: IncomingMessage, maxBytes: number): Promise<Record<string, unknown> | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > maxBytes) return null;
    chunks.push(chunk as Buffer);
  }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(data));
}

function round(usd: number): number {
  return Math.round(usd * 10_000) / 10_000;
}

function log(event: string, data: Record<string, unknown>): void {
  console.log(JSON.stringify({ t: new Date().toISOString(), event, ...data }));
}
