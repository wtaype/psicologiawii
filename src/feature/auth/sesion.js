// src/feature/auth/sesion.js
// Gestor unificado del ciclo de vida de la sesión, bus de eventos reactivo y guards de seguridad
// Local-First con TTL de 144 horas y carga diferida de Firebase Auth

import { getls, savels, removels } from '../../core/widev/storage.js';
import { Mensaje, cerrarTodos } from '../../core/widev/widev.js';
import { ROL_PATH } from '../../core/rutas.js';

const bus = new Set();

if (typeof window !== 'undefined') {
  document.addEventListener('astro:before-preparation', () => { bus.clear(); });
}

export const wiAuth = {
  get user() { return getls('wiSmile'); },

  on(fn) {
    if (typeof fn !== 'function') return () => {};
    bus.add(fn);
    const u = this.user;
    if (u) { try { fn(u); } catch (e) { console.error('wiAuth init:', e); } }
    return () => bus.delete(fn);
  },

  emit(wi) {
    bus.forEach(fn => { try { fn(wi); } catch (e) { console.error('wiAuth emit:', e); } });
  },

  login(wi, h = 144, keep = []) {
    removels.except(['wiTema_gaswii', 'wiTema', 'cookiesPrivacidad', 'wiSmart', ...keep]);
    savels('wiSmile', wi, h);
    this.emit(wi);
  },

  logout(keep = []) {
    removels.except(['wiTema_gaswii', 'wiTema', 'cookiesPrivacidad', 'wiSmart', ...keep]);
    this.emit(null);
  }
};

// Fire-and-forget: actualiza timestamp en Firestore sin bloquear el redirect
const _actualizarTimestamp = (uid) => {
  if (!uid) return;
  Promise.all([
    import('../../core/servicios/firebase.js'),
    import('firebase/firestore')
  ]).then(([{ db }, { doc, updateDoc, serverTimestamp }]) =>
    updateDoc(doc(db, 'smiles', uid), { actualizado: serverTimestamp() }).catch(() => {})
  ).catch(() => {});
};

// Redirección y bienvenida al ingresar — sin await, redirect a 150ms
export const entrar = (wi) => {
  wiAuth.login(wi, 144, ['wiSmart', 'cookiesPrivacidad']);

  const modal = document.querySelector('#wi_auth_modal.active') || document.querySelector('#modalLogin');
  if (modal) cerrarTodos();

  Mensaje(`<i class="fa-solid fa-hand-wave"></i> ¡Bienvenido, ${wi?.nombre || wi?.usuario || 'Gaswii'}!`, 'success');

  _actualizarTimestamp(wi?.uid);

  setTimeout(() => {
    const dest = new URLSearchParams(window.location.search).get('redirect') || ROL_PATH[wi?.rol] || '/';
    window.location.href = dest;
  }, 150);
};

// Cierre de sesión seguro
export const salir = async (keep = []) => {
  try {
    const { auth } = await import('../../core/servicios/firebase.js');
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  } catch (e) {
    console.warn('Error al cerrar sesión:', e);
  }
  wiAuth.logout(keep);
  window.location.replace('/');
};

// Proteger rutas privadas por rol
export const protegerRuta = (rolesPermitidos = []) => {
  const localUser = wiAuth.user;
  if (!localUser) {
    window.location.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    return null;
  }
  if (rolesPermitidos.length && !rolesPermitidos.includes(localUser.rol)) {
    window.location.replace(ROL_PATH[localUser.rol] || '/');
    return null;
  }
  return localUser;
};

export const generarAvatarUrl = (nombre = '', usuario = '') => {
  const semilla = encodeURIComponent(nombre || usuario || 'Gaswii');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${semilla}&backgroundColor=ff6600,0284c7,10b981`;
};

export const getSmileLocal = () => wiAuth.user;

// Sincroniza el perfil del usuario con Firestore y actualiza localStorage
// Usada por feature/cliente para mantener el perfil al día
export const sincronizarSmile = async (user, extraData = {}) => {
  if (!user?.uid) return null;
  const { db } = await import('../../core/servicios/firebase.js');
  const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');

  const docRef = doc(db, 'smiles', user.uid);
  let docSnap = null;
  try { docSnap = await getDoc(docRef); } catch (e) { console.warn('Firestore offline:', e); }

  const imgEmail = 'https://imgwii.web.app/smile.avif';
  const { avatar: calcIniciales } = await import('../../core/widev/nombre.js');

  let smileData;
  if (docSnap?.exists()) {
    const ex = docSnap.data();
    const avatar = user.photoURL || extraData.avatar || ex.avatar || imgEmail;
    const iniciales = extraData.iniciales || ex.iniciales || calcIniciales(ex.nombre || user.displayName || 'Vecino Solgas');
    smileData = { ...ex, ...extraData, avatar, iniciales, actualizado: new Date().toISOString() };
    const payload = { ...extraData, avatar, iniciales, actualizado: serverTimestamp() };
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
    updateDoc(docRef, payload).catch(() => {});
  } else {
    const nombre = extraData.nombre || user.displayName || 'Vecino Solgas';
    const usuario = extraData.usuario || (user.email?.split('@')[0] || 'usuario').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const avatar = user.photoURL || extraData.avatar || imgEmail;
    const iniciales = extraData.iniciales || calcIniciales(nombre);
    smileData = {
      uid: user.uid,
      usuario,
      email: user.email || '',
      nombre,
      apellidos: extraData.apellidos || '',
      avatar,
      iniciales,
      celular: extraData.celular || '',
      rol: extraData.rol || 'cliente',
      plan: 'estandar',
      activo: true,
      estado: 'activo',
      puntos: 0,
      direcciones: extraData.direcciones || [],
      terminos: true,
      terminosFecha: new Date().toISOString(),
      creado: new Date().toISOString(),
      actualizado: new Date().toISOString()
    };
    await setDoc(docRef, { ...smileData, terminosFecha: serverTimestamp(), creado: serverTimestamp(), actualizado: serverTimestamp() });
  }

  savels('wiSmile', smileData);
  return smileData;
};

export { ROL_PATH };
