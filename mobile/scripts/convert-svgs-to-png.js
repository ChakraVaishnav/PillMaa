const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
const files = [
  { src: 'icon.png', w: 1024, h: 1024 },
  { src: 'adaptive-icon.png', w: 432, h: 432 },
  { src: 'favicon.png', w: 48, h: 48 },
  { src: 'notification-icon.png', w: 96, h: 96 },
  { src: 'splash.png', w: 1242, h: 2436 }
];

(async () => {
  for (const f of files) {
    const filePath = path.join(iconsDir, f.src);
    try {
      const svg = await fs.promises.readFile(filePath);
      // sharp can handle SVG buffer and output PNG
      await sharp(svg)
        .resize(f.w, f.h, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(filePath + '.tmp.png');
      await fs.promises.rename(filePath + '.tmp.png', filePath);
      console.log('Converted', f.src);
    } catch (err) {
      console.error('Failed to convert', f.src, err.message);
    }
  }
})();
