// What we offer, as the home page lists it. The assistant reads this file too
// (assistant/src/knowledge.ts), so it has no imports: plain data only.

export type Service = {
  title: string;
  text: string;
  // SVG path data for the 24×24 icon.
  icon: string;
  accent?: boolean;
};

export const services: Service[] = [
  {
    title: 'Veb-saytlar',
    text: 'Landing, korporativ sayt, onlayn doʻkon. Tez yuklanadi, telefonda qulay, Googleʼda topiladi.',
    icon: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
  },
  {
    title: 'Telegram botlar',
    text: 'Buyurtma, yozilish, toʻlov va xabarnomalar — mijozlaringiz har kuni ochadigan ilova ichida.',
    icon: '<path d="M21 4 3 11l6.5 2.2L19 7l-7.2 7.3.4 5.7 3.3-4.1L19.5 19z"/>',
  },
  {
    title: 'CRM tizimlar',
    text: 'Mijozlar, buyurtmalar va hisobotlar bitta joyda. Excel va daftarlar oʻrniga.',
    icon: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 15h7M14 18h5M14 21h7"/>',
  },
  {
    title: 'AI yordamchilar',
    text: 'Mijozlarga kecha-kunduz javob beradigan bot, arizalarni saralash, hisobotlar boʻyicha savol-javob.',
    icon: '<path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8z"/>',
    accent: true,
  },
];
