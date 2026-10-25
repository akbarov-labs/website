# akbarovlabs.uz

The Akbarov Labs website: home page and blog. Built with Astro as a static site, hosted on Cloudflare Pages.

## Run locally

```bash
npm install
npm run dev
```

`npm run build` writes the site to `dist/`.

## Before launch: fill in

All of these live in `src/data/site.ts`. Anything left empty is hidden on the site.

- `telegram`: your Telegram username. Until it's set, "write to us" buttons open e-mail.
- `telegramChannel`: the blog's channel. The subscribe blocks show only when it's set.
- `founderPhoto`: put a photo in `public/` and give its path. Until then the logo mark stands in.
- `plans`: prices and terms. An empty price shows "Narxi suhbatda aniqlanadi".
- `email`: hello@akbarovlabs.uz works only once Cloudflare Email Routing forwards it.

## Write a blog post

Add a Markdown file to `src/content/blog/`. The file name becomes the URL:

```md
---
title: Sarlavha
description: Bir-ikki jumlali qisqa mazmun (Google va ulashishda koʻrinadi).
topic: SAYTLAR # SAYTLAR, TELEGRAM, AI yoki BIZNES
published: 2026-11-01
draft: false
---

Matn...
```

`##` headings become the table of contents. Topic chips on /blog appear once posts cover more than one topic.

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare → Workers & Pages → Create → Pages → connect the repo.
3. Framework preset: Astro. Build command `npm run build`, output directory `dist`.
4. Custom domains: add `akbarovlabs.uz` and `www.akbarovlabs.uz`.
5. Rules → Redirect Rules: `www.akbarovlabs.uz/*` → `https://akbarovlabs.uz/${1}`, 301.

`public/_headers` sets security headers and long caching for built assets.
