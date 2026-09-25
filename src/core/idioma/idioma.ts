// src/core/idioma/idioma.ts
// 🌐 Motor Central de Internacionalización (Core Hub & Federated Features)
// Unifica diccionarios globales y de cada feature con fallback automático a español.

import coreEs from './es.json';
import coreEn from './en.json';

import inicioEs from '../../feature/inicio/idioma/es.json';
import inicioEn from '../../feature/inicio/idioma/en.json';

import authEs from '../../feature/auth/idioma/es.json';
import authEn from '../../feature/auth/idioma/en.json';

import acercasEs from '../../feature/acercas/idioma/es.json';
import acercasEn from '../../feature/acercas/idioma/en.json';

// Feature Personal y Feature Cliente son 100% español operativo nativo (no requieren diccionarios JSON)
const localesPersonal: Record<string, any> = { es: {}, en: {} };
const localesCliente: Record<string, any> = { es: {}, en: {} };

export type Idioma = 'es' | 'en' | string;

export const IDIOMAS: Record<string, { nombre: string; code: string }> = {
  es: { nombre: 'Español', code: 'es' },
  en: { nombre: 'English', code: 'en' }
};

export const DEFAULT_LANG = 'es';

/**
 * Genera la ruta canónica según el idioma actual.
 * Admite N idiomas sin limitar a solo dos, con fallback al idioma por defecto ('es').
 * 
 * Ejemplos:
 * buildRuta('/', 'es') -> '/'
 * buildRuta('/', 'en') -> '/en'
 * buildRuta('/personal', 'en') -> '/en/personal'
 * buildRuta('/personal', 'es') -> '/personal'
 */
export function buildRuta(ruta: string = '/', lang: string = DEFAULT_LANG): string {
  const cleanPath = ruta.startsWith('/') ? ruta : `/${ruta}`;
  if (!lang || lang === DEFAULT_LANG) {
    return cleanPath;
  }
  return cleanPath === '/' ? `/${lang}` : `/${lang}${cleanPath}`;
}

const localesCore: Record<string, typeof coreEs> = {
  es: coreEs,
  en: coreEn
};

const localesInicio: Record<string, typeof inicioEs> = {
  es: inicioEs,
  en: inicioEn
};

const localesAuth: Record<string, typeof authEs> = {
  es: authEs,
  en: authEn
};

const localesAcercas: Record<string, typeof acercasEs> = {
  es: acercasEs,
  en: acercasEn
};

/**
 * Retorna las traducciones completas unificadas para el idioma solicitado.
 * Admite N idiomas sin limitar a solo dos, con fallback al idioma por defecto.
 */
export function getI18n(lang: string = DEFAULT_LANG) {
  const l = localesCore[lang] ? lang : DEFAULT_LANG;
  const core = localesCore[l] || localesCore[DEFAULT_LANG];
  const inicio = localesInicio[l] || localesInicio[DEFAULT_LANG];
  const auth = localesAuth[l] || localesAuth[DEFAULT_LANG];
  const acercas = localesAcercas[l] || localesAcercas[DEFAULT_LANG];
  const cliente = localesCliente[l] || localesCliente[DEFAULT_LANG];
  const personal = localesPersonal[l] || localesPersonal[DEFAULT_LANG];

  return {
    // 🏛️ Transversales (Core)
    topbar: core.topbar,
    nav: core.nav,
    footer: core.footer,
    sistema: core.sistema,

    // 🚀 Feature Inicio (Landing Page)
    hero: inicio.hero,
    sos: inicio.sos,
    catalogo: inicio.catalogo,
    pesaje: inicio.pesaje,
    seguridad: inicio.seguridad,
    calculadora: inicio.calculadora,
    mapa: inicio.mapa,
    nosotros: inicio.nosotros,
    faq: inicio.faq,
    modales: inicio.modales,

    // 🔐 Feature Auth
    auth,

    // 🏛️ Feature Acercas (Institucional y Legal)
    acercas,

    // 👑 Feature Cliente VIP
    cliente,

    // 🏢 Feature Personal / Consola Staff
    personal
  };
}

/**
 * Acceso directo a una feature específica
 */
export function getFeatureI18n(feature: 'inicio' | 'auth' | 'acercas' | 'cliente' | 'personal' | 'core', lang: string = DEFAULT_LANG) {
  const l = localesCore[lang] ? lang : DEFAULT_LANG;
  switch (feature) {
    case 'inicio': return localesInicio[l] || localesInicio[DEFAULT_LANG];
    case 'auth': return localesAuth[l] || localesAuth[DEFAULT_LANG];
    case 'acercas': return localesAcercas[l] || localesAcercas[DEFAULT_LANG];
    case 'cliente': return localesCliente[l] || localesCliente[DEFAULT_LANG];
    case 'personal': return localesPersonal[l] || localesPersonal[DEFAULT_LANG];
    default: return localesCore[l] || localesCore[DEFAULT_LANG];
  }
}

export const useTraduccion = getI18n;
