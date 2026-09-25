// src/core/rutas.js
// 🗺️ Enrutador Central de Gaswii (Solgas Surquillo)

export const RUTAS = {
  inicio: '/',
  inicioEn: '/en',
  login: '/login',
  loginEn: '/en/login',
  cliente: '/cliente',
  personal: '/personal'
};

export const ROL_PATH = {
  cliente: '/cliente',
  personal: '/personal',
  gestor: '/personal',
  admin: '/personal'
};

export const NAV_LINKS = [
  { id: 'productos', key: 'nav_products', href: '#productos', icon: 'fa-solid fa-fire-flame-curved' },
  { id: 'pesaje', key: 'nav_weight', href: '#pesaje', icon: 'fa-solid fa-scale-balanced' },
  { id: 'seguridad', key: 'nav_safety', href: '#seguridad', icon: 'fa-solid fa-shield-halved' },
  { id: 'calculadora', key: 'nav_calc', href: '#calculadora', icon: 'fa-solid fa-calculator' },
  { id: 'mapa-sede', key: 'nav_map', href: '#mapa-sede', icon: 'fa-solid fa-location-dot' },
  { id: 'nosotros', key: 'nav_about', href: '#nosotros', icon: 'fa-solid fa-clock-rotate-left' }
];

export default { RUTAS, NAV_LINKS, ROL_PATH };