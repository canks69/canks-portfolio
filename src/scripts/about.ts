import { gsap } from 'gsap';
import { qs } from './env';

/** Foto terbuka dengan clip-path lalu bergeser pelan (parallax) saat digulir. */
export function initAbout() {
	const section = qs('[data-about]');
	if (!section) return;

	const figure = qs('[data-about-figure]', section);
	const photo = qs('[data-about-photo]', section);
	const img = qs('[data-about-img]', section);
	if (!figure || !photo || !img) return;

	gsap.fromTo(
		photo,
		{ clipPath: 'inset(0% 0% 100% 0%)' },
		{
			clipPath: 'inset(0% 0% 0% 0%)',
			duration: 1.6,
			ease: 'expo.inOut',
			scrollTrigger: { trigger: figure, start: 'top 82%', once: true },
		}
	);

	gsap.fromTo(
		img,
		{ yPercent: -7 },
		{
			yPercent: 7,
			ease: 'none',
			scrollTrigger: { trigger: figure, start: 'top bottom', end: 'bottom top', scrub: true },
		}
	);
}
