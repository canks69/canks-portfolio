import { FEATURES } from './site.js';

/** Menu halaman utama (anchor ke section). `id` dipakai untuk menandai menu aktif saat scroll. */
export const mainMenu = [
	{ link: '#', label: 'Beranda', id: 'top' },
	{ link: '#about', label: 'Tentang', id: 'about' },
	{ link: '#skills', label: 'Keterampilan', id: 'skills' },
	{ link: '#portofolio', label: 'Portofolio', id: 'portofolio' },
	...(FEATURES.blog ? [{ link: '#blog', label: 'Blog', id: 'blog' }] : []),
	{ link: '/kontak', label: 'Kontak' },
];

/** Menu untuk halaman selain beranda. Menu aktif ditentukan dari URL (lihat Header.astro). */
export const menuPage = [
	{ link: '/', label: 'Beranda' },
	{ link: '/#about', label: 'Tentang' },
	{ link: '/keterampilan', label: 'Keterampilan' },
	{ link: '/proyek', label: 'Portofolio' },
	...(FEATURES.blog ? [{ link: '/blog', label: 'Blog' }] : []),
	{ link: '/kontak', label: 'Kontak' },
];
