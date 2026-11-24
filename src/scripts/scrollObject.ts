import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
	BufferGeometry,
	Color,
	ColorManagement,
	Float32BufferAttribute,
	Group,
	LineSegments,
	MathUtils,
	PerspectiveCamera,
	Scene,
	ShaderMaterial,
	Uint16BufferAttribute,
	Vector2,
	WebGLRenderer,
} from 'three';
import { qsa, reduceMotion } from './env';

/**
 * Objek 3D yang menempel di layar sepanjang halaman (kanvas `position: fixed`).
 *
 * Satu geometri garis berbentuk grid (U × V) yang bentuknya DIUBAH (morph) antar-section:
 *   hero → trefoil  ·  tentang → donat  ·  keterampilan → "apel" (spindle torus)  ·  portofolio → knot 5-sudut  ·  footer → knot 3,4
 * Karena semua bentuk memakai grid yang sama, titik-titiknya bisa saling berinterpolasi di GPU.
 *
 * Gerakan mengikuti scroll:
 *  - posisi, ukuran, dan kemiringan berpindah dari satu "stasiun" (section) ke stasiun berikutnya,
 *  - bentuk berubah di sela-sela section (bertahan di tengah section), dengan puntiran + riak saat transisi,
 *  - kecepatan scroll menambah putaran dan riak,
 *  - di atas footer (latar lime) garis berganti warna gelap.
 * Dimuat lewat dynamic import dan hanya di halaman yang punya elemen [data-scene-stop].
 */

type V3 = [number, number, number];
const TAU = Math.PI * 2;
const SHAPE_RADIUS = 1.35; // semua bentuk dinormalkan ke radius ini
const DISTANCE = 7; // jarak objek dari kamera

// ---------- bentuk (permukaan tabung mengelilingi kurva tertutup) ----------

const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
	const l = Math.hypot(a[0], a[1], a[2]) || 1;
	return [a[0] / l, a[1] / l, a[2] / l];
};

/** Titik pada simpul torus (p, q); t ∈ [0,1) menutup kurva. */
const knot = (p: number, q: number) => (t: number): V3 => {
	const u = TAU * p * t;
	const k = (q / p) * u;
	return [(2 + Math.cos(k)) * 0.5 * Math.cos(u), (2 + Math.cos(k)) * 0.5 * Math.sin(u), Math.sin(k) * 0.5];
};
/** Lingkaran berjari-jari R di bidang XY. */
const ring = (R: number) => (t: number): V3 => [R * Math.cos(TAU * t), R * Math.sin(TAU * t), 0];

/** Grid U×V: titik ke-(i,j) = kurva(i/U) + tabung berjari-jari r pada sudut j/V. Dinormalkan ke SHAPE_RADIUS. */
function tube(curve: (t: number) => V3, r: number, U: number, V: number): Float32Array {
	const out = new Float32Array(U * V * 3);
	const eps = 1 / (U * 4);
	let max = 0;
	for (let i = 0; i < U; i++) {
		const t = i / U;
		const P1 = curve(t);
		const P2 = curve(t + eps);
		const T: V3 = [P2[0] - P1[0], P2[1] - P1[1], P2[2] - P1[2]];
		const N0: V3 = [P2[0] + P1[0], P2[1] + P1[1], P2[2] + P1[2]];
		const B = norm(cross(T, N0));
		const N = norm(cross(B, T));
		for (let j = 0; j < V; j++) {
			const a = (TAU * j) / V;
			const c = Math.cos(a) * r;
			const s = Math.sin(a) * r;
			const k = (i * V + j) * 3;
			out[k] = P1[0] + N[0] * c + B[0] * s;
			out[k + 1] = P1[1] + N[1] * c + B[1] * s;
			out[k + 2] = P1[2] + N[2] * c + B[2] * s;
			max = Math.max(max, Math.hypot(out[k], out[k + 1], out[k + 2]));
		}
	}
	const scale = SHAPE_RADIUS / max;
	for (let k = 0; k < out.length; k++) out[k] *= scale;
	return out;
}

const SHAPES = (U: number, V: number) => [
	tube(knot(2, 3), 0.3, U, V), // 0 trefoil
	tube(ring(0.95), 0.4, U, V), // 1 donat
	tube(ring(0.42), 0.88, U, V), // 2 "apel" (spindle torus: tabung lebih tebal dari jari-jari lingkarannya)
	tube(knot(2, 5), 0.2, U, V), // 3 knot 5-sudut
	tube(knot(3, 4), 0.2, U, V), // 4 knot 3,4
];

