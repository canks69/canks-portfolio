#!/usr/bin/env bun
/**
 * Mengubah font (woff/ttf/otf) menjadi "typeface JSON" Three.js — hanya untuk huruf yang diminta.
 * Dipakai untuk teks 3D "CANKS" di hero (src/scripts/wordmark3d.ts).
 *
 *   bun scripts/build-wordmark-font.mjs <font.woff> CANKS > src/assets/canks-wordmark.typeface.json
 *
 * Butuh paket `opentype.js` (tidak jadi dependensi proyek). Pasang di folder sementara lalu tunjuk:
 *   OPENTYPE=/path/ke/node_modules/opentype.js/dist/opentype.min.mjs bun scripts/build-wordmark-font.mjs ...
 *
 * Satuan koordinat = unit font asli (resolution = unitsPerEm) sehingga `size` pada TextGeometry
 * sama dengan ukuran em. Logika konversi mengikuti TTFLoader bawaan Three.js (termasuk pembalikan arah kontur).
 *
 * Font: Geist (SIL Open Font License 1.1) — https://github.com/vercel/geist-font
 */
import { readFile } from 'node:fs/promises';

const [fontPath, chars = 'CANKS'] = process.argv.slice(2);
if (!fontPath) {
	console.error('Pemakaian: bun scripts/build-wordmark-font.mjs <font.woff> CANKS');
	process.exit(1);
}
const mod = await import(process.env.OPENTYPE ?? "opentype.js");
const opentype = mod.default ?? mod;
const buf = await readFile(fontPath);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const round = Math.round;

function reverseCommands(commands) {
	const paths = [];
	let path;
	for (const c of commands) {
		if (c.type.toLowerCase() === 'm') {
			path = [c];
			paths.push(path);
		} else if (c.type.toLowerCase() !== 'z') {
			path.push(c);
		}
	}
	const reversed = [];
	for (const p of paths) {
		reversed.push({ type: 'm', x: p[p.length - 1].x, y: p[p.length - 1].y });
		for (let i = p.length - 1; i > 0; i--) {
			const command = p[i];
			const result = { type: command.type };
			if (command.x2 !== undefined && command.y2 !== undefined) {
				result.x1 = command.x2;
				result.y1 = command.y2;
				result.x2 = command.x1;
				result.y2 = command.y1;
			} else if (command.x1 !== undefined && command.y1 !== undefined) {
				result.x1 = command.x1;
				result.y1 = command.y1;
			}
			result.x = p[i - 1].x;
			result.y = p[i - 1].y;
			reversed.push(result);
		}
	}
	return reversed;
}

const glyphs = {};
for (const ch of new Set(chars)) {
	const glyph = font.charToGlyph(ch);
	if (!glyph || glyph.index === 0) throw new Error(`Glyph "${ch}" tidak ada di font`);
	const token = { ha: round(glyph.advanceWidth), x_min: round(glyph.xMin), x_max: round(glyph.xMax), o: '' };
	for (const command of reverseCommands(glyph.path.commands)) {
		if (command.type.toLowerCase() === 'c') command.type = 'b';
		token.o += command.type.toLowerCase() + ' ';
		if (command.x !== undefined && command.y !== undefined) token.o += round(command.x) + ' ' + round(command.y) + ' ';
		if (command.x1 !== undefined && command.y1 !== undefined) token.o += round(command.x1) + ' ' + round(command.y1) + ' ';
		if (command.x2 !== undefined && command.y2 !== undefined) token.o += round(command.x2) + ' ' + round(command.y2) + ' ';
	}
	glyphs[ch] = token;
}

const out = {
	glyphs,
	familyName: font.getEnglishName('fullName'),
	ascender: round(font.ascender),
	descender: round(font.descender),
	underlinePosition: font.tables.post.underlinePosition,
	underlineThickness: font.tables.post.underlineThickness,
	boundingBox: {
		yMin: font.tables.head.yMin,
		xMin: font.tables.head.xMin,
		yMax: font.tables.head.yMax,
		xMax: font.tables.head.xMax,
	},
	resolution: font.unitsPerEm,
	license: 'Geist — SIL Open Font License 1.1 (https://github.com/vercel/geist-font)',
};
process.stdout.write(JSON.stringify(out));
