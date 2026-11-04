// src/feature/personal/modulos/anuncios/dataAnuncios.js
// 🎯 Gestor Local-First y de Negocio para Módulo de Anuncios en Backoffice
// Cascada de 3 niveles: Firestore -> LocalStorage -> Semilla (anuncios.json) -> []
// CERO datos fijos / hardcodeados · Sincronización reactiva continua
import { getls, savels } from '@widev';
import anunciosSemilla from '../../../../semillas/anuncios.json';
import { db } from '@core/servicios/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import { actualizarCentral, eliminarCentral } from '@core/servicios/actualizar.js';

export const STORAGE_KEY = 'wi_anuncios';
export const COLECCION_ANUNCIOS = 'anuncios';

let _memoriaAnuncios = null;

export function normalizarAnuncio(ad = {}) {
  const getBilingue = (obj, propEs, propEn, defEs = '', defEn = '') => {
    if (obj && typeof obj === 'object') {
      return {
        es: obj.es || defEs,
        en: obj.en || defEn || obj.es || defEs
      };
    }
    return {
      es: propEs || String(obj || defEs),
      en: propEn || defEn || propEs || String(obj || defEs)
    };
  };

  return {
    id: ad.id || `ad-${Date.now()}`,
    titulo: getBilingue(ad.titulo, ad.tituloEs, ad.tituloEn, 'Nueva Campaña', 'New Campaign'),
    badge: getBilingue(ad.badge, ad.badgeEs, ad.badgeEn, 'Evaluación Clínica', 'Clinical Assessment'),
    fecha: getBilingue(ad.fecha, ad.fechaEs, ad.fechaEn, 'Reciente', 'Recent'),
    fechaInicio: ad.fechaInicio || '',
    fechaFin: ad.fechaFin || '',
    estado: getBilingue(ad.estado, ad.estadoEs, ad.estadoEn, 'Activo · En curso', 'Active · Ongoing'),
    estadoTipo: ad.estadoTipo || (ad.activo ? 'activo' : 'finalizado'),
    activo: Boolean(ad.activo ?? (ad.estadoTipo === 'activo' || ad.estadoTipo === 'vigente')),
    pin: Boolean(ad.pin ?? false),
    flyerImg: ad.flyerImg || '/imgwii/psicologa-sofia-consulta.webp',
    thumbImg: ad.thumbImg || ad.flyerImg || '/imgwii/psicologa-sofia-consulta.webp',
    descripcion: getBilingue(ad.descripcion, ad.descEs, ad.descEn, '', ''),
    wsMsg: getBilingue(ad.wsMsg, ad.wsEs, ad.wsEn, 'Hola Lic. Sofía, vi el anuncio y deseo agendar una consulta.', 'Hello Lic. Sofia, I saw the ad and would like to book a consultation.'),
    creado: ad.creado || Date.now(),
    actualizado: ad.actualizado || Date.now(),
    userId: ad.userId || 'admin_sofia'
  };
}

export function ordenarAnuncios(lista = []) {
  if (!Array.isArray(lista)) return [];
  return [...lista].sort((a, b) => {
    const pinA = Boolean(a.pin);
    const pinB = Boolean(b.pin);
    if (pinA !== pinB) return pinB ? 1 : -1;
    const timeB = Number(b.actualizado || b.creado || 0);
    const timeA = Number(a.actualizado || a.creado || 0);
    return timeB - timeA;
  });
}

