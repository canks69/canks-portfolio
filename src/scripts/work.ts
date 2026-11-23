import { gsap } from 'gsap';
import { animate, hover, inView, stagger } from 'motion';
import { easeOut, finePointer, qs, qsa } from './env';

/**
 * Portofolio:
 *  - ≥1024px & gerak normal → section dipin, kartu bergulir horizontal (GSAP ScrollTrigger)
 *  - selain itu → daftar vertikal, kartu muncul berurutan (Motion inView)
 */
export function initWork() {
	const section = qs('[data-work]');
	const pin = qs('[data-work-pin]');
	const track = qs('[data-work-track]');
	if (!section || !pin || !track) return;

	const cards = qsa('[data-work-card]', section);
	const fill = qs('[data-work-fill]', section);
	const current = qs('[data-work-current]', section);
	const setFill = fill ? (gsap.quickSetter(fill, 'scaleX') as (v: number) => void) : null;

	const mm = gsap.matchMedia();

	mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
		section.classList.add('work--pinned');

		const distance = () => Math.max(0, track.scrollWidth - pin.clientWidth);

		const scrollTween = gsap.to(track, {
			x: () => -distance(),
			ease: 'none',
			scrollTrigger: {
				trigger: pin,
				start: 'top top',
				end: () => `+=${distance()}`,
				pin: true,
				scrub: 0.6,
				anticipatePin: 1,
				invalidateOnRefresh: true,
				refreshPriority: 1,
				onUpdate: (self) => {
					setFill?.(self.progress);
					if (current) {
						const n = Math.min(cards.length, Math.floor(self.progress * cards.length) + 1);
						current.textContent = String(n).padStart(2, '0');
					}
				},
			},
		});

		// gambar bergeser lebih lambat dari kartunya (parallax horizontal)
		cards.forEach((card) => {
			const img = qs('[data-card-img]', card);
			if (!img) return;
			gsap.fromTo(
				img,
				{ xPercent: -4.5 },
				{
					xPercent: 4.5,
					ease: 'none',
					scrollTrigger: {
						trigger: card,
						containerAnimation: scrollTween,
						start: 'left right',
						end: 'right left',
						scrub: true,
					},
				}
			);
		});

		return () => section.classList.remove('work--pinned');
	});

	// daftar vertikal
	mm.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
		const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced) return;

		cards.forEach((c) => (c.style.opacity = '0'));
		const stops = cards.map((card) =>
			inView(
				card,
				() => {
					animate(card, { opacity: [0, 1], y: [40, 0] }, { duration: 0.95, ease: easeOut, delay: stagger(0.08)(0, 1) });
				},
				{ margin: '0px 0px -10% 0px' }
			)
		);
		return () => {
			stops.forEach((stop) => stop());
			cards.forEach((c) => (c.style.opacity = ''));
		};
	});

	// hover kartu: gambar membesar dengan Motion (pada pembungkus, bukan <img> yang dipakai parallax GSAP)
	if (finePointer) {
		hover(qsa('[data-card]', section), (card) => {
			const zoom = card.querySelector('[data-card-zoom]');
			if (zoom) animate(zoom, { scale: 1.06 }, { duration: 0.9, ease: easeOut });
			return () => {
				if (zoom) animate(zoom, { scale: 1 }, { duration: 0.9, ease: easeOut });
			};
		});
	}
}
