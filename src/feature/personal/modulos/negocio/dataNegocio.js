// src/feature/personal/modulos/negocio/dataNegocio.js
// 🎯 Capa Canónica Local-First de Negocio: Firestore + Caché Local + Semilla Portátil
// Colección: 'negocio' · Documento: 'principal'
// Integrado con @widev y Firebase SDK

import { savels, getls, formatearFechaParaInput } from '@widev';

export const STORAGE_KEY = 'minegocio';
export const OLD_STORAGE_KEY = 'gaswii_negocio_config';
export const COLECCION_NEGOCIO = 'negocio';
export const DOC_NEGOCIO_ID = 'principal';

// 1. Lector seguro de semilla.json local (ignorado en git, puente frontend -> base de datos)
export function obtenerSemillaLocal() {
  try {
    const semillas = import.meta.glob('./semilla*.json', { eager: true });
    for (const ruta in semillas) {
      if (ruta.includes('semilla.json')) {
        const data = semillas[ruta].default || semillas[ruta];
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          return data;
        }
      }
    }
  } catch (e) {
    console.warn('[dataNegocio] Fallback al leer semilla:', e?.message || e);
  }
  return null;
}

// 2. Parser ultraligero de campos de la REST API de Firestore
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

// 3. Normalizador neutro y portable para Psicología / Salud Clínica
export function normalizarConfig(c = {}) {
  const cfg = c && typeof c === 'object' ? c : {};
  const semilla = obtenerSemillaLocal() || {};

  return {
    id: cfg.id || semilla.id || DOC_NEGOCIO_ID,
    principal: Boolean(cfg.principal ?? true),
    identidad: {
      nombre: cfg.identidad?.nombre || semilla.identidad?.nombre || 'Consultorio Psicológico América',
      nombreCorto: cfg.identidad?.nombreCorto || semilla.identidad?.nombreCorto || 'Psicología América',
      especialista: cfg.identidad?.especialista || semilla.identidad?.especialista || 'Lic. Sofia Reynaga Pachas',
      colegiatura: cfg.identidad?.colegiatura || semilla.identidad?.colegiatura || 'C.Ps.P. N° 49425',
      titulo: cfg.identidad?.titulo || semilla.identidad?.titulo || 'Licenciada en Psicología',
      grado: cfg.identidad?.grado || semilla.identidad?.grado || 'Maestrista en Psicología Clínica',
      enfoques: cfg.identidad?.enfoques || semilla.identidad?.enfoques || 'Terapia Cognitivo-Conductual (TCC) • ACT • Psicopedagogía',
      bio: cfg.identidad?.bio || semilla.identidad?.bio || '',
      lanzamientoFecha: cfg.identidad?.lanzamientoFecha || semilla.identidad?.lanzamientoFecha || '2021-06-08',
      logo: cfg.identidad?.logo || semilla.identidad?.logo || '/imgwii/logo.webp',
      imagenSede: cfg.identidad?.imagenSede || semilla.identidad?.imagenSede || '/imgwii/hero/psicologa-sofia-reynaga.webp'
    },
    contacto: {
      telefono: cfg.contacto?.telefono || semilla.contacto?.telefono || '+51 960 332 958',
      telefonoLimpio: cfg.contacto?.telefonoLimpio || semilla.contacto?.telefonoLimpio || '960332958',
      whatsapp: cfg.contacto?.whatsapp || semilla.contacto?.whatsapp || '51960332958',
      email: cfg.contacto?.email || semilla.contacto?.email || 'reynaga.psychologist@gmail.com',
      whatsappMensaje: cfg.contacto?.whatsappMensaje || semilla.contacto?.whatsappMensaje || '¡Hola Lic. Sofia Reynaga! Deseo agendar una consulta psicológica.',
      horario: cfg.contacto?.horario || semilla.contacto?.horario || 'Lunes a Sábado: 8:00 a.m. a 8:00 p.m.',
      horarioEn: cfg.contacto?.horarioEn || semilla.contacto?.horarioEn || 'Monday to Saturday: 8:00 a.m. to 8:00 p.m.'
    },
    ubicacion: {
      direccion: cfg.ubicacion?.direccion || semilla.ubicacion?.direccion || 'Av. Alfredo Benavides 620, Miraflores, Lima',
      distrito: cfg.ubicacion?.distrito || semilla.ubicacion?.distrito || 'Miraflores',
      ciudad: cfg.ubicacion?.ciudad || semilla.ubicacion?.ciudad || 'Lima',
      pais: cfg.ubicacion?.pais || semilla.ubicacion?.pais || 'PE',
      mapsUrl: cfg.ubicacion?.mapsUrl || semilla.ubicacion?.mapsUrl || 'https://maps.google.com/?q=Av.+Alfredo+Benavides+620+Miraflores+Lima',
      coordenadas: {
        lat: Number(cfg.ubicacion?.coordenadas?.lat ?? (semilla.ubicacion?.coordenadas?.lat || -12.1245)),
        lng: Number(cfg.ubicacion?.coordenadas?.lng ?? (semilla.ubicacion?.coordenadas?.lng || -77.0289))
      }
    },
    sedes: Array.isArray(cfg.sedes) && cfg.sedes.length > 0 
      ? cfg.sedes 
      : (Array.isArray(semilla.sedes) ? semilla.sedes : []),
    metricas: {
      pacientes: cfg.metricas?.pacientes || semilla.metricas?.pacientes || '450+',
      colegiaturaNumero: cfg.metricas?.colegiaturaNumero || semilla.metricas?.colegiaturaNumero || '49425',
      confidencialidad: cfg.metricas?.confidencialidad || semilla.metricas?.confidencialidad || '100%',
      satisfaccion: cfg.metricas?.satisfaccion || semilla.metricas?.satisfaccion || '98%',
      years: cfg.metricas?.years || calcularAnosTrayectoria(cfg.identidad?.lanzamientoFecha || semilla.identidad?.lanzamientoFecha)
    },
    redes: {
      facebook: cfg.redes?.facebook || semilla.redes?.facebook || 'https://facebook.com/psicologiaamerica',
      instagram: cfg.redes?.instagram || semilla.redes?.instagram || 'https://instagram.com/psicologiaamerica',
      tiktok: cfg.redes?.tiktok || semilla.redes?.tiktok || 'https://tiktok.com/@psicologiaamerica',
      linkedin: cfg.redes?.linkedin || semilla.redes?.linkedin || ''
    },
    seo: {
      titulo: {
        es: cfg.seo?.titulo?.es || semilla.seo?.titulo?.es || 'Consultorio Psicológico América | Terapia Psicológica y Talleres en Lima',
        en: cfg.seo?.titulo?.en || semilla.seo?.titulo?.en || 'America Psychological Clinic | Psychotherapy & Workshops in Lima'
      },
      descripcion: {
        es: cfg.seo?.descripcion?.es || semilla.seo?.descripcion?.es || 'Atención psicológica profesional y basada en evidencia con la Lic. Sofia Reynaga (C.Ps.P. 49425).',
        en: cfg.seo?.descripcion?.en || semilla.seo?.descripcion?.en || 'Evidence-based psychological consultation with Lic. Sofia Reynaga (C.Ps.P. 49425).'
      },
      keywords: {
        es: Array.isArray(cfg.seo?.keywords?.es) ? cfg.seo.keywords.es : (Array.isArray(semilla.seo?.keywords?.es) ? semilla.seo.keywords.es : []),
        en: Array.isArray(cfg.seo?.keywords?.en) ? cfg.seo.keywords.en : (Array.isArray(semilla.seo?.keywords?.en) ? semilla.seo.keywords.en : [])
      }
    },
    userId: cfg.userId || '',
    email: cfg.email || '',
    autor: cfg.autor || '',
    actualizado: cfg.actualizado || null
  };
}