// ---------- stasiun: posisi objek per section ----------

interface Station {
	shape: number;
	/** posisi (NDC -1..1) & ukuran (pecahan tinggi layar) — lanskap */
	pos: [number, number];
	size: number;
	/** sama untuk layar potret (ukuran = pecahan lebar layar) */
	posP: [number, number];
	sizeP: number;
	/** kemiringan dasar (rad) */
	tilt: [number, number];
}

const STATIONS: Record<string, Station> = {
	// posP/sizeP = layar potret (ponsel): objek berada di BELAKANG konten, redup, dan menyembul dari tepi kanan
	hero: { shape: 0, pos: [0.64, -0.56], size: 0.38, posP: [0.78, -0.34], sizeP: 0.34, tilt: [0.35, 0] },
	about: { shape: 1, pos: [0.8, -0.62], size: 0.28, posP: [0.82, -0.6], sizeP: 0.32, tilt: [1.0, 0.2] },
	skills: { shape: 2, pos: [-0.5, 0.1], size: 0.3, posP: [0.82, -0.2], sizeP: 0.32, tilt: [0.5, 0] },
	work: { shape: 3, pos: [0.0, -0.84], size: 0.26, posP: [0.82, -0.5], sizeP: 0.32, tilt: [0.3, 0.4] },
	footer: { shape: 4, pos: [0.72, 0.02], size: 0.42, posP: [0.8, 0.3], sizeP: 0.34, tilt: [0.5, -0.2] },
};

/** jendela easing per ruas transisi (0..1 di antara dua stasiun): bentuk bertahan di luar jendela */
const WINDOWS: [number, number][] = [
	[0.15, 0.85], // hero → tentang
	[0.15, 0.85], // tentang → keterampilan
	[0.15, 0.85], // keterampilan → portofolio
	[0.78, 1.0], // portofolio (pin panjang) → footer: berubah hanya di ujungnya
];

const VERTEX = /* glsl */ `
	uniform float uTime;
	uniform float uMix;
	uniform float uEnergy;
	uniform float uCenterDist;
	uniform float uRadius;
	attribute vec3 aTarget;
	varying float vDepth;
	varying float vBand;

	void main() {
		vec3 p = mix(position, aTarget, uMix);

		// puntiran saat berubah bentuk (seperti kain diperas): paling kuat di tengah transisi
		float k = sin(3.14159 * uMix);
		float ang = k * p.y * 1.1;
		float c = cos(ang);
		float s = sin(ang);
		p.xz = vec2(c * p.x - s * p.z, s * p.x + c * p.z);

		// riak halus: menguat saat transisi dan saat scroll cepat
		float w = sin(dot(p, vec3(2.7, 3.3, 2.1)) + uTime * 2.2) + sin(dot(p, vec3(-3.1, 1.9, 2.9)) - uTime * 1.7);
		p += normalize(p + vec3(0.0001)) * w * 0.045 * uEnergy;

		vec4 mv = modelViewMatrix * vec4(p, 1.0);
		gl_Position = projectionMatrix * mv;

		// depan = terang, belakang = redup → kedalaman terbaca
		float kk = (-mv.z - uCenterDist) / uRadius;
		vDepth = 1.0 - smoothstep(-1.0, 1.0, kk);

		// pita aksen yang mengalir di permukaan
		float wave = sin(p.x * 2.3 + p.y * 3.1 + p.z * 2.7 + uTime * 1.4) * 0.5 + 0.5;
		vBand = smoothstep(0.86, 0.96, wave);
	}
`;

const FRAGMENT = /* glsl */ `
	uniform vec3 uFg;
	uniform vec3 uAccent;
	uniform vec3 uInkColor;
	uniform vec3 uBandAlt;
	uniform float uInk;
	uniform float uOpacity;
	varying float vDepth;
	varying float vBand;

	void main() {
		vec3 line = mix(uFg, uInkColor, uInk);
		vec3 band = mix(uAccent, uBandAlt, uInk);
		vec3 color = mix(line, band, vBand);
		float alpha = mix(0.06, 0.58, vDepth) * mix(1.0, 1.6, vBand) * uOpacity;
		gl_FragColor = vec4(color, min(alpha, 0.95));
	}
`;

