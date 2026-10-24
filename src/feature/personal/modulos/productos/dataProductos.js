// src/feature/personal/modulos/productos/dataProductos.js
// 🎯 Capa Canónica Local-First de Productos & Catálogo: Firestore + Caché Local + Semilla
// Colección: 'productos' · Semilla: src/semillas/productos.json
// Integrado con @widev, Firebase SDK y solicitarActualizacionWeb

import { savels, getls } from '@widev';
import { db, auth } from '@core/servicios/firebase.js';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import productosSemilla from '../../../../semillas/productos.json';
import { actualizarCentral, eliminarCentral, solicitarActualizacionWeb } from '@core/servicios/actualizar.js';

export const STORAGE_KEY = 'wi_productos';
export const OLD_STORAGE_KEY = 'wi_servicios';
export const COLECCION_PRODUCTOS = 'productos';
export const COLECCION_SERVICIOS = COLECCION_PRODUCTOS; // Compatibilidad retroactiva

import { parseFirestoreDoc } from '@/negocio.js';

export { parseFirestoreDoc };

// Generador de ID y Slug amigable
export function generarSlug(texto = '') {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Normalizador canónico de estructura de Producto / Accesorio
 * Alineado estrictamente con el esquema oficial de Firestore y sin campos obsoletos
 */
export function normalizarProducto(p = {}) {
  const prod = p && typeof p === 'object' ? p : {};
  const nombreEs = prod.nombre?.es || (typeof prod.nombre === 'string' ? prod.nombre : '');
  const idDefault = prod.id || (nombreEs ? generarSlug(nombreEs) : `prod-${Date.now()}`);

  const tipo = (prod.tipo === 'asesoria' || prod.tipo === 'taller' || prod.tipoCategoria === 'taller') ? 'taller' : 'psicologia';
  const tipoCategoria = prod.tipoCategoria || (tipo === 'taller' ? 'taller' : 'psicologia');

  // Garantías bilingües clínicas
  const garantiasEs = Array.isArray(prod.garantias?.es)
    ? prod.garantias.es
    : (Array.isArray(prod.garantias) ? prod.garantias : [
        'Espacio seguro y 100% confidencial',
        'Herramientas prácticas para tu vida diaria',
        'Acompañamiento cálido basado en evidencia científica'
      ]);
  const garantiasEn = Array.isArray(prod.garantias?.en)
    ? prod.garantias.en
    : (Array.isArray(prod.garantiasEn) ? prod.garantiasEn : [
        'Safe and 100% confidential space',
        'Practical tools for daily life',
        'Compassionate evidence-based care'
      ]);

  // Público bilingüe (Adolescentes, Adultos, Parejas)
  const publicoEs = typeof prod.publico === 'object' && prod.publico !== null
    ? (prod.publico.es || '')
    : (prod.publico || prod.tipoUso || 'Adolescentes y Adultos');
  const publicoEn = typeof prod.publico === 'object' && prod.publico !== null
    ? (prod.publico.en || '')
    : (prod.publicoEn || prod.tipoUsoEn || 'Teens and Adults');

  // Badge bilingüe (Más Solicitado, Serenidad, Terapia Destacada)
  const badgeEs = typeof prod.badge === 'object' && prod.badge !== null
    ? (prod.badge.es || '')
    : (prod.badge || (prod.pin ? 'Más Solicitado' : ''));
  const badgeEn = typeof prod.badge === 'object' && prod.badge !== null
    ? (prod.badge.en || '')
    : (prod.badgeEn || (prod.pin ? 'Most Requested' : ''));

  // Sanitización estricta: NUNCA permitir remanentes como "Click-On", "Rosca", "10 kg" o "válvula"
  let modalidadEs = prod.modalidad?.es || prod.modalidad || '';
  if (!modalidadEs || typeof modalidadEs !== 'string' || /click|rosca|valvula|gas|cilindro/i.test(modalidadEs)) {
    modalidadEs = 'Presencial y Online';
  }
  let modalidadEn = prod.modalidad?.en || prod.modalidadEn || '';
  if (!modalidadEn || typeof modalidadEn !== 'string' || /click|screw|valve|gas/i.test(modalidadEn)) {
    modalidadEn = modalidadEs === 'Presencial y Online' ? 'In-Person & Online' : modalidadEs;
  }

  let duracionEs = prod.duracion?.es || prod.duracion || '';
  if (!duracionEs || typeof duracionEs !== 'string' || /kg|kilo|peso|regulador/i.test(duracionEs)) {
    duracionEs = '45 - 60 min';
  }
  let duracionEn = prod.duracion?.en || prod.duracionEn || '';
  if (!duracionEn || typeof duracionEn !== 'string' || /kg|kilo|weight/i.test(duracionEn)) {
    duracionEn = String(duracionEs).includes('min') ? String(duracionEs).replace('min', 'mins') : duracionEs;
  }
  const enfoque = prod.enfoque || 'Cognitivo Conductual / ACT';

  const precio = Number(prod.precio ?? prod.precioPEN ?? prod.price ?? 0);
  const stock = Number(prod.stock ?? 50);

  return {
    id: String(idDefault),
    slug: String(prod.slug || idDefault),
    tipo,
    tipoCategoria,
    estado: (prod.estado === 'pausado' || prod.activo === false) ? 'pausado' : 'activo',
    activo: !(prod.estado === 'pausado' || prod.activo === false),
    pin: Boolean(prod.pin),
    orden: Number(prod.orden ?? 1),
    precio,
    precioPEN: precio,
    stock,
    imagen: String(prod.imagen || '/imgwii/servicios/psicoterapia-individual.webp'),
    badgeIcon: String(prod.badgeIcon || 'fa-solid fa-star'),
    tagClase: String(prod.tagClase || 'badge-serenidad'),
    modalidad: {
      es: String(modalidadEs),
      en: String(modalidadEn)
    },
    duracion: {
      es: String(duracionEs),
      en: String(duracionEn)
    },
    enfoque: String(enfoque),
    valvula: String(modalidadEs),
    valvulaEn: String(modalidadEn),
    peso: String(duracionEs),
    userId: String(prod.userId || ''),
    email: String(prod.email || 'demo@consultorioamerica.com'),
    fecha: String(prod.fecha || new Date().toISOString().slice(0, 10).replace(/-/g, '/')),
    creado: prod.creado || null,
    actualizado: prod.actualizado || null,

    // Mapas Bilingües Oficiales
    nombre: {
      es: String(nombreEs),
      en: String(prod.nombre?.en || prod.nombreEn || '')
    },
    descripcion: {
      es: String(prod.descripcion?.es || (typeof prod.descripcion === 'string' ? prod.descripcion : '')),
      en: String(prod.descripcion?.en || prod.descripcionEn || '')
    },
    publico: {
      es: String(publicoEs),
      en: String(publicoEn)
    },
    badge: {
      es: String(badgeEs),
      en: String(badgeEn)
    },
    garantias: {
      es: garantiasEs,
      en: garantiasEn
    }
  };
}

/**
 * Aplana un producto bilingüe a un solo idioma para consumo directo en vistas
 */
export function aplanarProducto(prod, idioma = 'es') {
  if (!prod) return null;
  const p = normalizarProducto(prod);
  const lang = idioma === 'en' ? 'en' : 'es';

  return {
    ...p,
    nombre: p.nombre[lang] || p.nombre.es || '',
    descripcion: p.descripcion[lang] || p.descripcion.es || '',
    publico: p.publico[lang] || p.publico.es || '',
    badge: p.badge[lang] || p.badge.es || '',
    valvula: lang === 'en' ? (p.valvulaEn || p.valvula) : p.valvula,
    garantias: (p.garantias[lang] && p.garantias[lang].length > 0) ? p.garantias[lang] : p.garantias.es
  };
}

let _memoriaProductos = null;

export function getUsuarioActivo() {
  const authUser = (typeof auth !== 'undefined' && auth?.currentUser) ? auth.currentUser : null;
  const u = getls('wiSmile') || getls('gaswii_user') || {};
  const uid = authUser?.uid || u.uid || u.id || u.userId || '';
  return {
    userId: uid,
    email: authUser?.email || u.email || '',
    autor: authUser?.displayName || u.nombre || u.usuario || 'Usuario'
  };
}

// Detector y purgador de datos residuales de proyectos anteriores (Gaswii, GLP, Click-On, 10 kg)
function esRegistroResidualGaswii(p) {
  if (!p) return true;
  const str = JSON.stringify(p).toLowerCase();
  return (
    str.includes('click-on') || 
    str.includes('click_on') || 
    str.includes('10 kg') || 
    str.includes('45 kg') || 
    str.includes('regulador') || 
    str.includes('solgas') || 
    str.includes('balon') || 
    str.includes('balón') ||
    str.includes('glp') ||
    str.includes('válvula')
  );
}

/**
 * Obtiene los productos almacenados en memoria, localStorage o semilla (Prioridad 1° Local / Firestore, 2° Semilla)
 */
export function obtenerProductosLocal() {
  if (_memoriaProductos && Array.isArray(_memoriaProductos) && _memoriaProductos.length > 0) {
    if (_memoriaProductos.some(esRegistroResidualGaswii)) {
      _memoriaProductos = null;
    } else {
      return _memoriaProductos.sort((a, b) => (Number(a.orden) || 999) - (Number(b.orden) || 999));
    }
  }

  // 1. Revisar localStorage (wi_productos, wi_servicios o gaswii_productos)
  try {
    const local = getls(STORAGE_KEY) || getls(OLD_STORAGE_KEY) || getls('gaswii_productos');
    if (Array.isArray(local) && local.length > 0) {
      if (local.some(esRegistroResidualGaswii)) {
        // 🔥 PURGA AUTOMÁTICA DE DATOS RESIDUALES DE GAS/CLICK-ON EN EL NAVEGADOR
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(OLD_STORAGE_KEY);
          localStorage.removeItem('gaswii_productos');
        } catch (e) {}
        _memoriaProductos = null;
      } else {
        _memoriaProductos = local
          .map(normalizarProducto)
          .sort((a, b) => (Number(a.orden) || 999) - (Number(b.orden) || 999));
        savels(STORAGE_KEY, _memoriaProductos);
        return _memoriaProductos;
      }
    }
  } catch (e) {}

  // 2. Fallback a Semilla oficial (100% clínica y sin residuos)
  const semillas = (Array.isArray(productosSemilla) ? productosSemilla : [])
    .map(normalizarProducto)
    .sort((a, b) => (Number(a.orden) || 999) - (Number(b.orden) || 999));
  _memoriaProductos = semillas;
  try {
    savels(STORAGE_KEY, semillas);
    savels('wi_servicios', semillas);
    localStorage.removeItem('gaswii_productos');
  } catch (e) {}

  return _memoriaProductos;
}

