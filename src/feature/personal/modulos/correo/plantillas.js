// src/feature/personal/modulos/correo/plantillas.js
// 🌟 Archivo Padre / Barril: Unifica y re-exporta todas las plantillas de correo
// Arquitectura modular y limpia · 100% JS Nativo

export { mdToEmailHtml } from './plantillas/parser.js';
export { envoltorioBase } from './plantillas/base.js';
export { generarPlantillaPedido } from './plantillas/pedidos.js';
export { generarPlantillaComprobante } from './plantillas/comprobantes.js';
export { generarPlantillaCotizacion } from './plantillas/cotizacion.js';
export { generarPlantillaLibre } from './plantillas/mensajes.js';
