import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

// Function to create a valid uncompressed/deflated RGBA PNG
function createPNG(width, height, getPixel) {
  const bytesPerPixel = 4;
  const rowSize = width * bytesPerPixel + 1; // +1 for filter byte
  const rawData = Buffer.alloc(height * rowSize);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);

    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);

    return Buffer.concat([len, body, crc]);
  }

  // Table-based CRC32
  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Compression deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', deflated);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate branding pixel (Emerald shield/cyber aesthetic on dark #030712 background)
function brandPixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background #030712
  let r = 3, g = 7, b = 18, a = 255;

  // Outer circle ring
  if (dist > 0.72 && dist < 0.82) {
    r = 16; g = 185; b = 129; // Emerald-500
  } else if (dist <= 0.72 && dist >= 0.25) {
    // Shield / diamond pattern in center
    const diamond = Math.abs(dx) + Math.abs(dy);
    if (diamond <= 0.55 && diamond >= 0.40) {
      r = 52; g = 211; b = 153; // Emerald-400
    } else if (diamond < 0.40 && diamond >= 0.15) {
      r = 5; g = 150; b = 105; // Emerald-600
    }
  } else if (dist < 0.15) {
    // Center bright core
    r = 167; g = 243; b = 208; // Emerald-200
  }

  return [r, g, b, a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// Generate icons
console.log('Generating PWA assets...');

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, brandPixel));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, brandPixel));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, brandPixel));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64, brandPixel));
fs.writeFileSync(path.join(publicDir, 'splash-screen.png'), createPNG(512, 512, brandPixel));

// SVG Brand Icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="128" fill="#030712"/>
  <circle cx="256" cy="256" r="190" fill="none" stroke="#10b981" stroke-width="16" opacity="0.3"/>
  <polygon points="256,96 384,192 384,336 256,416 128,336 128,192" fill="#047857" stroke="#34d399" stroke-width="12"/>
  <path d="M256 160 L336 220 L336 310 L256 360 L176 310 L176 220 Z" fill="#065f46" stroke="#6ee7b7" stroke-width="8"/>
  <circle cx="256" cy="256" r="32" fill="#a7f3d0"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);
fs.writeFileSync(path.join(publicDir, 'masked-icon.svg'), svg);

console.log('PWA icons successfully generated in public/');