/**
 * Guarda el array de productos en caché local
 */
export function guardarProductosLocal(lista = []) {
  const normalizados = (Array.isArray(lista) ? [...lista] : [])
    .map(normalizarProducto)
    .sort((a, b) => (Number(a.orden) || 999) - (Number(b.orden) || 999));
  _memoriaProductos = normalizados;
  savels(STORAGE_KEY, normalizados);
  try {
    savels('gaswii_productos', normalizados);
    sessionStorage.removeItem('wi_sync_prods_ts');
  } catch (e) {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('psicologia:servicios-actualizado', { detail: normalizados }));
    window.dispatchEvent(new CustomEvent('wi:productos-actualizado', { detail: normalizados }));
    window.dispatchEvent(new CustomEvent('gaswii:productos-actualizado', { detail: normalizados }));
  }
  return normalizados;
}

if (typeof window !== 'undefined') {
  window.addEventListener('wi:productos-actualizado', (e) => {
    if (Array.isArray(e.detail) && e.detail.length > 0) {
      _memoriaProductos = e.detail
        .map(normalizarProducto)
        .sort((a, b) => (Number(a.orden) || 999) - (Number(b.orden) || 999));
    }
  });
}

/**
 * Sincroniza desde Firestore hacia Local-First o siembra la semilla si la colección está vacía
 */
