// src/feature/personal/modulos/whatsapp/lib/dataWhatsapp.js
// 📦 Centro de Colecciones y Motor Reactivo de WhatsApp (Local-First)
// Fuente única de la verdad para Canales Web y Plantillas de Despacho
import whatsappSemilla from '@/semillas/whatsapp.json';
import productosSemilla from '@/semillas/productos.json';
import { datosNegocio } from '@/negocio.js';
import { 
  obtenerSaludoHora, 
  sanitizarEspaciado, 
  interpolarTexto, 
  construirUrlWhatsapp 
} from './formateador.js';

const STORAGE_KEY = 'wi_whatsapp_config';

/**
 * Obtiene la colección completa (Local-First desde localStorage con fallback a la semilla)
 * Con purgado proactivo de registros residuales de gas/glp.
 */
export function obtenerColeccion() {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.canalesWeb) && Array.isArray(parsed.plantillas)) {
          const esResidualGas = parsed.canalesWeb.some(c => 
            c.id === 'canal_catalogo_producto' || 
            c.id === 'canal_modal_express' ||
            /gas|balon|glp|click-on|balanza/i.test(c.formatoMensaje || '')
          );
          const tieneCanalesClinicos = parsed.canalesWeb.some(c => c.id === 'canal_servicio_consulta');
          if (!esResidualGas && tieneCanalesClinicos) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Error leyendo wi_whatsapp_config de localStorage:', e);
    }
  }
  const fresca = JSON.parse(JSON.stringify(whatsappSemilla));
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fresca)); } catch(e){}
  }
  return fresca;
}

/**
 * Guarda la colección en localStorage y notifica en caliente mediante evento personalizado
 */
export function guardarColeccion(nuevaColeccion) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaColeccion));
      window.dispatchEvent(new CustomEvent('wi:whatsapp-actualizado', { detail: nuevaColeccion }));
      return true;
    } catch (e) {
      console.error('Error guardando wi_whatsapp_config:', e);
      return false;
    }
  }
  return false;
}

/**
 * Restaura la colección a los valores por defecto de la semilla canónica
 */
export function restaurarColeccion() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      const clon = JSON.parse(JSON.stringify(whatsappSemilla));
      window.dispatchEvent(new CustomEvent('wi:whatsapp-actualizado', { detail: clon }));
      return clon;
    } catch (e) {
      console.error('Error restaurando wi_whatsapp_config:', e);
    }
  }
  return JSON.parse(JSON.stringify(whatsappSemilla));
}

/**
 * Obtiene el número de teléfono oficial configurado para recibir pedidos
 */
export function obtenerTelefonoOficial() {
  const col = obtenerColeccion();
  if (col.telefonoOficial) {
    return String(col.telefonoOficial).replace(/\D/g, '');
  }
  return String(datosNegocio?.whatsapp || datosNegocio?.whatsappLimpio || '51960332958').replace(/\D/g, '');
}

/**
 * Obtiene un canal web por su ID ('canal_catalogo_producto', 'canal_modal_express', etc.)
 */
export function obtenerCanal(canalId) {
  const col = obtenerColeccion();
  return col.canalesWeb?.find(c => c.id === canalId) || null;
}

/**
 * Formatea el mensaje dinámico para un canal web específico
 */
export function formatearCanal(canalId, datos = {}) {
  const canal = obtenerCanal(canalId) || (datos?.id ? datos : null);
  const plantillaBase = datos.formatoMensaje || canal?.formatoMensaje || '';

  const nombreNegocio = datosNegocio?.identidad?.nombreCorto || datosNegocio?.identidad?.nombre || datosNegocio?.nombre || 'Consultorio Psicológico América';
  const prodObj = productosSemilla?.[0];
  const prodDefault = typeof prodObj?.nombre === 'object' ? (prodObj.nombre.es || prodObj.nombre.en) : (prodObj?.nombre || 'Psicoterapia Individual (TCC)');
  const precioDefault = prodObj?.precioPEN || prodObj?.precio || 85;

  const extractString = (val, fallback = '') => {
    if (!val) return fallback;
    if (typeof val === 'object') return val.es || val.en || fallback;
    return String(val);
  };

  const servicioNom = extractString(datos.servicio || datos.producto, prodDefault);
  const precioFormateado = datos.precio !== undefined && datos.precio !== null && !isNaN(Number(datos.precio))
    ? Number(datos.precio).toFixed(2)
    : (datos.precio || String(precioDefault));
  const totalFormateado = datos.total !== undefined && datos.total !== null && !isNaN(Number(datos.total))
    ? Number(datos.total).toFixed(2)
    : (precioFormateado || '85.00');

  const merge = {
    saludo: obtenerSaludoHora(),
    nombreNegocio: nombreNegocio,
    servicio: servicioNom,
    producto: servicioNom,
    taller: extractString(datos.taller, 'Taller de Inteligencia Emocional & Manejo del Estrés'),
    duracion: extractString(datos.duracion, '4 sesiones (Sábados 4:00 pm)'),
    publico: extractString(datos.publico, 'Jóvenes y Adultos'),
    inversion: datos.inversion || precioFormateado,
    modalidad: datos.modalidad || 'Presencial / Online (Google Meet)',
    precio: precioFormateado,
    total: totalFormateado,
    cantidad: datos.cantidad || 4,
    cliente: datos.cliente || 'Consultante',
    celular: datos.celular || '',
    direccion: datos.direccion || datosNegocio?.ubicacion?.direccion || 'Av. Separadora Industrial',
    distrito: datos.distrito || datosNegocio?.ubicacion?.distrito || 'Villa El Salvador',
    ...datos
  };

  return interpolarTexto(plantillaBase, merge);
}

