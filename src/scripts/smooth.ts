import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/** Lenis untuk scroll halus, disambungkan ke ticker GSAP agar ScrollTrigger tetap sinkron. */
export function initSmoothScroll() {
	const lenis = new Lenis({
		lerp: 0.1,
		smoothWheel: true,
		autoRaf: false,
	});

	lenis.on('scroll', ScrollTrigger.update);
	gsap.ticker.add((time) => lenis.raf(time * 1000));
	gsap.ticker.lagSmoothing(0);

	return lenis;
}

/**
 * Link anchor di halaman yang sama (#about, /#about saat sudah di "/") digulir lewat Lenis.
 * Tanpa Lenis (reduced motion) browser menangani sendiri.
 */
export function initAnchors(lenis: Lenis | null) {
	if (!lenis) return;

	document.addEventListener('click', (e) => {
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
		if (!a || a.target === '_blank') return;

		const url = new URL(a.href, location.href);
		const raw = a.getAttribute('href');
		if (url.origin !== location.origin || url.pathname !== location.pathname) return;
		if (!url.hash && raw !== '#') return;

		const target = url.hash ? document.querySelector<HTMLElement>(url.hash) : null;
		if (url.hash && !target) return;

		e.preventDefault();
		lenis.scrollTo(target ?? 0, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
		history.pushState(null, '', url.hash || location.pathname);
	});
}

/** Saat halaman dibuka dengan hash (mis. dari /blog ke /#about), gulir setelah layout final. */
export function scrollToHash(lenis: Lenis | null) {
	if (!location.hash) return;
	const target = document.querySelector<HTMLElement>(location.hash);
	if (!target) return;
	if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
	else target.scrollIntoView();
}
