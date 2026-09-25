// src/feature/auth/components/registrar.js
// Plantilla de registro, sanitizacion, validaciones y creacion de cuenta bajo demanda
// Solgas Surquillo (Gaswii)

import { wiSpin, Mensaje, wiTip, wiRateLimit } from '../../../core/widev/widev.js';
import { entrar } from '../sesion.js';
import { campo, mapearErrorAuth } from './ingresar.js';
import { t } from '../idioma/idioma.js';
import { camposRegistro } from '../data/campos.js';
import { loadFirebaseAuth, loadFirebaseDb } from '../firebaseAuthLoader.js';

// --- SANITIZACIÓN ESTRICTA ---
export const sanName      = v => v.replace(/[<>="'`;/\\$}{]/g, '').replace(/\s{2,}/g, ' ');
export const sanEmail     = v => v.replace(/[<>="'`;/\\$}{ ]/g, '').toLowerCase().trim();
export const sanUser      = v => v.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
export const sanCelular   = v => v.replace(/[^0-9+ ]/g, '').trim();
export const sanDireccion = v => v.replace(/[<>="'`;/\\$}{]/g, '').replace(/\s{2,}/g, ' ').trim();
export const sanDistrito  = v => v.replace(/[<>="'`;/\\$}{]/g, '').replace(/\s{2,}/g, ' ').trim();

const sans = { sanName, sanEmail, sanUser, sanCelular, sanDireccion, sanDistrito };

// Debounce unificado
const debounce = (fn, ms = 500) => { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); }; };

// Reglas de validación — síncronas, mensajes del JSON
export const reglas = {
  regEmail:     [sanEmail,     v => /^[\w.+-]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v) || t().val_invalid_email],
  regUsuario:   [sanUser,      v => v.length >= 3 || t().val_min3],
  regNombre:    [sanName,      v => v.length > 0  || t().val_nombre_requerido],
  regApellidos: [sanName,      v => v.length > 0  || t().val_apellidos_requerido],
  regPassword:  [v => v,       v => v.length >= 6  || t().val_min6],
  regPassword1: [v => v,       v => v === (document.getElementById('regPassword')?.value || '') || t().val_pass_no_match]
};

// Template HTML del formulario de registro — itera camposRegistro
export const tplRegistrar = () => {
  const txt = t();
  const inputs = camposRegistro.map(c => campo(c.ico, c.tipo, c.id, txt[c.key_ph], c.ojo, c.col)).join('');
  return `
  <div class="wilg_head">
    <img src="/imgwii/logo.webp" alt="Solgas Surquillo" class="wilg_brand_logo" onerror="this.src='/favicon.ico'">
    <h2>${txt.registro_titulo}</h2>
    <p>${txt.registro_sub}</p>
  </div>
  <button type="button" class="wilg_btn_google" id="btnGoogle">
    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google"> ${txt.google_registro}
  </button>
  <div class="wilg_or"><span>${txt.o_completa_datos}</span></div>
  <div class="wilg_grid">${inputs}</div>
  <label class="wilg_terminos_check">
    <input type="checkbox" id="checkTerminosRegistro">
    <span>${txt.acepto_terminos_1} <a href="/terminos" target="_blank" rel="noopener noreferrer">${txt.acepto_terminos_link}</a> ${txt.acepto_terminos_2}</span>
  </label>
  <button type="button" id="Registrar" class="wilg_btn inactivo" disabled>
    <i class="fa-solid fa-user-plus"></i> ${txt.btn_registro}
  </button>
  <div class="wilg_links_col">
    <p class="wilg_foot_row">
      <span>${txt.ya_tengo_cuenta}</span>
      <span class="wilg_log">${txt.link_ya_tengo_cuenta}</span>
    </p>
  </div>`;
};

// Comprobación del botón de registro
export const checkRegisterBtn = () => {
  const btn = document.getElementById('Registrar');
  if (!btn) return;
  const camposOk = camposRegistro.every(c => {
    const el = document.getElementById(c.id);
    return (el?.value.trim().length || 0) > 0 && !el?.classList.contains('error');
  });
  const terminosOk = document.getElementById('checkTerminosRegistro')?.checked || false;
  const ok = camposOk && terminosOk;
  btn.classList.toggle('inactivo', !ok);
  btn.disabled = !ok;
};

// Comprobación del botón Completar Google
export const checkCompleteBtn = () => {
  const btn = document.getElementById('CompletarGoogle');
  if (!btn) return;
  const userInput = (document.getElementById('regUsuarioGoogle')?.value.trim().length || 0) >= 3;
  const terminos = document.getElementById('checkTerminosGoogle')?.checked || false;
  const ok = userInput && terminos;
  btn.classList.toggle('inactivo', !ok);
  btn.disabled = !ok;
};

// Verificación de disponibilidad de usuario en Firestore (debounced)
export const checkUsuarioDisponible = debounce(async (el) => {
  if (!el) return;
  const val = sanUser(el.value);
  if (val.length < 3) return;
  const rl = wiRateLimit('regValidacion', 5);
  if (!rl.ok) {
    el.dataset.ok = 'false';
    wiTip(el, `Demasiados intentos. Espera ${rl.min} min`, 'error', 2500);
    return;
  }
  try {
    const { db, collection, query, where, limit, getDocs } = await loadFirebaseDb();
    const snap = await getDocs(query(collection(db, 'smiles'), where('usuario', '==', val), limit(1)));
    const ok = snap.empty;
    el.dataset.ok = ok ? 'true' : 'false';
    if (ok) {
      el.classList.remove('error');
      wiTip(el, `${t().tip_user_ok} <i class="fa-solid fa-check-circle"></i>`, 'success', 2500);
    } else {
      el.classList.add('error');
      wiTip(el, t().tip_user_exists, 'error', 2500);
    }
    checkRegisterBtn();
  } catch { /* silencioso */ }
}, 450);

// Verificación de disponibilidad de email en Firestore (debounced)
export const checkEmailDisponible = debounce(async (el) => {
  if (!el) return;
  const val = sanEmail(el.value);
  if (!/^[\w.+-]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(val)) return;
  const rl = wiRateLimit('regValidacion', 5);
  if (!rl.ok) {
    el.dataset.ok = 'false';
    wiTip(el, `Demasiados intentos. Espera ${rl.min} min`, 'error', 2500);
    return;
  }
  try {
    const { db, collection, query, where, limit, getDocs } = await loadFirebaseDb();
    const snap = await getDocs(query(collection(db, 'smiles'), where('email', '==', val), limit(1)));
    const ok = snap.empty;
    el.dataset.ok = ok ? 'true' : 'false';
    if (ok) {
      el.classList.remove('error');
      wiTip(el, `${t().tip_email_ok} <i class="fa-solid fa-check-circle"></i>`, 'success', 2500);
    } else {
      el.classList.add('error');
      wiTip(el, t().tip_email_exists, 'error', 2500);
    }
    checkRegisterBtn();
  } catch { /* silencioso */ }
}, 450);

// Validar un campo individual
export const checkField = (el, force = false) => {
  if (!el) return;
  const [san, rule] = reglas[el.id] || [];
  if (!san || !rule) return;
  const val = san(el.value);
  if (val !== el.value) el.value = val;
  const result = rule(val);

  if (result !== true) {
    el.dataset.ok = 'false';
    el.classList.add('error');
    if (force) {
      wiTip(el, result, 'error', 2500);
    }
    checkRegisterBtn();
    return false;
  }

  el.classList.remove('error');
  el.dataset.ok = 'true';
  wiTip.ocultar();

  if (el.id === 'regPassword1') {
    const p1 = document.getElementById('regPassword')?.value || '';
    if (val.length >= 6 && val === p1) {
      wiTip(el, 'Contraseñas coinciden <i class="fa-solid fa-check-circle"></i>', 'success', 2000);
    }
  } else if (el.id === 'regUsuario') {
    checkUsuarioDisponible(el);
  } else if (el.id === 'regEmail') {
    checkEmailDisponible(el);
  }

  checkRegisterBtn();
  return true;
};

// Registrar usuario
export const registrarUsuario = async (btn) => {
  const txt = t();

  const terminos = document.getElementById('checkTerminosRegistro')?.checked || false;
  if (!terminos) {
    const termEl = document.getElementById('checkTerminosRegistro');
    if (termEl) wiTip(termEl, txt.val_terminos_requeridos, 'error', 2500);
    else Mensaje(txt.val_terminos_requeridos, 'error');
    return;
  }

  const datos = Object.fromEntries(
    camposRegistro.map(c => {
      const el = document.getElementById(c.id);
      const san = c.san ? sans[c.san] : v => v;
      return [c.id, san(el?.value.trim() || '')];
    })
  );

  // Validación de todos los campos
  for (const c of camposRegistro) {
    const rule = reglas[c.regla];
    if (!rule) continue;
    const el = document.getElementById(c.id);
    const result = rule[1](datos[c.id] || '');
    if (result !== true) {
      if (el) {
        el.focus();
        wiTip(el, result, 'error', 2500);
      }
      return;
    }
  }

  if (!wiRateLimit('registro', 3, 60)) return Mensaje(txt.err_too_many, 'error');

  wiSpin(btn, true, txt.btn_registro + '...');
  try {
    const { auth, createUserWithEmailAndPassword, updateProfile } = await loadFirebaseAuth();
    const { db, doc, setDoc, serverTimestamp } = await loadFirebaseDb();
    const { user } = await createUserWithEmailAndPassword(auth, datos.regEmail, datos.regPassword);

    const imgEmail = 'https://imgwii.web.app/smile.avif';
    const { avatar: calcIniciales } = await import('../../../core/widev/nombre.js');
    const nombreCompleto = `${datos.regNombre} ${datos.regApellidos}`.trim();
    const iniciales = calcIniciales(nombreCompleto || datos.regUsuario);

    const profile = {
      uid: user.uid,
      email: datos.regEmail,
      nombre: datos.regNombre,
      apellidos: datos.regApellidos,
      usuario: datos.regUsuario,
      celular: '',
      avatar: imgEmail,
      iniciales: iniciales,
      rol: 'cliente',
      plan: 'estandar',
      activo: true,
      estado: 'activo',
      puntos: 0,
      direcciones: [],
      terminos: true,
      terminosFecha: serverTimestamp()
    };

    // updateProfile y setDoc en paralelo
    await Promise.all([
      updateProfile(user, { displayName: nombreCompleto }),
      setDoc(doc(db, 'smiles', user.uid), { ...profile, creado: serverTimestamp(), actualizado: serverTimestamp() })
    ]);

    entrar(profile);
  } catch (e) {
    console.error('Registro error:', e);
    Mensaje(mapearErrorAuth(e), 'error');
  } finally {
    wiSpin(btn, false);
  }
};