/**
 * Genera el enlace wa.me completo para un canal web
 */
export function crearUrlCanal(canalId, datos = {}, telefonoPersonalizado = null) {
  const mensaje = formatearCanal(canalId, datos);
  const telefono = telefonoPersonalizado || obtenerTelefonoOficial();
  return construirUrlWhatsapp(mensaje, telefono);
}

/**
 * Obtiene la lista de plantillas operativas de despacho
 */
export function obtenerPlantillasDespacho() {
  const col = obtenerColeccion();
  return col.plantillas || [];
}

/**
 * Obtiene una plantilla de despacho por su ID
 */
export function obtenerPlantillaDespacho(plantillaId) {
  const plantillas = obtenerPlantillasDespacho();
  return plantillas.find(p => p.id === plantillaId) || plantillas[0] || null;
}

/**
 * Formatea una plantilla de despacho para el simulador de smartphone o envío directo
 */
export function formatearPlantillaDespacho(plantillaId, datos = {}) {
  const tpl = obtenerPlantillaDespacho(plantillaId);
  if (!tpl) return '';

  const nombreNegocio = datosNegocio?.identidad?.nombreCorto || datosNegocio?.identidad?.nombre || datosNegocio?.nombre || 'Consultorio Psicológico América';
  const prodObj = productosSemilla?.[0];
  const prodDefault = typeof prodObj?.nombre === 'object' ? (prodObj.nombre.es || prodObj.nombre.en) : (prodObj?.nombre || 'Psicoterapia Individual (TCC)');
  const dirDefault = datosNegocio?.ubicacion?.direccion || 'Av. Separadora Industrial / Google Meet';
  const distDefault = datosNegocio?.ubicacion?.distrito || 'Villa El Salvador';

  const extractString = (val, fallback = '') => {
    if (!val) return fallback;
    if (typeof val === 'object') return val.es || val.en || fallback;
    return String(val);
  };

  const defaults = {
    saludo: obtenerSaludoHora(),
    nombreNegocio: nombreNegocio,
    cliente: 'Camila Valdivia',
    pedidoId: 'CITA-101',
    codigo: 'CITA-101',
    servicio: extractString(datos.servicio || datos.producto, prodDefault),
    producto: extractString(datos.producto || datos.servicio, prodDefault),
    monto: '85.00',
    precio: '85.00',
    fecha: 'Sábado 24 de Octubre',
    hora: '10:00 am',
    modalidad: 'Presencial / Online (Google Meet)',
    lugar: dirDefault,
    direccion: dirDefault,
    distrito: distDefault,
    tiempoEstimado: 'Sesión de 50 minutos'
  };

  const merge = { ...defaults, ...datos };
  return interpolarTexto(tpl.mensaje, merge);
}

// ── COMPATIBILIDAD CON CÓDIGO PREVIO ──
export const PLANTILLAS_WHATSAPP = Array.isArray(whatsappSemilla?.plantillas) ? whatsappSemilla.plantillas : [];
export function formatearPlantilla(textoBase, valores = {}) {
  const merge = {
    saludo: obtenerSaludoHora(),
    nombreNegocio: datosNegocio?.nombre || '',
    ...valores
  };
  return interpolarTexto(textoBase, merge);
}

export default {
  obtenerColeccion,
  guardarColeccion,
  restaurarColeccion,
  obtenerTelefonoOficial,
  obtenerCanal,
  formatearCanal,
  crearUrlCanal,
  obtenerPlantillasDespacho,
  obtenerPlantillaDespacho,
  formatearPlantillaDespacho,
  PLANTILLAS_WHATSAPP,
  formatearPlantilla
};
