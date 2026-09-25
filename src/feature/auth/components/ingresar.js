// src/feature/auth/components/ingresar.js
// Formulario de inicio de sesión, plantillas localizadas y llamadas de autenticación bajo demanda
// Solgas Surquillo (Gaswii)

import { wiSpin, Mensaje } from '../../../core/widev/widev.js';
import { entrar } from '../sesion.js';
import { t } from '../idioma/idioma.js';
import { loadFirebaseAuth, loadFirebaseDb } from '../firebaseAuthLoader.js';

// Mapeo de errores Firebase — claves del JSON, sin exponer códigos internos
export const mapearErrorAuth = (e) => {
  const txt = t();
  const map = {
    'auth/invalid-credential':    txt.err_invalid_credential,
    'auth/wrong-password':        txt.err_wrong_password,
    'auth/user-not-found':        txt.err_user_not_found,
    'auth/email-already-in-use':  txt.err_email_in_use,
    'auth/weak-password':         txt.err_weak_password,
    'auth/invalid-email':         txt.err_invalid_email,
    'auth/too-many-requests':     txt.err_too_many,
    'auth/popup-closed-by-user':  txt.err_popup_closed,
    'auth/network-request-failed':txt.err_network
  };
  return map[e?.code || ''] || txt.err_unexpected;
};

// Helper para dibujar campos de formulario
export const campo = (ico, tipo, id, place, ojo = false, col = 'half') => `
  <div class="wilg_grupo ${col === 'full' ? 'wilg_col_full' : ''}">
    <i class="fa-solid fa-${ico}"></i>
    <input type="${tipo}" id="${id}" placeholder="${place}" autocomplete="off">
    ${ojo ? '<i class="fa-solid fa-eye wilg_ojo"></i>' : ''}
  </div>`;

// Template HTML del formulario de ingreso
export const tplLogin = () => {
  const txt = t();
  return `
  <div class="wilg_head">
    <img src="/imgwii/logo.webp" alt="Solgas Surquillo" class="wilg_brand_logo" onerror="this.src='/favicon.ico'">
    <h2>${txt.bienvenido_de_vuelta}</h2>
    <p>${txt.bienvenido_sub}</p>
  </div>
  <button type="button" class="wilg_btn_google" id="btnGoogle">
    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google"> ${txt.btn_google}
  </button>
  <div class="wilg_or"><span>${txt.o_usa_email}</span></div>
  ${campo('envelope', 'text', 'email', txt.usuario_o_correo_ph, false, 'full')}
  ${campo('lock', 'password', 'password', txt.pass_ph, true, 'full')}
  <button type="button" id="Login" class="wilg_btn inactivo" disabled>
    <i class="fa-solid fa-right-to-bracket"></i> ${txt.btn_login}
  </button>
  <div class="wilg_links_col">
    <p class="wilg_foot_row">
      <span>${txt.no_tienes_cuenta}</span>
      <span class="wilg_reg">${txt.crear_cuenta_gratis}</span>
    </p>
    <span class="wilg_rec"><i class="fa-solid fa-key"></i> ${txt.link_olvidaste}</span>
  </div>`;
};

// Estado en memoria para usuario nuevo de Google SSO
let pendingGoogleUser = null;
export const getPendingGoogleUser = () => pendingGoogleUser;
export const setPendingGoogleUser = (u) => { pendingGoogleUser = u; };