export async function sincronizarProductosFirestore(opciones = {}) {
  try {
    if (!db) {
      return { ok: true, origen: 'local', datos: obtenerProductosLocal() };
    }

    if (opciones.forzarSemilla) {
      const sembrados = await resembrarProductosDesdeSemilla();
      return { ok: true, origen: 'semilla_resembrada', datos: sembrados };
    }

    const colRef = collection(db, COLECCION_PRODUCTOS);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      const locales = await resembrarProductosDesdeSemilla();
      return { ok: true, origen: 'semilla_sembrada', datos: locales };
    }

    const locales = obtenerProductosLocal();
    const remotos = snap.docs.map(d => {
      const data = d.data();
      return normalizarProducto({ id: d.id, ...data });
    });

    // Fusión inteligente: Si local tiene actualización más reciente en memoria/LS, preservar cambios recientes
    const mapa = new Map();
    remotos.forEach(r => mapa.set(r.id, r));

    locales.forEach(l => {
      const r = mapa.get(l.id);
      if (!r) {
        mapa.set(l.id, l);
      } else {
        const timeLocal = new Date(l.actualizado || 0).getTime();
        const timeRemoto = new Date(r.actualizado || 0).getTime();
        if (timeLocal > timeRemoto) {
          mapa.set(l.id, { ...r, ...l });
        }
      }
    });

    const fusionados = Array.from(mapa.values())
      .map(normalizarProducto)
      .sort((a, b) => (Number(a.orden) || 999) - (Number(b.orden) || 999));

    guardarProductosLocal(fusionados);
    return { ok: true, origen: 'firestore', datos: fusionados };
  } catch (err) {
    console.warn('[dataProductos] Sincronización Firestore:', err?.message || err);
    return { ok: false, error: err?.message, datos: obtenerProductosLocal() };
  }
}

