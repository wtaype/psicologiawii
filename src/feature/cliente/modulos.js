// src/feature/cliente/modulos.js
// Registro y configuración desacoplada del Portal de Clientes
// Gobernado dinámicamente por src/semillas/configurar.js (0ms)
import { configurarCliente, getModulosCliente } from '@/negocio.js';

export const moduloDefecto = configurarCliente.moduloDefecto || 'pedidos';
export const modulos = configurarCliente.modulos || [];

// Obtener solo los módulos habilitados para el sidebar y navegación
export const getModulosActivos = () => getModulosCliente();

// Obtener el módulo por defecto
export const getModuloDefecto = () => moduloDefecto;

// Validar si un módulo existe y está activo
export const esModuloValido = (id) => modulos.some(m => m.activo && m.id === id);
