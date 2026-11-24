import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
	BufferGeometry,
	Color,
	ColorManagement,
	Float32BufferAttribute,
	Group,
	LineSegments,
	LinearFilter,
	LinearMipmapLinearFilter,
	PerspectiveCamera,
	Scene,
	ShaderMaterial,
	TextureLoader,
	Vector2,
	WebGLRenderer,
} from 'three';
import { qs, reduceMotion } from './env';

/**
 * Foto hero sebagai RELIEF 3D dari garis (Three.js).
 *
 * Catatan jujur: ini bukan model kepala 3D hasil pemindaian. Foto dibaca sebagai peta terang-gelap, lalu
 * ratusan garis horizontal dilengkungkan ke depan mengikuti kecerahan (kulit/wajah menonjol, latar menjauh)
 * dan diberi kecerahan garis yang sama — sehingga wajah tetap terbaca dari depan dan terlihat sebagai
 * volume saat relief miring mengikuti kursor. <img> aslinya tetap ada di bawahnya.
 */

const VERTEX = /* glsl */ `
	uniform sampler2D uMap;
	uniform float uDepth;
	uniform vec2 uUvMin;
	uniform vec2 uUvMax;
	attribute vec2 aGrid; // 0..1 pada bidang relief
	varying float vLum;

	void main() {
		// aGrid.y = 0 di bawah; v tekstur = 0 juga di bawah (flipY) → tanpa pembalikan
		vec2 uv = mix(uUvMin, uUvMax, vec2(aGrid.x, aGrid.y));
		// LOD ±2,6 = diburamkan agar permukaan halus: tepi rambut/dahi tidak menjadi "tebing" tajam
		vec3 c = textureLod(uMap, uv, 2.6).rgb;
		float lum = dot(c, vec3(0.299, 0.587, 0.114));
		vLum = lum;

		vec3 pos = position;
		pos.z += smoothstep(0.05, 0.85, lum) * uDepth;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
	}
`;

const FRAGMENT = /* glsl */ `
	uniform vec3 uFg;
	uniform vec3 uAccent;
	uniform float uOpacity;
	varying float vLum;

	void main() {
		// bagian terang = garis tegas; bagian gelap = hampir hilang
		float a = smoothstep(0.08, 0.7, vLum);
		vec3 color = mix(uFg, uAccent, smoothstep(0.62, 0.95, vLum));
		gl_FragColor = vec4(color, a * 0.95 * uOpacity);
	}
`;

