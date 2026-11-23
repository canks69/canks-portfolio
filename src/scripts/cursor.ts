import { gsap } from 'gsap';
import { animate, hover } from 'motion';
import { finePointer, qs } from './env';

/** Cincin kursor: posisi diikuti GSAP quickTo, membesar di atas elemen interaktif (spring Motion). */
export function initCursor() {
	const el = qs('[data-cursor]');
	const ring = qs('[data-cursor-ring]');
	if (!el || !ring || !finePointer) return;

	const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
	const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });

	window.addEventListener(
		'pointermove',
		(e) => {
			if (e.pointerType === 'touch') return;
			el.classList.add('is-visible');
			xTo(e.clientX);
			yTo(e.clientY);
		},
		{ passive: true }
	);
	document.documentElement.addEventListener('mouseleave', () => el.classList.remove('is-visible'));

	hover('a, button, [data-magnetic], [data-row]', () => {
		animate(ring, { scale: 1.9 }, { type: 'spring', stiffness: 320, damping: 22 });
		return () => animate(ring, { scale: 1 }, { type: 'spring', stiffness: 320, damping: 24 });
	});
}
