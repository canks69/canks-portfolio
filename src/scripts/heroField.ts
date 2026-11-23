import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { qs, reduceMotion } from './env';

/**
 * Medan garis di hero: kumpulan garis horizontal bergelombang (seperti kontur topografi)
 * yang mengalir pelan dan menyingkir dari kursor. Digambar di canvas lewat ticker GSAP.
 */
export function initHeroField() {
	const hero = qs('[data-hero]');
	const canvas = qs<HTMLCanvasElement>('[data-hero-field]');
	const ctx = canvas?.getContext('2d');
	if (!hero || !canvas || !ctx) return;

	// warna dibaca dari token CSS dan dibaca ulang saat tema berganti
	let FG = '#ecebe4';
	let ACCENT = '#c8ff3d';
	const readColors = () => {
		const css = getComputedStyle(document.documentElement);
		FG = css.getPropertyValue('--fg').trim() || FG;
		ACCENT = css.getPropertyValue('--accent').trim() || ACCENT;
	};
	readColors();
	window.addEventListener('themechange', () => {
		readColors();
		if (reduceMotion) draw(0);
	});

	let w = 0;
	let h = 0;
	let dpr = 1;
	let lines = 28;
	let active = true;

	// kursor (dihaluskan) — default jauh di luar layar
	const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, inside: false };
	let scrollBoost = 0;

	const resize = () => {
		const r = canvas.getBoundingClientRect();
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		w = r.width;
		h = r.height;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		lines = w < 700 ? 18 : 30;
		if (reduceMotion) draw(0);
	};

	const draw = (time: number) => {
		const t = time * 0.00012;
		ctx.clearRect(0, 0, w, h);
		ctx.lineWidth = 1;

		// halus ke posisi kursor
		if (mouse.inside) {
			if (mouse.sx < -999) {
				mouse.sx = mouse.x;
				mouse.sy = mouse.y;
			}
			mouse.sx += (mouse.x - mouse.sx) * 0.08;
			mouse.sy += (mouse.y - mouse.sy) * 0.08;
		}

		const step = 12;
		const cols = Math.ceil(w / step) + 1;
		const amp = Math.min(h * 0.05, 46);
		const sigma = Math.max(w, h) * 0.12;

		for (let i = 0; i < lines; i++) {
			const base = ((i + 0.5) / lines) * h;
			const accent = i % 7 === 3;
			ctx.beginPath();

			for (let j = 0; j < cols; j++) {
				const x = j * step;
				const nx = x / w;

				let y =
					base +
					Math.sin(nx * 4.2 + t * 6 + i * 0.32) * amp +
					Math.sin(nx * 9.5 - t * 9 + i * 0.18) * amp * 0.42 +
					Math.sin(nx * 2 + t * 3) * amp * scrollBoost * 2.2;

				if (mouse.inside) {
					const dx = x - mouse.sx;
					const dy = base - mouse.sy;
					const fall = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
					y += Math.sign(dy || 1) * fall * 46;
				}

				if (j === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}

			ctx.strokeStyle = accent ? ACCENT : FG;
			ctx.globalAlpha = accent ? 0.34 : 0.1 + (i / lines) * 0.05;
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
	};

	resize();
	new ResizeObserver(resize).observe(canvas);

	if (reduceMotion) {
		canvas.style.opacity = '1';
		return;
	}

	hero.addEventListener('pointermove', (e) => {
		const r = canvas.getBoundingClientRect();
		mouse.x = e.clientX - r.left;
		mouse.y = e.clientY - r.top;
		mouse.inside = true;
	});
	hero.addEventListener('pointerleave', () => {
		mouse.inside = false;
		mouse.sx = mouse.sy = -9999;
	});

	// hanya menggambar saat hero terlihat; gelombang makin liar saat digulir keluar
	ScrollTrigger.create({
		trigger: hero,
		start: 'top bottom',
		end: 'bottom top',
		onToggle: (self) => (active = self.isActive),
		onUpdate: (self) => (scrollBoost = self.progress * 0.5),
	});

	gsap.ticker.add((time) => {
		if (active) draw(time * 1000);
	});
}
