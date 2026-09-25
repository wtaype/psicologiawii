// src/feature/auth/components/recuperar.js
// Vistas y llamadas para recuperacion de contrasenas olvidadas bajo demanda
// Solgas Surquillo (Gaswii)

import { wiSpin, Mensaje } from '../../../core/widev/widev.js';
import { campo, mapearErrorAuth } from './ingresar.js';
import { t } from '../idioma/idioma.js';
import { loadFirebaseAuth, loadFirebaseDb } from '../firebaseAuthLoader.js';

// Template HTML para formulario de recuperación
export const tplRestablecer = () => {
  const txt = t();
  return `
  <div class="wilg_head">
    <img src="/imgwii/logo.webp" alt="Solgas Surquillo" class="wilg_brand_logo" onerror="this.src='/favicon.ico'">
    <h2>${txt.recuperar_titulo}</h2>
    <p>${txt.recuperar_sub}</p>
  </div>
  ${campo('envelope', 'text', 'recEmail', txt.usuario_o_correo_ph)}
  <button type="button" id="Recuperar" class="wilg_btn">
    <i class="fa-solid fa-paper-plane"></i> ${txt.btn_recuperar}
  </button>
  <div class="wilg_links_col">
    <span class="wilg_log wilg_foot_back"><i class="fa-solid fa-arrow-left"></i> ${txt.volver_login}</span>
  </div>`;
};

// Enviar enlace de restablecimiento (Soporta resolver Username a Email)
export const enviarEnlaceRecuperacion = async (btn) => {
  const input = document.getElementById('recEmail')?.value.trim() || '';
  if (!input) return;

  const txt = t();
  wiSpin(btn, true, txt.sending_link);
  try {
    let email = input;

    if (!input.includes('@')) {
      const { db, collection, query, where, getDocs, limit } = await loadFirebaseDb();
      const snap = await getDocs(query(collection(db, 'smiles'), where('usuario', '==', input.toLowerCase()), limit(1)));
      if (snap.empty) throw { code: 'auth/user-not-found' };
      email = snap.docs[0].data().email;
    }

    const { auth, sendPasswordResetEmail } = await loadFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
    Mensaje(`${txt.reset_sent} ${email}!`, 'success');
  } catch (e) {
    console.error('Reset password error:', e);
    Mensaje(mapearErrorAuth(e), 'error');
  } finally {
    wiSpin(btn, false);
  }
};
