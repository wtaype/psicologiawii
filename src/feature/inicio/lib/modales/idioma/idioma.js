// src/feature/inicio/lib/modales/idioma/idioma.js
// 🌐 Padre Orquestador de Internacionalización para Modales (Agendar y Test)
// Resuelve N idiomas de forma dinámica sin booleanos binarios 'isEn', escalable a cualquier idioma.

export const IDIOMA_DEFAULT = 'es';

/**
 * Detecta el código del idioma activo en el navegador o documento.
 * @returns {string} Código de idioma ('es', 'en', 'pt', etc.)
 */
export function obtenerIdiomaActivo() {
  if (typeof window === 'undefined') return IDIOMA_DEFAULT;

  // 1. Detectar desde la ruta de URL (/en/, /en, etc.)
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0 && segments[0].length === 2) {
    return segments[0].toLowerCase();
  }

  // 2. Detectar desde el atributo lang de <html>
  const docLang = document.documentElement.lang;
  if (docLang && docLang.length >= 2) {
    return docLang.slice(0, 2).toLowerCase();
  }

  return IDIOMA_DEFAULT;
}

/**
 * Resuelve y fusiona el diccionario del idioma activo con fallback garantizado a español.
 * @param {Record<string, any>} locales - Mapa de diccionarios { es, en, ... }
 * @param {string|null} [lang=null] - Idioma opcional forzado
 * @returns {Record<string, any>} Textos resueltos
 */
export function resolverTextos(locales = {}, lang = null) {
  const activo = (lang || obtenerIdiomaActivo()).toLowerCase();
  const base = locales[IDIOMA_DEFAULT] || {};
  const objetivo = locales[activo] || {};

  if (activo === IDIOMA_DEFAULT) {
    return base;
  }

  // Fusión con fallback: si falta una clave en el idioma objetivo, usa la del español
  return {
    ...base,
    ...objetivo
  };
}

export default {
  IDIOMA_DEFAULT,
  obtenerIdiomaActivo,
  resolverTextos
};
