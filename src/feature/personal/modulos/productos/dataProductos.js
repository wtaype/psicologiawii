// src/feature/personal/modulos/productos/dataProductos.js
// 🎯 Capa Canónica Local-First de Productos: 100% Directo de Firebase Firestore + Caché
// Colección: 'productos' · Cero Semillas / Cero Datos Falsos Quemados
// Integrado con @widev y Firebase SDK

import { savels, getls } from '@widev';
import { db } from '@core/servicios/firebase.js';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

export const STORAGE_KEY = 'gaswii_productos';
export const COLECCION_PRODUCTOS = 'productos';

// Parser ultraligero de campos de la REST API de Firestore (para build-time SSG)
export function parseFirestoreDoc(fields = {}) {
  const res = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue !== undefined) res[k] = v.stringValue;
    else if (v.integerValue !== undefined) res[k] = parseInt(v.integerValue, 10);
    else if (v.doubleValue !== undefined) res[k] = parseFloat(v.doubleValue);
    else if (v.booleanValue !== undefined) res[k] = v.booleanValue;
    else if (v.timestampValue !== undefined) res[k] = v.timestampValue;
    else if (v.mapValue) res[k] = parseFirestoreDoc(v.mapValue.fields || {});
    else if (v.arrayValue) {
      res[k] = (v.arrayValue.values || []).map(item => {
        if (item.mapValue) return parseFirestoreDoc(item.mapValue.fields || {});
        if (item.stringValue !== undefined) return item.stringValue;
        return Object.values(item)[0];
      });
    }
  }
  return res;
}

// Generador de ID y Slug amigable
export function generarSlug(texto = '') {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Normalizador neutro de estructura de Producto (asegura llaves mínimas SIN inyectar datos falsos)
export function normalizarProducto(p = {}) {
  const prod = p && typeof p === 'object' ? p : {};
  const es = prod.nombre?.es || (typeof prod.nombre === 'string' ? prod.nombre : '');
  const idDefault = prod.id || (es ? generarSlug(es) : '');

  // Formato para arrays de garantías
  const garantiasEs = Array.isArray(prod.garantias?.es)
    ? prod.garantias.es
    : (Array.isArray(prod.garantias) ? prod.garantias : []);
  const garantiasEn = Array.isArray(prod.garantias?.en)
    ? prod.garantias.en
    : [];

  return {
    id: String(idDefault),
    slug: String(prod.slug || idDefault),
    estado: prod.estado === 'pausado' ? 'pausado' : 'activo',
    pin: Boolean(prod.pin),
    orden: Number(prod.orden ?? 1),
    precio: Number(prod.precio ?? (prod.price ?? 0)),
    precioEnvase: Number(prod.precioEnvase ?? 0),
    stock: Number(prod.stock ?? 0),
    stockMin: Number(prod.stockMin ?? 5),
    imagen: String(prod.imagen || '/imgwii/productos/BALON-10KG.webp'),
    badgeIcon: String(prod.badgeIcon || 'fa-solid fa-star'),
    tagClase: String(prod.tagClase || 'badge-fire'),
    tipoCategoria: String(prod.tipoCategoria || 'gas'),
    userId: String(prod.userId || ''),
    email: String(prod.email || ''),
    creado: prod.creado || null,
    actualizado: prod.actualizado || null,

    // Mapas Bilingües Oficiales
    nombre: {
      es: String(prod.nombre?.es || (typeof prod.nombre === 'string' ? prod.nombre : '')),
      en: String(prod.nombre?.en || '')
    },
    descripcion: {
      es: String(prod.descripcion?.es || (typeof prod.descripcion === 'string' ? prod.descripcion : '')),
      en: String(prod.descripcion?.en || '')
    },
    delivery: {
      es: String(prod.delivery?.es || 'Todo Incluido, despacho en puerta'),
      en: String(prod.delivery?.en || 'All-Inclusive, doorstep delivery')
    },
    peso: {
      es: String(prod.peso?.es || ''),
      en: String(prod.peso?.en || '')
    },
    pesoFull: {
      es: String(prod.pesoFull?.es || ''),
      en: String(prod.pesoFull?.en || '')
    },
    seguridad: {
      es: String(prod.seguridad?.es || 'Garantía desde planta de Solgas'),
      en: String(prod.seguridad?.en || 'Guaranteed from Solgas plant')
    },
    tipo: {
      es: String(prod.tipo?.es || 'Balón'),
      en: String(prod.tipo?.en || 'Cylinder')
    },
    tipoUso: {
      es: String(prod.tipoUso?.es || 'Hogar'),
      en: String(prod.tipoUso?.en || 'Household Use')
    },
    valvula: {
      es: String(prod.valvula?.es || 'Click-On (Acople Rápido)'),
      en: String(prod.valvula?.en || 'Click-On (Quick Connect) Valve')
    },
    garantias: {
      es: garantiasEs,
      en: garantiasEn
    }
  };
}

/**
 * Aplana un producto bilingüe a un solo idioma para consumo directo en plantillas o vistas
 */
export function aplanarProducto(prod, idioma = 'es') {
  if (!prod) return null;
  const p = normalizarProducto(prod);
  const lang = idioma === 'en' ? 'en' : 'es';

  return {
    ...p,
    nombre: p.nombre[lang] || p.nombre.es || '',
    descripcion: p.descripcion[lang] || p.descripcion.es || '',
    delivery: p.delivery[lang] || p.delivery.es || '',
    peso: p.peso[lang] || p.peso.es || '',
    pesoFull: p.pesoFull[lang] || p.pesoFull.es || '',
    seguridad: p.seguridad[lang] || p.seguridad.es || '',
    tipo: p.tipo[lang] || p.tipo.es || '',
    tipoUso: p.tipoUso[lang] || p.tipoUso.es || '',
    valvula: p.valvula[lang] || p.valvula.es || '',
    garantias: (p.garantias[lang] && p.garantias[lang].length > 0) ? p.garantias[lang] : p.garantias.es
  };
}

// Lectura en tiempo de compilación (Astro SSG / Cloudflare Build) directamente desde la REST API
let _productosBuildFirestore = null;
if (typeof window === 'undefined') {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://firestore.googleapis.com/v1/projects/gaswii/databases/(default)/documents/productos', {
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.documents)) {
        _productosBuildFirestore = json.documents.map(d => {
          const id = d.name.split('/').pop();
          const parsed = parseFirestoreDoc(d.fields || {});
          return normalizarProducto({ id, ...parsed });
        });
      }
    }
  } catch (err) {
    console.warn('[dataProductos] Build-time Firestore fetch:', err?.message || err);
  }
}

