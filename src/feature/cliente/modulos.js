// src/feature/cliente/modulos.js
// Registro y configuración central de módulos para el Feature Cliente (Solgas Surquillo)
// Permite activar/desactivar módulos y definir el módulo por defecto desde un único lugar

export const moduloDefecto = 'pedidos';

export const modulos = [
  { id: 'pedidos',   nombre: 'Pedir gas',    icono: 'fa-solid fa-bolt',             activo: true },
  { id: 'direccion', nombre: 'Direcciones',  icono: 'fa-solid fa-map-location-dot', activo: true, badge: '2' },
  { id: 'cuenta',    nombre: 'Mi cuenta',    icono: 'fa-solid fa-user-gear',        activo: true },
  { id: 'soporte',   nombre: 'Soporte',      icono: 'fa-solid fa-headset',          activo: true }
];

// Obtener solo los módulos habilitados para el sidebar y navegación
export const getModulosActivos = () => modulos.filter(m => m.activo);

// Obtener el módulo por defecto
export const getModuloDefecto = () => moduloDefecto;

// Validar si un módulo existe y está activo
export const esModuloValido = (id) => modulos.some(m => m.activo && m.id === id);
