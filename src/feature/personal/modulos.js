// src/feature/personal/modulos.js
// Registro y configuración central del Backoffice Personal
// Gobernado dinámicamente por src/semillas/configurar.js (0ms)
import { configurarPersonal, getModulosPersonal } from '@/negocio.js';

export const moduloDefecto = configurarPersonal.moduloDefecto || 'dashboard';
export const modulos = configurarPersonal.modulos || [];

// Obtener solo los módulos habilitados para el sidebar y rutas dinámicas
export const getModulosActivos = () => getModulosPersonal();

// Obtener el módulo por defecto
export const getModuloDefecto = () => moduloDefecto;

// Validar si un módulo existe y está activo
export const esModuloValido = (id) => getModulosPersonal().some(m => m.id === id);
