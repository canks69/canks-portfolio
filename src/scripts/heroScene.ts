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
	Plane,
	Raycaster,
	Scene,
	ShaderMaterial,
	TorusKnotGeometry,
	Vector2,
	Vector3,
	WebGLRenderer,
	WireframeGeometry,
} from 'three';
import { qs, reduceMotion } from './env';

/**
 * Hero: medan garis 3D dengan Three.js (WebGL).
 *
 * Puluhan garis sejajar membentuk "lanskap kontur" yang digambar dalam satu draw call (LineSegments).
 * Seluruh pergeseran dihitung di vertex shader (GPU): gelombang yang mengalir, riak yang mengikuti kursor,
 * dan amplitudo yang menguat saat halaman digulir. Kamera bergeser tipis mengikuti kursor (parallax 3D).
 *
 * Di atasnya melayang objek 3D: simpul torus (torus knot) dari garis wireframe. Kedalamannya terbaca dari
 * kecerahan (bagian depan terang, belakang redup), pita aksen mengalir di permukaannya, dan objek berputar,
 * miring mengikuti kursor, serta menyusut & memudar saat hero digulir. Objek ditempel pada kamera sehingga
 * posisinya di layar selalu di area kosong kanan-bawah.
 *
 * Dimuat lewat dynamic import dari main.ts — halaman tanpa hero tidak ikut mengunduh Three.js.
 */

const VERTEX = /* glsl */ `
	uniform float uTime;
	uniform vec3 uMouse;
	uniform float uMouseStrength;
	uniform float uAmp;
	uniform float uScroll;
	attribute float aAccent;
	varying float vFade;
	varying float vAccent;

	// jumlah gelombang sinus berlapis → permukaan organik tanpa tekstur noise
	float height(vec2 p) {
		return sin(p.x * 0.85 + uTime * 0.35 + p.y * 0.55) * 0.55
			+ sin(p.x * 2.1 - uTime * 0.5 + p.y * 1.3) * 0.24
			+ sin(p.y * 1.7 + uTime * 0.28 + p.x * 0.3) * 0.21;
	}

	void main() {
		vec3 pos = position;
		// gelombang makin tinggi di kejauhan → kesan barisan pegunungan
		float far = clamp(-pos.z / 24.0, 0.0, 1.0);
		float amp = uAmp * (1.0 + far * 1.1) * (1.0 + uScroll * 1.6);
		float y = height(pos.xz) * amp;

		// riak di sekitar kursor (gaussian)
		float d = distance(pos.xz, uMouse.xz);
		y += exp(-(d * d) / 2.6) * 0.95 * uMouseStrength;

		pos.y = y;
		vec4 mv = modelViewMatrix * vec4(pos, 1.0);
		gl_Position = projectionMatrix * mv;

		// garis jauh memudar, garis dekat lebih tegas
		vFade = smoothstep(44.0, 9.0, -mv.z);
		vAccent = aAccent;
	}
`;

const FRAGMENT = /* glsl */ `
	uniform vec3 uFg;
	uniform vec3 uAccent;
	uniform float uAlphaBase;
	uniform float uAlphaAccent;
	varying float vFade;
	varying float vAccent;

	void main() {
		vec3 color = mix(uFg, uAccent, vAccent);
		float alpha = mix(uAlphaBase, uAlphaAccent, vAccent) * vFade;
		gl_FragColor = vec4(color, alpha);
	}
`;

const KNOT_VERTEX = /* glsl */ `
	uniform float uTime;
	uniform float uCenterDist;
	uniform float uRadius;
	varying float vDepth;
	varying float vBand;

	void main() {
		vec4 mv = modelViewMatrix * vec4(position, 1.0);
		gl_Position = projectionMatrix * mv;

		// kedalaman relatif terhadap pusat objek: depan = 1 (terang), belakang = 0 (redup)
		float k = (-mv.z - uCenterDist) / uRadius;
		vDepth = 1.0 - smoothstep(-1.0, 1.0, k);

		// pita aksen yang mengalir melintasi permukaan
		float wave = sin(position.x * 2.3 + position.y * 3.1 + position.z * 2.7 + uTime * 1.4) * 0.5 + 0.5;
		vBand = smoothstep(0.86, 0.96, wave);
	}
`;

const KNOT_FRAGMENT = /* glsl */ `
	uniform vec3 uFg;
	uniform vec3 uAccent;
	uniform float uOpacity;
	varying float vDepth;
	varying float vBand;

	void main() {
		vec3 color = mix(uFg, uAccent, vBand);
		float alpha = mix(0.07, 0.62, vDepth) * mix(1.0, 1.6, vBand) * uOpacity;
		gl_FragColor = vec4(color, min(alpha, 0.95));
	}
`;

