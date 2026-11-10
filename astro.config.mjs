import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://akbarovlabs.uz',
  integrations: [sitemap()],
  // `npm run dev` only: the chat talks to the assistant running locally
  // (cd assistant && npm run dev). In production nginx does this.
  vite: {
    server: { proxy: { '/api/assistant': 'http://localhost:8080' } },
  },
});