export function initPortraitRelief() {
	const hero = qs('[data-hero]');
	const canvas = qs<HTMLCanvasElement>('[data-hero-relief]');
	const img = qs<HTMLImageElement>('[data-hero-photo] img');
	if (!hero || !canvas || !img) return;

	if (!document.createElement('canvas').getContext('webgl2')) return;
	ColorManagement.enabled = false;

	let renderer: WebGLRenderer;
	try {
		renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
	} catch {
		return;
	}
	renderer.setClearColor(0x000000, 0);

	const small = window.innerWidth < 700;
	const ROWS = small ? 80 : 120;
	const COLS = small ? 120 : 180;

	// bidang relief: lebar = rasio kanvas (±0,8), tinggi = 1
	let aspect = 0.8;

	// grid garis: ROWS garis, tiap garis COLS ruas; aGrid = posisi 0..1, position diisi saat ukuran diketahui
	const grid = new Float32Array(ROWS * COLS * 2 * 2);
	let g = 0;
	for (let r = 0; r < ROWS; r++) {
		const v = r / (ROWS - 1);
		for (let c = 0; c < COLS; c++) {
			grid[g++] = c / COLS;
			grid[g++] = v;
			grid[g++] = (c + 1) / COLS;
			grid[g++] = v;
		}
	}
	const geometry = new BufferGeometry();
	const positions = new Float32Array(ROWS * COLS * 2 * 3);
	geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
	geometry.setAttribute('aGrid', new Float32BufferAttribute(grid, 2));

	const fillPositions = () => {
		const pos = geometry.getAttribute('position');
		let i = 0;
		for (let k = 0; k < grid.length; k += 2) {
			pos.setXYZ(i++, (grid[k] - 0.5) * 2 * aspect, (grid[k + 1] - 0.5) * 2, 0);
		}
		pos.needsUpdate = true;
	};

	const uniforms = {
		uMap: { value: null as unknown },
		uDepth: { value: 0.5 },
		// <img> 1:1 dipotong ke bingkai 4:5 (object-fit: cover) → lebar yang terlihat 80%, di tengah
		uUvMin: { value: new Vector2(0.1, 0) },
		uUvMax: { value: new Vector2(0.9, 1) },
		uFg: { value: new Color('#ecebe4') },
		uAccent: { value: new Color('#c8ff3d') },
		uOpacity: { value: 1 },
	};
	const material = new ShaderMaterial({
		uniforms,
		vertexShader: VERTEX,
		fragmentShader: FRAGMENT,
		transparent: true,
		depthTest: false,
		depthWrite: false,
	});
	const mesh = new LineSegments(geometry, material);
	mesh.frustumCulled = false;
	const pivot = new Group();
	pivot.add(mesh);

	const scene = new Scene();
	scene.add(pivot);
	const camera = new PerspectiveCamera(28, 1, 0.1, 30);
	camera.position.set(0, 0, 5.2);

	const readColors = () => {
		const css = getComputedStyle(document.documentElement);
		const fg = css.getPropertyValue('--fg').trim();
		const accent = css.getPropertyValue('--accent').trim();
		if (fg) uniforms.uFg.value.set(fg);
		if (accent) uniforms.uAccent.value.set(accent);
	};
	readColors();

	const resize = () => {
		const r = canvas.getBoundingClientRect();
		const w = Math.max(1, Math.round(r.width));
		const h = Math.max(1, Math.round(r.height));
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		renderer.setSize(w, h, false);
		aspect = w / h;
		camera.aspect = aspect;
		camera.updateProjectionMatrix();
		fillPositions();
	};

	const ndc = new Vector2(0, 0);
	const tilt = new Vector2(0, 0);
	let pointerInside = false;
	const draw = (seconds: number) => {
		// miring mengikuti kursor; saat diam bergoyang pelan agar kedalamannya terbaca
		const tx = pointerInside ? ndc.x * 0.55 : Math.sin(seconds * 0.55) * 0.28;
		const ty = pointerInside ? ndc.y * 0.3 : Math.sin(seconds * 0.4 + 1) * 0.08;
		tilt.x += (ty - tilt.x) * 0.06;
		tilt.y += (tx - tilt.y) * 0.06;
		pivot.rotation.set(-tilt.x, tilt.y, 0);
		renderer.render(scene, camera);
	};

	const start = () => {
		resize();
		window.addEventListener('themechange', () => {
			readColors();
			if (reduceMotion) draw(1.2);
		});
		new ResizeObserver(() => {
			resize();
			if (reduceMotion) draw(1.2);
		}).observe(canvas);

		draw(0);
		// <img> redup (tetap terbaca sebagai wajah di bawah garis), relief 3D muncul
		const show = () => {
			gsap.to(canvas, { opacity: 1, duration: reduceMotion ? 0 : 1.4, delay: reduceMotion ? 0 : 2.2 });
			gsap.to(img, { opacity: 0.32, duration: reduceMotion ? 0 : 1.4, delay: reduceMotion ? 0 : 2.2 });
		};
		show();

		if (reduceMotion) {
			draw(1.2);
			return;
		}

		hero.addEventListener('pointermove', (e) => {
			const r = canvas.getBoundingClientRect();
			// koordinat relatif ke pusat foto, dibatasi agar miring tidak berlebihan
			ndc.set(gsap.utils.clamp(-1.5, 1.5, ((e.clientX - r.left) / r.width) * 2 - 1), gsap.utils.clamp(-1.5, 1.5, -(((e.clientY - r.top) / r.height) * 2 - 1)));
			pointerInside = true;
		});
		hero.addEventListener('pointerleave', () => (pointerInside = false));

		let active = true;
		ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: (self) => (active = self.isActive) });
		gsap.ticker.add((time) => {
			if (active) draw(time);
		});
	};

	new TextureLoader().load(
		img.currentSrc || img.src,
		(texture) => {
			texture.minFilter = LinearMipmapLinearFilter;
			texture.magFilter = LinearFilter;
			texture.generateMipmaps = true;
			uniforms.uMap.value = texture;
			start();
		},
		undefined,
		() => {
			/* gambar gagal dimuat — biarkan <img> apa adanya */
		}
	);
}
