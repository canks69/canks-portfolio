import { SITE } from '../components/data/site.js';
import { skillGroups } from '../components/data/skillsData.js';

/** Structured data (JSON-LD) schema.org. Hanya memuat fakta yang sudah tampil di situs. */

const abs = (path: string) => new URL(path, SITE.url).toString();
const personId = `${SITE.url}/#person`;

export function websiteLd() {
	return {
		'@type': 'WebSite',
		'@id': `${SITE.url}/#website`,
		url: `${SITE.url}/`,
		name: SITE.name,
		inLanguage: 'id',
		publisher: { '@id': personId },
	};
}

export function personLd() {
	return {
		'@type': 'Person',
		'@id': personId,
		name: SITE.name,
		url: `${SITE.url}/`,
		image: abs('/img/me-1x1.jpg'),
		jobTitle: SITE.jobTitle,
		sameAs: SITE.socials.map((s) => s.href),
		knowsAbout: skillGroups.flatMap((g) => g.items),
	};
}

/** Beranda: WebSite + Person dalam satu graf. */
export function homeLd() {
	return { '@context': 'https://schema.org', '@graph': [websiteLd(), personLd()] };
}

export function blogPostingLd(post: { title: string; description: string; pubDate: Date; updatedDate?: Date; url: string }) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.description,
		datePublished: post.pubDate.toISOString(),
		dateModified: (post.updatedDate ?? post.pubDate).toISOString(),
		inLanguage: 'id',
		image: abs(SITE.image),
		mainEntityOfPage: { '@type': 'WebPage', '@id': post.url },
		author: { '@id': personId, '@type': 'Person', name: SITE.name, url: `${SITE.url}/` },
		publisher: { '@id': personId },
	};
}

export function projectLd(p: {
	title: string;
	fullTitle?: string;
	description: string;
	image: string;
	category: string;
	skills: string[];
	year?: string;
	url: string;
	lang: string;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'CreativeWork',
		name: p.title,
		...(p.fullTitle && { alternateName: p.fullTitle }),
		description: p.description,
		image: abs(p.image),
		url: p.url,
		genre: p.category,
		keywords: p.skills.join(', '),
		inLanguage: p.lang,
		...(p.year && { dateCreated: p.year }),
		creator: { '@id': personId, '@type': 'Person', name: SITE.name, url: `${SITE.url}/` },
	};
}
