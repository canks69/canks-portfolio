/** Ikon + warna merek untuk marquee. File SVG ada di /public/assets. */
export const techIcons = [
	{ name: 'Bootstrap', src: '/assets/bootstrap.svg', color: '#7738ff' },
	{ name: 'TailwindCSS', src: '/assets/tailwind.svg', color: '#38bdf8' },
	{ name: 'Angular', src: '/assets/angular.svg', color: '#ff4747' },
	{ name: 'React', src: '/assets/react.svg', color: '#00d1ff' },
	{ name: 'Svelte', src: '/assets/svelte.svg', color: '#ff3e00' },
	{ name: 'VueJS', src: '/assets/vue.svg', color: '#42b883' },
	{ name: 'NodeJS', src: '/assets/nodejs.svg', color: '#83cd29' },
	{ name: 'Bun', src: '/assets/bun.svg', color: '#f3cbc2' },
	{ name: 'Golang', src: '/assets/golang.svg', color: '#00add8' },
	{ name: 'MySQL', src: '/assets/mysql.svg', color: '#ff4d4d' },
	{ name: 'MongoDB', src: '/assets/mongodb.svg', color: '#47a248' },
	{ name: 'JavaScript', src: '/assets/javascript.svg', color: '#f7df1e' },
	{ name: 'TypeScript', src: '/assets/typescript.svg', color: '#3178c6' },
	{ name: 'HTML', src: '/assets/html.svg', color: '#e34f26' },
	{ name: 'CSS', src: '/assets/css.svg', color: '#1572b6' },
];

/**
 * Dikelompokkan dari paragraf keterampilan di halaman, teknologi yang tercatat pada proyek portofolio
 * (JavaScript, PHP, Golang, Bootstrap, Tailwind), serta TypeScript, Python, Lua, dan Svelte.
 * Tidak ada tingkat kemahiran — tambahkan hanya bila Anda mau.
 */
export const skillGroups = [
	{ title: 'Bahasa', items: ['JavaScript', 'TypeScript', 'PHP', 'Golang', 'Python', 'Lua', 'HTML', 'CSS'] },
	{ title: 'Backend', items: ['NodeJS', 'Laravel', 'NestJS', 'ExpressJS', 'Bun', 'Gofiber'] },
	{ title: 'Frontend', items: ['React', 'NextJS', 'Angular', 'VueJS', 'Svelte', 'Bootstrap', 'Tailwind'] },
	{ title: 'Database', items: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis'] },
	{ title: 'DevOps', items: ['Docker', 'Git', 'Jenkins', 'Nginx'] },
];

/** Perangkat yang dipakai untuk membangun situs ini (fakta, bukan klaim kemahiran). */
export const siteStack = ['Astro', 'GSAP', 'Motion', 'Lenis', 'Bun', 'Tailwind CSS', 'TypeScript'];