export function initScrollObject() {
	if (reduceMotion) return; // objek ini sepenuhnya gerak mengikuti scroll — dilewati bila gerak dikurangi

	const stops = qsa('[data-scene-stop]')
		.map((el) => ({ el, st: STATIONS[el.dataset.sceneStop ?? ''] }))
		.filter((s): s is { el: HTMLElement; st: Station } => !!s.st);
	if (stops.length < 2) return;
	if (!document.createElement('canvas').getContext('webgl2')) return;

	ColorManagement.enabled = false;

	const canvas = document.createElement('canvas');
	canvas.className = 'scene-canvas';
	canvas.setAttribute('aria-hidden', 'true');
	canvas.style.opacity = '0';
	document.body.appendChild(canvas);

	let renderer: WebGLRenderer;
	try {
		renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
	} catch {
		canvas.remove();
		return;
	}
	renderer.setClearColor(0x000000, 0);

	const small = window.innerWidth < 700;
	const U = small ? 150 : 220;
	const V = small ? 12 : 16;
	const shapes = SHAPES(U, V);

	// ---- geometri: grid U×V, sisi sepanjang u dan v ----
	const indices: number[] = [];
	for (let i = 0; i < U; i++) {
		for (let j = 0; j < V; j++) {
			const a = i * V + j;
			indices.push(a, ((i + 1) % U) * V + j, a, i * V + ((j + 1) % V));
		}
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(shapes[stops[0].st.shape].slice(), 3));
	geometry.setAttribute('aTarget', new Float32BufferAttribute(shapes[stops[Math.min(1, stops.length - 1)].st.shape].slice(), 3));
	geometry.setIndex(new Uint16BufferAttribute(indices, 1));

	const uniforms = {
		uTime: { value: 0 },
		uMix: { value: 0 },
		uEnergy: { value: 0 },
		uCenterDist: { value: DISTANCE },
		uRadius: { value: SHAPE_RADIUS },
		uFg: { value: new Color('#ecebe4') },
		uAccent: { value: new Color('#c8ff3d') },
		uInkColor: { value: new Color('#0a0a0b') },
		uBandAlt: { value: new Color('#ffffff') },
		uInk: { value: 0 },
		uOpacity: { value: 1 },
	};
	const object = new LineSegments(
		geometry,
		new ShaderMaterial({
			uniforms,
			vertexShader: VERTEX,
			fragmentShader: FRAGMENT,
			transparent: true,
			depthTest: false,
			depthWrite: false,
		})
	);
	object.frustumCulled = false;
	const pivot = new Group();
	pivot.add(object);
	const scene = new Scene();
	scene.add(pivot);
	const camera = new PerspectiveCamera(38, 1, 0.1, 40);
	camera.position.set(0, 0, 0);

	const readColors = () => {
		const css = getComputedStyle(document.documentElement);
		const fg = css.getPropertyValue('--fg').trim();
		const accent = css.getPropertyValue('--accent').trim();
		const ink = css.getPropertyValue('--accent-ink').trim();
		if (fg) uniforms.uFg.value.set(fg);
		if (accent) uniforms.uAccent.value.set(accent);
		if (ink) uniforms.uInkColor.value.set(ink);
	};
	readColors();
	window.addEventListener('themechange', readColors);

	const resize = () => {
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5));
		renderer.setSize(window.innerWidth, window.innerHeight, false);
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		// potret (ponsel/tablet tegak): di belakang konten agar teks tidak tertimpa; lanskap: melayang di atas konten
		canvas.style.zIndex = camera.aspect < 1 ? '0' : '2';
	};
	resize();
	window.addEventListener('resize', resize);

	// ---- titik-titik jangkar: posisi scroll tempat tiap section "mengambil alih" (saat bagian atasnya di 60% layar) ----
	let anchors: number[] = [];
	const measure = () => {
		anchors = stops.map((s, i) => (i === 0 ? 0 : s.el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.6));
		for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
	};
	measure();
	ScrollTrigger.addEventListener('refresh', measure);

	const footer = document.querySelector<HTMLElement>('[data-footer]');

	// ---- keadaan ----
	let pairIndex = -1; // indeks ruas transisi yang sedang dimuat ke atribut geometri
	const ndc = new Vector2(0, 0);
	const tilt = new Vector2(0, 0);
	window.addEventListener('pointermove', (e) => ndc.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1)), {
		passive: true,
	});
	const intro = { v: 0 };
	let spin = 0;
	let lastY = window.scrollY;
	let lastT = 0;
	let speed = 0;

	const loadPair = (i: number) => {
		if (i === pairIndex) return;
		pairIndex = i;
		const from = shapes[stops[i].st.shape];
		const to = shapes[stops[Math.min(i + 1, stops.length - 1)].st.shape];
		(geometry.getAttribute('position').array as Float32Array).set(from);
		(geometry.getAttribute('aTarget').array as Float32Array).set(to);
		geometry.getAttribute('position').needsUpdate = true;
		geometry.getAttribute('aTarget').needsUpdate = true;
	};

	const draw = (time: number) => {
		const dt = Math.min(0.05, time - lastT || 0.016);
		lastT = time;
		const y = window.scrollY;

		// ---- di ruas mana kita berada, dan seberapa jauh (dengan easing berjendela) ----
		let i = 0;
		while (i < anchors.length - 2 && y >= anchors[i + 1]) i++;
		const last = stops.length - 1;
		const j = Math.min(i + 1, last);
		let e = 0;
		if (last > 0) {
			const span = anchors[j] - anchors[i] || 1;
			const t = MathUtils.clamp((y - anchors[i]) / span, 0, 1);
			const [w0, w1] = WINDOWS[Math.min(i, WINDOWS.length - 1)];
			e = MathUtils.smoothstep(t, w0, w1);
		}
		loadPair(i);
		uniforms.uMix.value = e;

		// ---- energi: kecepatan scroll + puncak di tengah transisi ----
		const v = Math.abs(y - lastY) / Math.max(dt, 0.001);
		lastY = y;
		speed += (v - speed) * 0.12;
		const energy = MathUtils.clamp(speed / 2400, 0, 1);
		uniforms.uEnergy.value = MathUtils.clamp(Math.sin(Math.PI * e) * 0.9 + energy * 0.8, 0, 1.3);

		// ---- posisi / ukuran / kemiringan: interpolasi antar-stasiun ----
		const A = stops[i].st;
		const B = stops[j].st;
		const portrait = camera.aspect < 1;
		const pa = portrait ? A.posP : A.pos;
		const pb = portrait ? B.posP : B.pos;
		const nx = MathUtils.lerp(pa[0], pb[0], e);
		const ny = MathUtils.lerp(pa[1], pb[1], e);
		const size = MathUtils.lerp(portrait ? A.sizeP : A.size, portrait ? B.sizeP : B.size, e);

		const halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * DISTANCE;
		const halfW = halfH * camera.aspect;
		const diam = portrait ? size * 2 * halfW : size * 2 * halfH;
		const scale = (diam / (2 * SHAPE_RADIUS)) * intro.v;
		pivot.position.set(nx * halfW, ny * halfH, -DISTANCE);
		pivot.scale.setScalar(Math.max(scale, 0.0001));
		uniforms.uRadius.value = SHAPE_RADIUS * Math.max(scale, 0.0001);

		// ---- putaran: tetap berputar pelan, makin cepat saat scroll; condong ke kursor ----
		spin += dt * (0.22 + energy * 1.7);
		tilt.x += (ndc.y * 0.4 - tilt.x) * 0.05;
		tilt.y += (ndc.x * 0.6 - tilt.y) * 0.05;
		const tx = MathUtils.lerp(A.tilt[0], B.tilt[0], e);
		const ty = MathUtils.lerp(A.tilt[1], B.tilt[1], e);
		object.rotation.set(tx + tilt.x, spin + ty + tilt.y, Math.sin(time * 0.3) * 0.08);

		// ---- garis berganti gelap saat berada di atas footer (latar lime) ----
		let ink = 0;
		if (footer) {
			const objY = ((1 - ny) / 2) * window.innerHeight;
			const rPx = (diam / (2 * halfH)) * (window.innerHeight / 2) * (portrait ? 1 / camera.aspect : 1);
			const fy = footer.getBoundingClientRect().top;
			ink = 1 - MathUtils.smoothstep(fy, objY - rPx, objY + rPx);
		}
		uniforms.uInk.value += (ink - uniforms.uInk.value) * 0.2;
		uniforms.uOpacity.value = portrait ? 0.45 : 1;

		uniforms.uTime.value = time;
		renderer.render(scene, camera);
	};

	canvas.addEventListener('webglcontextlost', (ev) => {
		ev.preventDefault();
		gsap.ticker.remove(draw);
	});

	// muncul perlahan setelah intro hero, objek "tumbuh" dari titik
	gsap.to(canvas, { opacity: 1, duration: 1.4, delay: 1.2 });
	gsap.to(intro, { v: 1, duration: 2.4, ease: 'expo.out', delay: 1.0 });
	gsap.ticker.add(draw);
}
