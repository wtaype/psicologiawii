// src/feature/personal/modulos/personal/dataPersonal.js
// Gestor Canónico del Equipo Profesional y Especialistas
// Fuente Canónica: Colección Firestore 'smiles' · Roles exclusivos: 'personal' y 'gestor'
// Respaldo canónico fiel a recursos-gaswii/firebase/smiles.md (2 gestores reales)
// 100% JS Nativo · Integrado con @widev y Firebase SDK

import { getls, savels, removels } from '@widev';

export const STORAGE_KEY = 'wi_equipo_personal';
export const COLECCION_SMILES = 'smiles';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos de caché para ahorrar lecturas en Firestore

let _memoriaPersonal = null;

// Detector de datos dummy o placeholders antiguos en caché local
function esRegistroPlaceholder(p) {
  if (!p) return true;
  const id = String(p.id || p.uid || '');
  const email = String(p.email || '').toLowerCase();
  const nom = String(p.nombre || p.nombreCompleto || '').toLowerCase();
  if (id.startsWith('per-') || id === 'per_01' || id === 'per_02') return true;
  if (email.includes('solgassurquillo.com') || email.includes('gaswii.com')) return true;
  if (nom.includes('administrador solgas') || nom.includes('técnico despachador') || nom.includes('repartidor')) return true;
  return false;
}

export function normalizarMiembro(p = {}) {
  let nombre = (p.nombre || '').trim();
  let apellidos = (p.apellidos || '').trim();
  let nombreCompleto = (p.nombreCompleto || '').trim();

  if (!nombre && !apellidos && nombreCompleto) {
    const partes = nombreCompleto.split(' ');
    nombre = partes[0] || '';
    apellidos = partes.slice(1).join(' ');
  } else if (!nombreCompleto) {
    nombreCompleto = `${nombre} ${apellidos}`.trim() || nombre;
  }

  const uid = p.uid || p.id || `per_${Date.now()}`;
  const activo = p.activo !== undefined ? Boolean(p.activo) : (p.estado !== 'inactivo');
  const rol = (p.rol === 'personal') ? 'personal' : 'gestor';

  let avatar = p.avatar || '';
  if (!avatar || avatar.includes('smile.webp') || avatar.includes('hero.webp')) {
    avatar = '/smile.avif';
  }

  return {
    id: uid,
    uid: uid,
    nombre: nombre,
    apellidos: apellidos,
    nombreCompleto: nombreCompleto,
    usuario: p.usuario || (nombre ? nombre.toLowerCase().replace(/\s+/g, '') : 'personal'),
    celular: p.celular || '',
    email: p.email || '',
    cargo: p.cargo || (rol === 'gestor' ? 'Gestor' : 'Colaborador'),
    colegiatura: p.colegiatura || (activo ? 'Habilitado/a' : 'Inactivo/a'),
    fechaIngreso: p.fechaIngreso || p.ingreso || '',
    experiencia: p.experiencia || '',
    cumpleanos: p.cumpleanos || p.fechaNacimiento || '',
    dni: p.dni || p.documento || '',
    avatar: avatar,
    rol: rol,
    activo: activo
  };
}

export function obtenerPersonal() {
  if (_memoriaPersonal && Array.isArray(_memoriaPersonal) && _memoriaPersonal.length > 0) return _memoriaPersonal;

  try {
    const local = getls(STORAGE_KEY);
    if (local) {
      const datos = Array.isArray(local) ? local : (local.datos || []);
      if (datos.some(esRegistroPlaceholder)) {
        removels(STORAGE_KEY);
        removels('gaswii_equipo_personal');
      } else if (datos.length > 0) {
        _memoriaPersonal = datos.map(normalizarMiembro);
        return _memoriaPersonal;
      }
    }
  } catch (e) {}

  // Cascada dinámica: usar sesión activa wiSmile si tiene rol administrativo
  let lista = [];
  const userSmile = getls('wiSmile');
  if (userSmile && ['personal', 'gestor', 'admin'].includes(userSmile.rol)) {
    lista.push(normalizarMiembro(userSmile));
  }

  _memoriaPersonal = lista;
  if (lista.length > 0) {
    savels(STORAGE_KEY, {
      timestamp: Date.now(),
      fuente: 'sesion',
      datos: lista
    });
  }
  return _memoriaPersonal;
}

