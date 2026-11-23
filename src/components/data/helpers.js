import { skillGroups, techIcons } from './skillsData.js';

/** "Point of Sale" → "point-of-sale" */
export const slugify = (text) =>
	text
		.toString()
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-');

/** Nama alternatif agar "Golang"/"Go" atau "Tailwind"/"TailwindCSS" dianggap sama saat mencocokkan. */
const ALIASES = { go: 'golang', luau: 'lua', tailwindcss: 'tailwind', express: 'expressjs', 'html-css': 'html' };

export const skillKey = (name) => {
	const k = slugify(name);
	return ALIASES[k] ?? k;
};

/**
 * Samakan penulisan nama teknologi dengan daftar di skillsData.js
 * ("react" → "React", "Node.js" → "NodeJS", "tailwindcss" → "Tailwind"). Nama yang tidak dikenal dibiarkan.
 */
// label dari kelompok keterampilan didahulukan (yang pertama menang), baru nama pada daftar ikon
const KNOWN = new Map();
for (const n of [...skillGroups.flatMap((g) => g.items), ...techIcons.map((t) => t.name)]) {
	if (!KNOWN.has(skillKey(n))) KNOWN.set(skillKey(n), n);
}
export const canonicalSkill = (name) => KNOWN.get(skillKey(name)) ?? name.trim();
