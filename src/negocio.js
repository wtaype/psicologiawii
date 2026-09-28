// src/negocio.js
// 🎯 Fachada Canónica y Reactiva de Negocio y Servicios (Consultorio Psicológico América)
// Fuente Primaria: Base de Datos Firestore ('negocio/principal' y 'servicios')
// Único Fallback: src/infoNegocio.json y src/infoServicios.json (fuera de Git)

import infoServicios from './infoServicios.json';
import { obtenerDatosNegocio, parseFirestoreDoc } from './feature/personal/modulos/negocio/dataNegocio.js';

/**
 * Normaliza cualquier documento de Firestore para servicios/talleres
 */
export function normalizarProductoFirestore(docRaw = {}) {
  const item = parseFirestoreDoc(docRaw.fields || {});
  const id = item.id || (docRaw.name ? docRaw.name.split('/').pop() : '');
  const precio = Number(item.precioPEN ?? item.precio ?? item.price ?? 85);
  
  return {
    id,
    tipo: item.tipo || 'psicologia',
    nombre: typeof item.nombre === 'object' && item.nombre !== null ? (item.nombre.es || '') : (item.nombre || ''),
    nombreEn: typeof item.nombre === 'object' && item.nombre !== null ? (item.nombre.en || '') : (item.nombreEn || ''),
    descripcion: typeof item.descripcion === 'object' && item.descripcion !== null ? (item.descripcion.es || '') : (item.descripcion || ''),
    descripcionEn: typeof item.descripcion === 'object' && item.descripcion !== null ? (item.descripcion.en || '') : (item.descripcionEn || ''),
    precioPEN: precio,
    duracion: typeof item.duracion === 'object' && item.duracion !== null ? (item.duracion.es || '') : (item.duracion || ''),
    duracionEn: typeof item.duracion === 'object' && item.duracion !== null ? (item.duracion.en || '') : (item.duracionEn || ''),
    enfoque: item.enfoque || '',
    publico: typeof item.publico === 'object' && item.publico !== null ? (item.publico.es || '') : (item.publico || ''),
    publicoEn: typeof item.publico === 'object' && item.publico !== null ? (item.publico.en || '') : (item.publicoEn || ''),
    modalidad: typeof item.modalidad === 'object' && item.modalidad !== null ? (item.modalidad.es || '') : (item.modalidad || ''),
    modalidadEn: typeof item.modalidad === 'object' && item.modalidad !== null ? (item.modalidad.en || '') : (item.modalidadEn || ''),
    garantias: Array.isArray(item.garantias?.es) ? item.garantias.es : (Array.isArray(item.garantias) ? item.garantias : []),
    garantiasEn: Array.isArray(item.garantias?.en) ? item.garantias.en : (Array.isArray(item.garantiasEn) ? item.garantiasEn : []),
    imagen: item.imagen || '',
    badge: typeof item.badge === 'object' && item.badge !== null ? (item.badge.es || '') : (item.badge || ''),
    badgeEn: typeof item.badge === 'object' && item.badge !== null ? (item.badge.en || '') : (item.badgeEn || ''),
    tagClase: item.tagClase || 'badge-serenidad',
    orden: Number(item.orden ?? 1),
    activo: Boolean(item.activo ?? true)
  };
}

let _serviciosBuildFirestore = Array.isArray(infoServicios) ? infoServicios : [];

