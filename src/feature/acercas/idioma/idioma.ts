// src/feature/acercas/idioma/idioma.ts
// 🌐 Motor Orquestador Federado de Internacionalización para Feature Acercas
// Arquitectura en 3 Niveles (Abuelo -> Padre -> Hijos) con soporte N-idiomas (sin isEn)

import padreEs from './es.json';
import padreEn from './en.json';
import { buildRuta as coreBuildRuta, DEFAULT_LANG } from '../../../core/idioma/idioma';

export const IDIOMA_DEFAULT = DEFAULT_LANG || 'es';

const localesPadre: Record<string, typeof padreEs> = {
  es: padreEs,
  en: padreEn
};

/**
 * Resuelve y fusiona el diccionario del Padre (textos transversales) con el diccionario
 * específico de cualquier sección Hija, aplicando fallback inteligente a español en cada nivel.
 * 
 * @param localesHijo Mapa de idiomas del hijo: { es: {...}, en: {...}, ... }
 * @param lang Código de idioma solicitado (ej: 'es', 'en', 'pt')
 * @returns Diccionario completo resuelto para la vista
 */
export function resolverIdiomaSeccion<T = any>(
  localesHijo: Record<string, any> = {},
  lang: string = IDIOMA_DEFAULT
): typeof padreEs & T {
  const codigo = localesHijo[lang] || localesPadre[lang] ? lang : IDIOMA_DEFAULT;

  // Base Padre
  const pBase = localesPadre[IDIOMA_DEFAULT] || {};
  const pLang = localesPadre[codigo] || {};
  const padreFusionado = { ...pBase, ...pLang };

  // Base Hijo
  const hBase = localesHijo[IDIOMA_DEFAULT] || {};
  const hLang = localesHijo[codigo] || {};
  const hijoFusionado = { ...hBase, ...hLang };

  return {
    ...padreFusionado,
    ...hijoFusionado
  } as typeof padreEs & T;
}

/**
 * Genera la ruta canónica para el idioma solicitado
 */
export function buildRuta(ruta: string = '/', lang: string = IDIOMA_DEFAULT): string {
  return coreBuildRuta(ruta, lang);
}

export { padreEs, padreEn };
export default resolverIdiomaSeccion;
