import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgBuffer = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f291e" />
      <stop offset="100%" stop-color="#040d12" />
    </radialGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="50%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Outer Rounded Mask for Maskable Icon -->
  <rect width="512" height="512" rx="128" fill="url(#bgGlow)"/>
  
  <!-- Outer Glowing Emerald Circle Ring -->
  <circle cx="256" cy="256" r="230" fill="none" stroke="url(#ringGrad)" stroke-width="14" filter="url(#glow)"/>
  <circle cx="256" cy="256" r="215" fill="#0b1320" stroke="#10b981" stroke-width="4"/>

  <!-- Soccer Ball Base (White Sphere) -->
  <circle cx="256" cy="256" r="170" fill="#ffffff" stroke="#0f172a" stroke-width="8"/>

  <!-- Soccer Ball Pentagons & Lines (Dark Navy/Slate) -->
  <!-- Center Pentagon -->
  <polygon points="256,190 308,228 288,288 224,288 204,228" fill="#0f172a"/>

  <!-- Top Pentagon & Connection -->
  <polygon points="256,92 220,135 292,135" fill="#0f172a"/>
  <line x1="256" y1="190" x2="256" y2="135" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
  <line x1="220" y1="135" x2="204" y2="228" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
  <line x1="292" y1="135" x2="308" y2="228" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>

  <!-- Left Polygon & Connection -->
  <polygon points="98,228 140,185 148,248" fill="#0f172a"/>
  <line x1="204" y1="228" x2="148" y2="248" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>

  <!-- Right Polygon & Connection -->
  <polygon points="414,228 372,185 364,248" fill="#0f172a"/>
  <line x1="308" y1="228" x2="364" y2="248" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>

  <!-- Bottom Left Polygon & Connection -->
  <polygon points="140,380 182,345 130,315" fill="#0f172a"/>
  <line x1="224" y1="288" x2="182" y2="345" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>

  <!-- Bottom Right Polygon & Connection -->
  <polygon points="372,380 330,345 382,315" fill="#0f172a"/>
  <line x1="288" y1="288" x2="330" y2="345" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>

  <!-- Bottom Center Polygon & Connection -->
  <polygon points="256,420 224,375 288,375" fill="#0f172a"/>
  <line x1="224" y1="288" x2="224" y2="375" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
  <line x1="288" y1="288" x2="288" y2="375" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>

  <!-- Outer Ball Shadow / Border -->
  <circle cx="256" cy="256" r="170" fill="none" stroke="#040d12" stroke-width="10" opacity="0.8"/>
</svg>
`);

async function generateIcons() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save updated SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgBuffer);

  // Generate PNG 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // Generate PNG 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // Generate Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Generate Favicon 64x64 PNG & 32x32
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  console.log('Successfully generated all PWA PNG icons!');
}

generateIcons().catch(console.error);