export async function consultarProductosFirestoreFresco() {
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('psicologia_servicios');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const projectId = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || 'psicologiawii';
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/servicios`, {
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.documents) && json.documents.length > 0) {
        const prods = json.documents
          .map(d => normalizarProductoFirestore(d))
          .sort((a, b) => (a.orden || 999) - (b.orden || 999));
        _serviciosBuildFirestore = prods;
        return prods;
      }
    }
  } catch (err) {
    // Si la colección aún no existe en Firestore, usamos el fallback directo de infoServicios.json
  }

  return _serviciosBuildFirestore;
}

if (typeof window === 'undefined') {
  await consultarProductosFirestoreFresco();
}

export const datosNegocio = {
  get raw() { return obtenerDatosNegocio(); },
  get nombre() { return this.raw.identidad?.nombre || ''; },
  get nombreCorto() { return this.raw.identidad?.nombreCorto || ''; },
  get razonSocial() { return this.nombre; },
  get especialista() { return this.raw.identidad?.especialista || ''; },
  get colegiatura() { return this.raw.identidad?.colegiatura || ''; },
  get registroColegio() { return `${this.colegiatura} · Colegiada y Habilitada`; },
  get titulo() { return this.raw.identidad?.titulo || ''; },
  get grado() { return this.raw.identidad?.grado || ''; },
  get enfoques() { return this.raw.identidad?.enfoques || ''; },
  get bio() { return this.raw.identidad?.bio || ''; },
  get logo() { return this.raw.identidad?.logo || ''; },
  get logoCircle() { return this.logo; },
  get logoFull() { return this.raw.identidad?.logoFull || '/imgwii/logo_full.webp'; },
  get fotoEspecialista() { return this.raw.identidad?.imagenSede || ''; },
  get imagenSede() { return this.fotoEspecialista; },
  get experienciaAnos() { return this.raw.metricas?.years || '6+'; },
  get moneda() { return this.raw.moneda || 'PEN'; },
  get telefono() { return this.raw.contacto?.telefono || ''; },
  get telefonoMostrado() { return this.telefono; },
  get telefonoLimpio() { return (this.telefono || '').replace(/\D/g, ''); },
  get whatsapp() { return this.raw.contacto?.whatsapp || (this.telefono || '').replace(/\D/g, ''); },
  get whatsappLimpio() { return (this.whatsapp || '').replace(/\D/g, ''); },
  get colegiaturaNumero() { return (this.colegiatura || '').replace(/\D/g, '') || '49425'; },
  get whatsappMensaje() {
    const m = this.raw.contacto?.whatsappMensaje;
    return typeof m === 'object' && m !== null ? (m.es || '') : (m || '');
  },
  get whatsappMensajeEn() {
    const m = this.raw.contacto?.whatsappMensaje;
    return typeof m === 'object' && m !== null ? (m.en || '') : (this.raw.contacto?.whatsappMensajeEn || '');
  },
  getWhatsappMensaje(idioma = 'es') {
    const m = this.raw.contacto?.whatsappMensaje;
    if (typeof m === 'object' && m !== null) return m[idioma] || m.es || '';
    return idioma === 'en' ? (this.raw.contacto?.whatsappMensajeEn || m || '') : (m || '');
  },
  get email() { return this.raw.contacto?.email || ''; },
  get direccionSede() { return this.raw.ubicacion?.direccion || ''; },
  get distritoSede() { return this.raw.ubicacion?.distrito || 'Villa El Salvador'; },
  get ciudad() { return this.raw.ubicacion?.ciudad || 'Lima'; },
  get pais() { return this.raw.ubicacion?.pais || 'PE'; },
  get codigoPostal() { return this.raw.ubicacion?.codigoPostal || '15834'; },
  get mapsUrl() { return this.raw.ubicacion?.mapsUrl || ''; },
  get coordenadas() { return this.raw.ubicacion?.coordenadas || { lat: -12.2084, lng: -76.9387 }; },
  get horario() {
    const h = this.raw.contacto?.horario;
    return typeof h === 'object' && h !== null ? (h.es || '') : (h || '');
  },
  get horarioEn() {
    const h = this.raw.contacto?.horario;
    return typeof h === 'object' && h !== null ? (h.en || '') : (this.raw.contacto?.horarioEn || '');
  },
  getHorario(idioma = 'es') {
    const h = this.raw.contacto?.horario;
    if (typeof h === 'object' && h !== null) return h[idioma] || h.es || '';
    return idioma === 'en' ? (this.raw.contacto?.horarioEn || h || '') : (h || '');
  },
  get horarios() { return this.raw.horarios || {}; },
  get finanzas() { return {}; },
  get tarifas() { return {}; },
  get sedes() {
    const rawSedes = Array.isArray(this.raw.sedes) ? this.raw.sedes : [];
    return rawSedes.map(s => {
      const atencionEs = typeof s.atencion === 'object' && s.atencion !== null ? s.atencion.es : (s.atencion || '');
      const atencionEn = typeof s.atencion === 'object' && s.atencion !== null ? s.atencion.en : (s.atencionEn || atencionEs);
      const tagEs = typeof s.tag === 'object' && s.tag !== null ? s.tag.es : (s.tag || s.nombre || '');
      const tagEn = typeof s.tag === 'object' && s.tag !== null ? s.tag.en : (s.tagEn || tagEs);
      return {
        ...s,
        atencion: atencionEs,
        atencionEn,
        tag: tagEs,
        tagEn
      };
    });
  },
  get distritos() {
    return this.sedes.map(s => ({
      id: s.id || s.nombre?.toLowerCase().replace(/\s+/g, '-'),
      nombre: s.nombre,
      tiempo: s.modalidad || s.atencion || '',
      tag: s.modalidad || s.tag || '',
      tagEn: s.modalidad === 'Virtual' ? 'Online' : 'In-Person'
    }));
  },
  get metricas() { return this.raw.metricas || {}; },
  get productos() {
    return _serviciosBuildFirestore && _serviciosBuildFirestore.length > 0 ? _serviciosBuildFirestore : infoServicios;
  },
  get servicios() {
    return this.productos.filter(p => !p.tipo || p.tipo === 'psicologia');
  },
  get talleres() {
    return this.productos.filter(p => p.tipo === 'taller');
  },
  get todosServicios() {
    return this.productos;
  },
  get seo() { return this.raw.seo || null; },
  get mediosPago() {
    return [
      { id: 'efectivo', nombre: 'Efectivo', icon: 'fa-money-bill-wave', desc: 'Pago en consultorio' },
      { id: 'yape', nombre: 'Yape', icon: 'fa-mobile-screen-button', desc: 'Billetera digital' },
      { id: 'plin', nombre: 'Plin', icon: 'fa-mobile-screen-button', desc: 'Billetera digital' },
      { id: 'transferencia', nombre: 'Transferencia Bancaria', icon: 'fa-building-columns', desc: 'BCP y otros bancos' }
    ];
  }
};

export const MEDIOS_PAGO_BASE = datosNegocio.mediosPago;

export default datosNegocio;