// Template HTML para completar usuario nuevo de Google SSO
export const tplUsername = () => {
  const txt = t();
  const u = pendingGoogleUser;
  const sugerenciaUser = (u?.email?.split('@')[0] || 'usuario').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return `
  <div class="wilg_head">
    <img src="/imgwii/logo.webp" alt="Solgas Surquillo" class="wilg_brand_logo" onerror="this.src='/favicon.ico'">
    <h2>${txt.casi_listo}</h2>
    <p>${txt.casi_listo_sub}</p>
  </div>
  ${u ? `
  <div class="wilg_user_preview">
    <strong>${u.displayName || 'Vecino Solgas'}</strong>
    <small>${u.email}</small>
  </div>` : ''}
  <div class="wilg_grupo">
    <i class="fa-solid fa-at"></i>
    <input type="text" id="regUsuarioGoogle" placeholder="${txt.usuario_ph_google}" autocomplete="off" value="${sugerenciaUser}">
  </div>
  <label class="wilg_terminos_check">
    <input type="checkbox" id="checkTerminosGoogle">
    <span>${txt.acepto_terminos_1} <a href="/terminos" target="_blank" rel="noopener noreferrer">${txt.acepto_terminos_link}</a> ${txt.acepto_terminos_2}</span>
  </label>
  <button type="button" id="CompletarGoogle" class="wilg_btn inactivo" disabled>
    <i class="fa-solid fa-rocket"></i> ${txt.completar_registro}
  </button>`;
};

// Activar o desactivar botón de login según inputs
export const checkLoginBtn = () => {
  const loginBtn = document.getElementById('Login');
  if (!loginBtn) return;
  const ok = (document.getElementById('email')?.value.trim().length || 0) > 0
          && (document.getElementById('password')?.value.length || 0) >= 6;
  loginBtn.classList.toggle('inactivo', !ok);
  loginBtn.disabled = !ok;
};

// Validar botón de completar registro con Google
export const checkGoogleBtn = () => {
  const btn = document.getElementById('CompletarGoogle');
  if (!btn) return;
  const userInput = document.getElementById('regUsuarioGoogle')?.value.trim() || '';
  const terminos = document.getElementById('checkTerminosGoogle')?.checked || false;
  const ok = userInput.length >= 3 && terminos;
  btn.classList.toggle('inactivo', !ok);
  btn.disabled = !ok;
};

// Iniciar sesión ordinaria (Soporta Email y Usuario con Firebase Real)
export const iniciarSesionOrdinaria = async (btn) => {
  const input = document.getElementById('email')?.value.trim() || '';
  const pass  = document.getElementById('password')?.value || '';
  if (!input || pass.length < 6) return;

  const txt = t();
  wiSpin(btn, true, txt.signing_in);
  try {
    let email = input;

    // Resolver username → email solo si no contiene '@'
    if (!input.includes('@')) {
      const { db, query, collection, where, limit, getDocs } = await loadFirebaseDb();
      const q = query(collection(db, 'smiles'), where('usuario', '==', input.toLowerCase()), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) throw { code: 'auth/user-not-found' };
      email = snap.docs[0].data().email;
    }

    const { auth, signInWithEmailAndPassword } = await loadFirebaseAuth();
    const { user } = await signInWithEmailAndPassword(auth, email, pass);

    // Leer perfil de Firestore
    const { db, doc, getDoc, setDoc, serverTimestamp } = await loadFirebaseDb();
    const docSnap = await getDoc(doc(db, 'smiles', user.uid));
    const imgEmail = 'https://imgwii.web.app/smile.avif';
    const { avatar: calcIniciales } = await import('../../../core/widev/nombre.js');
    const profile = docSnap.exists()
      ? docSnap.data()
      : {
          uid: user.uid, email: user.email || email,
          nombre: user.displayName || 'Vecino Solgas',
          usuario: email.split('@')[0],
          avatar: user.photoURL || imgEmail,
          iniciales: calcIniciales(user.displayName || email.split('@')[0]),
          rol: 'cliente', plan: 'estandar', activo: true
        };

    if (!docSnap.exists()) {
      setDoc(doc(db, 'smiles', user.uid), { ...profile, creado: serverTimestamp(), actualizado: serverTimestamp() }).catch(() => {});
    }

    entrar(profile);
  } catch (e) {
    console.error('Login error:', e);
    Mensaje(mapearErrorAuth(e), 'error');
  } finally {
    wiSpin(btn, false);
  }
};

