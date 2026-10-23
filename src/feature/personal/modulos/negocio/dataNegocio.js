// src/feature/personal/modulos/negocio/dataNegocio.js
// 🎯 Capa Canónica Local-First de Negocio: Firestore + Caché Local + Semilla src/semillas/negocio.json
// Colección: 'negocio' · Documento: 'principal'
// Integrado con @widev y Firebase SDK

import { savels, getls, formatearFechaParaInput } from '@widev';
import negocioSemilla from '../../../../semillas/negocio.json';
import { actualizarCentral } from '@core/servicios/actualizar.js';

export const STORAGE_KEY = 'wi_negocio';
export const OLD_STORAGE_KEY = 'minegocio';
export const COLECCION_NEGOCIO = 'negocio';
export const DOC_NEGOCIO_ID = 'principal';

// 1. Lector canónico de semilla inicial de despegue (lee src/semillas/negocio.json)
export function obtenerSemillaLocal() {
  return negocioSemilla && typeof negocioSemilla === 'object' ? negocioSemilla : null;
}

// 2. Importación y re-exportación canónica desde la fachada oficial @/negocio.js
import {
  parseFirestoreDoc,
  normalizarConfig,
  obtenerDatosNegocio,
  obtenerNegocioLocal
} from '@/negocio.js';

export {
  parseFirestoreDoc,
  normalizarConfig,
  obtenerDatosNegocio,
  obtenerNegocioLocal
};

let _memoriaNegocio = null;

import { auth } from '@core/servicios/firebase.js';

export function getUsuarioActivo() {
  let smile = null;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('wiSmile') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      smile = parsed?.value || parsed;
    }
  } catch (e) {}

  if (!smile) {
    try {
      smile = getls('wiSmile') || getls('wi_usuario') || getls('usuario') || {};
    } catch (e) {}
  }

  const authUser = auth?.currentUser;
  const uid = authUser?.uid || smile?.uid || smile?.id || smile?.userId || '';
  const email = authUser?.email || smile?.email || '';
  const nombre = authUser?.displayName || smile?.nombre || smile?.usuario || '';

  return {
    userId: uid,
    uid: uid,
    email: email,
    autor: nombre,
    rol: smile?.rol || 'personal'
  };
}

// Calcula los años de experiencia automáticamente a partir de una fecha YYYY-MM-DD o Timestamp
export function calcularAnosTrayectoria(fechaInput) {
  if (!fechaInput) return '';
  let dateObj = null;

  if (fechaInput?.seconds) {
    dateObj = new Date(fechaInput.seconds * 1000);
  } else if (typeof fechaInput === 'string') {
    dateObj = new Date(fechaInput.includes('T') ? fechaInput : `${fechaInput}T12:00:00`);
  } else if (fechaInput instanceof Date) {
    dateObj = fechaInput;
  }

  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const dif = new Date().getFullYear() - dateObj.getFullYear();
  return dif > 0 ? `${dif}` : '';
}

/**
 * Guarda en caché local y notifica reactivamente a la UI
 */
export function guardarDatosNegocioLocal(config) {
  try {
    const normalizado = normalizarConfig(config);
    _memoriaNegocio = normalizado;
    savels(STORAGE_KEY, normalizado);
    savels(OLD_STORAGE_KEY, normalizado);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi:negocio-actualizado', { detail: normalizado }));
    }
  } catch (e) {}
}

/**
 * Guarda en caché local y sincroniza directamente con Firestore
 */
