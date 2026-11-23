import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { qsa } from './env';

/** Pecah teks per kata, tiap kata dibungkus mask supaya bisa "naik" dari balik garis. */
export function splitWords(el: HTMLElement) {
	return SplitText.create(el, { type: 'words', mask: 'words', wordsClass: 'w' });
}

/** Judul section: kata naik dari mask saat masuk viewport. */
export function initSplitReveals() {
	qsa('[data-split]').forEach((el) => {
		const split = splitWords(el);
		gsap.set(el, { autoAlpha: 1 });
		gsap.fromTo(
			split.words,
			{ yPercent: 125 },
			{
				yPercent: 0,
				duration: 1.25,
				ease: 'expo.out',
				stagger: 0.07,
				scrollTrigger: { trigger: el, start: 'top 88%', once: true },
			}
		);
	});
}

/** Paragraf yang "menyala" kata demi kata mengikuti scroll. */
export function initScrubText() {
	qsa('[data-scrub]').forEach((el) => {
		const split = SplitText.create(el, { type: 'words', wordsClass: 'w' });
		gsap.fromTo(
			split.words,
			{ opacity: 0.14 },
			{
				opacity: 1,
				ease: 'none',
				stagger: 0.12,
				scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: 0.4 },
			}
		);
	});
	ScrollTrigger.sort();
}
