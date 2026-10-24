// src/feature/personal/modulos/clientes/dataClientes.js
// 🎯 Gestor Canónico Local-First para Directorio CRM
// Fuente Canónica: Colección 'smiles' · rol == 'cliente'
// Caché inteligente en LocalStorage para ahorrar lecturas en Firebase (0ms)
// Transición inteligente: Semillas solo si Firestore está vacío; con clientes registrados, solo Firebase.
// 100% JS Nativo · Integrado con @widev y Firebase

import { getls, savels } from '@widev';
import smilesSemilla from '../../../../semillas/smiles.json';

export const STORAGE_KEY = 'wi_crm_clientes';
export const COLECCION_SMILES = 'smiles';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos de caché para ahorrar lecturas

// Memoria volátil
let _memoriaClientes = null;

/**
 * Normaliza los datos de un cliente desde el esquema smiles
 */
export function normalizarCliente(c = {}) {
  const docNum = String(c.documento || '').trim();
  const uid = c.uid || c.id || `paciente_${Date.now()}`;
  const nombreContacto = c.contacto || `${c.nombre || ''} ${c.apellidos || ''}`.trim() || c.razonSocial || '';

  let avatar = c.avatar || '';
  if (!avatar || avatar.includes('smile.webp') || avatar.includes('hero.webp')) {
    const seed = encodeURIComponent(c.nombre || 'Paciente');
    avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=059669`;
  }

  let direccion = c.direccion || '';
  if (!direccion && Array.isArray(c.direcciones) && c.direcciones.length > 0) {
    const d0 = c.direcciones[0];
    direccion = `${d0.calle || ''}${d0.distrito ? ', ' + d0.distrito : ''}`.trim();
  }

  return {
    id: uid,
    uid: uid,
    nombre: c.nombre || c.razonSocial || '',
    contacto: nombreContacto,
    apellidos: c.apellidos || '',
    usuario: c.usuario || (c.email ? c.email.split('@')[0] : (c.nombre ? c.nombre.toLowerCase().replace(/\s+/g, '') : 'paciente')),
    documentoTipo: c.documentoTipo || (docNum.length === 11 ? 'RUC' : (docNum ? 'DNI' : 'DNI')),
    documento: docNum,
    celular: c.celular || '',
    email: c.email || '',
    direccion: direccion || 'Presencial en Consultorio Sede América',
    motivoConsulta: c.motivoConsulta || c.servicioContratado || 'Psicoterapia Individual (TCC)',
    modalidad: c.modalidad || 'Presencial Sede América',
    categoria: c.categoria || 'individual', // 'individual' | 'pareja' | 'infantil' | 'taller'
    estadoTratamiento: c.estadoTratamiento || c.estadoTributario || 'En Tratamiento', // 'Primera Cita' | 'En Tratamiento' | 'De Alta' | 'Pausado'
    totalSesiones: typeof c.totalSesiones === 'number' ? c.totalSesiones : (parseInt(c.sesiones, 10) || 1),
    honorarioPEN: parseFloat(c.honorarioPEN) || 85.00,
    fechaInicio: c.fechaInicio || c.fecha || '2026/10/23',
    observaciones: c.observaciones || 'Consultante comprometido con su proceso terapéutico.',
    avatar: avatar,
    rol: 'cliente',
    activo: Boolean(c.activo ?? true)
  };
}

/**
 * Obtiene la lista de clientes (Caché local primero en 0ms, luego semilla si está vacío)
 */
export function obtenerClientes() {
  if (_memoriaClientes) return _memoriaClientes;

  try {
    const local = getls(STORAGE_KEY);
    if (local) {
      const datos = Array.isArray(local) ? local : (local.datos || []);
      if (datos.length > 0) {
        _memoriaClientes = datos.map(normalizarCliente);
        return _memoriaClientes;
      }
    }
  } catch (e) {}

  // Semilla de preview: filtrar exclusivamente los usuarios con rol 'cliente' en smiles.json
  const clientesSemilla = (Array.isArray(smilesSemilla) ? smilesSemilla : [])
    .filter(s => s.rol === 'cliente')
    .map(normalizarCliente);

  _memoriaClientes = clientesSemilla;
  savels(STORAGE_KEY, {
    timestamp: Date.now(),
    fuente: 'semilla',
    datos: clientesSemilla
  });
  return _memoriaClientes;
}

/**
 * Guarda o actualiza un cliente en caché local y sincroniza en Firestore 'smiles'
 */
export async function guardarCliente(clienteData) {
  let clientes = obtenerClientes();
  const cacheActual = getls(STORAGE_KEY);

  // Si la caché solo contenía semillas y ahora registramos un cliente real, descartamos las semillas
  if (cacheActual && cacheActual.fuente === 'semilla') {
    clientes = [];
  }

  const normalizado = normalizarCliente(clienteData);
  const index = clientes.findIndex(c => c.id === normalizado.id || (c.documento && c.documento === normalizado.documento));

  if (index >= 0) {
    clientes[index] = { ...clientes[index], ...normalizado };
  } else {
    clientes.unshift(normalizado);
  }

  _memoriaClientes = clientes;
  savels(STORAGE_KEY, {
    timestamp: Date.now(),
    fuente: 'firestore',
    datos: clientes
  });

  // Sincronizar en la colección canónica 'smiles' de Firestore
  try {
    const { db } = await import('@core/servicios/firebase.js');
    if (db) {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      await setDoc(doc(db, COLECCION_SMILES, normalizado.id), {
        ...normalizado,
        actualizado: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    console.debug('[dataClientes] Sincronización en segundo plano con smiles:', err?.message || err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wi:cliente-guardado', { detail: normalizado }));
  }

  return normalizado;
}

/**
 * Elimina un cliente
 */
export async function eliminarCliente(id) {
  let clientes = obtenerClientes();
  clientes = clientes.filter(c => c.id !== id);
  _memoriaClientes = clientes;
  savels(STORAGE_KEY, {
    timestamp: Date.now(),
    fuente: 'firestore',
    datos: clientes
  });

  try {
    const { db } = await import('@core/servicios/firebase.js');
    if (db) {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, COLECCION_SMILES, id));
    }
  } catch (err) {
    console.debug('[dataClientes] Eliminación en Firestore:', err?.message || err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wi:cliente-eliminado', { detail: { id } }));
  }

  return clientes;
}

/**
 * Calcula métricas contables de la cartera
 */
export function calcularMetricasClientes(clientes = []) {
  const total = clientes.length;
  const mype = clientes.filter(c => (c.regimenTributario || '').toLowerCase().includes('mype') || (c.regimenTributario || '').toLowerCase().includes('general') || (c.regimenTributario || '').toLowerCase().includes('comercial') || c.documentoTipo === 'RUC').length;
  const independientes = clientes.filter(c => (c.regimenTributario || '').toLowerCase().includes('4ta') || (c.regimenTributario || '').toLowerCase().includes('residencial') || (c.regimenTributario || '').toLowerCase().includes('hogar') || c.documentoTipo === 'DNI').length;
  const facturacionMensual = clientes.reduce((acc, c) => acc + (parseFloat(c.honorarioPEN) || 0), 0);

  return {
    total,
    mype,
    independientes,
    facturacionMensual: facturacionMensual.toFixed(2)
  };
}

/**
 * Sincroniza desde Firestore. Si hay clientes en Firestore, muestra ÚNICAMENTE Firestore.
 * Si Firestore está vacío, muestra temporalmente semillas para demo.
 */
export async function sincronizarClientesDesdeFirestore(forzar = false) {
  try {
    // 1. Ahorro de lecturas: si la caché local proviene de Firestore y es reciente, reusar en 0ms
    if (!forzar) {
      const cache = getls(STORAGE_KEY);
      if (cache && cache.fuente === 'firestore' && cache.timestamp && (Date.now() - cache.timestamp < CACHE_TTL_MS)) {
        if (Array.isArray(cache.datos) && cache.datos.length > 0) {
          _memoriaClientes = cache.datos.map(normalizarCliente);
          return _memoriaClientes;
        }
      }
    }

    const { db, auth } = await import('@core/servicios/firebase.js');
    if (!db) return obtenerClientes();

    // Solo consultar Firestore si hay usuario autenticado para evitar 'insufficient permissions'
    const usuarioAuth = auth?.currentUser;
    const usuarioLocal = getls('wiSmile');
    if (!usuarioAuth && (!usuarioLocal || !['personal', 'gestor', 'admin'].includes(usuarioLocal.rol))) {
      return obtenerClientes();
    }

    const { collection, getDocs, query, where, limit } = await import('firebase/firestore');
    const q = query(
      collection(db, COLECCION_SMILES),
      where('rol', '==', 'cliente'),
      limit(100)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      // ✅ Hay clientes registrados en Firestore: Mostrar SOLO clientes de Firebase
      const remotos = snap.docs.map(d => normalizarCliente({ id: d.id, ...d.data() }));
      _memoriaClientes = remotos;
      savels(STORAGE_KEY, {
        timestamp: Date.now(),
        fuente: 'firestore',
        datos: remotos
      });
      return remotos;
    } else {
      // ⚠️ No hay clientes registrados aún en Firestore: Mostrar semillas temporales
      const clientesSemilla = (Array.isArray(smilesSemilla) ? smilesSemilla : [])
        .filter(s => s.rol === 'cliente')
        .map(normalizarCliente);
      _memoriaClientes = clientesSemilla;
      savels(STORAGE_KEY, {
        timestamp: Date.now(),
        fuente: 'semilla',
        datos: clientesSemilla
      });
      return clientesSemilla;
    }
  } catch (err) {
    console.debug('[dataClientes] Lectura remota Firestore diferida (usando local-first):', err?.message || err);
  }
  return obtenerClientes();
}
