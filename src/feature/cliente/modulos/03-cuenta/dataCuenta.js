// src/feature/cliente/modulos/03-cuenta/dataCuenta.js
// Capa de Datos Local-First de Mi Cuenta · Solgas Surquillo
// Esquema canónico 100% alineado con smiles.md y feature/auth
// En smiles/{uid} se guarda estrictamente uid (sin userId) y avatar + iniciales

import { getls, savels, avatar as calcIniciales } from '@widev';

/**
 * Obtiene el perfil completo desde la caché smart wiSmile (0ms)
 */
export function obtenerCuentaLocal() {
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
  if (!user) return null;

  const uid = user.uid || user.userId || '';
  const nombre = user.nombre || 'Vecino';
  const apellidos = user.apellidos || '';
  const usuario = user.usuario || user.email?.split('@')[0] || 'usuario';
  const nombreCompleto = [nombre, apellidos].filter(Boolean).join(' ') || usuario;

  return {
    uid,
    usuario,
    email: user.email || '',
    nombre,
    apellidos,
    celular: user.celular || '',
    avatar: user.avatar || user.foto || 'https://imgwii.web.app/smile.avif',
    iniciales: user.iniciales || calcIniciales(nombreCompleto),
    rol: user.rol || 'cliente',
    plan: user.plan || 'estandar',
    puntos: Number(user.puntos || 0),
    estado: user.estado || 'activo',
    activo: Boolean(user.activo ?? true),
    documentoTipo: user.documentoTipo || 'DNI',
    documento: user.documento || '',
    razonSocial: user.razonSocial || '',
    direccionFiscal: user.direccionFiscal || '',
    preferencias: {
      tipoValvula: user.preferencias?.tipoValvula || 'premium',
      horarioHabitual: user.preferencias?.horarioHabitual || 'mañana',
      metodoPago: user.preferencias?.metodoPago || 'yape',
      timbreMalogrado: Boolean(user.preferencias?.timbreMalogrado),
      llamarAlLlegar: Boolean(user.preferencias?.llamarAlLlegar ?? true),
      pisoAscensor: user.preferencias?.pisoAscensor || '',
      comprobanteEmail: Boolean(user.preferencias?.comprobanteEmail ?? true),
      tema: user.preferencias?.tema || 'futuro'
    }
  };
}

/**
 * Guarda o actualiza los datos del perfil y facturación en wiSmile y Firestore smiles/{uid}
 * (Solo uid, sin userId en smiles)
 */