let _memoriaProductos = null;

export function getUsuarioActivo() {
  const u = getls('wiSmile') || {};
  return {
    userId: u.uid || u.id || '',
    email: u.email || '',
    autor: u.nombre || u.usuario || ''
  };
}

/**
 * Obtiene los productos almacenados en memoria o en la caché local (Local-First).
 * CERO semillas: Si no hay productos, retorna [].
 */
export function obtenerProductosLocal() {
  if (_memoriaProductos && Array.isArray(_memoriaProductos)) {
    return _memoriaProductos;
  }

  // 1. En el cliente: Revisar localStorage
  try {
    const local = getls(STORAGE_KEY);
    if (Array.isArray(local)) {
      _memoriaProductos = local.map(normalizarProducto);
      return _memoriaProductos;
    }
  } catch (e) {}

  // 2. En Node (build time de Cloudflare/Astro): usar datos de Firestore REST
  if (_productosBuildFirestore && Array.isArray(_productosBuildFirestore)) {
    _memoriaProductos = _productosBuildFirestore;
    return _memoriaProductos;
  }

  // 3. Vacío si no se ha cargado aún
  _memoriaProductos = [];
  return _memoriaProductos;
}

/**
 * Guarda la lista de productos en caché local y emite evento global
 */
export function guardarProductosLocal(lista = []) {
  try {
    const normalizados = (Array.isArray(lista) ? lista : []).map(normalizarProducto);
    _memoriaProductos = normalizados;
    savels(STORAGE_KEY, normalizados);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gaswii:productos-actualizados', { detail: normalizados }));
    }
  } catch (e) {}
}

/**
 * Consulta Firestore en tiempo real (Cliente) para obtener todos los productos.
 * Actualiza la caché local automáticamente.
 */
