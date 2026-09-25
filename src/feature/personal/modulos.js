// src/feature/personal/modulos.js
// Registro y configuración central de módulos para el Feature Personal (Solgas Surquillo)
// Permite activar/desactivar módulos y definir el módulo por defecto desde un único lugar

export const moduloDefecto = 'dashboard';

export const modulos = [
  { id: 'dashboard', nombre: 'Dashboard',  icono: 'fa-solid fa-chart-pie',          activo: true },
  { id: 'notepad',   nombre: 'Notepad',    icono: 'fa-solid fa-note-sticky',        activo: true },
  { id: 'negocio',   nombre: 'Mi negocio', icono: 'fa-solid fa-store',              activo: true },
  { id: 'productos', nombre: 'Productos',  icono: 'fa-solid fa-box-archive',        activo: true },
  { id: 'sunat',     nombre: 'SUNAT',      icono: 'fa-solid fa-file-invoice-dollar', activo: true },
  { id: 'correo',    nombre: 'Correo',     icono: 'fa-solid fa-envelope',           activo: true },
  { id: 'galeria',   nombre: 'Galería',    icono: 'fa-solid fa-images',             activo: true },
  { id: 'entradas',  nombre: 'Entradas',   icono: 'fa-solid fa-newspaper',          activo: true },
  { id: 'paginas',   nombre: 'Páginas',    icono: 'fa-solid fa-file-lines',         activo: true },
  { id: 'personal',  nombre: 'Personal',   icono: 'fa-solid fa-users',              activo: true },
  { id: 'clientes',  nombre: 'Clientes',   icono: 'fa-solid fa-address-book',       activo: true, badge: '124' },
  { id: 'whatsapp',  nombre: 'WhatsApp',   icono: 'fa-brands fa-whatsapp',          activo: true },
  { id: 'perfil',    nombre: 'Mi perfil',  icono: 'fa-solid fa-user-gear',          activo: true },
  { id: 'ajustes',   nombre: 'Ajustes',    icono: 'fa-solid fa-gear',               activo: true }
];

// Obtener solo los módulos habilitados para el sidebar y rutas dinámicas
export const getModulosActivos = () => modulos.filter(m => m.activo);

// Obtener el módulo por defecto
export const getModuloDefecto = () => moduloDefecto;

// Validar si un módulo existe y está activo
export const esModuloValido = (id) => modulos.some(m => m.activo && m.id === id);
