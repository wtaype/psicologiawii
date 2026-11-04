// src/feature/personal/modulos/blogs/dataBlogs.js
// 🎯 Gestor Canónico Local-First para Módulo Blogs
// Fuente Canónica: Semilla src/semillas/blogs.json · Local-First (0ms)
import { getls, savels } from '@widev';
import blogsSemilla from '../../../../semillas/blogs.json';
import { slugify, countWords, mdToHtml } from '../../../blog/lib/procesarmd.js';
import { actualizarCentral, eliminarCentral } from '@core/servicios/actualizar.js';
import { datosNegocio } from '@/negocio.js';

export const STORAGE_KEY = 'wi_blogs_data_v8';
export const SEED_FP_KEY = 'wi_blogs_seed_fp';

// Memoria volátil en sesión
let _memoriaBlogs = null;

/**
 * Convierte dinámicamente un objeto/map o array a una lista iterable de blogs
 */
export function arrayizarBlogs(datos) {
  if (!datos) return [];
  if (Array.isArray(datos)) return datos;
  if (typeof datos === 'object') {
    return Object.keys(datos).map(key => ({
      ...datos[key],
      id: datos[key].id || key
    }));
  }
  return [];
}

/**
 * Resuelve la URL completa y absoluta de un recurso/imagen
 */
export function resolverUrlCompleta(ruta = '') {
  if (!ruta) return '';
  if (/^https?:\/\//i.test(ruta)) return ruta;
  const origen = (typeof window !== 'undefined' && window.location.origin) 
    ? window.location.origin 
    : 'http://localhost:4321';
  const rutaLimpia = ruta.startsWith('/') ? ruta : `/${ruta}`;
  return `${origen}${rutaLimpia}`;
}

/**
 * Genera un UID alfanumérico único para el cluster de traducción (estilo Firebase push ID)
 * ej: "cl_k7b9mX2pLq9v1Rt3Wz"
 */
export function generarClusterUid() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 8);
  return `cl_${timestamp}_${randomPart}`;
}

/**
 * Genera el siguiente ID numérico único de 8 dígitos (ej: "00000001", "00000002")
 * Si hay 5 blogs, genera automáticamente "00000006"
 */
export function generarSiguientePostId(blogs = []) {
  const lista = (blogs && blogs.length) ? blogs : (obtenerBlogs() || []);
  const nums = lista
    .map(b => parseInt(b.postId || b.id, 10))
    .filter(n => !isNaN(n) && n > 0);
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return String(max + 1).padStart(8, '0');
}
export const generarSiguienteBlogId = generarSiguientePostId;

/**
 * Valida si un ID numérico de 8 dígitos está disponible o ya está ocupado por otro artículo
 */
export function validarDisponibilidadPostId(candidateId = '', postActualId = '') {
  const limpia = String(candidateId || '').trim();
  if (!limpia) {
    return { disponible: false, idNormalizado: '', mensaje: 'El ID no puede estar vacío.' };
  }
  if (!/^\d{1,8}$/.test(limpia)) {
    return { disponible: false, idNormalizado: limpia, mensaje: 'El ID debe contener solo dígitos numéricos (máx. 8 dígitos).' };
  }

  const idNormalizado = limpia.padStart(8, '0');
  const blogs = obtenerBlogs();
  const ocupado = blogs.find(b => {
    const bId = String(b.postId || b.id || '').padStart(8, '0');
    const actualId = String(postActualId || '').padStart(8, '0');
    return bId === idNormalizado && bId !== actualId;
  });

  if (ocupado) {
    return {
      disponible: false,
      idNormalizado,
      mensaje: `El ID ${idNormalizado} ya está en uso por: "${ocupado.titulo}" ([${(ocupado.lang || 'es').toUpperCase()}])`,
      postExistente: ocupado
    };
  }

  return {
    disponible: true,
    idNormalizado,
    mensaje: `✓ ID ${idNormalizado} disponible.`
  };
}

/**
 * Normaliza un artículo de blog al esquema unificado Workwii con postId de 8 dígitos y langId como Cluster UID alfanumérico
 */
