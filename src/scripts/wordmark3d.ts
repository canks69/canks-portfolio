import { gsap } from 'gsap';
import {
	AmbientLight,
	Color,
	DirectionalLight,
	Group,
	MathUtils,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	Vector2,
	type PerspectiveCamera,
} from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import fontData from '../assets/canks-wordmark.typeface.json';

/**
 * Teks 3D "CANKS" di hero (Three.js): tiap huruf diekstrusi + di-bevel, diberi cahaya, dan diselaraskan
 * dengan posisi <h1 data-hero-word> di halaman. <h1> tetap ada (transparan) untuk SEO & pembaca layar,
 * dan otomatis terlihat lagi bila WebGL tidak tersedia.
 *
 * Satuan huruf = em (ukuran font 1). Bidang depan huruf berada tepat di bidang layar sehingga, saat tidak
 * miring, bentuknya sama dengan teks HTML; kedalaman ekstrusi menjauh dari penonton.
 *
 * Font: Geist SemiBold (SIL OFL 1.1), hanya huruf C-A-N-K-S — lihat scripts/build-wordmark-font.mjs.
 */

/** harus sama dengan letter-spacing pada .hero__word di Hero.astro (em) */
const TRACKING = -0.07;
/** metrik vertikal font (em): dipakai untuk mencari garis dasar di dalam kotak baris (line-height 0,8) */
const ASCENT = 1.005;
const DESCENT = 0.295;
const LINE_HEIGHT = 0.8;

const DEPTH = 0.22; // ketebalan ekstrusi (em)

export interface WordmarkContext {
	camera: PerspectiveCamera;
	/** jarak bidang teks dari kamera */
	distance: number;
	canvasRect: DOMRect;
	wordRect: DOMRect;
	/** ukuran font <h1> dalam px */
	fontSize: number;
	/** posisi kursor ternormalisasi (-1..1) */
	ndc: Vector2;
	seconds: number;
}

export interface Wordmark3D {
	/** tempelkan ke kamera */
	pivot: Group;
	/** lampu — tempelkan ke kamera */
	lights: Group;
	update(ctx: WordmarkContext): void;
	/** fg = warna bidang depan (persis warna teks); side = warna dasar sisi ekstrusi; rim = warna cahaya tepi */
	setColors(fg: Color, side: Color, rim: Color): void;
	playIntro(): void;
}

interface Letter {
	group: Group;
	/** [0] bidang depan/belakang, [1] sisi ekstrusi (ExtrudeGeometry memberi dua grup material) */
	materials: [MeshBasicMaterial, MeshStandardMaterial];
	baseY: number;
	state: { rx: number; oy: number; o: number };
}

