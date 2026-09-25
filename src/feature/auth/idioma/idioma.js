// src/feature/auth/idioma/idioma.js
// Traducciones bundleadas en build time — t() es sincrono, 0ms de costo
import es from './es.json';
import en from './en.json';

const _lang = typeof window !== 'undefined' && window.location.pathname.startsWith('/en') ? 'en' : 'es';

export const getLang = () => _lang;
export const t = () => (_lang === 'en' ? en : es);
