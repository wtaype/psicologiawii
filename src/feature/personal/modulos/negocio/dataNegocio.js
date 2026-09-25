// src/feature/personal/modulos/negocio/dataNegocio.js
// 🎯 Capa Canónica Local-First de Negocio: 100% Directo de Firebase Firestore + Caché
// Colección: 'negocio' · Documento: 'principal' · Cero Semillas / Cero Datos Quemados
// Integrado con @widev y Firebase SDK

import { savels, getls, formatearFechaParaInput } from '@widev';

export const STORAGE_KEY = 'minegocio';
export const OLD_STORAGE_KEY = 'gaswii_negocio_config';
export const COLECCION_NEGOCIO = 'negocio';
export const DOC_NEGOCIO_ID = 'principal';

// Parser ultraligero de campos de la REST API de Firestore
export function parseFirestoreDoc(fields = {}) {
  const res = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue !== undefined) res[k] = v.stringValue;
    else if (v.integerValue !== undefined) res[k] = parseInt(v.integerValue, 10);
    else if (v.doubleValue !== undefined) res[k] = parseFloat(v.doubleValue);
    else if (v.booleanValue !== undefined) res[k] = v.booleanValue;
    else if (v.timestampValue !== undefined) res[k] = v.timestampValue;
    else if (v.mapValue) res[k] = parseFirestoreDoc(v.mapValue.fields || {});
    else if (v.arrayValue) res[k] = (v.arrayValue.values || []).map(item => item.mapValue ? parseFirestoreDoc(item.mapValue.fields || {}) : Object.values(item)[0]);
  }
  return res;
}

// Normalizador neutro de estructura (asegura llaves mínimas sin inyectar datos falsos ni semillas)
export function normalizarConfig(c = {}) {
  const cfg = c && typeof c === 'object' ? c : {};
  return {
    id: cfg.id || DOC_NEGOCIO_ID,
    principal: Boolean(cfg.principal ?? true),
    identidad: cfg.identidad ? { ...cfg.identidad } : {},
    contacto: cfg.contacto ? { ...cfg.contacto } : {},
    ubicacion: {
      direccion: cfg.ubicacion?.direccion || '',
      distrito: cfg.ubicacion?.distrito || '',
      ciudad: cfg.ubicacion?.ciudad || '',
      pais: cfg.ubicacion?.pais || 'PE',
      mapsUrl: cfg.ubicacion?.mapsUrl || '',
      coordenadas: {
        lat: Number(cfg.ubicacion?.coordenadas?.lat ?? 0),
        lng: Number(cfg.ubicacion?.coordenadas?.lng ?? 0)
      }
    },
    zonas: Array.isArray(cfg.zonas) ? cfg.zonas : [],
    metricas: cfg.metricas ? { ...cfg.metricas } : {},
    redes: cfg.redes ? { ...cfg.redes } : {},
    seo: {
      titulo: {
        es: cfg.seo?.titulo?.es || '',
        en: cfg.seo?.titulo?.en || ''
      },
      descripcion: {
        es: cfg.seo?.descripcion?.es || '',
        en: cfg.seo?.descripcion?.en || ''
      },
      keywords: {
        es: Array.isArray(cfg.seo?.keywords?.es) ? cfg.seo.keywords.es : (typeof cfg.seo?.keywords?.es === 'string' ? cfg.seo.keywords.es.split(',').map(s => s.trim()).filter(Boolean) : []),
        en: Array.isArray(cfg.seo?.keywords?.en) ? cfg.seo.keywords.en : (typeof cfg.seo?.keywords?.en === 'string' ? cfg.seo.keywords.en.split(',').map(s => s.trim()).filter(Boolean) : [])
      }
    },
    userId: cfg.userId || '',
    email: cfg.email || '',
    autor: cfg.autor || '',
    actualizado: cfg.actualizado || null
  };
}

