/** Identitas situs — dipakai untuk canonical, Open Graph, structured data, dan tautan sosial. */
/** Saklar fitur. `blog: false` menyembunyikan blog (menu, bagian beranda, halaman /blog) tanpa menghapus artikelnya. */
export const FEATURES = {
	blog: false,
};

export const SITE = {
	/** alamat produksi (host kanonik = tanpa www; www sudah dialihkan 301 oleh server) */
	url: 'https://canks.dev',
	name: 'Canks',
	/** email kontak — dipakai di header, footer, dan halaman Kontak */
	email: 'canks.official@gmail.com',
	jobTitle: 'Full Stack Developer',
	locale: 'id_ID',
	/** gambar pratinjau default (1200×630, relatif ke /public) */
	image: '/og.png',
	imageAlt: 'Canks — Full Stack Developer yang ahli dalam teknologi modern',
	socials: [
		{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/muh-ihsan-nur-7b4a79206/' },
		{ label: 'Instagram', href: 'https://www.instagram.com/daeng.kulle_/' },
		{ label: 'GitHub', href: 'https://github.com/canks69/' },
	],
};
