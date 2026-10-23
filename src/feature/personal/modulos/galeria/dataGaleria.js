// src/feature/personal/modulos/galeria/dataGaleria.js
// Gestor Canónico de Medios y Fotos para el Módulo Galería
// Sincronización Ultra Eficiente: Cloudflare R2 + Firestore 1 Read (galeria/principal) con serverTimestamp()
// Modelo Enriquecido: creado, actualizado, fechaSubida (YYYY-MM-DD), pin, estado, userId
// 100% JS Nativo · Integrado con @widev

import { getls, savels } from '@widev';
import { subirImagenR2 } from '@servicios/r2Storage.js';
import { db, auth } from '@servicios/firebase.js';
import semillasGaleria from '@semillas/galeria.json';

export const STORAGE_KEY = 'wi_galeria_media';
export const OLD_STORAGE_KEY = 'minegocio_galeria_media';
export const CACHE_KEY = 'wi_galeria_cache_key';
export const COLECCION_GALERIA = 'galeria';
export const DOC_GALERIA_ID = 'principal';
export const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos de frescura en caché local

const IMAGENES_SEMILLA = Array.isArray(semillasGaleria) ? semillasGaleria : [];

let _sincronizando = false;

export function obtenerUsuarioActualId() {
  if (auth?.currentUser?.uid) return auth.currentUser.uid;
  const smile = getls('wiSmile') || {};
  return smile.uid || smile.id || smile.usuario || '';
}

export function normalizarImagen(img = {}) {
  const ahoraIso = new Date().toISOString();
  const fechaHoy = ahoraIso.slice(0, 10);

  return {
    id: img.id || `img_${Date.now()}`,
    nombre: img.nombre || 'imagen.webp',
    titulo: img.titulo || 'Fotografía Oficial',
    alt: img.alt || (img.titulo ? `Fotografía de ${img.titulo}` : 'Fotografía Oficial'),
    url: img.url || '',
    categoria: img.categoria || 'otros',
    pesoKb: typeof img.pesoKb === 'number' ? img.pesoKb : 38,
    dimensiones: img.dimensiones || 'Optimizado WebP',
    pin: Boolean(img.pin),
    estado: img.estado || 'activo',
    userId: img.userId !== undefined ? img.userId : '',
    fechaSubida: img.fechaSubida || fechaHoy,
    creado: img.creado || ahoraIso,
    actualizado: img.actualizado || ahoraIso
  };
}

/**
 * Extrae las categorías únicas existentes de las imágenes (100% dinámico y reutilizable)
 */
export function obtenerCategoriasDisponibles() {
  const lista = obtenerImagenesGaleria(true);
  const categoriasSet = new Set(lista.map(i => i.categoria).filter(Boolean));
  categoriasSet.add('otros');
  return Array.from(categoriasSet);
}

/**
 * Ordenamiento Inteligente:
 * 1° Criterio: Imágenes con Pin = true arriba
 * 2° Criterio: Más recientemente modificada (campo actualizado / timestamp numérico) primero
 */
export function ordenarGaleria(arr = []) {
  return [...arr].sort((a, b) => {
    if (a.pin !== b.pin) return a.pin ? -1 : 1;

    const tiempoB = new Date(b.actualizado || b.creado || b.fechaSubida || 0).getTime();
    const tiempoA = new Date(a.actualizado || a.creado || a.fechaSubida || 0).getTime();
    if (tiempoB !== tiempoA) return tiempoB - tiempoA;

    return (b.id || '').localeCompare(a.id || '');
  });
}

/**
 * Retorna las imágenes al instante desde el almacenamiento local (0ms lag)
 * con soporte para pin, filtros y ordenación por último modificado.
 */
