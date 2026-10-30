// src/feature/personal/modulos/anuncios/dataAnuncios.js
// 🎯 Gestor Local-First y de Negocio para Módulo de Anuncios en Backoffice
// Cascada de 3 niveles: LocalStorage -> Semilla (anuncios.json) -> []
import { getls, savels } from '@widev';
import anunciosSemilla from '../../../../semillas/anuncios.json';

export const STORAGE_KEY = 'wi_anuncios';

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
    estado: getBilingue(ad.estado, ad.estadoEs, ad.estadoEn, 'Activo · En curso', 'Active · Ongoing'),
    estadoTipo: ad.estadoTipo || (ad.activo ? 'activo' : 'completado'),
    activo: Boolean(ad.activo ?? (ad.estadoTipo !== 'completado')),
    conversaciones: Number(ad.conversaciones ?? 0),
    costoPorConv: ad.costoPorConv || 'S/ 7,33',
    metricasTexto: getBilingue(ad.metricasTexto, ad.metricasTextoEs, ad.metricasTextoEn, '', ''),
    flyerImg: ad.flyerImg || '/imgwii/psicologa-sofia-consulta.webp',
    thumbImg: ad.thumbImg || ad.flyerImg || '/imgwii/psicologa-sofia-consulta.webp',
    descripcion: getBilingue(ad.descripcion, ad.descEs, ad.descEn, '', ''),
    wsMsg: getBilingue(ad.wsMsg, ad.wsEs, ad.wsEn, 'Hola Lic. Sofía, vi el anuncio y deseo agendar una consulta.', 'Hello Lic. Sofia, I saw the ad and would like to book a consultation.')
  };
}

export function obtenerAnuncios(force = false) {
  if (_memoriaAnuncios && !force) return _memoriaAnuncios;

  try {
    const raw = getls(STORAGE_KEY, null);
    if (Array.isArray(raw) && raw.length > 0) {
      _memoriaAnuncios = raw.map(normalizarAnuncio);
      return _memoriaAnuncios;
    }
  } catch (e) {}

  if (Array.isArray(anunciosSemilla) && anunciosSemilla.length > 0) {
    _memoriaAnuncios = anunciosSemilla.map(normalizarAnuncio);
    try {
      savels(STORAGE_KEY, _memoriaAnuncios);
    } catch (e) {}
    return _memoriaAnuncios;
  }

  _memoriaAnuncios = [];
  return _memoriaAnuncios;
}

export function guardarAnuncios(lista) {
  const normalizados = (lista || []).map(normalizarAnuncio);
  _memoriaAnuncios = normalizados;
  savels(STORAGE_KEY, normalizados);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wi:anuncios-actualizado', { detail: normalizados }));
  }
  return normalizados;
}

export function crearAnuncio(nuevo) {
  const lista = obtenerAnuncios();
  const normalizado = normalizarAnuncio({
    ...nuevo,
    id: `ad-${Date.now()}`
  });
  lista.unshift(normalizado);
  return guardarAnuncios(lista);
}

export function actualizarAnuncio(id, data) {
  const lista = obtenerAnuncios();
  const idx = lista.findIndex(a => a.id === id);
  if (idx !== -1) {
    lista[idx] = normalizarAnuncio({ ...lista[idx], ...data });
    return guardarAnuncios(lista);
  }
  return lista;
}

export function eliminarAnuncio(id) {
  const lista = obtenerAnuncios().filter(a => a.id !== id);
  return guardarAnuncios(lista);
}
