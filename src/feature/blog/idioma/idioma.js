// src/feature/blog/idioma/idioma.js
// 🌐 Motor de Internacionalización Desacoplado para Feature Blog
// Arquitectura escalable a N idiomas (sin ternarios binarios isEn)
import es from './es.json';
import en from './en.json';

const DICCIONARIOS = {
  es,
  en
};

export const DEFAULT_LANG = 'es';

/**
 * Obtiene el diccionario del blog para el idioma solicitado con fallback automático a español.
 * @param {string} lang Código de idioma ('es', 'en', 'pt', etc.)
 */
export function getBlogI18n(lang = DEFAULT_LANG) {
  const clave = (lang || DEFAULT_LANG).toLowerCase();
  return DICCIONARIOS[clave] || DICCIONARIOS[DEFAULT_LANG] || es;
}

export { es, en };
export default getBlogI18n;
