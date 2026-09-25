// src/feature/personal/modulos/galeria/dataGaleria.js
// Gestor de Medios y Fotos para el Módulo Galería (Solgas Surquillo)
// Conectado al Bucket Cloudflare R2 ('gaswii-media') + Local-First Fallback
// 100% JS Nativo · Integrado con @widev

import { getls, savels } from '@widev';
import { subirImagenR2 } from '@/core/servicios/r2Storage.js';

const STORAGE_KEY = 'gaswii_galeria_media';

const IMAGENES_SEMILLA = [
  {
    id: 'img_balon_10kg',
    nombre: 'balon-solgas-10kg-premium.webp',
    titulo: 'Balón SOLGAS Premium 10 kg',
    alt: 'Balón de gas SOLGAS Premium 10 kg con precinto de seguridad para delivery en Surquillo',
    url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
    categoria: 'balones',
    pesoKb: 142,
    dimensiones: '800x800',
    fechaSubida: '24 Sep 2026'
  },
  {
    id: 'img_balon_45kg',
    nombre: 'balon-solgas-45kg-industrial.webp',
    titulo: 'Balón SOLGAS Industrial 45 kg',
    alt: 'Balón SOLGAS Industrial de 45 kg para restaurantes y comercios en Surquillo y Miraflores',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80',
    categoria: 'balones',
    pesoKb: 215,
    dimensiones: '800x800',
    fechaSubida: '22 Sep 2026'
  },
  {
    id: 'img_sede_dante',
    nombre: 'sede-solgas-dante-surquillo.webp',
    titulo: 'Sede Principal Jr. Dante 260',
    alt: 'Fachada del local oficial Solgas Surquillo en Jr. Dante 260, almacén de balones y atención rápida',
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80',
    categoria: 'sede',
    pesoKb: 185,
    dimensiones: '1200x800',
    fechaSubida: '20 Sep 2026'
  },
  {
    id: 'img_moto_delivery',
    nombre: 'flota-moto-reparto-surquillo.webp',
    titulo: 'Unidad de Reparto Motorizado',
    alt: 'Repartidor de Solgas Surquillo con balanza digital calibrada Inacal para entrega en 15 minutos',
    url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
    categoria: 'delivery',
    pesoKb: 198,
    dimensiones: '1000x750',
    fechaSubida: '19 Sep 2026'
  },
  {
    id: 'img_regulador_premium',
    nombre: 'regulador-click-on-gaswii.webp',
    titulo: 'Regulador Premium Click-On',
    alt: 'Regulador de gas GLP tipo Click-On con válvula de seguridad y corte automático de flujo',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    categoria: 'accesorios',
    pesoKb: 120,
    dimensiones: '600x600',
    fechaSubida: '18 Sep 2026'
  },
  {
    id: 'img_banner_promo',
    nombre: 'banner-promocion-surquillo.webp',
    titulo: 'Banner Promo Gaswii Surquillo',
    alt: 'Banner publicitario oficial de Solgas Surquillo con precio del balón de gas y delivery express',
    url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80',
    categoria: 'banners',
    pesoKb: 245,
    dimensiones: '1200x630',
    fechaSubida: '15 Sep 2026'
  }
];

export function obtenerImagenesGaleria() {
  const guardadas = getls(STORAGE_KEY);
  if (guardadas && Array.isArray(guardadas) && guardadas.length > 0) {
    return guardadas;
  }
  savels(STORAGE_KEY, IMAGENES_SEMILLA);
  return IMAGENES_SEMILLA;
}

export async function procesarSubidaImagen(file, categoria = 'balones', titulo = '', alt = '') {
  let urlPublica = '';
  let nombreArchivo = file.name || `media_${Date.now()}.webp`;

  try {
    // Intentar subida nativa a Cloudflare R2
    const res = await subirImagenR2(file, titulo || 'gaswii');
    if (res && res.url) {
      urlPublica = res.url;
    }
  } catch (err) {
    console.warn('Fallback a URL local-first (R2 offline o sin credenciales locales):', err.message);
    urlPublica = URL.createObjectURL(file);
  }

  const nuevaImagen = {
    id: `img_${Date.now()}`,
    nombre: nombreArchivo,
    titulo: titulo || file.name.replace(/\.[^/.]+$/, ''),
    alt: alt || `Imagen de ${titulo || 'Solgas Surquillo'}`,
    url: urlPublica,
    categoria: categoria || 'balones',
    pesoKb: Math.round(file.size / 1024) || 120,
    dimensiones: 'Optimizado WebP',
    fechaSubida: 'Hoy'
  };

  const lista = obtenerImagenesGaleria();
  lista.unshift(nuevaImagen);
  savels(STORAGE_KEY, lista);
  return nuevaImagen;
}

export function actualizarAltImagen(id, nuevoAlt) {
  const lista = obtenerImagenesGaleria();
  const idx = lista.findIndex(img => img.id === id);
  if (idx >= 0) {
    lista[idx].alt = nuevoAlt;
    savels(STORAGE_KEY, lista);
    return lista[idx];
  }
  return null;
}

export function eliminarImagenGaleria(id) {
  let lista = obtenerImagenesGaleria();
  lista = lista.filter(img => img.id !== id);
  savels(STORAGE_KEY, lista);
  return lista;
}