// Lectura en tiempo de compilación (Astro SSG / Cloudflare Build) directamente desde la REST API de Firestore
let _datosBuildFirestore = null;
if (typeof window === 'undefined') {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const projectId = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || 'psicologiawii';
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/negocio/principal`, {
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      _datosBuildFirestore = parseFirestoreDoc(json.fields || {});
    }
  } catch (err) {
    console.warn('[dataNegocio] Build-time Firestore fetch:', err?.message || err);
  }
}

let _memoriaNegocio = null;

export function getUsuarioActivo() {
  const u = getls('wiSmile') || {};
  return {
    userId: u.uid || u.id || '',
    email: u.email || '',
    autor: u.nombre || u.usuario || ''
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
  return dif > 0 ? `${dif}+` : '1';
}

/**
 * Obtiene los datos oficiales del negocio:
 * 1. Memoria activa en sesión.
 * 2. Caché local persistente (localStorage 'minegocio').
 * 3. En SSG/Build: Datos vivos directo desde Firestore REST API.
 * 4. Neutro si aún no se ha hidratado.
 */
export function obtenerDatosNegocio() {
  if (_memoriaNegocio) {
    return _memoriaNegocio;
  }

  // 1. En el cliente: Revisar caché local primero
  try {
    const local = getls(STORAGE_KEY) || getls(OLD_STORAGE_KEY);
    if (local && typeof local === 'object' && local.identidad && local.identidad.nombre) {
      _memoriaNegocio = normalizarConfig(local);
      return _memoriaNegocio;
    }
  } catch (e) {}

  // 2. En Node (build time de Cloudflare/Astro): usar datos frescos de Firestore REST
  if (_datosBuildFirestore && _datosBuildFirestore.identidad?.nombre) {
    _memoriaNegocio = normalizarConfig(_datosBuildFirestore);
    return _memoriaNegocio;
  }

  // 3. Estructura neutra vacía
  _memoriaNegocio = normalizarConfig({});
  return _memoriaNegocio;
}

/**
 * Guarda en caché local y notifica reactivamente a la UI
 */
export function guardarDatosNegocioLocal(config) {
  try {
    const normalizado = normalizarConfig(config);
    _memoriaNegocio = normalizado;
    savels(STORAGE_KEY, normalizado);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gaswii:negocio-actualizado', { detail: normalizado }));
    }
  } catch (e) {}
}

/**
 * Guarda en caché local y sincroniza en segundo plano con Firestore
 */
export function guardarDatosNegocio(input = {}) {
  const actual = obtenerDatosNegocio();
  const usuario = getUsuarioActivo();

  // Parsear fecha de lanzamiento
  const fechaStr = input.identidad?.lanzamientoFecha || actual.identidad?.lanzamientoFecha || "";
  const yearsCalc = calcularAnosTrayectoria(fechaStr);

  const configActualizada = {
    ...actual,
    id: DOC_NEGOCIO_ID,
    principal: true,
    identidad: {
      ...actual.identidad,
      ...(input.identidad || {}),
      lanzamientoFecha: fechaStr
    },
    contacto: {
      ...actual.contacto,
      ...(input.contacto || {})
    },
    ubicacion: {
      ...actual.ubicacion,
      ...(input.ubicacion || {})
    },
    zonas: Array.isArray(input.zonas) ? input.zonas : (actual.zonas || []),
    metricas: {
      ...actual.metricas,
      ...(input.metricas || {}),
      years: yearsCalc
    },
    redes: {
      ...actual.redes,
      ...(input.redes || {})
    },
    seo: {
      ...actual.seo,
      ...(input.seo || {})
    },
    userId: usuario.userId || actual.userId || '',
    email: usuario.email || actual.email || '',
    autor: usuario.autor || actual.autor || ''
  };

  guardarDatosNegocioLocal(configActualizada);

  // Sincronización en segundo plano con Firestore
  sincronizarNegocioFirestore(configActualizada, fechaStr);

  return configActualizada;
}

// Transforma la fecha a Timestamp nativo y persiste en Firestore
async function sincronizarNegocioFirestore(config, fechaStr) {
  try {
    const { db } = await import('@core/servicios/firebase.js');
    if (!db) return;
    const { doc, setDoc, Timestamp, serverTimestamp } = await import('firebase/firestore');

    let timestampLanzamiento = null;
    if (fechaStr) {
      try {
        timestampLanzamiento = Timestamp.fromDate(new Date(`${fechaStr}T12:00:00`));
      } catch (e) {}
    }

    const payload = {
      id: DOC_NEGOCIO_ID,
      principal: true,
      identidad: {
        ...config.identidad,
        ...(timestampLanzamiento ? { lanzamiento: timestampLanzamiento } : {})
      },
      contacto: config.contacto,
      ubicacion: config.ubicacion,
      zonas: config.zonas,
      metricas: config.metricas,
      redes: config.redes,
      seo: config.seo,
      userId: config.userId,
      email: config.email,
      autor: config.autor,
      actualizado: serverTimestamp()
    };

    // Reemplaza el documento completo en la colección 'negocio'
    await setDoc(doc(db, COLECCION_NEGOCIO, DOC_NEGOCIO_ID), payload);
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
    if (!db) return null;
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
    }
  } catch (err) {
    console.warn('[dataNegocio] Lectura Firestore:', err?.message || err);
  }
  return null;
}

export const consultarNegocioDesdeFirestore = sincronizarDesdeFirestore;
