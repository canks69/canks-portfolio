import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { initAbout } from './about';
import { initBackToTop } from './backToTop';
import { initCursor } from './cursor';
import { reduceMotion } from './env';
import { initFooter } from './footer';
import { initHeader } from './header';
import { addHeroToIntro, buildIntro } from './intro';
import { initLines } from './lines';
import { initMagnetic } from './magnetic';
import { initReveals } from './reveal';
import { initRows } from './rows';
import { initSkills } from './skills';
import { initAnchors, initSmoothScroll, scrollToHash } from './smooth';
import { initScrubText, initSplitReveals } from './split';
import { initTheme } from './theme';
import { initWork } from './work';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

/** Menunggu font (maks. 1,2 dtk) supaya SplitText mengukur dengan font yang benar. */
const fontsReady = () =>
	Promise.race([
		document.fonts?.ready ?? Promise.resolve(),
		new Promise((resolve) => setTimeout(resolve, 1200)),
	]);

/** Three.js dimuat terpisah (dynamic import) dan hanya bila halaman memiliki hero. */
const loadHeroScene = () => {
	if (!document.querySelector('[data-hero-field]')) return;
	import('./heroScene')
		.then((m) => m.initHeroScene())
		.catch(() => {});
};

async function boot() {
	await fontsReady();

	// Gerak dikurangi: biarkan halaman statis (CSS sudah menampilkan semuanya).
	// Hanya hal yang tidak bergerak/ringan yang tetap dijalankan.
	initTheme();

	if (reduceMotion) {
		initHeader(null);
		initBackToTop(null);
		loadHeroScene();
		document.documentElement.dataset.ready = '1';
		return;
	}

	const lenis = initSmoothScroll();
	initAnchors(lenis);

	// urutan penting: ScrollTrigger dibuat sesuai urutan halaman, section ber-pin lebih dulu
	const intro = buildIntro();
	addHeroToIntro(intro);
	loadHeroScene();
	initHeader(lenis);
	initAbout();
	initSkills(lenis);
	initWork();
	initSplitReveals();
	initScrubText();
	initLines();
	initFooter();

	initBackToTop(lenis);
	initReveals();
	initRows();
	initMagnetic();
	initCursor();

	ScrollTrigger.refresh();
	scrollToHash(lenis);
	window.addEventListener('load', () => ScrollTrigger.refresh());

	document.documentElement.dataset.ready = '1';
}

boot();
