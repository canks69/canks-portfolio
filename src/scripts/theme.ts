import { animate } from 'motion';
import { qs, reduceMotion } from './env';

type Theme = 'light' | 'dark';

const root = document.documentElement;
const current = (): Theme => (root.dataset.theme === 'light' ? 'light' : 'dark');

const stored = () => {
	try {
		const t = localStorage.getItem('theme');
		return t === 'light' || t === 'dark' ? t : null;
	} catch {
		return null;
	}
};

/** Pasang tema ke <html>, perbarui meta theme-color & label tombol, lalu beri tahu skrip lain (mis. canvas hero). */
function apply(theme: Theme, persist: boolean) {
	root.dataset.theme = theme;
	if (persist) {
		try {
			localStorage.setItem('theme', theme);
		} catch {
			/* penyimpanan diblokir — abaikan */
		}
	}
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f3f2ec' : '#0a0a0b');
	const btn = qs('[data-theme-toggle]');
	btn?.setAttribute('aria-label', theme === 'light' ? 'Ganti ke tema gelap' : 'Ganti ke tema terang');
	window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

/**
 * Tombol tema: gelap ↔ terang. Tanpa pilihan tersimpan, tema mengikuti sistem.
 * Pergantian memakai View Transitions API — lingkaran meluas dari tombol — bila didukung dan gerak tidak dikurangi.
 */
export function initTheme() {
	const btn = qs('[data-theme-toggle]');
	apply(current(), false); // sinkronkan label awal
	if (!btn) return;

	btn.addEventListener('click', () => {
		const next: Theme = current() === 'dark' ? 'light' : 'dark';
		const icon = btn.querySelector('[data-theme-icon]');
		if (icon && !reduceMotion) animate(icon, { rotate: [-90, 0], scale: [0.6, 1] }, { type: 'spring', stiffness: 300, damping: 18 });

		const start = (document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } })
			.startViewTransition;
		if (!start || reduceMotion) {
			apply(next, true);
			return;
		}

		const r = btn.getBoundingClientRect();
		const x = r.left + r.width / 2;
		const y = r.top + r.height / 2;
		const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

		const transition = start.call(document, () => apply(next, true));
		transition.ready
			.then(() =>
				root.animate(
					{ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
					{ duration: 750, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', pseudoElement: '::view-transition-new(root)' }
				)
			)
			.catch(() => {});
	});

	// belum memilih → ikuti perubahan tema sistem
	matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
		if (!stored()) apply(e.matches ? 'light' : 'dark', false);
	});
}