export function obtenerAnuncios(force = false) {
  if (_memoriaAnuncios && !force) return ordenarAnuncios(_memoriaAnuncios);

  let listaFinal = [];

  // 1. Revisar LocalStorage (0ms)
  try {
    const raw = getls(STORAGE_KEY, null);
    if (Array.isArray(raw) && raw.length > 0) {
      listaFinal = raw.map(normalizarAnuncio);
    }
  } catch (e) {}

  // 2. Cascada con Semillas Oficiales (anuncios.json)
  const semillas = (Array.isArray(anunciosSemilla) ? anunciosSemilla : []).map(normalizarAnuncio);

  if (listaFinal.length === 0) {
    listaFinal = [...semillas];
  } else {
    // Fusión inteligente: Si semillas contiene anuncios que faltan en LocalStorage (ej: ad-05, ad-06), incorporarlos
    const idsExistentes = new Set(listaFinal.map((a) => a.id));
    let huboNuevos = false;
    semillas.forEach((sem) => {
      if (sem && sem.id && !idsExistentes.has(sem.id)) {
        listaFinal.push(sem);
        huboNuevos = true;
      }
    });

    if (huboNuevos) {
      try {
        savels(STORAGE_KEY, listaFinal);
      } catch (e) {}
    }
  }

  _memoriaAnuncios = ordenarAnuncios(listaFinal);
  return _memoriaAnuncios;
}

/**
 * Consulta y reconcilia anuncios desde Firestore
 */
export async function sincronizarAnunciosFirestore(forzar = false) {
  try {
    if (db) {
      const colRef = collection(db, COLECCION_ANUNCIOS);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const remotos = snap.docs.map((d) => normalizarAnuncio({ id: d.id, ...d.data() }));
        if (remotos.length > 0) {
          return guardarAnuncios(remotos);
        }
      }
    }
  } catch (e) {
    // Si la conexión da 403 o está offline, continuar con la cascada Local/Semillas
  }
  return obtenerAnuncios(forzar);
}

export function guardarAnuncios(lista) {
  const normalizados = ordenarAnuncios((lista || []).map(normalizarAnuncio));
  _memoriaAnuncios = normalizados;
  savels(STORAGE_KEY, normalizados);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wi:anuncios-actualizado', { detail: normalizados }));
  }
  return normalizados;
}

export async function crearAnuncio(nuevo) {
  const lista = [...obtenerAnuncios()];
  const normalizado = normalizarAnuncio({
    ...nuevo,
    id: nuevo.id || `ad-${Date.now()}`
  });
  lista.unshift(normalizado);
  _memoriaAnuncios = lista;
  savels(STORAGE_KEY, lista);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wi:anuncios-actualizado', { detail: lista }));
  }

  await actualizarCentral({
    modulo: 'anuncios',
    coleccion: COLECCION_ANUNCIOS,
    docId: normalizado.id,
    storageKey: STORAGE_KEY,
    evento: 'wi:anuncios-actualizado',
    datos: normalizado,
    listaStorage: lista,
    redeploy: true,
    forzarWrite: true,
    mensajeExito: `Campaña "${normalizado.titulo.es || normalizado.id}" creada con éxito`
  });

  return lista;
}

export async function actualizarAnuncio(id, data) {
  const lista = [...obtenerAnuncios()];
  const idx = lista.findIndex(a => a.id === id);
  if (idx !== -1) {
    const normalizado = normalizarAnuncio({ ...lista[idx], ...data, id });
    lista[idx] = normalizado;
    _memoriaAnuncios = lista;
    savels(STORAGE_KEY, lista);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi:anuncios-actualizado', { detail: lista }));
    }

    await actualizarCentral({
      modulo: 'anuncios',
      coleccion: COLECCION_ANUNCIOS,
      docId: id,
      storageKey: STORAGE_KEY,
      evento: 'wi:anuncios-actualizado',
      datos: normalizado,
      listaStorage: lista,
      redeploy: true,
      forzarWrite: true,
      mensajeExito: `Campaña "${normalizado.titulo.es || id}" actualizada al instante`
    });

    return lista;
  }
  return lista;
}

export async function eliminarAnuncio(id) {
  const lista = obtenerAnuncios().filter(a => a.id !== id);
  _memoriaAnuncios = lista;
  savels(STORAGE_KEY, lista);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wi:anuncios-actualizado', { detail: lista }));
  }

  await eliminarCentral({
    modulo: 'anuncios',
    coleccion: COLECCION_ANUNCIOS,
    docId: id,
    storageKey: STORAGE_KEY,
    evento: 'wi:anuncios-actualizado',
    listaActualizada: lista,
    redeploy: true,
    mensajeExito: 'Campaña eliminada con éxito'
  });

  return lista;
}
