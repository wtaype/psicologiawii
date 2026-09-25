// src/feature/personal/modulos/productos/modales.js
// 🪟 Archivo Padre y Orquestador de Modales para el Módulo de Productos
// Re-exporta los modales hijos y se integra con wiModal de @widev

export {
  MODAL_ID,
  inicializarModalProducto,
  abrirModalProducto,
  cerrarModalProducto
} from './modales/modalProducto.js';

export { wiModal, abrirModal, cerrarModal, cerrarTodos } from '@widev';
