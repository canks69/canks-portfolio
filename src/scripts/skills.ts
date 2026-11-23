import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animate, hover } from 'motion';
import type Lenis from 'lenis';
import { finePointer, qs, qsa, reduceMotion } from './env';

export function initSkills(lenis: Lenis | null) {
	const section = qs('[data-skills]');
	if (!section) return;

	initMarquee(section, lenis);

	// daftar keterampilan: teks bergeser dengan spring saat di-hover
	if (finePointer) {
		hover(qsa('[data-skill]', section), (el) => {
			const label = el.querySelector('span');
			if (label) animate(label, { x: 10 }, { type: 'spring', stiffness: 320, damping: 22 });
			return () => {
				if (label) animate(label, { x: 0 }, { type: 'spring', stiffness: 320, damping: 24 });
			};
		});
	}
}

/**
 * Dua baris marquee berlawanan arah. Posisi dihitung manual (bukan tween berulang)
 * supaya arah & kecepatan bisa diubah mulus; scroll cepat memberi dorongan sementara.
 */
function initMarquee(section: HTMLElement, lenis: Lenis | null) {
	if (reduceMotion) return;

	const rows = qsa('[data-marquee]', section).map((row) => {
		const groups = qsa('.marquee__group', row);
		return {
			row,
			groups,
			dir: Number(row.dataset.dir) || 1,
			setX: gsap.quickSetter(groups, 'x', 'px') as (v: number) => void,
			x: 0,
			width: 0,
			visible: false,
		};
	});

	const measure = () => rows.forEach((r) => (r.width = r.groups[0].offsetWidth));
	measure();
	ScrollTrigger.addEventListener('refreshInit', measure);

	rows.forEach((r) =>
		ScrollTrigger.create({
			trigger: r.row,
			start: 'top bottom',
			end: 'bottom top',
			onToggle: (self) => (r.visible = self.isActive),
		})
	);

	let boost = 0;
	if (lenis) {
		lenis.on('scroll', ({ velocity }: { velocity: number }) => {
			boost = Math.min(Math.abs(velocity) * 0.12, 5);
		});
	}

	const BASE = 70; // px per detik
	gsap.ticker.add((_t, deltaMs) => {
		const dt = deltaMs / 1000;
		boost *= 0.94;
		rows.forEach((r) => {
			if (!r.visible || !r.width) return;
			r.x = gsap.utils.wrap(-r.width, 0, r.x - r.dir * BASE * (1 + boost) * dt);
			r.setX(r.x);
		});
	});
}
