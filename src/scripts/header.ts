import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animate, hover, scroll, stagger } from 'motion';
import type Lenis from 'lenis';
import { easeInOut, easeOut, qs, qsa } from './env';

const spring = { type: 'spring', stiffness: 420, damping: 38 } as const;

export function initHeader(lenis: Lenis | null) {
	const header = qs('[data-header]');
	if (!header) return;

	initHideOnScroll(header);
	initProgress();
	initNav();
	initMenu(header, lenis);
}

/** Header menghilang saat menggulir turun, muncul lagi saat menggulir naik. */
function initHideOnScroll(header: HTMLElement) {
	let lastY = window.scrollY;
	const update = () => {
		const y = window.scrollY;
		header.toggleAttribute('data-scrolled', y > 16);
		if (!header.hasAttribute('data-menu-open')) {
			const delta = y - lastY;
			if (y > 240 && delta > 4) header.setAttribute('data-hidden', '');
			else if (delta < -4 || y < 240) header.removeAttribute('data-hidden');
		}
		lastY = y;
	};
	window.addEventListener('scroll', update, { passive: true });
	update();
}

/** Garis progres baca di dasar header — dihubungkan ke scroll lewat Motion. */
function initProgress() {
	const bar = qs('[data-progress]');
	if (!bar) return;
	scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
}

/** Satu garis aksen berpindah antar menu (spring Motion) + penanda section aktif. */
function initNav() {
	const nav = qs('[data-nav]');
	const ink = qs('[data-nav-ink]');
	const links = qsa<HTMLAnchorElement>('[data-nav-link]');
	if (!nav || !ink || !links.length) return;

	let active: HTMLElement | null = links.find((l) => l.hasAttribute('data-current')) ?? null;
	let first = true;

	const moveInk = (el: HTMLElement | null, instant = false) => {
		if (!el) {
			animate(ink, { opacity: 0 }, { duration: instant ? 0 : 0.25 });
			return;
		}
		const n = nav.getBoundingClientRect();
		const r = el.getBoundingClientRect();
		animate(
			ink,
			{ x: r.left - n.left, scaleX: r.width, opacity: 1 },
			instant || first ? { duration: 0 } : spring
		);
		first = false;
	};

	const setActive = (el: HTMLElement | null) => {
		links.forEach((l) => l.toggleAttribute('data-active', l === el));
		active = el;
		moveInk(el);
	};

	hover(links, (el) => {
		moveInk(el as HTMLElement);
		return () => moveInk(active);
	});

	// penanda section aktif (hanya di halaman yang memuat section-nya)
	links.forEach((link) => {
		const id = link.dataset.navId;
		const section = id ? document.getElementById(id) : null;
		if (!section) return;
		ScrollTrigger.create({
			trigger: section,
			start: 'top 55%',
			end: 'bottom 55%',
			onToggle: (self) => self.isActive && setActive(link),
		});
	});

	window.addEventListener('resize', () => moveInk(active, true));
	moveInk(active, true);
}

/** Menu layar penuh untuk layar sempit. */
function initMenu(header: HTMLElement, lenis: Lenis | null) {
	const btn = qs<HTMLButtonElement>('[data-menu-btn]');
	const menu = qs('[data-menu]');
	const label = qs('[data-menu-label]');
	if (!btn || !menu) return;

	const items = qsa('[data-menu-item]', menu);
	let open = false;

	const lock = (on: boolean) => {
		if (lenis) on ? lenis.stop() : lenis.start();
		else document.body.style.overflow = on ? 'hidden' : '';
	};

	const openMenu = () => {
		open = true;
		menu.hidden = false;
		btn.setAttribute('aria-expanded', 'true');
		header.setAttribute('data-menu-open', '');
		header.removeAttribute('data-hidden');
		if (label) label.textContent = 'Tutup';
		lock(true);

		animate(menu, { clipPath: ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)'] }, { duration: 0.75, ease: easeInOut });
		animate(
			items,
			{ opacity: [0, 1], y: [56, 0] },
			{ duration: 0.9, ease: easeOut, delay: stagger(0.07, { startDelay: 0.3 }) }
		);
	};

	const closeMenu = async () => {
		if (!open) return;
		open = false;
		btn.setAttribute('aria-expanded', 'false');
		header.removeAttribute('data-menu-open');
		if (label) label.textContent = 'Menu';
		lock(false);

		await animate(menu, { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'] }, { duration: 0.55, ease: easeInOut });
		if (!open) menu.hidden = true;
	};

	btn.addEventListener('click', () => (open ? closeMenu() : openMenu()));
	menu.addEventListener('click', (e) => {
		if ((e.target as Element).closest('a')) closeMenu();
	});
	window.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());
	window.matchMedia('(min-width: 1200px)').addEventListener('change', (e) => e.matches && closeMenu());
}