export function obtenerImagenesGaleria(incluirEliminadas = false) {
  const guardadas = getls(STORAGE_KEY) || getls(OLD_STORAGE_KEY);
  if (guardadas && Array.isArray(guardadas) && guardadas.length > 0) {
    // Si contiene formato de fecha viejo con texto ("Feb 2026"), autorreparar con las semillas de octubre
    const tieneFechasViejas = guardadas.some(img => img.fechaSubida && (img.fechaSubida.includes('Ene') || img.fechaSubida.includes('Feb')));
    if (!tieneFechasViejas) {
      // 🎯 Auto-actualización inteligente de semillas (pesos reales y URLs sin esperar Firestore)
      let huboCambios = false;
      const semillasMap = new Map(IMAGENES_SEMILLA.map(s => [s.id, s]));
      const sincronizadas = guardadas.map(img => {
        const semilla = semillasMap.get(img.id);
        if (semilla) {
          const urlDistinta = semilla.url !== img.url;
          const pesoDistinto = semilla.pesoKb !== img.pesoKb;
          if (urlDistinta || pesoDistinto) {
            huboCambios = true;
            return {
              ...img,
              url: semilla.url,
              pesoKb: semilla.pesoKb,
              dimensiones: semilla.dimensiones || img.dimensiones,
              actualizado: semilla.actualizado || img.actualizado
            };
          }
        }
        return img;
      });

      if (huboCambios) {
        savels(STORAGE_KEY, sincronizadas);
      }

      verificarSyncBackground();
      const normalizadas = (huboCambios ? sincronizadas : guardadas).map(normalizarImagen);
      const filtradas = incluirEliminadas ? normalizadas : normalizadas.filter(x => x.estado !== 'eliminado');
      return ordenarGaleria(filtradas);
    }
  }

  // Primera carga o autorreparación: semilla local de octubre y sincronización con Firestore
  const inicial = IMAGENES_SEMILLA.map(normalizarImagen);
  savels(STORAGE_KEY, inicial);
  verificarSyncBackground(true);
  const filtradas = incluirEliminadas ? inicial : inicial.filter(x => x.estado !== 'eliminado');
  return ordenarGaleria(filtradas);
}

/**
 * Sincronización Ultraligera de 1 SOLO READ a Firestore (galeria/principal)
 */
export async function sincronizarGaleriaConFirestore(forzar = false) {
  if (_sincronizando) return obtenerImagenesGaleria();

  const ahora = Date.now();
  const ultimoSync = parseInt(getls(CACHE_KEY) || '0', 10);

  if (!forzar && ultimoSync && (ahora - ultimoSync) < CACHE_TTL_MS) {
    return obtenerImagenesGaleria();
  }

  _sincronizando = true;
  try {
    const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const docRef = doc(db, COLECCION_GALERIA, DOC_GALERIA_ID);

    // 🎯 1 SOLO READ a Firestore:
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      const listaLocal = (getls(STORAGE_KEY) || IMAGENES_SEMILLA).map(normalizarImagen);
      await setDoc(docRef, {
        items: listaLocal,
        total: listaLocal.filter(x => x.estado !== 'eliminado').length,
        actualizado: serverTimestamp(),
        version: 1
      }, { merge: true });

      savels(CACHE_KEY, ahora.toString());
      return ordenarGaleria(listaLocal.filter(x => x.estado !== 'eliminado'));
    }

    const data = snap.data() || {};
    const itemsFirestore = (Array.isArray(data.items) ? data.items : []).map(normalizarImagen);

    // 🎯 Sincronización Inteligente:
    // Las semillas oficiales actualizadas (nuevos KB y URLs) refrescan automáticamente sus homólogos en Firestore
    let huboCambios = false;
    const semillasMap = new Map(IMAGENES_SEMILLA.map(s => [s.id, normalizarImagen(s)]));

    const itemsFusionados = itemsFirestore.map(item => {
      const semilla = semillasMap.get(item.id);
      if (semilla) {
        const urlDistinta = semilla.url !== item.url;
        const pesoDistinto = semilla.pesoKb !== item.pesoKb;
        if (urlDistinta || pesoDistinto) {
          huboCambios = true;
          return {
            ...item,
            url: semilla.url,
            pesoKb: semilla.pesoKb,
            dimensiones: semilla.dimensiones,
            actualizado: semilla.actualizado
          };
        }
      }
      return item;
    });

    const idsFirestore = new Set(itemsFusionados.map(i => i.id));
    const semillasFaltantes = IMAGENES_SEMILLA.filter(s => !idsFirestore.has(s.id)).map(normalizarImagen);
    if (semillasFaltantes.length > 0) huboCambios = true;

    const consolidado = [...itemsFusionados, ...semillasFaltantes];

    savels(STORAGE_KEY, consolidado);
    savels(CACHE_KEY, ahora.toString());

    // Si hubo cambios o se forzó manualmente (clic en botón Sincronizar), guardar de inmediato en Firestore (1 Write atómico)
    if (forzar || huboCambios) {
      await setDoc(docRef, {
        items: consolidado,
        total: consolidado.filter(x => x.estado !== 'eliminado').length,
        actualizado: serverTimestamp(),
        version: Date.now()
      }, { merge: true });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi:galeria:actualizada', { detail: consolidado }));
    }

    return ordenarGaleria(consolidado.filter(x => x.estado !== 'eliminado'));
  } catch (err) {
    console.warn('[dataGaleria] Sincronización Firestore (1 read):', err?.message || err);
    return obtenerImagenesGaleria();
  } finally {
    _sincronizando = false;
  }
}

