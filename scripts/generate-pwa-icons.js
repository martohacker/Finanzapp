const fs = require('fs');
const path = require('path');

// Generar iconos PWA básicos usando SVG
// Esto es un fallback si no tienes sharp instalado

const publicDir = path.join(__dirname, '..', 'public');

// Crear SVG simple para el icono
const svg192 = `
<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="192" height="192" fill="url(#grad)" rx="40"/>
  <text x="96" y="120" font-size="96" text-anchor="middle" fill="white">💰</text>
</svg>
`;

const svg512 = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad512)" rx="110"/>
  <text x="256" y="320" font-size="256" text-anchor="middle" fill="white">💰</text>
</svg>
`;

// Nota: Para generar PNG reales, necesitas usar sharp o una herramienta externa
// Por ahora, guardamos SVG que el navegador puede usar
console.log('Generando iconos SVG...');
console.log('NOTA: Para iconos PNG, usa la herramienta en public/create-icons.html o una herramienta online');

fs.writeFileSync(path.join(publicDir, 'pwa-icon-192.svg'), svg192);
fs.writeFileSync(path.join(publicDir, 'pwa-icon-512.svg'), svg512);

console.log('Iconos SVG generados en public/');
console.log('Para crear PNG: usa public/create-icons.html en tu navegador');