export async function sincronizarProductosFirestore() {
  if (!db) return obtenerProductosLocal();
  try {
    const colRef = collection(db, COLECCION_PRODUCTOS);
    const snap = await getDocs(colRef);
    const prods = [];
    snap.forEach(docSnap => {
      prods.push(normalizarProducto({ id: docSnap.id, ...docSnap.data() }));
    });

    // Ordenar por campo 'orden' ascendente o por 'id'
    prods.sort((a, b) => (a.orden || 999) - (b.orden || 999));

    guardarProductosLocal(prods);
    return prods;
  } catch (err) {
    console.warn('[dataProductos] Error al consultar Firestore:', err?.message || err);
    return obtenerProductosLocal();
  }
}

/**
 * Guarda o crea un producto en Firestore y en caché local
 */
export async function guardarProductoFirestore(productoData) {
  const usuario = getUsuarioActivo();
  const rawId = productoData.id || generarSlug(productoData.nombre?.es || 'producto');
  const idFinal = rawId.trim();

  const productoLimpio = normalizarProducto({
    ...productoData,
    id: idFinal,
    slug: productoData.slug || idFinal,
    userId: usuario.userId || productoData.userId || '',
    email: usuario.email || productoData.email || ''
  });

  // Guardar inmediatamente en caché local
  const listaActual = obtenerProductosLocal();
  const idx = listaActual.findIndex(p => p.id === idFinal);
  let listaNueva = [];
  if (idx >= 0) {
    listaNueva = [...listaActual];
    listaNueva[idx] = productoLimpio;
  } else {
    listaNueva = [...listaActual, productoLimpio];
  }
  guardarProductosLocal(listaNueva);

  // Sincronizar con Firestore
  if (db) {
    try {
      const docRef = doc(db, COLECCION_PRODUCTOS, idFinal);
      const payload = {
        ...productoLimpio,
        actualizado: serverTimestamp()
      };
      if (idx < 0) {
        payload.creado = serverTimestamp();
      }
      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.error('[dataProductos] Error al guardar en Firestore:', err);
      throw err;
    }
  }

  return productoLimpio;
}

/**
 * Cambia el estado (activo / pausado) de un producto con sincronización inmediata
 */
export async function cambiarEstadoProducto(id, nuevoEstado) {
  const estadoValido = nuevoEstado === 'pausado' ? 'pausado' : 'activo';
  const lista = obtenerProductosLocal();
  const prod = lista.find(p => p.id === id);
  if (!prod) return false;

  prod.estado = estadoValido;
  guardarProductosLocal(lista);

  if (db) {
    try {
      const docRef = doc(db, COLECCION_PRODUCTOS, id);
      await updateDoc(docRef, {
        estado: estadoValido,
        actualizado: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.warn('[dataProductos] Error cambiando estado:', err);
    }
  }
  return true;
}

/**
 * Actualiza rápidamente precio y stock desde las tarjetas del panel
 */
export async function actualizarPrecioYStock(id, { precio, stock, precioEnvase, stockMin }) {
  const lista = obtenerProductosLocal();
  const prod = lista.find(p => p.id === id);
  if (!prod) return false;

  if (precio !== undefined) prod.precio = Number(precio);
  if (stock !== undefined) prod.stock = Number(stock);
  if (precioEnvase !== undefined) prod.precioEnvase = Number(precioEnvase);
  if (stockMin !== undefined) prod.stockMin = Number(stockMin);

  guardarProductosLocal(lista);

  if (db) {
    try {
      const docRef = doc(db, COLECCION_PRODUCTOS, id);
      const updates = { actualizado: serverTimestamp() };
      if (precio !== undefined) updates.precio = Number(precio);
      if (stock !== undefined) updates.stock = Number(stock);
      if (precioEnvase !== undefined) updates.precioEnvase = Number(precioEnvase);
      if (stockMin !== undefined) updates.stockMin = Number(stockMin);

      await updateDoc(docRef, updates);
      return true;
    } catch (err) {
      console.warn('[dataProductos] Error actualizando precio/stock:', err);
    }
  }
  return true;
}

/**
 * Elimina un producto de Firestore y de la memoria local
 */
export async function eliminarProductoFirestore(id) {
  const lista = obtenerProductosLocal().filter(p => p.id !== id);
  guardarProductosLocal(lista);

  if (db) {
    try {
      await deleteDoc(doc(db, COLECCION_PRODUCTOS, id));
      return true;
    } catch (err) {
      console.error('[dataProductos] Error eliminando de Firestore:', err);
      throw err;
    }
  }
  return true;
}
