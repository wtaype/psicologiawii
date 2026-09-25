// src/feature/auth/visualLogin.js
// Controlador de eventos del DOM y orquestador visual bajo demanda
// Solgas Surquillo (Gaswii)

import './login.css';
import { wiTip } from '../../core/widev/widev.js';
import { wiAuth, entrar, ROL_PATH, salir } from './sesion.js';
import { tplLogin, tplUsername, checkLoginBtn, checkGoogleBtn, iniciarGoogleSSO, iniciarSesionOrdinaria, completarRegistroGoogle } from './components/ingresar.js';
import { tplRegistrar, checkRegisterBtn, checkField, registrarUsuario, reglas } from './components/registrar.js';
import { tplRestablecer, enviarEnlaceRecuperacion } from './components/recuperar.js';

let vTimeout = null;

const tpls = {
  login:       tplLogin,
  registrar:   tplRegistrar,
  restablecer: tplRestablecer,
  username:    tplUsername
};

const setupFormState = (v) => {
  const form = document.getElementById('liForm');
  if (!form) return;
  form.querySelector('input')?.focus();

  if (v === 'login') {
    const btn = document.getElementById('Login');
    if (btn) { btn.classList.add('inactivo'); btn.disabled = true; }
    requestAnimationFrame(checkLoginBtn);
  }
  if (v === 'registrar') {
    const btn = document.getElementById('Registrar');
    if (btn) { btn.classList.add('inactivo'); btn.disabled = true; }
    requestAnimationFrame(checkRegisterBtn);
  }
  if (v === 'username') {
    const btn = document.getElementById('CompletarGoogle');
    if (btn) { btn.classList.add('inactivo'); btn.disabled = true; }
    requestAnimationFrame(checkGoogleBtn);
  }
};

// Cambiar de vista (sincrono — todos los templates son sync)
export const swap = (v) => {
  wiTip.ocultar();
  const form = document.getElementById('liForm');
  if (!form || !tpls[v]) return;
  form.innerHTML = tpls[v]();
  form.setAttribute('data-vista', v);
  form.closest('.wilg_card')?.classList.toggle('modo-registro', v === 'registrar');
  setTimeout(() => setupFormState(v), 30);
};

export const cerrarModalAuth = () => {
  wiTip.ocultar();
  const modal = document.getElementById('wi_auth_modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 200);
  }
};

export const abrirLogin = (vista = 'login') => {
  document.getElementById('wi_auth_modal')?.remove();

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
  <div id="wi_auth_modal" class="active">
    <div class="wilg_card ${vista === 'registrar' ? 'modo-registro' : ''}">
      <button class="modalX" type="button" aria-label="Cerrar">&times;</button>
      <form id="liForm" data-vista="${vista}">
        ${tpls[vista]()}
      </form>
    </div>
  </div>`;
  document.body.appendChild(wrapper.firstElementChild);
  setTimeout(() => setupFormState(vista), 40);
};

// --- LISTENERS GLOBALES CLIENT-SIDE ---
let listenersIniciados = false;

export const initListeners = () => {
  if (listenersIniciados || typeof window === 'undefined') return;
  listenersIniciados = true;

  document.addEventListener('submit', (e) => {
    if (e.target.closest('#liForm')) e.preventDefault();
  });

  document.addEventListener('click', async (e) => {
    const target = e.target;

    if (target.matches('.modalX') || target.closest('.modalX')) {
      e.preventDefault();
      cerrarModalAuth();
      return;
    }

    const modal = document.getElementById('wi_auth_modal');
    if (modal && target === modal) { cerrarModalAuth(); return; }

    // Mostrar/ocultar contraseña
    const ojo = target.closest('.wilg_ojo');
    if (ojo) {
      const input = ojo.previousElementSibling;
      if (input) {
        const esPass = input.getAttribute('type') === 'password';
        input.setAttribute('type', esPass ? 'text' : 'password');
        ojo.classList.toggle('fa-eye', !esPass);
        ojo.classList.toggle('fa-eye-slash', esPass);
      }
      return;
    }

    // Intercambio de vistas
    if (target.closest('.wilg_reg')) { e.preventDefault(); return swap('registrar'); }
    if (target.closest('.wilg_rec')) { e.preventDefault(); return swap('restablecer'); }
    if (target.closest('.wilg_log')) { e.preventDefault(); return swap('login'); }

    // Acciones
    const btnGoogle = target.closest('#btnGoogle');
    if (btnGoogle) { e.preventDefault(); await iniciarGoogleSSO(btnGoogle, (v) => swap(v)); return; }

    const btnCompletarGoogle = target.closest('#CompletarGoogle');
    if (btnCompletarGoogle) { e.preventDefault(); await completarRegistroGoogle(btnCompletarGoogle); return; }

    const btnLogin = target.closest('#Login');
    if (btnLogin) { e.preventDefault(); await iniciarSesionOrdinaria(btnLogin); return; }

    const btnReg = target.closest('#Registrar');
    if (btnReg) { e.preventDefault(); await registrarUsuario(btnReg); return; }

    const btnRec = target.closest('#Recuperar');
    if (btnRec) { e.preventDefault(); await enviarEnlaceRecuperacion(btnRec); return; }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key !== 'Enter' || !e.target.closest('#liForm input')) return;
    const id = e.target.id;
    if (id === 'password') document.getElementById('Login')?.click();
    if (id === 'regPassword1') document.getElementById('Registrar')?.click();
    if (id === 'recEmail') document.getElementById('Recuperar')?.click();
    if (id === 'regUsuarioGoogle') document.getElementById('CompletarGoogle')?.click();
  });

  document.addEventListener('input', (e) => {
    const target = e.target;
    if (!target.closest('#liForm input')) return;
    const { id } = target;
    if (id === 'email' || id === 'password') checkLoginBtn();
    if (id === 'regUsuarioGoogle') checkGoogleBtn();
    if (reglas[id]) {
      checkRegisterBtn();
      if (vTimeout) clearTimeout(vTimeout);
      vTimeout = setTimeout(() => checkField(target), 300);
    }
  });

  document.addEventListener('change', (e) => {
    const id = e.target?.id;
    if (id === 'checkTerminosRegistro') checkRegisterBtn();
    if (id === 'checkTerminosGoogle') checkGoogleBtn();
  });

  document.addEventListener('auth:swap', (e) => {
    if (e.detail) swap(e.detail);
  });

  document.addEventListener('blur', (e) => {
    const target = e.target;
    if (target.closest('#liForm input') && reglas[target.id]) checkField(target, true);
  }, true);

  window.addEventListener('storage', (e) => {
    if (e.key === 'wiSmile') window.location.reload();
  });
};

// Inicializador para la página completa (/login)
export const init = () => {
  initListeners();
  const wi = wiAuth.user;
  if (wi) {
    const dest = new URLSearchParams(window.location.search).get('redirect') || ROL_PATH[wi?.rol] || '/';
    return (window.location.href = dest);
  }
  swap('login');
};

export { salir };
