// src/feature/inicio/lib/whatsapp.js
// 🚀 Motor Centralizado de Mensajes WhatsApp para Gaswii
// Funciona de forma isomórfica (Build-time SSR en Astro + Runtime en Cliente)
// Genera mensajes naturales, directos y amigables según la hora del día sin tecnicismos.

import { datosNegocio } from '../../../negocio.js';

/**
 * Obtiene el saludo dinámico según la hora del día en Perú
 */
export function obtenerSaludoHora() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return 'Buenos días';
  if (hora >= 12 && hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Obtiene el número de WhatsApp canónico (desde caché local o fallback negocio)
 */
export function obtenerNumeroWhatsApp() {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('minegocio');
      if (raw) {
        const cfg = JSON.parse(raw);
        const wa = cfg.contacto?.whatsappLimpio || cfg.contacto?.whatsapp;
        if (wa) return String(wa).replace(/\D/g, '');
      }
    } catch (e) {}
  }
  return datosNegocio.whatsapp || '51936369384';
}

/**
 * Obtiene el nombre del negocio (desde caché local o fallback canónico)
 */
export function obtenerNombreNegocio() {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('minegocio');
      if (raw) {
        const cfg = JSON.parse(raw);
        const nom = cfg.identidad?.nombre;
        if (nom) return nom;
      }
    } catch (e) {}
  }
  return datosNegocio.nombre || 'Solgas Surquillo';
}

/**
 * Genera el texto formateado simple, natural y sin etiquetas técnicas
 */
export function generarMensajeWhatsApp({
  origen = '',
  producto = '',
  precio = null,
  cantidad = 1,
  distrito = '',
  direccion = '',
  cliente = '',
  celular = '',
  metodoPago = '',
  detalle = '',
  notas = '',
  extra = ''
} = {}) {
  const saludo = obtenerSaludoHora();
  const lineas = [];

  const cantTxt = cantidad > 1 ? `${cantidad}x ` : '';
  const precioTxt = precio !== null && precio !== undefined && !isNaN(Number(precio))
    ? ` (S/ ${Number(precio).toFixed(2)})`
    : '';

  // CASO A: Pedido formal desde el Modal Express (con dirección, cliente o pago)
  if (cliente || direccion || metodoPago) {
    lineas.push(`${saludo}, quiero realizar un pedido:`);
    if (cliente) {
      const cel = celular ? ` (📱 ${celular})` : '';
      lineas.push(`👤 Soy: ${cliente}${cel}`);
    }
    if (producto) {
      lineas.push(`📦 ${cantTxt}${producto}${precioTxt}`);
    }
    if (direccion || distrito) {
      const dirCompleta = direccion && distrito 
        ? `${direccion}, ${distrito}` 
        : (direccion || distrito);
      lineas.push(`📍 Entrega: ${dirCompleta}`);
    }
    if (metodoPago) {
      lineas.push(`💳 Pago: ${metodoPago}`);
    }
    if (notas) {
      lineas.push(`📝 Nota: ${notas}`);
    }
    if (extra) {
      lineas.push(extra);
    }
    lineas.push(``);
    lineas.push(`¿Podrían confirmarme el pedido, por favor? ¡Muchas gracias!`);
    return lineas.join('\n');
  }

  // CASO B: Clic directo en tarjeta de producto (Card de Inicio)
  if (producto) {
    lineas.push(`${saludo}. He visto en su página web el ${cantTxt}${producto}${precioTxt}. Quiero realizar el pedido, ¿podrían confirmarme por favor? ¡Muchas gracias!`);
    if (notas) lineas.push(`📝 Nota: ${notas}`);
    if (extra) lineas.push(extra);
    return lineas.join('\n');
  }

  // CASO C: Consulta de sección específica (Balanza, Garantía, FAQ, etc.)
  if (detalle) {
    lineas.push(`${saludo}. He visto en su página web: ${detalle}. Quisiera consultar la atención, ¿podrían confirmarme por favor? ¡Muchas gracias!`);
    return lineas.join('\n');
  }

  // CASO D: Saludo de consulta general
  const nombreNegocio = obtenerNombreNegocio();
  lineas.push(`${saludo}, ${nombreNegocio}. He visto su página web y deseo consultar sobre el pedido de gas a domicilio. ¿Podrían atenderme, por favor? ¡Muchas gracias!`);
  return lineas.join('\n');
}

/**
 * Genera el enlace directo de WhatsApp wa.me codificado
 */
export function crearEnlaceWhatsApp(opciones = {}, numeroPersonalizado = null) {
  const num = numeroPersonalizado ? String(numeroPersonalizado).replace(/\D/g, '') : obtenerNumeroWhatsApp();
  const msg = typeof opciones === 'string' ? opciones : generarMensajeWhatsApp(opciones);
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

export default {
  obtenerSaludoHora,
  obtenerNumeroWhatsApp,
  obtenerNombreNegocio,
  generarMensajeWhatsApp,
  crearEnlaceWhatsApp
};
