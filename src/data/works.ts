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
    href: 'https://t.me/Posboncha_bot',
    linkText: '@Posboncha_bot',
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

// Prototypes: work we made to show what we can build. None of these is a
// client project. The brands are fictional, or the sites are unsolicited
// concepts that the businesses did not take, so the page and the assistant
// must always call them prototypes.
export type Prototype = {
  id: string;
  name: string;
  kind: string;
  text: string;
  href: string;
  linkText: string;
};

export const prototypes: Prototype[] = [
  {
    id: 'yashil-vodiy',
    name: 'Yashil Vodiy Residence',
    kind: '3D sayt · uz/ru/en',
    text: 'Toshkentdagi turar-joy majmuasi uchun skroll bilan harakatlanadigan 3D sayt: binolar qavatma-qavat quriladi, qavat tanlanadi, kvartira ichi va Toshkent uchun hisoblangan haqiqiy quyosh nuri koʻrsatiladi. Majmua xayoliy.',
    href: 'https://akbarov-labs.github.io/yashil-vodiy/',
    linkText: 'Demoni koʻrish',
  },
  {
    id: 'falak',
    name: 'Falak Observatory 41',
    kind: '3D mahsulot sahifasi',
    text: 'Soat uchun 3D taqdimot: korpus, siferblat, mexanizm qismlarga ajraladi, tasma almashtiriladi va bilakka oʻlchab koʻriladi. Brend xayoliy, model fayllarsiz, toʻliq kodda yasalgan.',
    href: 'https://akbarov-labs.github.io/falak-watch-story/',
    linkText: 'Demoni koʻrish',
  },
  {
    id: 'paper-boat',
    name: 'Paper Boat Voyage',
    kind: '3D hikoya',
    text: 'Skroll qilganingiz sari qogʻoz qayiq togʻ bulogʻidan dengizgacha 38 km suzib boradi. Skroll orqali hikoya qilish texnikasi namunasi.',
    href: 'https://akbarov-labs.github.io/paper-boat-voyage/',
    linkText: 'Demoni koʻrish',
  },
  {
    id: 'dentist',
    name: 'Stomatolog sayti',
    kind: 'Sayt shabloni · uz/ru',
    text: 'Xususiy stomatolog uchun sayt: davolash narxi kalkulyatori, “hozir ochiq” ish vaqti va Telegramga qabulga yozilish. Shifokor va holatlar namuna sifatida berilgan.',
    href: 'https://github.com/akbarov-labs/dentist-2',
    linkText: 'Kodni koʻrish',
  },
  {
    id: 'rosemarine',
    name: 'Organik sovun brendi',
    kind: 'Sayt konsepti · uz/ru/en',
    text: 'Qoʻlda tayyorlangan organik sovun brendi uchun doʻkon konsepti. Brendning rasmiy sayti emas.',
    href: 'https://rosemarine.vercel.app',
    linkText: 'Konseptni koʻrish',
  },
  {
    id: 'muqimiy',
    name: 'Teatr sayti',
    kind: 'Redizayn konsepti',
    text: 'Toshkentdagi teatr sayti uchun redizayn konsepti: repertuar, spektakllar, yangiliklar. Teatrning rasmiy sayti emas.',
    href: 'https://muqumiy-concept.vercel.app',
    linkText: 'Konseptni koʻrish',
  },
];