export function guardarDatosNegocio(input = {}) {
  const actual = obtenerDatosNegocio();
  const usuario = getUsuarioActivo();

  // Parsear fecha de lanzamiento/fundación
  const fechaStr = input.identidad?.lanzamientoFecha || actual.identidad?.lanzamientoFecha || "";
  const yearsCalc = calcularAnosTrayectoria(fechaStr);

  const ahoraSec = Math.floor(Date.now() / 1000);
  const timestampActual = { seconds: ahoraSec, nanoseconds: 0 };
  const creadoPrevio = input.creado || actual.creado || timestampActual;

  const configActualizada = {
    ...actual,
    id: DOC_NEGOCIO_ID,
    principal: true,
    userId: usuario.userId || actual.userId || '',
    creado: creadoPrevio,
    actualizado: timestampActual,
    moneda: input.moneda || actual.moneda || 'PEN',
    langPrincipal: input.langPrincipal || actual.langPrincipal || 'es',
    langs: input.langs || actual.langs || ['es', 'en'],
    idiomaPrincipal: input.langPrincipal || actual.langPrincipal || 'es',
    idiomas: input.langs || actual.langs || ['es', 'en'],
    titulo: input.titulo || actual.titulo || '',
    subtitulo: input.subtitulo ?? actual.subtitulo ?? '',
    hero: {
      ...actual.hero,
      ...(input.hero || {})
    },
    identidad: {
      ...actual.identidad,
      ...(input.identidad || {}),
      colegiatura: String(input.identidad?.colegiatura || actual.identidad?.colegiatura || '49425').replace(/[^0-9]/g, '') || '49425',
      lanzamientoFecha: fechaStr
    },
    contacto: {
      ...actual.contacto,
      ...(input.contacto || {})
    },
    horarios: {
      ...actual.horarios,
      ...(input.horarios || {})
    },
    ubicacion: {
      ...actual.ubicacion,
      ...(input.ubicacion || {})
    },
    zonas: Array.isArray(input.zonas) ? input.zonas : (actual.zonas || []),
    sedes: Array.isArray(input.sedes) ? input.sedes : (actual.sedes || []),
    metricas: {
      ...actual.metricas,
      ...(input.metricas || {}),
      colegiatura: String(input.identidad?.colegiatura || actual.identidad?.colegiatura || '49425').replace(/[^0-9]/g, '') || '49425',
      years: yearsCalc ? `${yearsCalc}+` : (input.metricas?.years || actual.metricas?.years || '')
    },
    redes: {
      ...actual.redes,
      ...(input.redes || {})
    },
    redesOrden: Array.isArray(input.redesOrden) ? input.redesOrden : (actual.redesOrden || []),
    seo: {
      ...actual.seo,
      ...(input.seo || {})
    }
  };

  // Limpiar campos obsoletos o redundantes
  delete configActualizada.email;
  delete configActualizada.autor;
  if (configActualizada.contacto) {
    delete configActualizada.contacto.whatsappMensaje;
  }
  if (configActualizada.identidad) {
    delete configActualizada.identidad.lanzamiento;
    delete configActualizada.identidad.subtitulo;
  }

  // Normalización oficial Workwii y actualización de memoria volátil inmediata
  const normalizado = normalizarConfig(configActualizada);
  _memoriaNegocio = normalizado;
  guardarDatosNegocioLocal(normalizado);

  // Delegar actualización universal al motor central Zero-Waste (Local-First + Firestore + Debounced Deploy)
  actualizarCentral({
    modulo: 'negocio',
    coleccion: COLECCION_NEGOCIO,
    docId: DOC_NEGOCIO_ID,
    storageKey: STORAGE_KEY,
    evento: 'wi:negocio-actualizado',
    datos: normalizado,
    redeploy: true,
    mensajeExito: 'Ficha de negocio actualizada con éxito'
  });

  return normalizado;
}

// Persiste de forma limpia en Firestore
async function sincronizarNegocioFirestore(config, fechaStr) {
  try {
    const { db } = await import('@core/servicios/firebase.js');
    if (!db) return;
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

    const identidadLimpia = { ...(config.identidad || {}) };
    delete identidadLimpia.lanzamiento;
    delete identidadLimpia.subtitulo;

    const metricasLimpias = {
      clientes: config.metricas?.clientes || '',
      balanza: config.metricas?.balanza || '',
      years: config.metricas?.years || '',
      dias: config.metricas?.dias || ''
    };

    const payload = {
      id: DOC_NEGOCIO_ID,
      principal: true,
      moneda: config.moneda || 'PEN',
      langPrincipal: config.langPrincipal || 'es',
      langs: Array.isArray(config.langs) ? config.langs : ['es', 'en'],
      idiomaPrincipal: config.langPrincipal || 'es',
      idiomas: Array.isArray(config.langs) ? config.langs : ['es', 'en'],
      titulo: config.titulo || '',
      subtitulo: config.subtitulo || '',
      hero: config.hero || {},
      identidad: identidadLimpia,
      contacto: config.contacto || {},
      horarios: config.horarios || {},
      ubicacion: config.ubicacion || {},
      zonas: Array.isArray(config.zonas) ? config.zonas : [],
      sedes: config.sedes || [],
      metricas: metricasLimpias,
      redes: config.redes || {},
      redesOrden: Array.isArray(config.redesOrden) ? config.redesOrden : [],
      seo: config.seo || {},
      userId: config.userId || '',
      actualizado: serverTimestamp()
    };

    // Reemplaza el documento completo en la colección 'negocio' -> 'principal'
    await setDoc(doc(db, COLECCION_NEGOCIO, DOC_NEGOCIO_ID), payload, { merge: true });
  } catch (err) {
    console.warn('[dataNegocio] Sincronización diferida Firestore:', err?.message || err);
  }
}

/**
 * Carga datos frescos desde Firestore en cliente y actualiza la caché local
 */
export async function sincronizarDesdeFirestore() {
  try {
    const { db } = await import('@core/servicios/firebase.js');
    if (!db) return normalizarConfig(obtenerSemillaLocal());
    const { doc, getDoc } = await import('firebase/firestore');

    const snap = await getDoc(doc(db, COLECCION_NEGOCIO, DOC_NEGOCIO_ID));
    if (snap.exists()) {
      const data = snap.data();
      let fechaLanz = "";
      if (data.identidad?.lanzamiento) {
        fechaLanz = formatearFechaParaInput(data.identidad.lanzamiento);
      } else if (data.identidad?.lanzamientoFecha) {
        fechaLanz = data.identidad.lanzamientoFecha;
      }
      const normalizado = normalizarConfig({
        ...data,
        identidad: {
          ...data.identidad,
          lanzamientoFecha: fechaLanz
        }
      });
      guardarDatosNegocioLocal(normalizado);
      return normalizado;
    } else {
      // Documento aún no creado en Firestore: Usar semilla de infoNegocio.json
      const semilla = normalizarConfig(obtenerSemillaLocal());
      return semilla;
    }
  } catch (err) {
    console.warn('[dataNegocio] Lectura Firestore:', err?.message || err);
  }
  return normalizarConfig(obtenerSemillaLocal());
}

export const consultarNegocioDesdeFirestore = sincronizarDesdeFirestore;
