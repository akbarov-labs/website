// Everything the assistant knows, as one text built from the same files the
// home page uses: if the site and the assistant disagree, the site's data is
// wrong in both places, never in one. Built once at start-up, so the system
// prompt is byte-identical on every request and stays in the prompt cache.

import { readFile, readdir } from 'node:fs/promises';
import { site, plans } from '../../src/data/site.ts';
import { services } from '../../src/data/services.ts';
import { featuredWork, works } from '../../src/data/works.ts';

const blogDir = new URL('../../src/content/blog/', import.meta.url);
const faqFile = new URL('../faq.md', import.meta.url);

export type Knowledge = {
  text: string;
  // FAQ questions with no answer yet (TODO), for the start-up log.
  missing: string[];
};

export async function buildKnowledge(): Promise<Knowledge> {
  const faq = parseFaq(await readFile(faqFile, 'utf8'));
  const posts = await readPosts();
  const sections = [
    section('Biz haqimizda', [
      `${site.name} (${site.url}): ${site.description}`,
      `Asoschisi: ${site.founder}.`,
    ]),
    section(
      'Xizmatlar',
      services.map((s) => `- ${s.title}: ${s.text}`),
    ),
    section(
      'Narxlar',
      plans.map((p) => {
        const price = p.price ? `${p.price} soʻmdan` : 'narxi suhbatda aniqlanadi';
        const term = p.term ? `, muddati: ${p.term}` : ', muddati suhbatda aniqlanadi';
        return `- ${p.name}: ${price}${term}. Ichiga kiradi: ${p.items.join('; ')}.`;
      }),
    ),
    section('Ishga tushirilgan ishlar', [
      `- ${featuredWork.name} (${featuredWork.kind}): ${featuredWork.text} Imkoniyatlari: ${featuredWork.features.join('; ')}. ` +
        featuredWork.links.map((l) => `${l.text}: ${l.href}`).join('; '),
      ...works.map((w) => `- ${w.name} (${w.kind}): ${w.text} ${w.href}`),
    ]),
    section(
      'Blog maqolalari',
      posts.length
        ? posts.map((p) => `### ${p.title}\n${site.url}/blog/${p.slug}/\n${p.description}\n\n${p.body}`)
        : ['Hozircha maqola yoʻq.'],
    ),
    section(
      'Koʻp beriladigan savollar',
      faq.answered.map((e) => `### ${e.question}\n${e.answer}`),
    ),
    section(
      'Aloqa',
      [
        site.telegram && `Telegram: https://t.me/${site.telegram}`,
        `Email: ${site.email}`,
        site.instagram && `Instagram: https://instagram.com/${site.instagram}`,
      ].filter((line): line is string => Boolean(line)),
    ),
  ];
  return { text: sections.join('\n\n'), missing: faq.missing };
}

function section(title: string, lines: string[]): string {
  return `## ${title}\n${lines.join('\n')}`;
}

type FaqEntry = { question: string; answer: string };

function parseFaq(markdown: string): { answered: FaqEntry[]; missing: string[] } {
  const withoutComments = markdown.replace(/<!--[\s\S]*?-->/g, '');
  const answered: FaqEntry[] = [];
  const missing: string[] = [];
  for (const block of withoutComments.split(/^## /m).slice(1)) {
    const [question, ...rest] = block.split('\n');
    const answer = rest.join('\n').trim();
    if (!answer || answer === 'TODO') missing.push(question.trim());
    else answered.push({ question: question.trim(), answer });
  }
  return { answered, missing };
}

type Post = { slug: string; title: string; description: string; body: string };

async function readPosts(): Promise<Post[]> {
  const files = (await readdir(blogDir)).filter((f) => f.endsWith('.md')).sort();
  const posts: Post[] = [];
  for (const file of files) {
    const raw = await readFile(new URL(file, blogDir), 'utf8');
    const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
    if (!match) continue;
    const meta = Object.fromEntries(
      match[1].split('\n').map((line) => {
        const i = line.indexOf(':');
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      }),
    );
    if (meta.draft === 'true') continue;
    posts.push({ slug: file.replace(/\.md$/, ''), title: meta.title, description: meta.description, body: match[2].trim() });
  }
  return posts;
}
