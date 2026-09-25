// src/core/seo.js
// --- [Metadatos SEO Clínico] titulo = ~50 caracteres, descripcion = ~150 caracteres
import app from '../app.js';
import { datosNegocio } from '../negocio.js';

// ==========================================
// 1. ASSET CANÓNICO DE IMAGEN PARA GOOGLE SERP Y REDES SOCIALES
// ==========================================
export const SEO_IMAGEN = {
  url: '/imgwii/Sofia.jpg',
  width: 1200,
  height: 630,
  type: 'image/jpeg',
  alt: 'Consultorio Psicológico América - Lic. Sofía Reynaga en Miraflores y Villa El Salvador',
  caption: 'Atención psicológica profesional, evaluación diagnóstica TDAH/TEA y psicoterapia'
};

// ==========================================
// 2. METADATOS CANÓNICOS DE INICIO (PÁGINA PRINCIPAL)
// ==========================================
export const SEO_INICIO = {
  es: {
    title: "Consultorio Psicológico América | Terapia, Descarte TDAH/TEA & Talleres",
    description: "Atención psicológica con calidez y rigor científico en Miraflores y Villa El Salvador. Psicoterapia individual, parejas, niños y evaluación TDAH/TEA. Lic. Sofía.",
    path: '/',
    keywords: [
      'psicologia miraflores',
      'psicologo miraflores',
      'psicologo villa el salvador',
      'terapia de pareja lima',
      'evaluacion tdah ninos lima',
      'descarte autismo tea lima',
      'terapia cognitivo conductual lima',
      'psicoterapia familiar lima',
      'consulta psicologica online peru',
      'talleres habilidades sociales lima',
      'lic sofia reynaga psicologa'
    ],
    audience: ['familias', 'parejas', 'padres de familia', 'adolescentes', 'adultos'],
    intent: 'agendar consulta psicologica, evaluacion diagnostica tdah tea y psicoterapia en lima'
  },
  en: {
    title: "América Psychology Clinic | Psychotherapy, ADHD/ASD Screening Lima",
    description: "Professional psychological care with Lic. Sofía Reynaga in Miraflores and Villa El Salvador. Individual therapy, couples, child therapy, and ADHD/ASD diagnosis.",
    path: '/en',
    keywords: [
      'psychologist miraflores lima',
      'couples therapy lima',
      'adhd assessment lima peru',
      'autism evaluation children lima',
      'english speaking psychologist lima',
      'online therapy peru'
    ],
    audience: ['expats', 'families', 'couples', 'individuals'],
    intent: 'book psychological consultation and psychotherapy in miraflores lima'
  }
};

// ==========================================
// 3. MAPA DE RUTAS PÚBLICAS
// ==========================================
export const seo = {
  inicio: SEO_INICIO
};

/**
 * Genera metadatos completos para el <head> (OpenGraph, Twitter, Hreflang, Canonical)
 */
export function getMeta(ruta = '/', idioma = 'es') {
  const clave = ruta === '/' || ruta === '/en' ? 'inicio' : ruta.replace(/^\/(en\/)?/, '');
  const data = seo[clave] ? seo[clave][idioma] : seo.inicio[idioma];
  const urlBase = (app.linkweb || 'https://psicologiawii.com').replace(/\/$/, '');
  const canonical = `${urlBase}${ruta}`;

  const seoDinamico = clave === 'inicio' ? datosNegocio.seo : null;
  const title = (seoDinamico?.titulo?.[idioma]?.trim()) || data.title;
  const description = (seoDinamico?.descripcion?.[idioma]?.trim()) || data.description;
  const dynamicKeywords = seoDinamico?.keywords?.[idioma];
  const keywordsList = Array.isArray(dynamicKeywords) && dynamicKeywords.length > 0 
    ? dynamicKeywords 
    : data.keywords;
  const keywords = keywordsList.join(', ');

  const imgCanonical = SEO_IMAGEN.url.startsWith('http') 
    ? SEO_IMAGEN.url 
    : `${urlBase}${SEO_IMAGEN.url}`;

  return {
    title,
    description,
    keywords,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogImage: imgCanonical,
    ogImageWidth: SEO_IMAGEN.width,
    ogImageHeight: SEO_IMAGEN.height,
    ogImageType: SEO_IMAGEN.type,
    ogImageAlt: SEO_IMAGEN.alt,
    ogUrl: canonical,
    ogType: 'website',
    siteName: datosNegocio.nombre,
    telefono: datosNegocio.telefonoMostrado,
    locale: idioma === 'es' ? 'es_PE' : 'en_US',
    localeAlternate: idioma === 'es' ? 'en_US' : 'es_PE',
    hreflang: {
      es: `${urlBase}/`,
      en: `${urlBase}/en`,
      default: `${urlBase}/`
    }
  };
}