export function initHeroScene() {
	const hero = qs('[data-hero]');
	const canvas = qs<HTMLCanvasElement>('[data-hero-field]');
	if (!hero || !canvas) return;

	// Deteksi WebGL diam-diam (kanvas sementara) supaya perangkat tanpa WebGL tidak memunculkan galat di konsol
	if (!document.createElement('canvas').getContext('webgl2') && !document.createElement('canvas').getContext('webgl')) return;

	// warna diberikan apa adanya (sRGB) ke shader
	ColorManagement.enabled = false;

	let renderer: WebGLRenderer;
	try {
		renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
	} catch {
		return; // WebGL tidak tersedia: hero tetap tampil tanpa latar garis
	}
	renderer.setClearColor(0x000000, 0);

	const small = window.innerWidth < 700;
	const LINES = small ? 34 : 54;
	const SEGMENTS = small ? 120 : 220;
	const HALF_X = 12;
	const Z_FAR = -28;
	const Z_NEAR = 3.5;

	// ---- geometri: LINES garis, masing-masing SEGMENTS ruas, semua dalam satu LineSegments ----
	const positions = new Float32Array(LINES * SEGMENTS * 2 * 3);
	const accents = new Float32Array(LINES * SEGMENTS * 2);
	let p = 0;
	let a = 0;
	for (let i = 0; i < LINES; i++) {
		const z = Z_FAR + (Z_NEAR - Z_FAR) * (i / (LINES - 1));
		const accent = i % 7 === 3 ? 1 : 0;
		for (let j = 0; j < SEGMENTS; j++) {
			const x0 = -HALF_X + 2 * HALF_X * (j / SEGMENTS);
			const x1 = -HALF_X + 2 * HALF_X * ((j + 1) / SEGMENTS);
			positions[p++] = x0;
			positions[p++] = 0;
			positions[p++] = z;
			positions[p++] = x1;
			positions[p++] = 0;
			positions[p++] = z;
			accents[a++] = accent;
			accents[a++] = accent;
		}
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
	geometry.setAttribute('aAccent', new Float32BufferAttribute(accents, 1));

	const uniforms = {
		uTime: { value: 0 },
		uMouse: { value: new Vector3(0, 0, -50) },
		uMouseStrength: { value: 0 },
		uAmp: { value: 0.7 },
		uScroll: { value: 0 },
		uFg: { value: new Color('#ecebe4') },
		uAccent: { value: new Color('#c8ff3d') },
		uAlphaBase: { value: 0.15 },
		uAlphaAccent: { value: 0.45 },
	};
	const material = new ShaderMaterial({
		uniforms,
		vertexShader: VERTEX,
		fragmentShader: FRAGMENT,
		transparent: true,
		depthTest: false,
		depthWrite: false,
	});

	const lines = new LineSegments(geometry, material);
	lines.frustumCulled = false; // posisi dihitung di shader, bounding box bawaan tidak berlaku

	const scene = new Scene();
	scene.add(lines);

	const camera = new PerspectiveCamera(38, 1, 0.1, 60);
	const CAMERA_BASE = new Vector3(0, 3.1, 8.4);
	camera.position.copy(CAMERA_BASE);
	scene.add(camera); // anak kamera (objek 3D) hanya dirender bila kamera ada di scene

	// ---- objek 3D: simpul torus dari garis ----
	const KNOT_DIST = 7; // jarak objek dari kamera
	const knotUniforms = {
		uTime: uniforms.uTime, // dibagi dengan lanskap
		uFg: uniforms.uFg,
		uAccent: uniforms.uAccent,
		uCenterDist: { value: KNOT_DIST },
		uRadius: { value: 1.4 },
		uOpacity: { value: 1 },
	};
	const knot = new LineSegments(
		new WireframeGeometry(new TorusKnotGeometry(1, 0.3, small ? 140 : 240, small ? 12 : 18, 2, 3)),
		new ShaderMaterial({
			uniforms: knotUniforms,
			vertexShader: KNOT_VERTEX,
			fragmentShader: KNOT_FRAGMENT,
			transparent: true,
			depthTest: false,
			depthWrite: false,
		})
	);
	knot.frustumCulled = false;
	knot.renderOrder = 2;
	const pivot = new Group();
	pivot.add(knot);
	camera.add(pivot);

	let knotScale = 0.85;
	const intro = { v: reduceMotion ? 1 : 0 }; // 0 → 1: objek "tumbuh" saat halaman dibuka
	const placeKnot = () => {
		// letakkan objek di area kosong kanan-bawah layar, apa pun rasio layarnya
		const halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * KNOT_DIST;
		const halfW = halfH * camera.aspect;
		const portrait = camera.aspect < 1;
		// potret: area kosong di kanan judul (di bawah foto); lanskap: kanan-bawah
		pivot.position.set((portrait ? 0.56 : 0.58) * halfW, (portrait ? -0.3 : -0.56) * halfH, -KNOT_DIST);
		// diameter objek ≈ 2,6 satuan: ±38% tinggi layar (lanskap) atau ±30% lebar layar (potret)
		knotScale = portrait ? (0.3 * 2 * halfW) / 2.6 : (0.38 * 2 * halfH) / 2.6;
		knotUniforms.uRadius.value = 1.45 * knotScale;
	};

	// ---- warna dari token CSS (dibaca ulang saat tema berganti) ----
	const readColors = () => {
		const css = getComputedStyle(document.documentElement);
		const fg = css.getPropertyValue('--fg').trim();
		const accent = css.getPropertyValue('--accent').trim();
		if (fg) uniforms.uFg.value.set(fg);
		if (accent) uniforms.uAccent.value.set(accent);
	};
	readColors();

	// ---- ukuran ----
	const resize = () => {
		const r = canvas.getBoundingClientRect();
		const w = Math.max(1, Math.round(r.width));
		const h = Math.max(1, Math.round(r.height));
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.fov = camera.aspect < 1 ? 58 : 38; // layar potret: sudut pandang lebih lebar
		camera.updateProjectionMatrix();
		placeKnot();
	};

	// ---- interaksi ----
	const raycaster = new Raycaster();
	const floor = new Plane(new Vector3(0, 1, 0), 0);
	const ndc = new Vector2(0, 0);
	const hit = new Vector3();
	const mouseWorld = new Vector3(0, 0, -50);
	let pointerInside = false;
	let scrollTarget = 0;
	const lookAt = new Vector3(0, 0.1, -2);
	const tilt = new Vector2(0, 0);

	const draw = (seconds: number) => {
		uniforms.uTime.value = seconds;

		// kursor → titik pada bidang lantai
		if (pointerInside) {
			camera.updateMatrixWorld();
			raycaster.setFromCamera(ndc, camera);
			if (raycaster.ray.intersectPlane(floor, hit)) {
				if (mouseWorld.z < -40) mouseWorld.copy(hit);
				mouseWorld.lerp(hit, 0.12);
			}
		}
		uniforms.uMouse.value.copy(mouseWorld);
		uniforms.uMouseStrength.value += ((pointerInside ? 1 : 0) - uniforms.uMouseStrength.value) * 0.06;
		uniforms.uScroll.value += (scrollTarget - uniforms.uScroll.value) * 0.08;

		// kamera: parallax tipis mengikuti kursor + sedikit mundur saat digulir
		camera.position.x += (ndc.x * 0.7 - camera.position.x) * 0.04;
		camera.position.y += (CAMERA_BASE.y + ndc.y * 0.25 - camera.position.y) * 0.04;
		camera.position.z = CAMERA_BASE.z + uniforms.uScroll.value * 1.8;
		camera.lookAt(lookAt);

		// objek 3D: putar perlahan, miring mengikuti kursor, menyusut & memudar saat digulir
		tilt.x += (ndc.y * 0.55 - tilt.x) * 0.05;
		tilt.y += (ndc.x * 0.9 - tilt.y) * 0.05;
		knot.rotation.set(0.35 + tilt.x, seconds * 0.22 + tilt.y, seconds * 0.05);
		const away = Math.min(uniforms.uScroll.value / 0.5, 1); // 0..1 selama hero digulir keluar
		pivot.scale.setScalar(knotScale * intro.v * (1 - away * 0.45));
		knotUniforms.uOpacity.value = 1 - away * 0.9;

		renderer.render(scene, camera);
	};

	resize();
	new ResizeObserver(() => {
		resize();
		if (reduceMotion) draw(14);
	}).observe(canvas);

	window.addEventListener('themechange', () => {
		readColors();
		if (reduceMotion) draw(14);
	});

	// gerak dikurangi: satu bingkai statis, tanpa loop & tanpa interaksi
	if (reduceMotion) {
		canvas.style.opacity = '1';
		draw(14);
		return;
	}

	hero.addEventListener('pointermove', (e) => {
		const r = canvas.getBoundingClientRect();
		ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
		pointerInside = true;
	});
	hero.addEventListener('pointerleave', () => {
		pointerInside = false;
		ndc.set(0, 0);
	});

	// render hanya saat hero terlihat; amplitudo menguat saat digulir keluar
	let active = true;
	ScrollTrigger.create({
		trigger: hero,
		start: 'top bottom',
		end: 'bottom top',
		onToggle: (self) => (active = self.isActive),
		onUpdate: (self) => (scrollTarget = self.progress * 0.5),
	});

	canvas.addEventListener('webglcontextlost', (e) => {
		e.preventDefault();
		active = false;
	});

	gsap.to(intro, { v: 1, duration: 2.4, ease: 'expo.out', delay: 0.9 });

	gsap.ticker.add((time) => {
		if (active) draw(time);
	});
}
