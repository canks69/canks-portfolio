import { animate, hover, scroll } from 'motion';
import type Lenis from 'lenis';
import { easeOut, qs, reduceMotion } from './env';

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Popup "kembali ke atas":
 *  - muncul dengan spring (Motion) setelah menggulir ±0,8 layar, hilang lagi di dekat puncak
 *  - cincin di sekelilingnya = progres scroll halaman
 *  - klik → gulir ke atas lewat Lenis (atau langsung bila gerak dikurangi)
 */
export function initBackToTop(lenis: Lenis | null) {
	const btn = qs<HTMLButtonElement>('[data-to-top]');
	const ring = document.querySelector<SVGCircleElement>('[data-to-top-ring]');
	const arrow = qs('[data-to-top-arrow]');
	if (!btn) return;

	if (ring) {
		ring.style.strokeDasharray = String(CIRCUMFERENCE);
		ring.style.strokeDashoffset = String(CIRCUMFERENCE);
		scroll((progress: number) => {
			ring.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));
		});
	}

	let visible = false;

	const show = () => {
		if (visible) return;
		visible = true;
		btn.hidden = false;
		if (reduceMotion) return;
		animate(btn, { opacity: [0, 1], scale: [0.4, 1], y: [28, 0] }, { type: 'spring', stiffness: 380, damping: 20 });
	};

	const hide = async () => {
		if (!visible) return;
		visible = false;
		if (!reduceMotion) {
			await animate(btn, { opacity: [1, 0], scale: [1, 0.5], y: [0, 20] }, { duration: 0.25, ease: easeOut });
		}
		if (!visible) btn.hidden = true;
	};

	const update = () => (window.scrollY > window.innerHeight * 0.8 ? show() : hide());
	window.addEventListener('scroll', update, { passive: true });
	update();

	btn.addEventListener('click', () => {
		if (lenis) lenis.scrollTo(0, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
		else window.scrollTo({ top: 0 });
	});

	if (arrow && !reduceMotion) {
		hover(btn, () => {
			animate(arrow, { y: -3 }, { type: 'spring', stiffness: 400, damping: 15 });
			return () => animate(arrow, { y: 0 }, { type: 'spring', stiffness: 300, damping: 20 });
		});
	}
}
