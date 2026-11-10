// One visitor turn: send the conversation to Claude, stream the reply, run the
// tools it asks for, and repeat until it has answered. Used by the server and
// by the eval, so both behave the same.

import Anthropic from '@anthropic-ai/sdk';
import { tools } from './prompt.ts';
import { costUsd, supportsFallbacks } from './pricing.ts';

export type Lead = { name: string; contact: string; need: string };

export type TurnHooks = {
  onText: (delta: string) => void;
  // Resolves when the lead reached Sarvar; throws when it didn't.
  sendLead: (lead: Lead) => Promise<void>;
  logGap: (topic: string) => void;
};

export type TurnResult = {
  costUsd: number;
  outputTokens: number;
  leadSent: boolean;
  refused: boolean;
};

// Shown when Claude declines to answer at all.
export const refusalText =
  'Bu savolga javob bera olmayman. Akbarov Labs xizmatlari yoki loyihangiz haqida soʻrasangiz, bajonidil yordam beraman.';

// A reply plus at most a couple of tool calls; more means something is looping.
const maxRounds = 4;

export async function runTurn(
  client: Anthropic,
  options: {
    model: string;
    system: string;
    // The whole conversation, ending with the visitor's new message. Replies
    // are appended to it unchanged, so the next turn replays them as they came.
    history: Anthropic.Beta.BetaMessageParam[];
    leadAlreadySent: boolean;
    signal?: AbortSignal;
  },
  hooks: TurnHooks,
): Promise<TurnResult> {
  const { model, system, history, signal } = options;
  const result: TurnResult = { costUsd: 0, outputTokens: 0, leadSent: options.leadAlreadySent, refused: false };
  let wroteText = false;
  let jsonRetries = 0;

  for (let round = 0; round < maxRounds; round++) {
    let roundStarted = false;
    const stream = client.beta.messages.stream(
      {
        model,
        max_tokens: 2000,
        // Short answers from a fixed text don't need deep thinking; the eval
        // checks whether a higher effort would answer better.
        output_config: { effort: 'low' },
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        tools,
        messages: history,
        ...(supportsFallbacks(model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      },
      { signal },
    );
    stream.on('text', (delta) => {
      // Text before and after a tool call arrives in two rounds; keep it apart.
      if (!roundStarted && wroteText) hooks.onText('\n\n');
      roundStarted = true;
      wroteText = true;
      hooks.onText(delta);
    });

    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await stream.finalMessage();
    } catch (err) {
      // With streamed tool inputs, a tool call whose JSON can't be parsed at
      // all rejects here. Ask again once; API errors and aborts go up.
      if (err instanceof Anthropic.APIError || signal?.aborted || jsonRetries++ >= 1) throw err;
      round--;
      continue;
    }
    result.costUsd += costUsd(model, message.usage);
    result.outputTokens += message.usage.output_tokens;
    history.push({ role: 'assistant', content: message.content });

    if (message.stop_reason === 'refusal') {
      result.refused = true;
      if (!wroteText) hooks.onText(refusalText);
      return result;
    }
    const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
    if (message.stop_reason !== 'tool_use' || toolUses.length === 0) return result;

    const toolResults: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const call of toolUses) {
      toolResults.push({ type: 'tool_result', tool_use_id: call.id, ...(await runTool(call, result, hooks)) });
    }
    history.push({ role: 'user', content: toolResults });
  }
  return result;
}

async function runTool(
  call: Anthropic.Beta.BetaToolUseBlock,
  result: TurnResult,
  hooks: TurnHooks,
): Promise<{ content: string; is_error?: boolean }> {
  const input = call.input as Record<string, unknown>;
  if (call.name === 'log_gap') {
    const topic = text(input.topic, 120);
    if (!topic) return { content: 'topic is required, under 120 characters', is_error: true };
    hooks.logGap(topic);
    return { content: 'Noted.' };
  }
  if (call.name === 'send_lead') {
    if (result.leadSent) return { content: 'Already sent in this conversation; do not send again.', is_error: true };
    const lead = { name: text(input.name, 100), contact: text(input.contact, 100), need: text(input.need, 800) };
    if (!lead.name || !lead.contact || !lead.need) {
      return { content: 'name, contact and need are all required, each short', is_error: true };
    }
    try {
      await hooks.sendLead(lead as Lead);
    } catch {
      return {
        content: 'Sending failed. Ask the visitor to write to Sarvar directly with the contact button on the page.',
        is_error: true,
      };
    }
    result.leadSent = true;
    return { content: 'Sent to Sarvar.' };
  }
  return { content: `Unknown tool ${call.name}`, is_error: true };
}

// A trimmed string no longer than `max`, or '' for anything else.
function text(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : '';
}
