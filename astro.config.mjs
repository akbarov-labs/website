import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://akbarovlabs.uz',
  integrations: [sitemap()],
});
