// src/feature/inicio/idioma/idioma.js
// 🌐 Motor Orquestador de Internacionalización Federada para Feature Inicio
// Resuelve N idiomas de forma dinámica para cualquier sección hija con fallback inteligente al español.

export const IDIOMA_DEFAULT = 'es';

/**
 * Resuelve y fusiona el diccionario del idioma solicitado para cualquier sección hija.
 * Si el idioma solicitado no existe o le falta alguna clave, aplica fallback automático al español.
 * 
 * @param {Record<string, Record<string, any>>} locales - Mapa de diccionarios locales: { es, en, pt, ... }
 * @param {string} [lang='es'] - Código del idioma solicitado
 * @returns {Record<string, any>} Diccionario final resuelto para la sección
 */
export function resolverIdioma(locales = {}, lang = IDIOMA_DEFAULT) {
  const codigo = locales[lang] ? lang : IDIOMA_DEFAULT;
  const dataBase = locales[IDIOMA_DEFAULT] || {};

  // Si es el idioma por defecto, retorna directamente a 0ms sin clonación
  if (codigo === IDIOMA_DEFAULT) {
    return dataBase;
  }

  const dataLang = locales[codigo] || {};

  // Fusión con fallback: si una clave falta en el idioma objetivo, toma la del español
  return {
    ...dataBase,
    ...dataLang
  };
}

/**
 * Genera la ruta canónica para cualquier idioma y vista.
 * Soporta N idiomas sin condicionales binarios.
 * @param {string} [ruta='/'] - Ruta base relativa (ej: '/', '/personal', '/cliente')
 * @param {string} [lang='es'] - Idioma actual
 * @returns {string} Ruta con prefijo correspondiente
 */
export function buildRuta(ruta = '/', lang = IDIOMA_DEFAULT) {
  const cleanPath = ruta.startsWith('/') ? ruta : `/${ruta}`;
  if (!lang || lang === IDIOMA_DEFAULT) {
    return cleanPath;
  }
  return cleanPath === '/' ? `/${lang}` : `/${lang}${cleanPath}`;
}

export default resolverIdioma;
