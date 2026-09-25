// src/feature/personal/modulos/entradas/dataEntradas.js
// Gestor de Artículos y Blog SEO para Solgas Surquillo (Inspirado en Workwii)
// 100% JS Nativo · Integrado con @widev y Local-First

import { getls, savels } from '@widev';

const STORAGE_KEY = 'gaswii_entradas_blog';

const ENTRADAS_SEMILLA = [
  {
    id: 'art_01',
    titulo: '¿Cómo verificar que tu balón de gas Solgas está 100% lleno?',
    slug: 'como-verificar-que-tu-balon-de-gas-esta-lleno',
    categoria: 'Consejos de Seguridad',
    estado: 'publicado',
    fecha: '24 Sep 2026',
    autor: 'Wilder Taype (Solgas Surquillo)',
    portada: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
    metaTitle: '¿Cómo saber si tu balón de gas está lleno? · Solgas Surquillo',
    metaDesc: 'Aprende los métodos seguros para comprobar el peso de tu balón de gas GLP de 10 kg con balanza digital calibrada Inacal.',
    tags: 'gas glp, surquillo, balon de gas, peso exacto, solgas',
    contenido: `## La importancia de recibir el peso exacto de tu balón de gas

Cuando solicitas un balón de gas para tu hogar o negocio en Surquillo, la garantía del peso neto es fundamental. En **Solgas Surquillo (Sede Dante 260)**, todos nuestros repartidores cuentan con la balanza digital certificada por Inacal.

### 1. El peso de la tara del cilindro
Cada balón de gas cuenta con un número grabado en el collarín metálico denominado **"TARA"**. Este valor indica el peso del envase vacío (aproximadamente entre 10.5 kg y 11.8 kg según el fabricante).

### 2. El cálculo matemático simple:
> **Peso Total en Balanza = Tara grabada + 10.00 kg de gas GLP**

Por ejemplo, si el collarín indica una tara de \`11.2 kg\`, el peso total en la balanza digital debe marcar exactamente **21.2 kg**.

### 3. Prueba de Jabonadura y Válvula
Nunca uses fuego o encendedor para verificar fugas. Nuestro técnico realiza gratuitamente la prueba de espuma en la válvula tras cada instalación. ¡Seguridad total garantizada!`
  },
  {
    id: 'art_02',
    titulo: 'Precio oficial del balón de gas en Surquillo y Miraflores: Guía 2026',
    slug: 'precio-oficial-balon-de-gas-surquillo-miraflores-2026',
    categoria: 'Precios y Mercado',
    estado: 'publicado',
    fecha: '20 Sep 2026',
    autor: 'Equipo Comercial Gaswii',
    portada: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80',
    metaTitle: 'Precio del Balón de Gas en Surquillo y Miraflores · Solgas Oficial',
    metaDesc: 'Consulta los precios actualizados del balón de 10kg y 45kg con delivery express en menos de 15 minutos.',
    tags: 'precio gas, surquillo delivery, miraflores, solgas precio',
    contenido: `## Precios Transparentes y Entrega Rápida en tu Distrito

Encontrar un distribuidor formal de GLP con precios regulados y comprobante SUNAT electrónico es indispensable. En nuestra sede de **Jr. Dante 260**, mantenemos los precios oficiales recomendados por planta Solgas.

### Tabla Oficial de Precios:
- **Balón SOLGAS Premium 10 kg:** S/ 65.00 (Delivery e instalación gratis)
- **Balón SOLGAS Industrial 45 kg:** S/ 220.00 (Incluye Factura F001 con 18% IGV)
- **Regulador Click-On de Alta Presión:** S/ 45.00

### Cobertura en Tiempo Récord:
Cubrimos todo Surquillo (Barrio Médico, Dante, Mercado 1, Principal), Miraflores Límite, San Borja Sur y San Isidro Financiero en un promedio de **12 a 15 minutos**.`
  },
  {
    id: 'art_03',
    titulo: 'Mantenimiento preventivo de cocinas a gas y reguladores industriales',
    slug: 'mantenimiento-preventivo-cocinas-reguladores-industriales',
    categoria: 'Empresas y Restaurantes',
    estado: 'borrador',
    fecha: '25 Sep 2026',
    autor: 'Técnico Especialista',
    portada: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    metaTitle: 'Mantenimiento Preventivo de GLP para Restaurantes · Solgas',
    metaDesc: 'Recomendaciones técnicas de seguridad para sistemas de gas en restaurantes y pollerías de Surquillo.',
    tags: 'restaurantes, glp industrial, 45kg, mantenimiento',
    contenido: `## Protocolos de Seguridad para Negocios Gastronómicos

Los restaurantes y pollerías de Surquillo requieren un flujo ininterrumpido y seguro de GLP. En este artículo detallamos la frecuencia de cambio de mangueras y reguladores de alta presión...`
  }
];

export function obtenerEntradas() {
  const guardadas = getls(STORAGE_KEY);
  if (guardadas && Array.isArray(guardadas) && guardadas.length > 0) {
    return guardadas;
  }
  savels(STORAGE_KEY, ENTRADAS_SEMILLA);
  return ENTRADAS_SEMILLA;
}

export function guardarEntrada(entradaData) {
  const entradas = obtenerEntradas();
  const idx = entradas.findIndex(e => e.id === entradaData.id);

  const slugGenerado = entradaData.slug || entradaData.titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const registro = {
    id: entradaData.id || `art_${Date.now()}`,
    titulo: entradaData.titulo || 'Artículo sin título',
    slug: slugGenerado,
    categoria: entradaData.categoria || 'Consejos de Seguridad',
    estado: entradaData.estado || 'publicado',
    fecha: entradaData.fecha || 'Hoy',
    autor: entradaData.autor || 'Solgas Surquillo',
    portada: entradaData.portada || 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
    metaTitle: entradaData.metaTitle || `${entradaData.titulo} · Solgas Surquillo`,
    metaDesc: entradaData.metaDesc || 'Guía oficial de Solgas Surquillo.',
    tags: entradaData.tags || 'solgas, surquillo, gas glp',
    contenido: entradaData.contenido || ''
  };

  if (idx >= 0) {
    entradas[idx] = { ...entradas[idx], ...registro };
  } else {
    entradas.unshift(registro);
  }

  savels(STORAGE_KEY, entradas);
  return registro;
}

export function eliminarEntrada(id) {
  let entradas = obtenerEntradas();
  entradas = entradas.filter(e => e.id !== id);
  savels(STORAGE_KEY, entradas);
  return entradas;
}
