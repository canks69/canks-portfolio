import { animate, hover } from 'motion';
import { finePointer, qsa } from './env';

/**
 * Baris blog: panah & judul bergerak dengan spring Motion saat di-hover.
 * (Latar lime yang naik dari bawah diurus CSS supaya tetap ada tanpa JS.)
 */
export function initRows() {
	if (!finePointer) return;

	const spring = { type: 'spring', stiffness: 300, damping: 22 } as const;

	hover(qsa('[data-row]'), (row) => {
		const main = row.querySelector('[data-row-main]');
		const arrow = row.querySelector('[data-row-arrow]');
		if (main) animate(main, { x: 14 }, spring);
		if (arrow) animate(arrow, { x: 6, y: -6, rotate: 45 }, spring);

		return () => {
			if (main) animate(main, { x: 0 }, spring);
			if (arrow) animate(arrow, { x: 0, y: 0, rotate: 0 }, spring);
		};
	});
}