export async function guardarPerfil(datos = {}) {
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
  if (!user) throw new Error('No hay sesión de usuario activa.');

  const uid = user.uid || user.userId;
  if (!uid) throw new Error('UID de usuario no encontrado.');

  // Actualizar objeto en memoria local
  user.uid = uid;
  delete user.userId; // Garantizar eliminación de duplicados
  user.nombre = datos.nombre !== undefined ? datos.nombre.trim() : (user.nombre || '');
  user.apellidos = datos.apellidos !== undefined ? datos.apellidos.trim() : (user.apellidos || '');
  user.celular = datos.celular !== undefined ? datos.celular.trim() : (user.celular || '');
  user.documentoTipo = datos.documentoTipo || user.documentoTipo || 'DNI';
  user.documento = datos.documento !== undefined ? datos.documento.trim() : (user.documento || '');
  user.razonSocial = datos.razonSocial !== undefined ? datos.razonSocial.trim() : (user.razonSocial || '');
  user.direccionFiscal = datos.direccionFiscal !== undefined ? datos.direccionFiscal.trim() : (user.direccionFiscal || '');
  
  // Avatar e Iniciales personalizables
  if (datos.avatar !== undefined && datos.avatar.trim()) {
    user.avatar = datos.avatar.trim();
  } else if (!user.avatar) {
    user.avatar = 'https://imgwii.web.app/smile.avif';
  }

  if (datos.iniciales !== undefined && datos.iniciales.trim()) {
    user.iniciales = datos.iniciales.trim().toUpperCase().slice(0, 3);
  } else {
    const nombreCompleto = [user.nombre, user.apellidos].filter(Boolean).join(' ') || user.usuario || 'Gaswii';
    user.iniciales = calcIniciales(nombreCompleto);
  }
  delete user.foto; // Reemplazado definitivamente por avatar e iniciales

  // Guardar en caché wiSmile (0ms)
  savels('wiSmile', user, 144);
  if (typeof window !== 'undefined') {
    window.__GASWII_USER__ = user;
    const topName = document.getElementById('topbarUserName');
    if (topName) topName.textContent = user.nombre || user.usuario;
    const topAvatar = document.getElementById('topbarAvatarLetter');
    if (topAvatar) topAvatar.textContent = user.iniciales;
  }

  // Sincronizar en segundo plano con Firestore smiles/{uid} (ESTRICTAMENTE UID, SIN USERID)
  (async () => {
    try {
      const { db } = await import('@core/servicios/firebase.js');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

      await setDoc(doc(db, 'smiles', uid), {
        uid: uid,
        nombre: user.nombre,
        apellidos: user.apellidos,
        celular: user.celular,
        iniciales: user.iniciales,
        avatar: user.avatar,
        documentoTipo: user.documentoTipo,
        documento: user.documento,
        razonSocial: user.razonSocial,
        direccionFiscal: user.direccionFiscal,
        actualizado: serverTimestamp()
      }, { merge: true });

      console.log(`[Gaswii Cuenta] ✅ Perfil sincronizado en smiles/${uid} (sin userId redundante)`);
    } catch (err) {
      console.error('[Gaswii Cuenta] ❌ Error al guardar en Firestore:', err);
    }
  })();

  return user;
}

/**
 * Guarda las preferencias operativas de entrega de gas
 */
export async function guardarPreferencias(prefs = {}) {
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
  if (!user) throw new Error('No hay sesión de usuario activa.');

  const uid = user.uid || user.userId;
  if (!uid) throw new Error('UID de usuario no encontrado.');

  user.preferencias = {
    ...(user.preferencias || {}),
    ...prefs
  };

  // Guardar local
  savels('wiSmile', user, 144);
  if (typeof window !== 'undefined') {
    window.__GASWII_USER__ = user;
  }

  // Sincronizar en Firestore smiles/{uid}
  (async () => {
    try {
      const { db } = await import('@core/servicios/firebase.js');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

      await setDoc(doc(db, 'smiles', uid), {
        preferencias: user.preferencias,
        actualizado: serverTimestamp()
      }, { merge: true });

      console.log(`[Gaswii Cuenta] ✅ Preferencias sincronizadas en smiles/${uid}`);
    } catch (err) {
      console.error('[Gaswii Cuenta] ❌ Error al guardar preferencias:', err);
    }
  })();

  return user.preferencias;
}

/**
 * Actualiza la contraseña en Firebase Auth
 */
export async function actualizarPassword(nuevaPassword) {
  if (!nuevaPassword || nuevaPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  const { auth } = await import('@core/servicios/firebase.js');
  const { updatePassword } = await import('firebase/auth');

  if (auth.authStateReady) {
    await auth.authStateReady();
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No se detectó una sesión activa en Firebase Auth.');
  }

  try {
    await updatePassword(currentUser, nuevaPassword);
  } catch (err) {
    if (err.code === 'auth/requires-recent-login') {
      throw new Error('Por seguridad, debes cerrar sesión e iniciar nuevamente antes de cambiar la contraseña.');
    }
    throw err;
  }
}

/**
 * Envía un correo oficial de restablecimiento de contraseña
 */
export async function enviarResetPassword() {
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
  if (!user?.email) throw new Error('No hay un correo electrónico registrado.');

  const { auth } = await import('@core/servicios/firebase.js');
  const { sendPasswordResetEmail } = await import('firebase/auth');

  await sendPasswordResetEmail(auth, user.email);
}
