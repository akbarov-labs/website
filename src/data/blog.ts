import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;
export type Topic = Post['data']['topic'];

export const topics: { id: Topic; label: string }[] = [
  { id: 'SAYTLAR', label: 'Saytlar' },
  { id: 'TELEGRAM', label: 'Telegram' },
  { id: 'AI', label: 'AI' },
  { id: 'BIZNES', label: 'Biznes' },
];

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', (p) => !p.data.draft);
  return posts.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

export function formatDate(d: Date): string {
  return `${d.getUTCDate()}-${months[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
}

export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export function postUrl(p: Post): string {
  return `/blog/${p.id}/`;
}
