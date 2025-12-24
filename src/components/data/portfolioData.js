/**
 * @SofiDev Esto es JSDOC, si consideras que puede ser complicado solo borralo, es un comentario, no afectará en nada
 * @typedef PortafolioData
 * @property {string} imgSrc Url de la imagen
 * @property {string} title Titulo de la tarjeta
 * @property {string[]} skills Array con tus habilidades ej: ['React', 'CSS', 'JavaScript']
 * @property {string} descripcion La descripcion de la tarjeta
 * @property {string} demoURL Url de una pagina de demostración
 * @property {string} repoURL Url del repositorio, ej: https://github.com/usuario/repo
 * @property {string} anim La animación que se ejecutará cuando se cargue la tarjeta, ej: fade-up, fade-right, fade-left, fade-down
 * @property {number} averageBrightness Cuanto brillo tendrá el color de fondo de la tarjeta, ej: 0.1
 */

/**
 * @SofiDev Esto es JSDOC, si consideras que puede ser complicado solo borralo, es un comentario, no afectará en nada
 * @type {PortafolioData[]}
 */
export const portafolioData = [
	{
		imgSrc: '/img/portfolio/mebook-erp.png',
		title: 'Mebook ERP',
		skills: ['React', 'Bootstrap'],
		descripcion:
			'Mebook adalah aplikasi untuk Sistem Enterprise Resource Planning (ERP) yang dirancang untuk membantu perusahaan mengelola dan mengintegrasikan berbagai aspek penting dalam bisnis mereka. Dengan antarmuka yang ramah pengguna dan mudah digunakan, Mebook memungkinkan perusahaan untuk menyederhanakan serta mengoptimalkan proses bisnis secara lebih efisien.',
		demoURL: '',
		repoURL: '',
		anim: 'fade-right',
	},
	{
		imgSrc: '/img/portfolio/ticketing-travel.png',
		title: 'Ticketing dan Travel',
		skills: ['NextJS', 'Tailwind'],
		descripcion:
			'Sebuah aplikasi pemesanan perjalanan, tiket, dan hotel yang menyediakan platform praktis bagi pengguna untuk memesan penerbangan, tiket, dan akomodasi sesuai kebutuhan perjalanan mereka.',
		demoURL: '',
		repoURL: '',
		anim: 'fade-up',
		averageBrightness: 0.1,
	},
	{
		imgSrc: '/img/portfolio/system-inventory.png',
		title: 'System Inventory',
		skills: ['Laravel', 'Bootstrap', 'JavaScript', 'MySQL', 'Redis'],
		descripcion:
			'Sistem Inventori untuk Usaha Kecil dan Menengah adalah sistem perangkat lunak yang dirancang untuk membantu bisnis mengelola dan melacak persediaan, penjualan, dan pembelian secara efisien.',
		demoURL: '',
		repoURL: '',
		anim: 'fade-left',
	},
	{
		imgSrc: '/img/portfolio/imapos.jpg',
		title: 'ImaPOS - Point of Sale',
		skills: ['React', 'Tailwind', 'Golang', 'PostgreSQL', 'Redis'],
		descripcion:
			'ImaPOS adalah sistem Point of Sale (POS) yang komprehensif dan dirancang khusus untuk bisnis kafe dan coffee shop, yang mempermudah operasional mulai dari pencatatan pesanan hingga manajemen inventori dan pelaporan keuangan.',
		demoURL: '',
		repoURL: '',
		anim: 'fade-left',
	},
	{
		imgSrc: '/img/portfolio/dittisiber.png',
		title: 'SIMBB - Dittisiber',
		skills: ['Laravel', 'Bootstrap', 'JavaScript', 'MySQL', 'Redis'],
		descripcion:
			'Sistem Informasi Manajemen Barang Bukti adalah sistem perangkat lunak yang dirancang untuk membantu aparat penegak hukum dan instansi terkait dalam mengelola serta melacak barang bukti yang ditemukan atau disita selama proses penyelidikan dan kegiatan penegakan hukum.',
		demoURL: '',
		repoURL: '',
		anim: 'fade-left',
	},
	{
		imgSrc: '/img/portfolio/unbk.png',
		title: 'UNBK System',
		skills: ['ExpressJS', 'Bootstrap', 'JavaScript', 'MongoDB'],
		descripcion:
			'Aplikasi Ujian Nasional Berbasis Komputer (UNBK) adalah sistem komputer yang digunakan untuk mengelola, memantau, dan menyelenggarakan Ujian Nasional secara elektronik. Aplikasi ini digunakan oleh institusi pendidikan dan pemerintah untuk menggantikan sistem ujian tradisional serta melaksanakan ujian secara online.',
		demoURL: '',
		repoURL: '',
		anim: 'fade-right',
	},
	{
		imgSrc: '/img/portfolio/elearning.png',
		title: 'E-Learning',
		skills: ['PHP', 'Bootstrap', 'JavaScript', 'MySQL'],
		descripcion:
			'Sistem Aplikasi Pembelajaran Online adalah metode pembelajaran yang menggabungkan pembelajaran langsung (sinkron) dengan pembelajaran tidak langsung atau mandiri yang dapat dilakukan kapan saja (asinkron).',
		demoURL: '',
		repoURL: '',
		anim: 'fade-right',
	}
];

const skillIcons = {
	JavaScript: 'skill-icons:javascript',
	React: 'skill-icons:react-dark',
	NextJS: 'skill-icons:nextjs-dark',
	Laravel: 'skill-icons:laravel-dark',
	PHP: 'skill-icons:php-dark',
	MySQL: 'skill-icons:mysql-dark',
	PostgreSQL: 'skill-icons:postgresql-dark',
	MongoDB: 'skill-icons:mongodb',
	Golang: 'skill-icons:golang',
	Redis: 'skill-icons:redis-dark',
	ExpressJS: 'skill-icons:expressjs-dark',
	Astro: 'skill-icons:astro',
	CSS: 'skill-icons:css',
	Sass: 'skill-icons:sass',
	StyledComponents: 'skill-icons:styledcomponents',
	Bootstrap: 'skill-icons:bootstrap',
	Tailwind: 'skill-icons:tailwindcss-dark',
};

/**
 * @description Se mapea el portafolioData para que tenga los iconos de las habilidades
 * 	Puedes ver Array.map en https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
 */
export const getPortafolioData = portafolioData.map((item) => {
	return {
		// Se coloca todo el contenido previo del item
		...item,
		// Se cambian las skills por los iconos correspondientes
		skills: item.skills.map((skill) => skillIcons[skill]),
	};
});
