import { getCollection, render, type CollectionEntry } from 'astro:content';
import { canonicalSkill } from '../components/data/helpers.js';
// Sumber kedua (opsional): proyek singkat tanpa file Markdown, ditulis sebagai array JS.
import { projects as dataProjects } from '../components/data/portfolioData.js';

export interface Project {
	slug: string;
	title: string;
	fullTitle?: string;
	/** bahasa isi (summary & Markdown) */
	lang: string;
	category: string;
	imgSrc: string;
	skills: string[];
	/** ringkasan singkat (kartu & meta description) */
	descripcion: string;
	repoURL: string;
	demoURL: string;
	role?: string;
	year?: string;
	highlights: string[];
	order: number;
	/** hanya ada untuk proyek dari file Markdown */
	entry?: CollectionEntry<'projects'>;
}

const dedupe = (list: string[]) => [...new Set(list)];

/**
 * Semua proyek = file Markdown di src/content/projects + array di portfolioData.js.
 * Bila slug sama, file Markdown menang. Urut berdasarkan `order`, lalu judul.
 */
export async function getProjects(): Promise<Project[]> {
	const entries = await getCollection('projects');

	const fromMarkdown: Project[] = entries.map((e) => ({
		slug: e.id,
		title: e.data.title,
		fullTitle: e.data.fullTitle,
		lang: e.data.lang,
		category: e.data.category,
		imgSrc: e.data.image,
		skills: dedupe(e.data.skills.map(canonicalSkill)),
		descripcion: e.data.summary,
		repoURL: e.data.repoURL,
		demoURL: e.data.demoURL,
		role: e.data.role,
		year: e.data.year,
		highlights: e.data.highlights,
		order: e.data.order,
		entry: e,
	}));

	const taken = new Set(fromMarkdown.map((p) => p.slug));
	const fromData: Project[] = (dataProjects as Partial<Project>[])
		.filter((p) => p.slug && !taken.has(p.slug))
		.map((p, i) => ({
			slug: p.slug!,
			title: p.title ?? p.slug!,
			fullTitle: p.fullTitle,
			lang: p.lang ?? 'id',
			category: p.category ?? '',
			imgSrc: p.imgSrc ?? '',
			skills: dedupe((p.skills ?? []).map(canonicalSkill)),
			descripcion: p.descripcion ?? '',
			repoURL: p.repoURL ?? '',
			demoURL: p.demoURL ?? '',
			role: p.role,
			year: p.year,
			highlights: p.highlights ?? [],
			order: 1000 + i,
		}));

	return [...fromMarkdown, ...fromData].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

/** Komponen <Content /> untuk isi Markdown proyek (null bila proyek berasal dari array JS). */
export async function renderProjectBody(project: Project) {
	return project.entry ? (await render(project.entry)).Content : null;
}

/** Proyek sebelum/sesudah (melingkar) untuk navigasi di halaman detail. */
export function neighbours(list: Project[], slug: string) {
	const i = list.findIndex((p) => p.slug === slug);
	return {
		index: i,
		prev: list[(i - 1 + list.length) % list.length],
		next: list[(i + 1) % list.length],
	};
}