/**
 * Genera el marcado de datos estructurados Schema.org JSON-LD para Google Rich Snippets
 */
export function getJsonLd(ruta = '/', idioma = 'es') {
  const urlBase = (app.linkweb || 'https://psicologiawii.com').replace(/\/$/, '');
  const isEn = idioma === 'en';
  const canonical = `${urlBase}${ruta}`;
  const data = seo.inicio[idioma] || SEO_INICIO.es;
  const seoDinamico = ruta === '/' || ruta === '/en' ? datosNegocio.seo : null;
  const title = (seoDinamico?.titulo?.[idioma]?.trim()) || data.title;
  const description = (seoDinamico?.descripcion?.[idioma]?.trim()) || data.description;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      // 0. Entidad WebPage con PrimaryImageOfPage
      {
        '@type': 'WebPage',
        '@id': `${urlBase}/#webpage`,
        url: canonical,
        name: title,
        description: description,
        inLanguage: isEn ? 'en-US' : 'es-PE',
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${urlBase}/#website`,
          url: urlBase,
          name: datosNegocio.nombre
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          '@id': `${urlBase}/#primaryimage`,
          url: `${urlBase}${SEO_IMAGEN.url}`,
          contentUrl: `${urlBase}${SEO_IMAGEN.url}`,
          width: SEO_IMAGEN.width,
          height: SEO_IMAGEN.height,
          caption: SEO_IMAGEN.caption
        }
      },
      // 1. Entidad Clínica Psicológica / MedicalBusiness
      {
        '@type': ['MedicalBusiness', 'MedicalClinic'],
        '@id': `${urlBase}/#clinic`,
        name: datosNegocio.nombre,
        description: isEn 
          ? "Certified psychology and psychotherapy clinic in Miraflores and Villa El Salvador. Specialized in individual therapy, couples, and ADHD/ASD diagnosis."
          : "Consultorio de atención psicológica y psicoterapia en Miraflores y Villa El Salvador. Especializado en terapia individual, pareja, familia y descarte TDAH/TEA.",
        url: urlBase,
        telephone: datosNegocio.telefonoMostrado,
        image: `${urlBase}${SEO_IMAGEN.url}`,
        priceRange: "S/ 85 - S/ 600",
        paymentAccepted: ["Cash", "Yape", "Plin", "Bank Transfer"],
        currenciesAccepted: "PEN",
        medicalSpecialty: ["Psychology", "Psychotherapy", "PediatricPsychology"],
        address: {
          '@type': 'PostalAddress',
          streetAddress: datosNegocio.direccionSede,
          addressLocality: datosNegocio.distritoSede,
          addressRegion: datosNegocio.ciudad,
          postalCode: '15074',
          addressCountry: datosNegocio.pais
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: datosNegocio.coordenadas.lat,
          longitude: datosNegocio.coordenadas.lng
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '20:00'
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Saturday'],
            opens: '09:00',
            closes: '18:00'
          }
        ],
        areaServed: datosNegocio.sedes.map(s => ({
          '@type': 'AdministrativeArea',
          name: s.distrito
        }))
      },
      // 2. Servicios Clínicos y Evaluaciones
      ...datosNegocio.servicios.map(s => {
        const servNom = isEn ? (s.nombreEn || s.nombre) : s.nombre;
        const servDesc = isEn ? (s.descripcionEn || s.descripcion) : s.descripcion;
        const precioNum = Number(s.precioPEN ?? 85);
        const imgUrl = (s.imagen || SEO_IMAGEN.url).startsWith('http') 
          ? s.imagen 
          : `${urlBase}${s.imagen || SEO_IMAGEN.url}`;

        return {
          '@type': 'Service',
          '@id': `${urlBase}/#servicio-${s.id || s.slug}`,
          name: servNom,
          description: servDesc,
          image: imgUrl,
          provider: {
            '@type': 'MedicalBusiness',
            name: datosNegocio.nombre
          },
          offers: {
            '@type': 'Offer',
            url: `${urlBase}/#servicios`,
            priceCurrency: 'PEN',
            price: isNaN(precioNum) ? '85.00' : precioNum.toFixed(2),
            priceValidUntil: '2027-12-31',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'MedicalBusiness',
              name: datosNegocio.nombre
            }
          }
        };
      })
    ]
  };
}

export default {
  seo,
  SEO_IMAGEN,
  SEO_INICIO,
  getMeta,
  getJsonLd
};