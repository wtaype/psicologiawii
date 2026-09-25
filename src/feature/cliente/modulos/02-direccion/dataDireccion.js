// src/feature/cliente/modulos/02-direccion/dataDireccion.js
// Capa Canónica Local-First de Direcciones · Solgas Surquillo
// Esquema Firestore: smiles/{uid}.direcciones como ARRAY con Timestamps nativos
// Sincronización en segundo plano (0ms UX) y logging exhaustivo

import { getls, savels } from '@widev';

/**
 * Normaliza fechas provenientes de Timestamp Firestore, objetos serializados o ISO strings
 */
function serializarFechaISO(val) {
  if (!val) return new Date().toISOString();
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  if (val.seconds) return new Date(val.seconds * 1000).toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

/**
 * Normaliza cualquier formato previo o entrante a un Array puro y canónico de direcciones
 * Soporta strings sueltos ("Calle Dante 261"), arrays y maps con tolerancia total
 */
export function normalizarDireccionesArray(rawDirs = []) {
  if (!rawDirs) return [];

  let list = [];
  if (Array.isArray(rawDirs)) {
    list = rawDirs.map((d, idx) => {
      if (typeof d === 'string' && d.trim()) {
        return {
          id: `dir_${idx}`,
          alias: idx === 0 ? 'Casa' : `Dirección ${idx + 1}`,
          calle: d.trim(),
          direccion: d.trim(),
          distrito: 'Surquillo'
        };
      }
      return d;
    }).filter(d => Boolean(d && (d.calle || d.direccion || d.domicilio)));
  } else if (typeof rawDirs === 'object') {
    list = Object.entries(rawDirs).map(([key, d]) => {
      if (typeof d === 'string' && d.trim()) {
        return {
          id: key,
          alias: 'Casa',
          calle: d.trim(),
          direccion: d.trim(),
          distrito: 'Surquillo'
        };
      }
      return {
        ...d,
        id: d.id || key
      };
    }).filter(d => Boolean(d && (d.calle || d.direccion || d.domicilio)));
  }

  if (list.length === 0) return [];

  let hayPrincipal = false;
  const resultado = list.map((d, idx) => {
    const esPrincipal = Boolean(d.esPrincipal ?? d.predeterminada ?? false);
    if (esPrincipal) hayPrincipal = true;

    const alias = String(d.alias || d.etiqueta || (idx === 0 ? 'Casa' : `Dirección ${idx + 1}`)).trim();
    const calle = String(d.calle || d.direccion || d.domicilio || '').trim();
    const dpto = String(d.dpto || '').trim();
    const distrito = String(d.distrito || 'Surquillo').trim();
    const celular = String(d.celular || '').trim();
    const referencia = String(d.referencia || '').trim();
    const eta = String(d.eta || '12–15 min').trim();

    return {
      id: String(d.id || `dir_${Date.now()}_${idx}`),
      alias,
      etiqueta: alias,
      calle,
      direccion: calle,
      dpto,
      distrito,
      celular,
      referencia,
      eta,
      esPrincipal,
      predeterminada: esPrincipal,
      creado: serializarFechaISO(d.creado),
      actualizado: serializarFechaISO(d.actualizado)
    };
  });

  if (!hayPrincipal && resultado.length > 0) {
    resultado[0].esPrincipal = true;
    resultado[0].predeterminada = true;
  }

  return resultado;
}

export const normalizarDireccionesMap = normalizarDireccionesArray;

/**
 * Obtiene la lista actual de direcciones desde el almacenamiento local wiSmile (0ms)
 */
export function obtenerDireccionesLocal() {
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
  return user ? normalizarDireccionesArray(user.direcciones) : [];
}

/**
 * Sincronización silenciosa en segundo plano con Firestore (smiles/{userId})
 * Si Firestore tiene direcciones y local no las tenía (o cambiaron), actualiza wiSmile y emite evento
 */
let _sincronizando = false;
export async function sincronizarDireccionesDesdeFirestore() {
  if (_sincronizando) return;
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
  const userId = user?.userId || user?.uid;
  if (!userId) return;

  _sincronizando = true;
  try {
    const { db } = await import('@core/servicios/firebase.js');
    const { doc, getDoc } = await import('firebase/firestore');

    const docSnap = await getDoc(doc(db, 'smiles', userId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      const rawDirs = data.direcciones || (data.direccion ? [data.direccion] : []);
      const normalizadas = normalizarDireccionesArray(rawDirs);
      const locales = obtenerDireccionesLocal();

      const cambiaron = JSON.stringify(normalizadas) !== JSON.stringify(locales);
      if (cambiaron || (normalizadas.length > 0 && locales.length === 0)) {
        user.direcciones = normalizadas;
        if (data.celular && !user.celular) user.celular = data.celular;
        savels('wiSmile', user, 144);
        if (typeof window !== 'undefined') {
          window.__GASWII_USER__ = user;
          document.dispatchEvent(new CustomEvent('direccionesActualizadas', { detail: { direcciones: normalizadas } }));
        }
      }
    }
  } catch (err) {
    console.warn('[Gaswii Direcciones] Aviso en sincronización en background:', err);
  } finally {
    _sincronizando = false;
  }
}

/**
 * Convierte un item local a objeto con Timestamps nativos de Firestore
 */
function prepararItemParaFirestore(item, Timestamp) {
  let creadoTs = Timestamp.now();
  if (item.creado) {
    if (typeof item.creado.toDate === 'function') {
      creadoTs = item.creado;
    } else if (item.creado.seconds) {
      creadoTs = new Timestamp(item.creado.seconds, item.creado.nanoseconds || 0);
    } else if (typeof item.creado === 'string' && !isNaN(Date.parse(item.creado))) {
      creadoTs = Timestamp.fromDate(new Date(item.creado));
    }
  }

  return {
    id: String(item.id),
    alias: String(item.alias || 'Casa'),
    etiqueta: String(item.alias || 'Casa'),
    calle: String(item.calle || ''),
    direccion: String(item.calle || ''),
    dpto: String(item.dpto || ''),
    distrito: String(item.distrito || 'Surquillo'),
    celular: String(item.celular || ''),
    referencia: String(item.referencia || ''),
    eta: String(item.eta || '12–15 min'),
    esPrincipal: Boolean(item.esPrincipal),
    predeterminada: Boolean(item.esPrincipal),
    creado: creadoTs,
    actualizado: Timestamp.now()
  };
}

/**
 * Sincronizador central a Firestore en segundo plano (Non-blocking / Background Sync)
 */
function sincronizarSmilesFirestore(uid, listaDirecciones) {
  if (!uid) {
    console.warn('[Gaswii Firestore] ⚠️ No hay UID de usuario para sincronizar.');
    return;
  }

  (async () => {
    try {
      console.log(`[Gaswii Firestore] ⏳ Sincronizando en segundo plano para smiles/${uid}...`);
      const { db, auth } = await import('@core/servicios/firebase.js');
      const { doc, setDoc, serverTimestamp, Timestamp } = await import('firebase/firestore');

      if (auth?.authStateReady) {
        await auth.authStateReady();
      }

      // Transformar cada dirección para que creado y actualizado sean Timestamps nativos de Firestore
      const direccionesFirestore = listaDirecciones.map(d => prepararItemParaFirestore(d, Timestamp));

      const docRef = doc(db, 'smiles', uid);
      await setDoc(docRef, {
        uid: uid,
        direcciones: direccionesFirestore,
        rol: 'cliente',
        actualizado: serverTimestamp()
      }, { merge: true });

      console.log(`[Gaswii Firestore] ✅ ¡Éxito! Direcciones guardadas con Timestamps en smiles/${uid}:`, direccionesFirestore);
    } catch (e) {
      console.error(`[Gaswii Firestore] ❌ Error al guardar en colección smiles/${uid}:`, e);
    }
  })();
}

/**
 * Persistencia unificada: Guarda en local wiSmile (0ms) y despacha en segundo plano a Firestore
 */
function persistirLocalYFondo(nuevaLista) {
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
  if (!user) throw new Error('No hay sesión de usuario activa.');

  const userId = user.userId || user.uid;
  user.direcciones = nuevaLista;
  savels('wiSmile', user, 144);
  if (typeof window !== 'undefined') {
    window.__GASWII_USER__ = user;
    document.dispatchEvent(new CustomEvent('direccionesActualizadas', { detail: { direcciones: nuevaLista } }));
  }

  sincronizarSmilesFirestore(userId, nuevaLista);
  return nuevaLista;
}

/**
 * Guarda o actualiza una dirección
 */
export async function guardarDireccion(dirData = {}) {
  const listaActual = obtenerDireccionesLocal();
  const id = dirData.id || `dir_${Date.now()}`;
  const esPrincipal = Boolean(dirData.esPrincipal);
  const now = new Date().toISOString();

  const nueva = {
    id,
    alias: dirData.alias || 'Casa',
    etiqueta: dirData.alias || 'Casa',
    calle: dirData.calle || '',
    direccion: dirData.calle || '',
    dpto: dirData.dpto || '',
    distrito: dirData.distrito || 'Surquillo',
    celular: dirData.celular || '',
    referencia: dirData.referencia || '',
    eta: dirData.eta || '12–15 min',
    esPrincipal,
    predeterminada: esPrincipal,
    actualizado: now,
    creado: dirData.creado || now
  };

  if (esPrincipal || listaActual.length === 0) {
    nueva.esPrincipal = true;
    nueva.predeterminada = true;
    listaActual.forEach(d => { d.esPrincipal = false; d.predeterminada = false; });
  }

  const idx = listaActual.findIndex(d => d.id === id);
  if (idx >= 0) {
    listaActual[idx] = { ...listaActual[idx], ...nueva };
  } else {
    nueva.esPrincipal ? listaActual.unshift(nueva) : listaActual.push(nueva);
  }

  return persistirLocalYFondo(listaActual);
}

/**
 * Elimina una dirección
 */
export async function eliminarDireccion(id) {
  let lista = obtenerDireccionesLocal();
  const idx = lista.findIndex(d => d.id === id);
  if (idx < 0) return lista;

  const eraPrincipal = lista[idx].esPrincipal;
  lista = lista.filter(d => d.id !== id);

  if (eraPrincipal && lista.length > 0) {
    lista[0].esPrincipal = true;
    lista[0].predeterminada = true;
  }

  return persistirLocalYFondo(lista);
}

/**
 * Marca una dirección como predeterminada
 */
export async function establecerPrincipal(id) {
  const lista = obtenerDireccionesLocal();
  lista.forEach(d => {
    const esP = (d.id === id);
    d.esPrincipal = esP;
    d.predeterminada = esP;
  });
  return persistirLocalYFondo(lista);
}