export async function guardarMiembroPersonal(data) {
  const lista = obtenerPersonal();
  const normalizado = normalizarMiembro(data);
  const idx = lista.findIndex(p => p.id === normalizado.id);

  if (idx >= 0) {
    lista[idx] = { ...lista[idx], ...normalizado };
  } else {
    lista.push(normalizado);
  }

  _memoriaPersonal = lista;
  savels(STORAGE_KEY, {
    timestamp: Date.now(),
    fuente: 'firestore',
    datos: lista
  });

  // Persistir en Firestore en la colección canónica 'smiles'
  try {
    const { db } = await import('@core/servicios/firebase.js');
    if (db) {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      await setDoc(doc(db, COLECCION_SMILES, normalizado.id), {
        uid: normalizado.uid,
        usuario: normalizado.usuario,
        nombre: normalizado.nombre,
        apellidos: normalizado.apellidos,
        email: normalizado.email,
        celular: normalizado.celular,
        documento: normalizado.dni,
        documentoTipo: 'DNI',
        cargo: normalizado.cargo,
        rol: normalizado.rol,
        avatar: normalizado.avatar || '/smile.avif',
        activo: normalizado.activo,
        estado: normalizado.activo ? 'activo' : 'inactivo',
        cumpleanos: normalizado.cumpleanos,
        fechaIngreso: normalizado.fechaIngreso,
        actualizado: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    console.debug('[dataPersonal] Sincronización en segundo plano con smiles:', err?.message || err);
  }

  return normalizado;
}

export async function eliminarMiembroPersonal(id) {
  let lista = obtenerPersonal();
  lista = lista.filter(p => p.id !== id);
  _memoriaPersonal = lista;
  savels(STORAGE_KEY, {
    timestamp: Date.now(),
    fuente: 'firestore',
    datos: lista
  });

  try {
    const { db } = await import('@core/servicios/firebase.js');
    if (db) {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, COLECCION_SMILES, id));
    }
  } catch (err) {
    console.debug('[dataPersonal] Eliminación en Firestore:', err?.message || err);
  }

  return lista;
}

export async function sincronizarPersonalDesdeFirestore(forzar = false) {
  try {
    // 1. Ahorro de lecturas: si la caché local es reciente y de Firestore, reusar en 0ms
    if (!forzar) {
      const cache = getls(STORAGE_KEY);
      if (cache && cache.fuente === 'firestore' && cache.timestamp && (Date.now() - cache.timestamp < CACHE_TTL_MS)) {
        if (Array.isArray(cache.datos) && cache.datos.length > 0 && !cache.datos.some(esRegistroPlaceholder)) {
          _memoriaPersonal = cache.datos.map(normalizarMiembro);
          return _memoriaPersonal;
        }
      }
    }

    const { db, auth } = await import('@core/servicios/firebase.js');
    if (!db) return obtenerPersonal();

    // Esperar a que Firebase Auth resuelva la sesión si está iniciando
    if (auth && typeof auth.authStateReady === 'function') {
      try {
        await auth.authStateReady();
      } catch (e) {}
    }

    const { collection, getDocs, query, where } = await import('firebase/firestore');
    // Consulta canónica: Solo roles 'personal' y 'gestor'
    const q = query(
      collection(db, COLECCION_SMILES),
      where('rol', 'in', ['personal', 'gestor'])
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const remotos = snap.docs
        .map(d => normalizarMiembro({ id: d.id, ...d.data() }))
        .filter(m => !esRegistroPlaceholder(m));
      
      if (remotos.length > 0) {
        _memoriaPersonal = remotos;
        savels(STORAGE_KEY, {
          timestamp: Date.now(),
          fuente: 'firestore',
          datos: remotos
        });
        return remotos;
      }
    }
  } catch (err) {
    console.debug('[dataPersonal] Lectura Firestore diferida (usando equipo canónico local):', err?.message || err);
  }

  return obtenerPersonal();
}
