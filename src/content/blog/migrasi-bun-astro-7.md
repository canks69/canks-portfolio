---
title: "Pindah ke Bun dan Astro 7: Apa yang Berubah"
description: "Catatan migrasi dari npm + Astro 4 ke Bun + Astro 7, termasuk koleksi konten, Tailwind 4, dan Dockerfile."
pubDate: '2026-11-23'
---

Portofolio ini sebelumnya memakai npm, Astro 4, React 18, dan Tailwind 3. Setelah pindah ke **Bun** dan memperbarui semua dependensi, versinya melompat jauh: Astro 7, React 19, dan Tailwind 4. Berikut hal-hal yang perlu diubah.

## Bun sebagai package manager

Langkahnya singkat: hapus `package-lock.json`, hapus `node_modules`, lalu pasang ulang.

```bash
bun install
```

Bun membuat `bun.lock` (format teks, aman di-commit). Untuk menjalankan skrip Astro di runtime Bun, bukan Node.js, tambahkan `--bun`:

```bash
bun --bun run dev
bun --bun run build
```

## Koleksi konten: konfigurasi lama sudah dihapus

Build pertama langsung gagal dengan `LegacyContentConfigError`. Konfigurasi lama di `src/content/config.ts` tidak lagi didukung; koleksi sekarang wajib punya **loader**.

File dipindah ke `src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
  }),
});

export const collections = { blog };
```

Perubahan lain yang mengikutinya:

- `z` sekarang diimpor dari `astro/zod`.
- `post.slug` menjadi `post.id`.
- `post.render()` menjadi `render(post)`, yang diimpor dari `astro:content`.

## Tailwind 4 dan integrasi yang tidak lagi cocok

`@astrojs/tailwind` hanya mendukung Astro sampai versi 5 dan Tailwind 3, jadi harus diganti dengan plugin Vite resmi dari Tailwind:

```js
// astro.config.mjs
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: { plugins: [tailwindcss()] },
});
```

```css
/* global.css */
@import 'tailwindcss';
```

File `tailwind.config.mjs` tidak diperlukan lagi; konfigurasi Tailwind 4 berada di CSS.

## `astro dev` sekarang berjalan sebagai daemon

Di Astro 7, `astro dev` dan `astro preview` berjalan di latar belakang. Untuk menghentikannya:

```bash
bun --bun run astro dev stop
bun --bun run astro preview stop
```

Jangan mengandalkan `pkill`: polanya mudah ikut mengenai proses Astro milik project lain.

## Dockerfile

Tahap build sekarang memakai image Bun. Image itu tidak punya Node.js, karena itu build dijalankan dengan `--bun`:

```dockerfile
FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun --bun run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

Tambahkan juga `.dockerignore` yang mengecualikan `node_modules` dan `dist`. Tanpa itu, `COPY . .` bisa menimpa hasil `bun install` di dalam image dengan `node_modules` dari komputer lokal, yang berisi binari untuk sistem operasi yang berbeda.

## Catatan versi Node.js

Astro 7 mensyaratkan Node.js 22.23.4 atau lebih baru bila dijalankan lewat Node. Bila skrip dijalankan dengan `bun --bun`, Node.js tidak dibutuhkan.
