import { animate, inView, stagger } from 'motion';
import { easeOut, qsa } from './env';

/**
 * Reveal ringan dengan Motion (IntersectionObserver, tanpa scrubbing):
 *  - [data-reveal]       : elemen tunggal naik + muncul
 *  - [data-reveal-group] : anak-anaknya (atau [data-reveal-item]) muncul berurutan
 */
export function initReveals() {
	qsa('[data-reveal]').forEach((el) => {
		inView(
			el,
			() => {
				animate(el, { opacity: [0, 1], y: [28, 0] }, { duration: 0.9, ease: easeOut });
			},
			{ margin: '0px 0px -12% 0px' }
		);
	});

	qsa('[data-reveal-group]').forEach((group) => {
		const marked = qsa('[data-reveal-item]', group);
		const items = marked.length ? marked : (Array.from(group.children) as HTMLElement[]);
		items.forEach((i) => (i.style.opacity = '0'));

		inView(
			group,
			() => {
				animate(
					items,
					{ opacity: [0, 1], y: [34, 0] },
					{ duration: 0.95, ease: easeOut, delay: stagger(0.09) }
				);
			},
			{ margin: '0px 0px -12% 0px' }
		);
	});
}
