import { gsap } from 'gsap';
import { qs } from './env';

/** Footer: wordmark naik pelan (scrub), panah email tergambar dengan DrawSVG. */
export function initFooter() {
	const footer = qs('[data-footer]');
	if (!footer) return;

	const word = qs('[data-footer-word]', footer);
	const arrow = qs('[data-footer-arrow]', footer);

	if (word) {
		gsap.fromTo(
			word,
			{ yPercent: 30 },
			{
				yPercent: 0,
				ease: 'none',
				scrollTrigger: { trigger: footer, start: 'top bottom', end: 'bottom bottom', scrub: true },
			}
		);
	}

	if (arrow) {
		gsap.fromTo(
			arrow,
			{ drawSVG: '0%' },
			{
				drawSVG: '100%',
				duration: 1.4,
				ease: 'expo.inOut',
				scrollTrigger: { trigger: footer, start: 'top 60%', once: true },
			}
		);
	}
}
