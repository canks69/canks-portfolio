import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { FEATURES } from './src/components/data/site.js';

// https://astro.build/config
export default defineConfig({
	// dipakai untuk canonical, Open Graph, dan sitemap
	site: 'https://canks.dev',
	devToolbar: {
		enabled: false,
	},
	integrations: [
		react(),
		sitemap({
			// halaman pengalihan lama, artikel contoh, dan seluruh blog (bila disembunyikan) tidak diindeks
			filter: (page) =>
				!page.endsWith('/about/') && !page.includes('/blog/example/') && (FEATURES.blog || !page.includes('/blog')),
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