// 4. Lectura en tiempo de compilación (Astro SSG / Cloudflare Build) directamente desde la REST API de Firestore
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
  if (!fechaInput) return '4+';
  let dateObj = null;

  if (fechaInput?.seconds) {
    dateObj = new Date(fechaInput.seconds * 1000);
  } else if (typeof fechaInput === 'string') {
    dateObj = new Date(fechaInput.includes('T') ? fechaInput : `${fechaInput}T12:00:00`);
  } else if (fechaInput instanceof Date) {
    dateObj = fechaInput;
  }

  if (!dateObj || isNaN(dateObj.getTime())) return '4+';
  const dif = new Date().getFullYear() - dateObj.getFullYear();
  return dif > 0 ? `${dif}+` : '1';
}

/**
 * Obtiene los datos oficiales del negocio:
 * 1. Memoria activa en sesión.
 * 2. Caché local persistente (localStorage 'minegocio').
 * 3. En SSG/Build: Datos vivos directo desde Firestore REST API.
 * 4. Semilla local como puente inicial (semilla.json).
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

  // 3. Fallback a semilla local normalizada
  const semilla = obtenerSemillaLocal();
  if (semilla) {
    _memoriaNegocio = normalizarConfig(semilla);
    return _memoriaNegocio;
  }

  // 4. Estructura neutra por defecto
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
      window.dispatchEvent(new CustomEvent('psicologia:negocio-actualizado', { detail: normalizado }));
      window.dispatchEvent(new CustomEvent('gaswii:negocio-actualizado', { detail: normalizado }));
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
  const fechaStr = input.identidad?.lanzamientoFecha || actual.identidad?.lanzamientoFecha || "2021-06-08";
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
    sedes: Array.isArray(input.sedes) ? input.sedes : (actual.sedes || []),
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
      sedes: config.sedes,
      metricas: config.metricas,
      redes: config.redes,
      seo: config.seo,
      userId: config.userId,
      email: config.email,
      autor: config.autor,
      actualizado: serverTimestamp()
    };

    // Reemplaza el documento completo en la colección 'negocio' -> 'principal'
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