// Iniciar sesión con Google SSO (Flujo Limpio de 2 Pasos)
export const iniciarGoogleSSO = async (btn, onNuevoUsuario) => {
  wiSpin(btn, true, t().connecting);
  try {
    const { auth, googleProvider, signInWithPopup } = await loadFirebaseAuth();
    const res  = await signInWithPopup(auth, googleProvider);
    const user = res.user;

    const { db, doc, getDoc } = await loadFirebaseDb();
    const docRef  = doc(db, 'smiles', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // ✅ Usuario recurrente: Entra directo sin fricción
      entrar(docSnap.data());
    } else {
      // 🚀 Usuario nuevo: Guardar referencia y solicitar que elija @usuario y acepte términos
      pendingGoogleUser = user;
      if (typeof onNuevoUsuario === 'function') {
        onNuevoUsuario('username');
      } else {
        const ev = new CustomEvent('auth:swap', { detail: 'username' });
        document.dispatchEvent(ev);
      }
    }
  } catch (e) {
    if (e?.code !== 'auth/popup-closed-by-user') {
      console.error('Google SSO error:', e);
      Mensaje(mapearErrorAuth(e), 'error');
    }
  } finally {
    wiSpin(btn, false);
  }
};

// Completar registro del usuario nuevo de Google
export const completarRegistroGoogle = async (btn) => {
  const { auth } = await loadFirebaseAuth();
  const user = pendingGoogleUser || auth?.currentUser;
  const txt = t();
  if (!user) {
    Mensaje(txt.err_unexpected, 'error');
    return;
  }

  const userEl = document.getElementById('regUsuarioGoogle');
  const userInput = userEl?.value.trim() || '';
  const terminos = document.getElementById('checkTerminosGoogle')?.checked || false;

  if (userInput.length < 3) {
    wiTip(userEl, txt.val_min3, 'error', 2500);
    return;
  }

  if (!terminos) {
    const termEl = document.getElementById('checkTerminosGoogle');
    if (termEl) wiTip(termEl, txt.val_terminos_requeridos, 'error', 2500);
    else Mensaje(txt.val_terminos_requeridos, 'error');
    return;
  }

  wiSpin(btn, true, txt.completar_registro + '...');
  try {
    const { db, doc, setDoc, query, collection, where, limit, getDocs, serverTimestamp } = await loadFirebaseDb();
    const usernameLimpio = userInput.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    // Comprobar unicidad de username
    const q = query(collection(db, 'smiles'), where('usuario', '==', usernameLimpio), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty && snap.docs[0].id !== user.uid) {
      wiTip(userEl, txt.tip_user_exists, 'error', 2500);
      return;
    }

    const docRef = doc(db, 'smiles', user.uid);
    const imgEmail = 'https://imgwii.web.app/smile.avif';
    const { avatar: calcIniciales } = await import('../../../core/widev/nombre.js');
    const iniciales = calcIniciales(user.displayName || usernameLimpio);

    const partes = (user.displayName || '').trim().split(/\s+/);
    const nombre = partes[0] || 'Vecino Solgas';
    const apellidos = partes.slice(1).join(' ');

    const profile = {
      uid: user.uid,
      email: user.email || '',
      nombre: nombre,
      apellidos: apellidos,
      usuario: usernameLimpio,
      celular: '',
      avatar: user.photoURL || imgEmail,
      iniciales: iniciales,
      rol: 'cliente',
      plan: 'estandar',
      activo: true,
      direcciones: [],
      terminos: true,
      terminosFecha: serverTimestamp()
    };

    await setDoc(docRef, {
      ...profile,
      creado: serverTimestamp(),
      actualizado: serverTimestamp()
    });

    pendingGoogleUser = null;
    entrar(profile);
  } catch (e) {
    console.error('Completar Google error:', e);
    Mensaje(mapearErrorAuth(e), 'error');
  } finally {
    wiSpin(btn, false);
  }
};
