// Finished work, as the home page shows it. The assistant reads this file too
// (assistant/src/knowledge.ts), so it has no imports: logos are matched to
// `id` in src/pages/index.astro.

export type Work = {
  id: string;
  name: string;
  kind: string;
  text: string;
  href: string;
  linkText: string;
};

// The big card at the top of the section.
export const featuredWork = {
  id: 'kitoblarim',
  name: 'Kitoblarim',
  kind: 'Telegram bot + Mini App · 3 tilda',
  text: 'Boshlagan kitobingizni oxirigacha oʻqishga yordam beradigan bepul Telegram ilova. Tugatish sanasini tanlaysiz — ilova kuniga necha sahifa oʻqish kerakligini hisoblaydi va Telegramda eslatib turadi.',
  features: [
    'Shaxsiy va oilaviy kutubxona, shtrix-kod orqali kitob qoʻshish',
    'Telegram guruhlarida oʻqish marafonlari',
    'Audiokitoblar pleyeri',
    'Keyingi kitobni tanlashda maslahatchi',
  ],
  links: [
    { href: 'https://t.me/kitob_javonim_bot', text: '@kitob_javonim_bot' },
    { href: 'https://kitoblarim.uz', text: 'kitoblarim.uz — kitoblar katalogi' },
  ],
};

// The rest of what's live, under Kitoblarim.
export const works: Work[] = [
  {
    id: 'olgo',
    name: 'Olgo',
    kind: 'Sayt + Telegram bot',
    text: 'Instagram sotuvchilari uchun Telegramda onlayn doʻkon. Mijozlar Payme, Click orqali yoki naqd pulda toʻlaydi, buyurtmalar esa sotuvchining telefoniga keladi.',
    href: 'https://olgo.uz',
    linkText: 'olgo.uz',
  },
  {
    id: 'alifbo',
    name: 'Yangi Alifbo',
    kind: 'Sayt + Telegram bot',
    text: 'Oʻzbek matnini kirill, lotin va yangi alifbo (ö, ğ, ş, ç) orasida oʻgiradi. Word, PDF, PowerPoint va Excel fayllarini ham.',
    href: 'https://alifbo.akbarovlabs.uz',
    linkText: 'alifbo.akbarovlabs.uz',
  },
  {
    id: 'aktiv-yodla',
    name: 'Aktiv Yodla',
    kind: 'Telegram Mini App',
    text: 'Inglizcha soʻzlarni ishlatishni oʻrgatadi: har bir yangi soʻzni darhol oʻz gapingizda qoʻllaysiz, keyin u unutilishidan oldin takrorlanadi.',
    href: 'https://yodla.akbarovlabs.uz',
    linkText: 'yodla.akbarovlabs.uz',
  },
  {
    id: 'posbon',
    name: 'Posbon',
    kind: 'Telegram bot',
    text: 'Telegram guruhlarini qoʻriqlaydi: yangi aʼzolarga captcha, spam va reklamaga qarshi himoya. Barcha sozlamalar bot bilan shaxsiy chatda.',
    href: 'https://t.me/PosbonGuruhBot',
    linkText: '@PosbonGuruhBot',
  },
  {
    id: 'birgaolamizmi',
    name: 'Birga olamizmi?',
    kind: 'Telegram bot + Mini App',
    text: 'Birgalikda xarid: odamlar bitta mahsulotga yigʻilib, uni ulgurji narxda oladi. Guruh toʻlmasa, hech kim hech narsa toʻlamaydi.',
    href: 'https://birgaolamiz.akbarovlabs.uz',
    linkText: 'birgaolamiz.akbarovlabs.uz',
  },
];