export function createWordmark3D(text = 'CANKS', distance = 7, instant = false): Wordmark3D {
	const font = new Font(fontData as unknown as ConstructorParameters<typeof Font>[0]);
	const resolution = (fontData as { resolution: number }).resolution;
	const glyphs = (fontData as { glyphs: Record<string, { ha: number }> }).glyphs;

	const wordGroup = new Group();
	const letters: Letter[] = [];
	let cursor = 0;
	let minX = Infinity;
	let maxX = -Infinity;
	let capEm = 0.72;

	for (const ch of text) {
		const geometry = new TextGeometry(ch, {
			font,
			size: 1,
			depth: DEPTH,
			curveSegments: 10,
			bevelEnabled: true,
			bevelThickness: 0.014,
			bevelSize: 0.01,
			bevelSegments: 4,
		});
		geometry.computeBoundingBox();
		const box = geometry.boundingBox!;
		const cx = (box.min.x + box.max.x) / 2;
		const cy = (box.min.y + box.max.y) / 2;
		if (ch === 'N') capEm = box.max.y; // tinggi huruf kapital (garis dasar = 0)

		// pusatkan huruf di titik asal grupnya; bidang depan (z = depth + bevel) dipindah ke z = 0
		geometry.translate(-cx, -cy, -(DEPTH + 0.014));

		// bidang depan TANPA pencahayaan (MeshBasicMaterial) → warnanya persis warna teks situs, rata seperti teks HTML;
		// hanya sisi ekstrusi yang berpencahayaan sehingga terbaca sebagai kedalaman
		const face = new MeshBasicMaterial({ color: new Color('#ecebe4'), transparent: true });
		const side = new MeshStandardMaterial({ color: new Color('#9a9993'), roughness: 0.7, metalness: 0, transparent: true });
		const materials: [MeshBasicMaterial, MeshStandardMaterial] = [face, side];
		const mesh = new Mesh(geometry, materials);
		mesh.renderOrder = 1;

		const group = new Group();
		group.add(mesh);
		const baseX = cursor + cx;
		group.position.set(baseX, cy, 0);
		wordGroup.add(group);

		minX = Math.min(minX, cursor + box.min.x);
		maxX = Math.max(maxX, cursor + box.max.x);
		cursor += glyphs[ch].ha / resolution + TRACKING;

		letters.push({ group, materials, baseY: cy, state: { rx: instant ? 0 : -1.5, oy: instant ? 0 : -1.1, o: instant ? 1 : 0 } });
	}

	const centerXEm = (minX + maxX) / 2;
	const pivot = new Group();
	pivot.add(wordGroup);

	// lampu (ditempel ke kamera oleh pemanggil):
	//  - ambient + cahaya utama dari kiri-atas-depan → membentuk bayangan pada sisi ekstrusi
	//  - cahaya tepi aksen dari kanan-belakang → sapuan lime tipis pada sisi kanan huruf
	const lights = new Group();
	const ambient = new AmbientLight(0xffffff, 1.5);
	const key = new DirectionalLight(0xffffff, 2.2);
	key.position.set(-3, 4, 2);
	key.target.position.set(0, 0, -distance);
	const rim = new DirectionalLight(0xc8ff3d, 1.8);
	rim.position.set(7, -1.5, -9);
	rim.target.position.set(0, 0, -distance);
	lights.add(ambient, key, rim, key.target, rim.target);

	const tilt = new Vector2(0, 0);

	return {
		pivot,
		lights,

		setColors(fg, sideColor, rimColor) {
			for (const l of letters) {
				l.materials[0].color.copy(fg);
				l.materials[1].color.copy(sideColor);
			}
			rim.color.copy(rimColor);
		},

		playIntro() {
			letters.forEach((l, i) => {
				gsap.to(l.state, { rx: 0, oy: 0, duration: 1.6, ease: 'expo.out', delay: 0.35 + i * 0.08 });
				gsap.to(l.state, { o: 1, duration: 0.7, ease: 'power2.out', delay: 0.35 + i * 0.08 });
			});
		},

		update({ camera, distance: d, canvasRect, wordRect, fontSize, ndc, seconds }) {
			// px layar → satuan dunia pada bidang teks
			const halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * d;
			const wpp = (2 * halfH) / canvasRect.height;
			const s = fontSize * wpp; // 1 em dalam satuan dunia

			// garis dasar di dalam kotak baris (line-height 0,8) dan sisi kiri <h1>, relatif ke kanvas
			const baselineY = wordRect.top - canvasRect.top + ((LINE_HEIGHT - (ASCENT + DESCENT)) / 2 + ASCENT) * fontSize;
			const leftX = wordRect.left - canvasRect.left;
			const centerPxX = leftX + centerXEm * fontSize;
			const centerPxY = baselineY - (capEm / 2) * fontSize;

			pivot.position.set((centerPxX - canvasRect.width / 2) * wpp, -(centerPxY - canvasRect.height / 2) * wpp, -d);
			wordGroup.scale.setScalar(s);
			wordGroup.position.set(-centerXEm * s, -(capEm / 2) * s, 0);

			// miring mengikuti kursor + goyangan halus saat diam
			tilt.x += (ndc.x * 0.2 - tilt.x) * 0.05;
			tilt.y += (ndc.y * 0.09 - tilt.y) * 0.05;
			pivot.rotation.set(-tilt.y + Math.sin(seconds * 0.5) * 0.025, tilt.x + Math.sin(seconds * 0.42 + 1) * 0.04, 0);

			for (const l of letters) {
				l.group.rotation.x = l.state.rx;
				l.group.position.y = l.baseY + l.state.oy;
				l.materials[0].opacity = l.state.o;
				l.materials[1].opacity = l.state.o;
			}
		},
	};
}
