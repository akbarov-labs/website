# Ustaxona yordamchisi — plan

The real AI assistant that replaces the sample chat on akbarovlabs.uz (`src/components/ChatDemo.astro`).
Status (9 November 2026): built and tested locally against a stand-in for the Claude API; not yet run
on a real model, not deployed. Code: `assistant/` (see its README). Waiting on the items in step 1 of the
build order.

## What it does

- Answers visitors' questions about Akbarov Labs: services, prices and terms, finished work, how a
  project runs, the blog. Uzbek (Latin) by default; it answers in the visitor's language
  (Uzbek Cyrillic, Russian, English).
- Answers **only** from what we give it. If the answer isn't there, it says so and offers to pass the
  question to Sarvar. It never invents a price, a deadline or a feature.
- When a visitor wants a project, it collects name, contact (Telegram or phone) and what they need,
  **asks before sending**, then sends it to Sarvar on Telegram. It tells the visitor Sarvar will write
  back.
- It is also the live demo of the “AI yordamchilar” service we sell, and the thing we learn on.

It does not: take payments, book calls on a calendar, discuss other companies, or answer general
questions unrelated to us (homework, code help, news).

## How it fits the site

```
visitor ─ Cloudflare ─ edge Caddy ─ web (nginx, static site)
                                      └── /api/assistant/* ─ assistant (Node)  ─ Claude API
                                                                               └ Telegram Bot API (leads)
```

- **assistant**: a small Node + TypeScript service in `assistant/`, using the official
  `@anthropic-ai/sdk`. One endpoint, `POST /api/assistant/chat`, streams the reply (server-sent
  events). No database.
- **web** stays nginx. nginx forwards `/api/assistant/` to the assistant container (with buffering
  off, so the stream isn't held back). The edge Caddy config doesn't change.
- **Two images, one deploy**: `ghcr.io/akbarov-labs/website/web` and `.../website/assistant`.
  `deploy-app` already supports this (`IMAGES="web assistant"`); it needs one line in
  `/etc/deploy-app/akbarovlabs.conf` on the server.
- **Feature switch**: `ASSISTANT_ENABLED` in the server's `.env`. Off → the page keeps today's sample
  chat. So it can ship dark, and be turned off in a minute if something goes wrong.

## What it knows

One knowledge file, built at `npm run build` from the same sources the page uses, so the assistant
and the page can't disagree:

- services and plans (`src/data/site.ts`) — **prices and terms are empty today; they must be filled
  first**, or the most common question gets “narxi suhbatda aniqlanadi”;
- finished work (the `works` list moves from `index.astro` to `src/data/works.ts`);
- blog posts (`src/content/blog/`);
- a hand-written FAQ (`assistant/faq.md`): how a project runs, typical timelines, payment, support
  after launch, who we are. I'll draft it from the site and the projects; Sarvar corrects it.

That's about 5,000 tokens: small enough to send whole on every request, so no search or vector
database. It sits in the system prompt with prompt caching, so repeat reads cost a tenth of the
price.

## Model and cost

The model is set by `ASSISTANT_MODEL`, the same way Kitoblarim's recommender does it.

Estimate for one conversation of 4 answers: the 5,000-token knowledge is written to the cache on the
first answer and read from it on the next three; each answer adds ~400 input tokens and produces ~400
output tokens (the reply plus a little thinking at `effort: "low"`).

| Model | Input / output per 1M | Cache write / read per 1M | Per conversation | 100 / month | 500 / month | 1,000 / month |
|---|---|---|---|---|---|---|
| `claude-opus-5-5` | $4 / $20 | $5 / $0.20 | ~6.8¢ | ~$7 | ~$34 | ~$68 |
| `claude-sonnet-5-5` | $2 / $10 | $2.50 / $0.20 | ~3.6¢ | ~$4 | ~$18 | ~$36 |
| `claude-haiku-5-5` | $0.10 / $0.50 | $0.125 / $0.01 | ~0.18¢ | ~$0.20 | ~$0.90 | ~$1.80 |

Output is most of the cost, so how long the answers are matters more than the knowledge size. Uzbek
may take more tokens than English; the first build measures the real numbers from each response's
`usage`. The daily cap ($2) limits the worst month to about $60 whatever the traffic.

**Plan: one model for every message, not a different model per task.** Start with `claude-opus-5-5`
at `effort: "low"`, because answer quality in Uzbek is the biggest risk. Run the same eval on Sonnet
5.5 and Haiku 5.5 (all three cost under $1), and switch to the cheapest one that passes. Routing
messages to different models needs a step that decides which model to use, loses the cache on every
switch, and doubles the testing; at this traffic it would save a few dollars a month. Revisit it only
if traffic reaches thousands of conversations and the eval shows a cheaper model fails only on certain
kinds of questions.

Other settings: streaming, `max_tokens` around 2,000, and the server-side refusal fallback enabled.

## Keeping it safe and cheap

- **Cloudflare Turnstile** before the first message of a conversation (Reads already uses it).
- **Limits per visitor**: 20 messages an hour, 12 messages per conversation, 1,000 characters per
  message. Needs the visitor's real IP behind Cloudflare: one label from
  `docs/cloudflare-real-ip.md` in `akbarov-labs/reads`.
- **Daily budget**: the service adds up token usage and stops answering for the day past a set
  amount (e.g. $2), showing the “Telegramda yozish” button instead. Plus a monthly spend limit in the
  Anthropic Console as the last backstop.
- **Prompt injection**: visitor text is treated as a question, never as instructions; the only action
  it can trigger is a lead message to Sarvar, and only after the visitor confirms.
- **Privacy**: conversations aren't stored. The server logs token counts and errors only. A lead
  exists only as the Telegram message. A line under the chat says it's an AI and can be wrong.

## Testing and learning

No staging, so testing happens before the push:

- **Eval set** (`assistant/eval/`): ~40 questions in Uzbek, Russian and English, each with what a good
  answer must and mustn't do. Price and timeline questions, “show me your work”, off-topic requests,
  “ignore your instructions”, a full lead conversation, a visitor who won't give a contact. Run before
  every change to the prompt or model; one run costs cents and prints the cost.
- **Local run**: `docker compose up` with your own API key, the real widget on localhost.
- **After launch**: a weekly look at the logs (questions it couldn't answer become FAQ entries), and
  the eval re-run when the FAQ changes.

## Build order

1. **You**: fill prices and terms in `site.ts`, your Telegram username, and correct the FAQ draft.
   Create an API key and a Console spend limit, a Telegram bot for leads (plus your chat id), and a
   Turnstile site key.
2. **Assistant service**: knowledge build, system prompt, lead tool, limits, eval set. Tested locally.
3. **Widget**: the live chat in the sample chat's place, same design; the three chips become starter
   questions; errors and limits fall back to the contact button.
4. **Ship dark**: CI builds both images; on the server, the `IMAGES` line, the real-IP label and the
   secrets in `.env`; deploy with `ASSISTANT_ENABLED=false`, then turn it on.
5. **Blog post**: how we built it and what the first weeks showed.
