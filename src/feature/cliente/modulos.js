// src/feature/cliente/modulos.js
// Registro y configuración desacoplada del Portal de Clientes
// Gobernado dinámicamente por src/semillas/configurar.js (0ms)
import { configurarCliente, getModulosCliente } from '@/negocio.js';

export const moduloDefecto = configurarCliente.moduloDefecto || 'sesiones';
export const modulos = configurarCliente.modulos || [];

// Obtener solo los módulos habilitados para el sidebar y navegación
export const getModulosActivos = () => getModulosCliente();

// Obtener el módulo por defecto
export const getModuloDefecto = () => moduloDefecto;

// Normalizar alias para retrocompatibilidad
export const normalizarModulo = (id) => {
  if (id === 'agendar') return 'pedidos';
  if (id === 'direccion' || id === 'modalidad') return 'sesiones';
  return id;
};

// Validar si un módulo existe y está activo
export const esModuloValido = (id) => {
  const norm = normalizarModulo(id);
  return modulos.some(m => m.activo && m.id === norm);
};
