import sharp from 'sharp';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function removeWhiteBackground(data, width, height) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);

      // Pure / near-white → fully transparent
      if (min >= 245) {
        data[i + 3] = 0;
        continue;
      }

      // Soft fringe from anti-aliased white edges
      if (min >= 210 && max - min <= 24) {
        const fade = Math.max(0, 255 - Math.round(((min - 210) / 35) * 255));
        data[i + 3] = Math.min(data[i + 3], fade);
      }
    }
  }
}

async function makeTransparent(pathIn, pathOut) {
  if (!existsSync(pathIn)) {
    console.warn('Skip missing:', pathIn);
    return;
  }

  const { data, info } = await sharp(pathIn)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  removeWhiteBackground(data, info.width, info.height);

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 5 })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(pathOut);

  const meta = await sharp(pathOut).metadata();
  console.log(`Processed ${pathOut} → ${meta.width}x${meta.height}`);
}

const logos = [
  ['public/images/logo.png', 'public/images/logo.png'],
  ['public/images/logo-delivery.png', 'public/images/logo-delivery.png'],
];

for (const [inputRel, outputRel] of logos) {
  await makeTransparent(join(root, inputRel), join(root, outputRel));
}
