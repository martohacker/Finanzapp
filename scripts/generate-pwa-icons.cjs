const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Asegurar que el directorio public existe
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Función para crear un icono
async function createIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#0284c7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0369a1;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad${size})" rx="${size * 0.2}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.3}" fill="rgba(255, 255, 255, 0.2)"/>
      <text x="${size / 2}" y="${size / 2 + size * 0.1}" font-size="${size * 0.5}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">💰</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(publicDir, `pwa-${size}x${size}.png`));
  
  console.log(`✓ Icono ${size}x${size} generado`);
}

async function generateIcons() {
  console.log('Generando iconos PWA...');
  try {
    await createIcon(192);
    await createIcon(512);
    console.log('✓ Todos los iconos generados exitosamente en public/');
  } catch (error) {
    console.error('Error al generar iconos:', error);
    process.exit(1);
  }
}

generateIcons();