/**
 * Resiembra y sincroniza en Firestore los productos canónicos de la semilla
 */
export async function resembrarProductosDesdeSemilla() {
  const semillas = (Array.isArray(productosSemilla) ? productosSemilla : []).map(normalizarProducto);
  if (db) {
    for (const item of semillas) {
      try {
        const payload = { ...item };
        await setDoc(doc(db, COLECCION_PRODUCTOS, item.id), {
          ...payload,
          creado: serverTimestamp(),
          actualizado: serverTimestamp()
        });
      } catch (err) {
        console.warn('[dataProductos] Error al sembrar producto:', item.id, err);
      }
    }
  }
  guardarProductosLocal(semillas);
  solicitarActualizacionWeb({ motivo: 'productos-catalogo-canonico' });
  return semillas;
}

// Alias de retrocompatibilidad
export const resembrarServiciosDesdeSemilla = resembrarProductosDesdeSemilla;

/**
 * Guarda o actualiza un producto en Firestore y en local
 * Motor Central Zero-Waste: Local-First (0 ms) + Dirty Checking + Cloudflare Deploy en Segundo Plano
 */
export async function guardarProductoFirestore(productoRaw = {}) {
  const activeUser = getUsuarioActivo();
  const normalizado = normalizarProducto(productoRaw);

  const prodFinal = {
    ...normalizado,
    userId: normalizado.userId || activeUser.userId || '',
    fecha: normalizado.fecha || new Date().toISOString().slice(0, 10),
    actualizado: new Date().toISOString()
  };
  if (!prodFinal.creado) {
    prodFinal.creado = new Date().toISOString();
  }

  // 1. Preparar lista para Local-First
  const actuales = [...obtenerProductosLocal()];
  const idx = actuales.findIndex(p => p.id === prodFinal.id);
  if (idx >= 0) {
    actuales[idx] = prodFinal;
  } else {
    actuales.push(prodFinal);
  }

  // Orden estricto garantizado siempre por la propiedad orden
  actuales.sort((a, b) => (Number(a.orden) || 999) - (Number(b.orden) || 999));

  _memoriaProductos = [...actuales];
  try {
    sessionStorage.removeItem('wi_sync_prods_ts');
  } catch (e) {}

  // 2. Ejecutar mediante el Motor Central Zero-Waste
  await actualizarCentral({
    modulo: 'productos',
    coleccion: COLECCION_PRODUCTOS,
    docId: prodFinal.id,
    storageKey: STORAGE_KEY,
    evento: 'wi:productos-actualizado',
    datos: prodFinal,
    listaStorage: actuales,
    redeploy: true,
    forzarWrite: true,
    mensajeExito: `Producto ${prodFinal.nombre.es || prodFinal.id} actualizado al instante`
  });

  return prodFinal;
}

/**
 * Cambia el estado de un producto (activo / pausado)
 */
export async function cambiarEstadoProducto(id, nuevoEstado) {
  const lista = obtenerProductosLocal();
  const item = lista.find(p => p.id === id);
  if (!item) return null;

  item.estado = nuevoEstado;
  item.activo = nuevoEstado === 'activo';
  return guardarProductoFirestore(item);
}

/**
 * Elimina un producto de local y Firestore mediante el motor central
 */
export async function eliminarProductoFirestore(id) {
  const lista = obtenerProductosLocal().filter(p => p.id !== id);

  await eliminarCentral({
    modulo: 'productos',
    coleccion: COLECCION_PRODUCTOS,
    docId: id,
    storageKey: STORAGE_KEY,
    evento: 'wi:productos-actualizado',
    listaActualizada: lista,
    redeploy: true,
    mensajeExito: 'Producto eliminado del catálogo'
  });

  return true;
}

export default {
  STORAGE_KEY,
  COLECCION_PRODUCTOS,
  COLECCION_SERVICIOS,
  obtenerProductosLocal,
  guardarProductosLocal,
  sincronizarProductosFirestore,
  resembrarServiciosDesdeSemilla,
  resembrarProductosDesdeSemilla,
  guardarProductoFirestore,
  cambiarEstadoProducto,
  eliminarProductoFirestore,
  normalizarProducto,
  aplanarProducto
};
