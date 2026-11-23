import { gsap } from 'gsap';
import { qsa } from './env';

/** Semua [data-line] tergambar (scaleX 0 → 1) saat masuk viewport; Rule menyalakan tanda silangnya. */
export function initLines() {
	qsa('[data-line]').forEach((el) => {
		const rule = el.closest('.rule');
		gsap.fromTo(
			el,
			{ scaleX: 0 },
			{
				scaleX: 1,
				duration: 1.7,
				ease: 'expo.out',
				scrollTrigger: {
					trigger: el,
					start: 'top 94%',
					once: true,
					onEnter: () => rule?.classList.add('is-drawn'),
				},
			}
		);
	});
}
