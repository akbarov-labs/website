// What a request costs, for the daily budget and the eval's report. US dollars
// per million tokens, from Anthropic's price list (November 2026). An unknown
// model is priced as Opus so the budget errs on the safe side.

import type Anthropic from '@anthropic-ai/sdk';

type Price = { input: number; output: number; cacheWrite: number; cacheRead: number };

const prices: Record<string, Price> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 },
};

export function costUsd(model: string, usage: Anthropic.Beta.BetaUsage): number {
  const p = prices[model] ?? prices['claude-opus-5-5'];
  const perToken = (n: number | null | undefined, price: number) => ((n ?? 0) * price) / 1_000_000;
  return (
    perToken(usage.input_tokens, p.input) +
    perToken(usage.output_tokens, p.output) +
    perToken(usage.cache_creation_input_tokens, p.cacheWrite) +
    perToken(usage.cache_read_input_tokens, p.cacheRead)
  );
}

// Haiku has no server-side fallback model: the parameter only works on Opus and Sonnet.
export function supportsFallbacks(model: string): boolean {
  return !model.startsWith('claude-haiku');
}
