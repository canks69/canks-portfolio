---
title: "Membagi Tugas GSAP, Motion, dan Lenis di Astro"
description: "Tiga library animasi dalam satu halaman bisa saling bertabrakan. Begini cara membagi perannya supaya tetap rapi dan ringan."
pubDate: '2026-11-23'
---

Portofolio ini memakai tiga library animasi sekaligus: **GSAP**, **Motion**, dan **Lenis**. Kuncinya bukan memilih satu yang paling hebat, tetapi memberi masing-masing satu peran yang jelas.

## Pembagian peran

| Library | Dipakai untuk |
| --- | --- |
| **Lenis** | Scroll yang halus |
| **GSAP** | Hal yang terikat pada scroll atau butuh timeline: intro, pin, parallax, SplitText, DrawSVG |
| **Motion** | Interaksi kecil: reveal saat masuk layar, hover berbasis spring, progres scroll |

Aturan praktisnya: kalau animasinya perlu **scrub**, **pin**, atau **urutan yang rumit**, serahkan ke GSAP. Kalau cukup "muncul saat terlihat" atau "bereaksi saat di-hover", Motion lebih ringkas.

## Lenis dan GSAP memakai satu ticker

Lenis mengubah posisi scroll secara halus, jadi `ScrollTrigger` harus diberi tahu setiap kali posisinya berubah. Cara paling bersih adalah membuat Lenis ikut berjalan di ticker GSAP, bukan memakai `requestAnimationFrame` sendiri:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false });

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

`autoRaf: false` penting: tanpa itu ada dua loop yang menggerakkan scroll.

## GSAP: galeri horizontal yang di-pin

Section portofolio di desktop berupa galeri yang digeser ke samping selagi halaman digulir ke bawah. Intinya hanya satu tween dengan `pin` dan `scrub`:

```ts
const distance = () => track.scrollWidth - pin.clientWidth;

gsap.to(track, {
  x: () => -distance(),
  ease: 'none',
  scrollTrigger: {
    trigger: pin,
    start: 'top top',
    end: () => `+=${distance()}`,
    pin: true,
    scrub: 0.6,
    invalidateOnRefresh: true,
  },
});
```

Bungkus semuanya dengan `gsap.matchMedia()` agar pin hanya aktif di layar lebar dan otomatis dibatalkan saat ukuran berubah.

## Motion: yang kecil-kecil

Untuk reveal, Motion cukup dua baris dan tidak perlu `ScrollTrigger`:

```ts
import { animate, inView } from 'motion';

inView(el, () => {
  animate(el, { opacity: [0, 1], y: [28, 0] }, { duration: 0.9 });
});
```

Garis progres baca di bawah header juga hanya satu panggilan:

```ts
import { animate, scroll } from 'motion';

scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
```

## Jangan biarkan dua library menulis `transform` yang sama

Ini jebakan yang paling sering muncul. GSAP dan Motion sama-sama menulis properti `transform` pada elemen. Kalau keduanya menganimasikan elemen yang sama, hasilnya saling menimpa.

Solusinya sederhana: **satu elemen, satu pemilik transform**. Di situs ini:

- Gambar kartu proyek digeser GSAP (parallax), sedangkan efek zoom saat hover dipasang Motion pada **pembungkusnya**.
- Kursor kustom diposisikan GSAP (`quickTo`), sedangkan cincin di dalamnya dibesarkan oleh Motion.

## Hormati `prefers-reduced-motion`

Keadaan awal animasi (misalnya `opacity: 0`) hanya boleh aktif kalau JavaScript benar-benar berjalan. Karena itu kelas `js` dipasang lewat skrip kecil di `<head>`, dan **tidak** dipasang bila pengguna meminta gerak dikurangi:

```html
<script is:inline>
  (function () {
    var d = document.documentElement;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    d.classList.add('js');
  })();
</script>
```

```css
.js [data-reveal] { opacity: 0; transform: translateY(28px); }
```

Hasilnya, tanpa JavaScript atau dengan gerak dikurangi, semua konten tetap tampil apa adanya, tanpa Lenis, tanpa pin, dan tanpa scrub.

## Satu tips SplitText

`SplitText` dengan opsi `mask` membungkus tiap kata dalam elemen ber-`overflow: clip`. Huruf seperti *g*, *y*, atau italic serif bisa terpotong. Beri ruang pada pembungkusnya dengan padding dan margin negatif agar tata letak tidak berubah:

```css
.w-mask {
  padding: 0.1em 0.14em 0.2em;
  margin: -0.1em -0.14em -0.2em;
}
```

## Penutup

Tiga library terasa ringan kalau batasnya jelas: Lenis untuk scroll, GSAP untuk koreografi, Motion untuk interaksi. Sisanya hanya disiplin soal siapa yang memegang `transform`.