export function normalizarBlog(p = {}) {
  const md = p.contenidoMD || p.contenido || '';
  const wordsInfo = countWords(md);
  const ahora = Date.now();
  const fechaHoy = new Date().toISOString().split('T')[0].replace(/-/g, '/'); // YYYY/MM/DD

  const idRaw = p.postId || p.id;
  let idFinal = idRaw ? String(idRaw).padStart(8, '0') : generarSiguientePostId(_memoriaBlogs || arrayizarBlogs(blogsSemilla) || []);
  if (/^\d+$/.test(String(idFinal))) {
    idFinal = String(idFinal).padStart(8, '0');
  }

  // Pre-renderizado HTML instantáneo para Web (0ms)
  let html = p.contenido || '';
  if (!html || !html.includes('<h2')) {
    html = mdToHtml(md, p.lang || 'es');
  }

  // Formato internacional de fecha YYYY/MM/DD
  const publicadoISO = (p.publicado || fechaHoy).toString().replace(/-/g, '/');

  // Normalización de keywords como array
  let keywordsList = [];
  if (Array.isArray(p.keywords)) {
    keywordsList = p.keywords;
  } else if (typeof p.keywords === 'string' && p.keywords.trim()) {
    keywordsList = p.keywords.split(',').map(s => s.trim()).filter(Boolean);
  } else if (p.metaSEO?.keywords) {
    keywordsList = p.metaSEO.keywords.split(',').map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(p.tags)) {
    keywordsList = [...p.tags];
  }

  // Cluster UID compartido para versiones multilingües
  const clusterUid = (p.langId && String(p.langId).trim()) ? String(p.langId).trim() : generarClusterUid();

  // Autor y Categoría dinámicos (100% agnóstico y reutilizable para cualquier proyecto)
  const autorDinamico = p.autor || datosNegocio.especialista || datosNegocio.nombre || 'Autor';
  const categoriaDinamica = p.categoria || 'General';

  return {
    id: String(idFinal),
    postId: String(idFinal),
    slug: slugify(p.slug || p.titulo || 'articulo'),
    lang: p.lang || 'es',
    langId: clusterUid,
    activo: p.activo !== false,
    pin: Boolean(p.pin),
    userId: p.userId || '',
    autor: autorDinamico,
    titulo: p.titulo || 'Sin Título',
    descripcion: p.descripcion || '',
    categoria: categoriaDinamica,
    imagen: p.imagen || '/smile.avif',
    imagenTop: p.imagenTop || p.imagen || '/smile.avif',
    tags: Array.isArray(p.tags) ? p.tags : [],
    keywords: keywordsList,
    vistas: Number(p.vistas || 0),
    likes: Number(p.likes || 0),
    lecturaTM: p.lecturaTM || `${wordsInfo.min} min`,
    creado: typeof p.creado === 'number' ? p.creado : ahora,
    publicado: publicadoISO,
    actualizado: typeof p.actualizado === 'number' ? p.actualizado : ahora,
    contenido: html,
    contenidoMD: md
  };
}

/**
 * Calcula la huella única de las semillas para auto-detección instantánea de cambios en blogs.json
 */
function calcularSeedFingerprint() {
  try {
    const keys = Object.keys(blogsSemilla || {}).sort();
    return keys.map(k => `${k}:${blogsSemilla[k]?.actualizado || blogsSemilla[k]?.creado || ''}`).join('|');
  } catch(e) {
    return 'seed_v1';
  }
}

/**
 * Obtiene todos los artículos (Local-First con auto-detección de cambios en semillas)
 */
