import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Setiap file .md/.mdx di src/content/blog menjadi satu entri (id = nama file)
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	// Validasi frontmatter
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Ubah string menjadi objek Date
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		// true = jangan diindeks mesin pencari dan jangan masuk sitemap
		noindex: z.boolean().default(false),
	}),
});

// Proyek portofolio — satu file .md per proyek di src/content/projects.
// Nama file = slug (alamat /proyek/<slug>/). Isi Markdown menjadi deskripsi lengkap di halaman detail.
const projects = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
	schema: z.object({
		// judul singkat (kartu, judul halaman, menu)
		title: z.string(),
		// judul resmi/lengkap — tampil di daftar fakta halaman detail
		fullTitle: z.string().optional(),
		category: z.string(),
		// bahasa isi (summary & Markdown); dipakai untuk atribut lang
		lang: z.string().default('id'),
		// path gambar relatif ke /public, mis. /img/portfolio/mebook-erp.jpg
		image: z.string(),
		// ringkasan singkat — dipakai pada kartu dan meta description
		summary: z.string(),
		skills: z.array(z.string()),
		// urutan tampil (kecil = lebih dulu)
		order: z.number().default(100),
		demoURL: z.string().default(''),
		repoURL: z.string().default(''),
		role: z.string().optional(),
		year: z.coerce.string().optional(),
		highlights: z.array(z.string()).default([]),
	}),
});

export const collections = { blog, projects };