function verificarSyncBackground(forzar = false) {
  if (typeof window === 'undefined') return;
  setTimeout(() => {
    sincronizarGaleriaConFirestore(forzar).catch(() => {});
  }, 200);
}

async function persistirGaleriaCompleta(lista) {
  savels(STORAGE_KEY, lista);
  savels(CACHE_KEY, Date.now().toString());

  try {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    await setDoc(doc(db, COLECCION_GALERIA, DOC_GALERIA_ID), {
      items: lista,
      total: lista.filter(x => x.estado !== 'eliminado').length,
      actualizado: serverTimestamp(),
      version: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn('[dataGaleria] Error al guardar en Firestore:', err?.message || err);
  }
}

/**
 * Sube el archivo físico a Cloudflare R2 y actualiza el array consolidado en Firestore (1 Write atómico)
 */
export async function procesarSubidaImagen(file, categoria = 'otros', titulo = '', alt = '', pin = false) {
  let urlPublica = '';
  let nombreArchivo = file.name || `media_${Date.now()}.webp`;

  try {
    const res = await subirImagenR2(file, titulo || 'galeria');
    if (res && res.url) {
      urlPublica = res.url;
      nombreArchivo = res.key || nombreArchivo;
    }
  } catch (err) {
    console.warn('[dataGaleria] Fallback local-first R2:', err?.message || err);
    urlPublica = URL.createObjectURL(file);
  }

  const ahoraIso = new Date().toISOString();
  const fechaHoy = ahoraIso.slice(0, 10);

  const nuevaImagen = normalizarImagen({
    id: `img_${Date.now()}`,
    nombre: nombreArchivo,
    titulo: titulo || file.name.replace(/\.[^/.]+$/, ''),
    alt: alt || (titulo ? `Fotografía de ${titulo}` : 'Fotografía Oficial'),
    url: urlPublica,
    categoria: categoria || 'otros',
    pesoKb: Math.round(file.size / 1024) || 38,
    dimensiones: 'Optimizado WebP',
    pin: Boolean(pin),
    estado: 'activo',
    userId: obtenerUsuarioActualId(),
    fechaSubida: fechaHoy,
    creado: ahoraIso,
    actualizado: ahoraIso
  });

  const lista = (getls(STORAGE_KEY) || IMAGENES_SEMILLA).map(normalizarImagen);
  lista.unshift(nuevaImagen);

  await persistirGaleriaCompleta(lista);
  return nuevaImagen;
}

/**
 * Actualiza completamente una imagen (título, categoría, ALT, pin) en 1 solo Write
 */
export async function actualizarImagenCompleta(id, cambios = {}) {
  const lista = (getls(STORAGE_KEY) || IMAGENES_SEMILLA).map(normalizarImagen);
  const idx = lista.findIndex(img => img.id === id);
  if (idx >= 0) {
    const ahoraIso = new Date().toISOString();
    lista[idx] = {
      ...lista[idx],
      ...cambios,
      id, // inmutable
      actualizado: ahoraIso
    };

    await persistirGaleriaCompleta(lista);
    return lista[idx];
  }
  return null;
}

export async function alternarPinImagen(id) {
  const lista = (getls(STORAGE_KEY) || IMAGENES_SEMILLA).map(normalizarImagen);
  const item = lista.find(img => img.id === id);
  if (item) {
    item.pin = !item.pin;
    item.actualizado = new Date().toISOString();
    await persistirGaleriaCompleta(lista);
    return item;
  }
  return null;
}

export async function actualizarAltImagen(id, nuevoAlt) {
  return actualizarImagenCompleta(id, { alt: nuevoAlt });
}

export async function eliminarImagenGaleria(id, borradoFisico = false) {
  const lista = (getls(STORAGE_KEY) || IMAGENES_SEMILLA).map(normalizarImagen);
  let nuevaLista;

  if (borradoFisico) {
    nuevaLista = lista.filter(img => img.id !== id);
  } else {
    // Soft delete canónico: estado = 'eliminado'
    nuevaLista = lista.map(img => {
      if (img.id === id) {
        return {
          ...img,
          estado: 'eliminado',
          actualizado: new Date().toISOString()
        };
      }
      return img;
    });
  }

  await persistirGaleriaCompleta(nuevaLista);
  return ordenarGaleria(nuevaLista.filter(x => x.estado !== 'eliminado'));
}