export function obtenerBlogs(force = false) {
  if (_memoriaBlogs && !force) return _memoriaBlogs;

  const currentSeedFp = calcularSeedFingerprint();
  const semillas = arrayizarBlogs(blogsSemilla).map(normalizarBlog);
  const seedIdsSet = new Set(semillas.map(s => String(s.postId || s.id)));

  if (!force) {
    try {
      const storedSeedFp = getls(SEED_FP_KEY);
      const local = getls(STORAGE_KEY);
      const listaLocal = arrayizarBlogs(local);

      if (listaLocal.length > 0) {
        // Si la huella de la semilla coincide, usar caché local (0ms)
        if (storedSeedFp === currentSeedFp) {
          _memoriaBlogs = listaLocal.map(normalizarBlog);
          return _memoriaBlogs;
        }

        // Reconciliación automática ante cambios en blogs.json:
        // 1. Conservar semillas frescas actuales
        const listaReconciliada = [];
        semillas.forEach(s => {
          const id = String(s.postId || s.id);
          const localMatch = listaLocal.find(l => String(l.postId || l.id) === id);
          if (localMatch) {
            listaReconciliada.push(normalizarBlog({
              ...s,
              vistas: localMatch.vistas !== undefined ? localMatch.vistas : s.vistas,
              likes: localMatch.likes !== undefined ? localMatch.likes : s.likes
            }));
          } else {
            listaReconciliada.push(s);
          }
        });

        // 2. Conservar posts creados/traducidos por el usuario que no son semillas
        listaLocal.forEach(l => {
          const id = String(l.postId || l.id);
          if (!seedIdsSet.has(id)) {
            listaReconciliada.push(normalizarBlog(l));
          }
        });

        _memoriaBlogs = listaReconciliada;
        savels(STORAGE_KEY, _memoriaBlogs);
        savels(SEED_FP_KEY, currentSeedFp);
        return _memoriaBlogs;
      }
    } catch (e) {
      console.warn('[dataBlogs] Error al leer localStorage:', e);
    }
  }

  // Fallback o carga inicial forzada
  _memoriaBlogs = semillas;
  savels(STORAGE_KEY, _memoriaBlogs);
  savels(SEED_FP_KEY, currentSeedFp);
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

  // Sincronización del Cluster de Traducción (langId compartido entre idiomas)
  if (normalizado.langId) {
    // Si normalizado.langId apuntaba a un ID numérico de otro post para vincular
    const postHermano = actualizados.find(b => (b.id === normalizado.langId || b.postId === normalizado.langId) && b.id !== normalizado.id);
    if (postHermano) {
      const targetClusterUid = (postHermano.langId && postHermano.langId.startsWith('cl_'))
        ? postHermano.langId
        : ((normalizado.langId && normalizado.langId.startsWith('cl_')) ? normalizado.langId : generarClusterUid());
      
      normalizado.langId = targetClusterUid;
      postHermano.langId = targetClusterUid;
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

  // Desvincular hermano recíprocamente si existía
  const hermanoIdx = filtrados.findIndex(b => b.langId === id);
  if (hermanoIdx >= 0) {
    filtrados[hermanoIdx].langId = null;
    savels(STORAGE_KEY, filtrados);
  }

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
    listaStorage: filtrados,
    redeploy: true,
    mensajeExito: 'Artículo eliminado correctamente'
  });

  return filtrados;
}

/**
 * Cambia el estado publicado/borrador de un artículo
 */
export function toggleActivoBlog(id) {
  const blogs = obtenerBlogs();
  const post = blogs.find(b => b.id === id);
  if (!post) return null;
  post.activo = !post.activo;
  return guardarBlog(post);
}

/**
 * Cambia el estado fijado (pin) de un artículo
 */
export function togglePinBlog(id) {
  const blogs = obtenerBlogs();
  const post = blogs.find(b => b.id === id);
  if (!post) return null;
  post.pin = !post.pin;
  return guardarBlog(post);
}

/**
 * Vincula dos o más artículos a un mismo Cluster UID de traducción compartido
 */
export function vincularPostsCluster(postAId, postBId) {
  const blogs = obtenerBlogs();
  const postA = blogs.find(b => b.id === postAId || b.postId === postAId);
  const postB = blogs.find(b => b.id === postBId || b.postId === postBId);
  if (!postA || !postB) return false;

  const clusterUid = (postA.langId && postA.langId.startsWith('cl_'))
    ? postA.langId
    : ((postB.langId && postB.langId.startsWith('cl_')) ? postB.langId : generarClusterUid());

  postA.langId = clusterUid;
  postB.langId = clusterUid;
  savels(STORAGE_KEY, blogs);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wi:blogs-actualizado', { detail: blogs }));
  }
  return clusterUid;
}

/**
 * Desvincula un artículo de su cluster, asignándole un nuevo cluster UID propio
 */
export function desvincularPostCluster(postId) {
  const blogs = obtenerBlogs();
  const post = blogs.find(b => b.id === postId || b.postId === postId);
  if (!post) return null;

  post.langId = generarClusterUid();
  savels(STORAGE_KEY, blogs);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wi:blogs-actualizado', { detail: blogs }));
  }
  return post.langId;
}

/**
 * Obtiene los artículos en idiomas opuestos al idioma actual para vincular
 */
export function obtenerPostsOpuestos(langActual = 'es') {
  const blogs = obtenerBlogs();
  return blogs.filter(b => (b.lang || 'es') !== langActual);
}

/**
 * Exporta el catálogo en formato Map u Objeto para fácil integración
 */
export function exportarBlogsMap() {
  const blogs = obtenerBlogs();
  const mapa = {};
  blogs.forEach(b => {
    mapa[b.id] = b;
  });
  return mapa;
}
