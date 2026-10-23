// src/feature/personal/modulos/blogs/dataBlogs.js
// 🎯 Gestor Canónico Local-First para Módulo Blogs
// Fuente Canónica: Semilla src/semillas/blogs.json · Local-First (0ms)
import { getls, savels } from '@widev';
import blogsSemilla from '../../../../semillas/blogs.json';
import { slugify, countWords } from '../../../blog/lib/procesarmd.js';
import { actualizarCentral, eliminarCentral } from '@core/servicios/actualizar.js';
import { datosNegocio } from '@/negocio.js';

export const STORAGE_KEY = 'wi_blogs_data_v3';

// Memoria volátil en sesión
let _memoriaBlogs = null;

/**
 * Normaliza un artículo de blog al esquema unificado Workwii
 */
export function normalizarBlog(p = {}) {
  const wordsInfo = countWords(p.contenidoMD || p.contenido || '');
  const ahora = Date.now();
  const fechaHoy = new Date().toISOString().split('T')[0];

  return {
    id: p.id || `art-${Date.now()}-${slugify(p.titulo || 'post').slice(0, 16)}`,
    slug: slugify(p.slug || p.titulo || 'articulo'),
    lang: p.lang || 'es',
    langId: p.langId || null,
    activo: p.activo !== false,
    pin: Boolean(p.pin),
    userId: p.userId || '',
    autor: p.autor || datosNegocio.identidad?.nombreCorto || datosNegocio.nombre || 'Redacción',
    titulo: p.titulo || 'Sin Título',
    descripcion: p.descripcion || '',
    categoria: p.categoria || 'General',
    imagen: p.imagen || datosNegocio.hero?.imagen || '/smile.avif',
    imagenTop: p.imagenTop || p.imagen || datosNegocio.hero?.imagen || '/smile.avif',
    tags: Array.isArray(p.tags) ? p.tags : [],
    vistas: Number(p.vistas || 0),
    likes: Number(p.likes || 0),
    lecturaTM: p.lecturaTM || `${wordsInfo.min} min`,
    creado: typeof p.creado === 'number' ? p.creado : ahora,
    publicado: p.publicado || fechaHoy,
    actualizado: typeof p.actualizado === 'number' ? p.actualizado : ahora,
    metaSEO: {
      keywords: p.metaSEO?.keywords || (Array.isArray(p.tags) ? p.tags.join(', ') : ''),
      alt: p.metaSEO?.alt || p.titulo || ''
    },
    contenido: p.contenido || p.contenidoMD || '',
    contenidoMD: p.contenidoMD || p.contenido || ''
  };
}

/**
 * Obtiene todos los artículos (Local-First con fallback a blogs.json)
 */
export function obtenerBlogs(force = false) {
  if (_memoriaBlogs && !force) return _memoriaBlogs;

  if (!force) {
    try {
      const local = getls(STORAGE_KEY);
      if (Array.isArray(local) && local.length > 0) {
        _memoriaBlogs = local.map(normalizarBlog);
        return _memoriaBlogs;
      }
    } catch (e) {
      console.warn('[dataBlogs] Error al leer localStorage:', e);
    }
  }

  // Fallback a la semilla
  _memoriaBlogs = (blogsSemilla || []).map(normalizarBlog);
  savels(STORAGE_KEY, _memoriaBlogs);
  return _memoriaBlogs;
}

/**
 * Sincroniza y recarga forzosamente los artículos desde el archivo JSON de semillas
 */
export function sincronizarConSemilla() {
  return obtenerBlogs(true);
}

/**
 * Guarda o actualiza un artículo de blog
 */
export function guardarBlog(blogData = {}) {
  const blogs = obtenerBlogs();
  const normalizado = normalizarBlog(blogData);
  normalizado.actualizado = Date.now();

  const idx = blogs.findIndex(b => b.id === normalizado.id || (normalizado.id && b.slug === normalizado.slug && b.id !== normalizado.id));

  let actualizados;
  if (idx >= 0) {
    blogs[idx] = { ...blogs[idx], ...normalizado };
    actualizados = [...blogs];
  } else {
    actualizados = [normalizado, ...blogs];
  }

  _memoriaBlogs = actualizados;
  savels(STORAGE_KEY, actualizados);

  // Vincular bidireccionalmente el langId con el post hermano si fue seleccionado
  if (normalizado.langId) {
    const hermanoIdx = actualizados.findIndex(b => b.id === normalizado.langId);
    if (hermanoIdx >= 0 && actualizados[hermanoIdx].langId !== normalizado.id) {
      actualizados[hermanoIdx].langId = normalizado.id;
      savels(STORAGE_KEY, actualizados);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wi:blogs-actualizado', { detail: actualizados }));
  }

  // Sincronización universal (Local-First + Firestore + Cloudflare Deploy con Dock)
  actualizarCentral({
    modulo: 'blogs',
    coleccion: 'blogs',
    docId: normalizado.id,
    storageKey: STORAGE_KEY,
    evento: 'wi:blogs-actualizado',
    datos: normalizado,
    listaStorage: actualizados,
    redeploy: true,
    mensajeExito: `Artículo "${normalizado.titulo}" publicado con éxito`
  });

  return normalizado;
}

/**
 * Elimina un artículo por su ID
 */
export function eliminarBlog(id) {
  const blogs = obtenerBlogs();
  const filtrados = blogs.filter(b => b.id !== id);
  _memoriaBlogs = filtrados;
  savels(STORAGE_KEY, filtrados);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wi:blogs-actualizado', { detail: filtrados }));
  }

  eliminarCentral({
    modulo: 'blogs',
    coleccion: 'blogs',
    docId: id,
    storageKey: STORAGE_KEY,
    evento: 'wi:blogs-actualizado',
    listaActualizada: filtrados,
    redeploy: true,
    mensajeExito: 'Artículo eliminado con éxito'
  });

  return true;
}

/**
 * Alterna el estado Pin (destacado)
 */
export function togglePinBlog(id) {
  const blogs = obtenerBlogs();
  const b = blogs.find(x => x.id === id);
  if (b) {
    b.pin = !b.pin;
    b.actualizado = Date.now();
    savels(STORAGE_KEY, blogs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi:blogs-actualizado', { detail: blogs }));
    }
    return b.pin;
  }
  return false;
}

/**
 * Alterna el estado Activo / Borrador
 */
export function toggleActivoBlog(id) {
  const blogs = obtenerBlogs();
  const b = blogs.find(x => x.id === id);
  if (b) {
    b.activo = !b.activo;
    b.actualizado = Date.now();
    savels(STORAGE_KEY, blogs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi:blogs-actualizado', { detail: blogs }));
    }
    return b.activo;
  }
  return false;
}

/**
 * Obtiene publicaciones del idioma opuesto para el selector langId
 */
export function obtenerPostsOpuestos(langActual = 'es') {
  const blogs = obtenerBlogs();
  return blogs.filter(b => b.lang !== langActual && b.activo);
}

/**
 * Exporta el catálogo actual de blogs como JSON descargable para actualizar src/semillas/blogs.json
 */
export function descargarSemillaBlogs() {
  if (typeof window === 'undefined') return;
  const blogs = obtenerBlogs();
  const blob = new Blob([JSON.stringify(blogs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'blogs.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
