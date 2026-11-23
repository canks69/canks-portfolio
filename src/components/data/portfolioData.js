/**
 * Sumber KEDUA proyek portofolio (opsional).
 *
 * Sumber utama adalah file Markdown di `src/content/projects/*.md` (isi file = deskripsi lengkap).
 * Proyek yang ditulis di sini tetap muncul di beranda, /proyek/ dan halaman detail;
 * bila slug-nya sama dengan file Markdown, file Markdown yang dipakai.
 *
 * @typedef Project
 * @property {string} slug        Alamat halaman detail (/proyek/<slug>/) — jangan diubah setelah dipublikasikan
 * @property {string} title       Judul proyek
 * @property {string} category    Jenis proyek, mis. 'ERP'
 * @property {string} imgSrc      Path gambar (relatif ke /public)
 * @property {string[]} skills    Teknologi yang dipakai
 * @property {string} descripcion Ringkasan proyek
 * @property {string} demoURL     URL demo (kosong = tidak ditampilkan)
 * @property {string} repoURL     URL repositori (kosong = tidak ditampilkan)
 * @property {string} [role]
 * @property {string} [year]
 * @property {string[]} [highlights]
 */

/** @type {Project[]} */
export const projects = [
	// {
	// 	slug: 'contoh-proyek',
	// 	title: 'Contoh Proyek',
	// 	category: 'Web',
	// 	imgSrc: '/img/portfolio/contoh.png',
	// 	skills: ['React', 'Tailwind'],
	// 	descripcion: 'Ringkasan singkat proyek.',
	// 	demoURL: '',
	// 	repoURL: '',
	// },
];
