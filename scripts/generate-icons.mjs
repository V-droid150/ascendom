/**
 * Generates the app and PWA icons from pixel art, with no image dependency.
 *
 * The icons are pixel art, so a full raster library would be overkill: a PNG is
 * a zlib-deflated stream of filtered scanlines, and Node ships zlib. This keeps
 * the dependency list honest and means the icons are reproducible from source
 * rather than committed binaries nobody can regenerate.
 *
 * Usage: npm run icons
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// Sweetie 16 entries used by the icon, kept in sync with src/theme/colors.ts.
const C = {
  '.': null,
  n: '#1a1c2c', // night background
  d: '#333c57', // inner frame
  g: '#ffcd75', // gold
  o: '#c99b47', // gold shade
  r: '#b13e53', // gem
  w: '#f4f4f4', // highlight
};

/**
 * A crown over a night field: the clearest single symbol for "rise through the
 * ranks of a kingdom" that still reads at 48px.
 *
 * The crown spans columns 3-12 of 16, which keeps it inside the ~80% safe zone
 * that Android maskable icons crop to. Every spike tip connects downward to the
 * band — a tip left floating above a gap reads as a rendering artefact.
 */
const ICON = [
  'nnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnn',
  'nnnwnnnwwnnnwnnn',
  'nnngnnnggnnngnnn',
  'nnngnngggggngnnn',
  'nnnggggggggggnnn',
  'nnnggggggggggnnn',
  'nnnggrggggrggnnn',
  'nnnggggggggggnnn',
  'nnnoooooooooonnn',
  'nnnggggggggggnnn',
  'nnnoooooooooonnn',
  'nnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnn',
];

/** The splash mark: just the crown, transparent around it. */
const SPLASH = ICON.map((row) => row.replaceAll('n', '.'));

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);

  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typed));

  return Buffer.concat([length, typed, checksum]);
}

function hexToRgb(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

/** Encodes RGBA pixels as a PNG. `pixels` is width*height*4 bytes. */
function encodePng(width, height, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // Each scanline is prefixed with filter type 0 (none).
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Renders char art at an integer scale into an RGBA buffer. */
function render(art, scale) {
  const width = art[0].length * scale;
  const height = art.length * scale;
  const pixels = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const char = art[Math.floor(y / scale)][Math.floor(x / scale)];
      const hex = C[char];
      const offset = (y * width + x) * 4;

      if (!hex) continue; // transparent

      const [r, g, b] = hexToRgb(hex);
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255;
    }
  }

  return { width, height, pixels };
}

function write(path, art, scale) {
  const { width, height, pixels } = render(art, scale);
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, encodePng(width, height, pixels));
  console.log(`  ${path}  ${width}x${height}`);
}

console.log('Generating Ascendom icons:');

// Integer scales only, so every icon stays pixel-perfect.
write('assets/images/icon.png', ICON, 64); // 1024, store listing
write('assets/images/splash-icon.png', SPLASH, 16); // 256
write('assets/images/favicon.png', ICON, 4); // 64
write('public/logo192.png', ICON, 12); // 192, PWA
write('public/logo512.png', ICON, 32); // 512, PWA maskable

console.log('Done.');
