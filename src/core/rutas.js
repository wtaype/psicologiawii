// src/core/rutas.js
// 🗺️ Enrutador Central del Consultorio Psicológico América
// Conectado a configurarSistema
import { configurarSistema } from '@/semillas/configurar.js';

export const RUTAS = configurarSistema.rutas || {
  inicio: '/',
  inicioEn: '/en',
  login: '/login',
  loginEn: '/en/login',
  cliente: '/cliente',
  personal: '/personal',
  redes: '/redes'
};

export const ROL_PATH = configurarSistema.rutas?.roles || {
  cliente: '/cliente',
  personal: '/personal',
  gestor: '/personal',
  admin: '/personal'
};

export const NAV_LINKS = configurarSistema.navegacion.map(n => ({
  id: n.id,
  key: `nav_${n.id}`,
  href: n.href,
  icon: n.icono.startsWith('fa-') ? n.icono : `fa-solid ${n.icono}`,
  label: n.label
}));

export default { RUTAS, NAV_LINKS, ROL_PATH };
