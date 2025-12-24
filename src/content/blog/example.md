---
title: "JavaScript: Tutorial Menu Hamburger"
description: "Ini adalah postingan terbaru"
pubDate: '30 Apr 2024'
heroImage: "../img/about-1x1.png"
---

## JavaScript: Menjelajahi Fungsi dan Memahami Variabel

![javascript image](/img/about-1x1.png)

Pada bagian kedua dari panduan praktis JavaScript ini, kita akan masuk ke dunia fungsi yang menarik dan membahas perbedaan antara `var`, `let`, dan `const`. Siap-siap memahami konsep-konsep penting ini dalam perjalanan kamu di dunia pengembangan web.

## Fungsi dalam JavaScript

Fungsi adalah blok kode yang dapat digunakan kembali untuk menjalankan tugas tertentu. Membuat fungsi melibatkan dua langkah utama: deklarasi dan eksekusi.

### Deklarasi Fungsi

```javascript
function saludar(nombre) {
  console.log(`Halo, ${nombre}!`);
}
```

Di sini, `saludar` adalah nama fungsi, dan `(nombre)` adalah parameter yang dapat diterima oleh fungsi tersebut.

### Eksekusi Fungsi

```javascript
saludar("Juan");
// Output: Halo, Juan!
```

Dengan memanggil fungsi `saludar` dan memberikan argumen `Juan`, kode di dalam fungsi akan dijalankan dan menghasilkan output yang sesuai.

### Jenis-Jenis Fungsi

#### Fungsi dengan Nilai Kembalian

```javascript
function sumar(a, b) {
  return a + b;
}

let resultado = sumar(3, 5);
// resultado: 8
```

#### Fungsi Anonim

```javascript
let saludar = function(nombre) {
  console.log(`Halo, ${nombre}!`);
};

saludar("Ana");
// Output: Halo, Ana!
```

#### Arrow Function

```javascript
let multiplicar = (a, b) => a * b;

let producto = multiplicar(4, 6);
// producto: 24
```

Arrow function merupakan cara yang lebih singkat dan ringkas untuk menulis fungsi.

## Variabel: var, let, dan const

### `var`

```javascript
function ejemploVar() {
  if (true) {
    var x = 10;
  }
  console.log(x);
}

ejemploVar();
// Output: 10
```

`var` memiliki cakupan fungsi (function scope), artinya variabel akan tersedia di seluruh fungsi tempat ia dideklarasikan.

### `let`

```javascript
function ejemploLet() {
  if (true) {
    let y = 20;
  }
  console.log(y); // Error!
}

ejemploLet();
```

`let` memiliki cakupan blok (block scope), sehingga hanya bisa diakses di dalam blok tempat variabel tersebut dibuat.

### `const`

```javascript
function ejemploConst() {
  const PI = 3.14;
  console.log(PI);
}

ejemploConst();
// Output: 3.14
```

Pada contoh ini, `const` digunakan untuk mendeklarasikan konstanta `PI`. Nilainya hanya bisa ditetapkan sekali. Namun, jika `const` digunakan pada objek, isi objek tersebut masih bisa berubah.


## Scope dalam JavaScript

Scope mengacu pada seberapa jauh variabel dapat diakses dan digunakan di dalam kode.

### Scope Global

```javascript
let globalVar = "Saya variabel global";

function ejemploScopeGlobal() {
  console.log(globalVar);
}

ejemploScopeGlobal();
// Output: Saya variabel global
```

### Scope Local

```javascript
function ejemploScopeLocal() {
  let localVar = "Saya variabel lokal";
  console.log(localVar);
}

ejemploScopeLocal();
// Output: Saya variabel lokal

console.log(localVar); // Error!
```

Variabel yang dideklarasikan dengan `let` dan `const` hanya bisa diakses di dalam blok tempat variabel tersebut dibuat.

## Kesimpulan

Pada bagian panduan JavaScript ini, kita telah mempelajari cara membuat dan menjalankan fungsi, serta memahami perbedaan antara `var`, `let`, dan `const`. Memahami konsep-konsep ini sangat penting untuk membangun aplikasi yang solid dan memahami bagaimana variabel memengaruhi alur serta struktur kode. Di bagian selanjutnya, kita akan membahas konsep yang lebih lanjut dan latihan praktis untuk memperdalam pemahaman kamu. Terus eksplorasi dan maksimalkan potensi JavaScript di proyek web kamu! 🚀✨