import { animate } from 'motion';
import { finePointer, qsa } from './env';

/** [data-magnetic] ditarik pelan ke arah kursor dengan spring Motion. */
export function initMagnetic() {
	if (!finePointer) return;

	qsa('[data-magnetic]').forEach((el) => {
		el.addEventListener('pointermove', (e) => {
			const r = el.getBoundingClientRect();
			const x = (e.clientX - (r.left + r.width / 2)) * 0.28;
			const y = (e.clientY - (r.top + r.height / 2)) * 0.4;
			animate(el, { x, y }, { type: 'spring', stiffness: 220, damping: 16, mass: 0.6 });
		});
		el.addEventListener('pointerleave', () => {
			animate(el, { x: 0, y: 0 }, { type: 'spring', stiffness: 200, damping: 12, mass: 0.6 });
		});
	});
}
