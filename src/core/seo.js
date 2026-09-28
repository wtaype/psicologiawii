// src/core/seo.js
// 🎯 Fachada Canónica de Metadatos SEO Clínico y Schema.org JSON-LD
// 100% Dinámico: Consume exclusivamente de datosNegocio (que ya resuelve Firestore -> único fallback infoNegocio / infoProductos)
// Cero datos quemados: Cero strings hardcodeados. Todo se actualiza en cascada desde infoNegocio / infoProductos.

import app from '../app.js';
import { datosNegocio } from '../negocio.js';

// ==========================================
// 1. ASSET CANÓNICO DE IMAGEN PARA GOOGLE SERP Y REDES SOCIALES
// ==========================================
export const SEO_IMAGEN = {
  get url() { return datosNegocio.seo?.imagen?.url || ''; },
  get width() { return datosNegocio.seo?.imagen?.width || 1200; },
  get height() { return datosNegocio.seo?.imagen?.height || 630; },
  get type() { return datosNegocio.seo?.imagen?.type || 'image/jpeg'; },
  get alt() { return datosNegocio.seo?.imagen?.alt || datosNegocio.nombre; },
  get caption() { return datosNegocio.seo?.imagen?.caption || datosNegocio.bio; }
};

// ==========================================
// 2. METADATOS CANÓNICOS DINÁMICOS DE INICIO (PÁGINA PRINCIPAL)
// ==========================================
export const SEO_INICIO = {
  get es() {
    const s = datosNegocio.seo || {};
    return {
      title: s.titulo?.es || datosNegocio.nombre,
      description: s.descripcion?.es || datosNegocio.bio,
      path: '/',
      keywords: Array.isArray(s.keywords?.es) ? s.keywords.es : [],
      audience: s.audiencia?.es || [],
      intent: s.intencion?.es || ''
    };
  },
  get en() {
    const s = datosNegocio.seo || {};
    return {
      title: s.titulo?.en || datosNegocio.nombreCorto,
      description: s.descripcion?.en || datosNegocio.bio,
      path: '/en',
      keywords: Array.isArray(s.keywords?.en) ? s.keywords.en : [],
      audience: s.audiencia?.en || [],
      intent: s.intencion?.en || ''
    };
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

  const title = data.title || datosNegocio.nombre;
  const description = data.description || datosNegocio.bio;
  const keywordsList = Array.isArray(data.keywords) && data.keywords.length > 0 
    ? data.keywords 
    : [];
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
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: imgCanonical,
    idioma,
    alternateHref: ruta === '/en' || ruta.startsWith('/en/') ? `${urlBase}/` : `${urlBase}/en/`,
    alternateLang: idioma === 'es' ? 'en' : 'es',
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
  const title = data.title || datosNegocio.nombre;
  const description = data.description || datosNegocio.bio;
  const seoData = datosNegocio.seo || {};
  const schemaData = seoData.schema || {};

  // Rango de precios calculado dinámicamente de las tarifas
  const tarifas = datosNegocio.tarifas || {};
  const preciosArray = [tarifas.consultaBase, tarifas.consultaPresencial, tarifas.paquete10Sesiones, tarifas.descarteDiagnostico].filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
  const minPrecio = preciosArray.length > 0 ? Math.min(...preciosArray) : 0;
  const maxPrecio = preciosArray.length > 0 ? Math.max(...preciosArray) : 0;
  const priceRange = schemaData.rangoPrecios || `S/ ${minPrecio} - S/ ${maxPrecio}`;

  // Horarios de apertura dinámicos
  const horasSemana = datosNegocio.horarios?.semana || { abre: "09:00", cierra: "20:00" };
  const horasSabado = datosNegocio.horarios?.sabado || { abre: "09:00", cierra: "18:00" };

  const openingHours = [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: horasSemana.abre,
      closes: horasSemana.cierra
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday'],
      opens: horasSabado.abre,
      closes: horasSabado.cierra
    }
  ];

  // Descripción de consultorio dinámico
  const clinicDesc = schemaData.descripcionCorta?.[idioma] 
    || (isEn ? datosNegocio.contacto?.horarioEn : datosNegocio.bio)
    || description;

  // Medios de pago aceptados dinámicos
  const paymentAccepted = (datosNegocio.mediosPago || []).map(m => m.nombre);

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
        '@type': schemaData.tipo || ['MedicalBusiness', 'MedicalClinic'],
        '@id': `${urlBase}/#clinic`,
        name: datosNegocio.nombre,
        description: clinicDesc,
        url: urlBase,
        telephone: datosNegocio.telefonoMostrado,
        image: `${urlBase}${SEO_IMAGEN.url}`,
        priceRange: priceRange,
        paymentAccepted: paymentAccepted,
        currenciesAccepted: datosNegocio.moneda || 'PEN',
        medicalSpecialty: schemaData.especialidades || ['Psychology', 'Psychotherapy'],
        address: {
          '@type': 'PostalAddress',
          streetAddress: datosNegocio.direccionSede,
          addressLocality: datosNegocio.distritoSede,
          addressRegion: datosNegocio.ciudad,
          postalCode: datosNegocio.codigoPostal || '',
          addressCountry: datosNegocio.pais
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: datosNegocio.coordenadas.lat,
          longitude: datosNegocio.coordenadas.lng
        },
        openingHoursSpecification: openingHours,
        areaServed: datosNegocio.sedes.map(s => ({
          '@type': 'AdministrativeArea',
          name: s.distrito || s.nombre
        }))
      },
      // 2. Servicios Clínicos y Evaluaciones Dinámicos
      ...datosNegocio.servicios.map(s => {
        const servNom = isEn ? (s.nombreEn || s.nombre) : s.nombre;
        const servDesc = isEn ? (s.descripcionEn || s.descripcion) : s.descripcion;
        const precioNum = Number(s.precioPEN ?? 0);
        const imgUrl = (s.imagen || SEO_IMAGEN.url).startsWith('http') 
          ? (s.imagen || SEO_IMAGEN.url)
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
            priceCurrency: datosNegocio.moneda || 'PEN',
            price: isNaN(precioNum) ? '0.00' : precioNum.toFixed(2),
            priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
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