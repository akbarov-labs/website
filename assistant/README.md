# Ustaxona yordamchisi

The AI chat on akbarovlabs.uz. A small Node service: the page's chat card
(`src/components/Assistant.astro`) asks it whether it is on, then streams
answers from it. Plan and reasoning: `docs/ai-assistant.md`. Deploying and
turning it on: `DEPLOY.md` → The AI assistant.

| File | What it is |
|---|---|
| `src/server.ts` | HTTP service: config, chat (server-sent events), limits, daily budget |
| `src/chat.ts` | One visitor turn: Claude, streaming, the two tools. Shared with the eval |
| `src/prompt.ts` | The instructions and tool definitions |
| `src/knowledge.ts` | What it knows, built from `src/data/*.ts`, the blog and `faq.md` |
| `faq.md` | Answers to common questions. `TODO` answers are left out |
| `eval/` | Test conversations and the runner that compares models |

Node 24 runs the TypeScript directly; there is no build step.

## Run it locally

```bash
cd assistant && npm install && cp .env.example .env
```

Put your `ANTHROPIC_API_KEY` in `.env` and set `ASSISTANT_ENABLED=true`. Then,
in two terminals:

```bash
cd assistant && npm run dev
```

```bash
npm run dev
```

Open `http://localhost:4321`: the chat card in the hero is live. Without the
assistant running, it stays the sample.

## Check what it knows

```bash
cd assistant && npm run knowledge
```

Prints the full instructions and knowledge exactly as Claude receives them,
and lists the FAQ questions that still have no answer.

## Eval

```bash
cd assistant && npm run eval
```

Runs every conversation in `eval/cases.json` on Opus 5.5, Sonnet 5.5 and
Haiku 5.5 (about a dollar in total), prints pass/fail per model, and writes
every answer to `eval/results/` for reading. The checks catch invented prices
and timelines, wrong tool use and the wrong alphabet; whether the Uzbek reads
well is for a person to judge. Pick the cheapest model that passes and reads
well, and set it as `ASSISTANT_MODEL`.

`npm run eval -- --models claude-haiku-5-5 --only lead-full` runs part of it.
