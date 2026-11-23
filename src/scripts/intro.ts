import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { qs, qsa } from './env';
import { splitWords } from './split';

void DrawSVGPlugin;

/**
 * Intro halaman — satu timeline GSAP:
 * garis pemandu tergambar → header turun → judul halaman naik dari mask.
 * Hero (jika ada) menambahkan elemennya sendiri ke timeline yang sama.
 */
export function buildIntro() {
	const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

	tl.fromTo(
		qsa('[data-guide]'),
		{ scaleY: 0 },
		{ scaleY: 1, duration: 1.8, ease: 'expo.inOut', stagger: 0.12 },
		0
	);

	const bar = qs('[data-header-bar]');
	if (bar) tl.fromTo(bar, { autoAlpha: 0, y: -18 }, { autoAlpha: 1, y: 0, duration: 1.1 }, 0.4);

	// judul halaman (hero lead, judul blog, 404, ...)
	qsa('[data-title]').forEach((el, i) => {
		const split = splitWords(el);
		gsap.set(el, { autoAlpha: 1 });
		tl.fromTo(
			split.words,
			{ yPercent: 125 },
			{ yPercent: 0, duration: 1.3, stagger: 0.055 },
			0.65 + i * 0.1
		);
	});

	// meta kecil di halaman non-hero
	const meta = qsa('[data-page-meta]');
	if (meta.length) {
		tl.fromTo(
			meta,
			{ autoAlpha: 0, y: 14 },
			{ autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 },
			0.8
		);
	}

	return tl;
}

/** Hero: kata raksasa per huruf, potret berbingkai garis (DrawSVG), canvas garis. */
export function addHeroToIntro(tl: gsap.core.Timeline) {
	const hero = qs('[data-hero]');
	if (!hero) return;

	const word = qs('[data-hero-word]', hero);
	const portrait = qs('[data-hero-portrait]', hero);
	const photo = qs('[data-hero-photo]', hero);
	const frame = qs('[data-hero-frame]', hero);
	const meta = qs('[data-hero-meta]', hero);
	const foot = qs('[data-hero-foot]', hero);
	const field = qs('[data-hero-field]', hero);
	const ticks = qsa('.hero__tick', hero);

	if (word) {
		const split = SplitText.create(word, { type: 'chars', mask: 'chars', charsClass: 'ch' });
		gsap.set(word, { autoAlpha: 1 });
		tl.fromTo(split.chars, { yPercent: 140 }, { yPercent: 0, duration: 1.5, stagger: 0.07 }, 0.45);
	}
	if (meta) {
		gsap.set(meta, { autoAlpha: 1 });
		tl.fromTo(Array.from(meta.children), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12 }, 0.7);
	}
	if (portrait && photo) {
		gsap.set(portrait, { autoAlpha: 1 });
		const img = photo.querySelector('img');
		tl.fromTo(
			photo,
			{ clipPath: 'inset(100% 0% 0% 0%)' },
			{ clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' },
			0.7
		);
		if (img) tl.fromTo(img, { scale: 1.4 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0.7);
		tl.fromTo(portrait.querySelector('figcaption'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 1.8);
	}
	if (frame) tl.fromTo(frame, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.8, ease: 'expo.inOut' }, 0.8);
	if (ticks.length) {
		tl.fromTo(
			ticks,
			{ autoAlpha: 0, scale: 0 },
			{ autoAlpha: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: 'back.out(2.5)' },
			1.9
		);
	}
	if (foot) {
		gsap.set(foot, { autoAlpha: 1 });
		tl.fromTo(Array.from(foot.children), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12 }, 1.5);
	}
	if (field) tl.to(field, { opacity: 1, duration: 2.4, ease: 'power2.out' }, 0.3);

	// isyarat gulir: garis terisi lalu mengosong, berulang
	const cue = qs('[data-hero-cue]', hero);
	if (cue) {
		gsap
			.timeline({ repeat: -1, repeatDelay: 0.3, delay: 2.4 })
			.fromTo(cue, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 1.1, ease: 'power3.inOut' })
			.to(cue, { scaleX: 0, transformOrigin: 'right', duration: 1.1, ease: 'power3.inOut' });
	}

	// parallax saat meninggalkan hero
	if (word) {
		gsap.to(word, {
			yPercent: -14,
			ease: 'none',
			scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
		});
	}
	if (portrait) {
		gsap.to(portrait, {
			y: -70,
			ease: 'none',
			scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
		});
	}
	ScrollTrigger.sort();
}
