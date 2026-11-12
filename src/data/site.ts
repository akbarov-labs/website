// Everything the owner fills in lives here. An empty value is hidden on the
// site, so nothing like "[NARX]" ever reaches a visitor.

export const site = {
  name: 'Akbarov Labs',
  url: 'https://akbarovlabs.uz',
  description:
    'Biznesingiz uchun saytlar, Telegram botlar va biznes tizimlarini quramiz — va ularga sunʼiy intellektni ulab beramiz.',

  // TODO: your Telegram username without "@" (the "Telegramda yozish" buttons use it).
  telegram: '',
  // TODO: the blog's Telegram channel without "@" (the subscribe blocks show only when set).
  telegramChannel: '',
  // Works once Cloudflare Email Routing forwards it to your inbox.
  email: 'hello@akbarovlabs.uz',
  instagram: 'akbarovlabs',
  // TODO: put a photo in public/ (e.g. public/sarvar.jpg) and write '/sarvar.jpg'.
  founderPhoto: '',
  founder: 'Sarvar Akbarov',
};

export type Plan = {
  name: string;
  // In soʻm, e.g. '3 000 000'. Empty → "Narxi suhbatda aniqlanadi".
  price: string;
  // e.g. '7–10 kun'. Empty → the line is hidden.
  term: string;
  items: string[];
  featured?: boolean;
};

// TODO: fill in prices and terms.
export const plans: Plan[] = [
  {
    name: 'Landing sahifa',
    price: '',
    term: '',
    items: ['Bir sahifali zamonaviy sayt', 'Telefonga moslashgan', 'Arizalar Telegramga keladi', 'Domen va hostingni sozlash'],
  },
  {
    name: 'Telegram bot',
    price: '',
    term: '',
    featured: true,
    items: ['Menyu, katalog va buyurtmalar', 'Admin uchun boshqaruv paneli', 'Mijozlarga xabarnomalar', 'Toʻlov tizimini ulash'],
  },
  {
    name: 'Biznes tizimi (CRM)',
    price: '',
    term: '',
    items: ['Mijozlar va buyurtmalar bazasi', 'Xodimlar uchun alohida huquqlar', 'Kunlik va oylik hisobotlar', 'AI yordamchi (ixtiyoriy)'],
  },
];

// Where "write to us" buttons go: Telegram when set, otherwise e-mail.
export const contactHref = site.telegram ? `https://t.me/${site.telegram}` : `mailto:${site.email}`;
export const contactLabel = site.telegram ? 'Telegramda yozish' : 'Xat yozish';
