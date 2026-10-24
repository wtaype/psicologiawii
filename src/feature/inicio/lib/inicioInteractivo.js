// src/feature/inicio/lib/inicioInteractivo.js
// 🌟 Módulo de Interactividad Smart Unificado de Gaswii (Diferido vía wiSmart)
// Cero Bloqueo de Primer Render (TBT = 0ms) · Se activa al interactuar (touch, scroll, click, mousemove)
import { imgwii } from '@widev';
import { ROL_PATH } from '@core/rutas.js';
import { obtenerSaludoHora } from './whatsapp.js';

/**
 * Resuelve el destino del panel administrativo o de cliente
 */
function resolverDestinoDashboard(smile) {
  if (!smile) return '/login';
  const isEn = window.location.pathname.startsWith('/en');
  const rol = smile.rol || 'cliente';
  const esStaff = rol === 'personal' || rol === 'gestor' || rol === 'admin';
  const base = ROL_PATH[rol] || (esStaff ? '/personal' : '/cliente');
  return isEn ? `/en${base}` : base;
}

/**
 * Actualiza la UI de autenticación en Header y MobileDrawer
 */
export function actualizarAuthUi(smile) {
  const u = (smile && typeof smile === 'object' && smile.value) ? smile.value : smile;
  const authBox = document.getElementById('headerAuthContainer');
  const btnLogin = document.getElementById('headerBtnLogin');
  const userContainer = document.getElementById('headerUserContainer') || document.getElementById('headerUserPerfil');
  const userAvatar = document.getElementById('headerUserAvatar');
  const userNombre = document.getElementById('headerUserNombre');
  const userBadge = document.getElementById('headerUserBadge');
  const perfilLink = document.getElementById('headerPerfilLink');

  const drawerBtnLogin = document.getElementById('drawerBtnLogin');
  const drawerUserPerfil = document.getElementById('drawerUserPerfil');
  const drawerUserAvatar = document.getElementById('drawerUserAvatar');
  const drawerUserNombre = document.getElementById('drawerUserNombre');
  const drawerUserBadge = document.getElementById('drawerUserBadge');
  const drawerPerfilLink = document.getElementById('drawerPerfilLink');

  if (u && (u.uid || u.nombre || u.usuario || u.email)) {
    if (authBox) authBox.classList.add('has-user');
    if (btnLogin) btnLogin.style.setProperty('display', 'none', 'important');
    if (userContainer) userContainer.style.setProperty('display', 'inline-flex', 'important');
    if (drawerBtnLogin) drawerBtnLogin.style.display = 'none';
    if (drawerUserPerfil) drawerUserPerfil.style.display = 'flex';

    const foto = (!u.avatar && !u.foto && !u.photoURL) || (u.avatar && u.avatar.includes('smile.webp')) 
      ? '/smile.avif' 
      : (u.avatar || u.foto || u.photoURL);
    if (userAvatar) userAvatar.src = foto;
    if (drawerUserAvatar) drawerUserAvatar.src = foto;

    const nombreCorto = (u.nombre || u.usuario || 'Usuario').trim().split(' ')[0];
    if (userNombre) userNombre.textContent = nombreCorto;
    if (drawerUserNombre) drawerUserNombre.textContent = nombreCorto;

    const rol = (u.rol || 'cliente').toLowerCase();
    const esStaff = ['personal', 'gestor', 'admin', 'colaborador'].includes(rol);
    const rolBadge = esStaff ? (u.cargo || 'Especialista') : 'Paciente';

    if (userBadge) userBadge.textContent = rolBadge;
    if (drawerUserBadge) drawerUserBadge.textContent = rolBadge;

    const rutaDestino = esStaff ? '/personal' : '/cliente';
    if (perfilLink) perfilLink.href = rutaDestino;
    if (drawerPerfilLink) drawerPerfilLink.href = rutaDestino;
  } else {
    if (authBox) authBox.classList.remove('has-user');
    if (btnLogin) {
      btnLogin.style.removeProperty('display');
      btnLogin.style.display = 'inline-flex';
    }
    if (userContainer) {
      userContainer.style.setProperty('display', 'none', 'important');
    }
    if (drawerBtnLogin) drawerBtnLogin.style.display = 'flex';
    if (drawerUserPerfil) drawerUserPerfil.style.display = 'none';
  }
}

/**
 * Switcher de idiomas dinámico preservando ruta y anclas
 */
function initLanguageSwitcher() {
  document.querySelectorAll('.header-pill-group a[data-lang]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetLang = btn.getAttribute('data-lang');
      if (!targetLang) return;
      e.preventDefault();
      const pathActual = window.location.pathname.replace(/\/$/, '') || '/';
      let limpia = pathActual;
      if (limpia === '/en') limpia = '/';
      else if (limpia.startsWith('/en/')) limpia = limpia.slice(3) || '/';
      const hash = window.location.hash || '';

      const dest = targetLang === 'es' 
        ? limpia 
        : (limpia === '/' ? `/${targetLang}` : `/${targetLang}${limpia}`);
      window.location.href = dest + hash;
    });
  });
}

/**
 * Hidrata elementos del Hero con datos reactivos de negocio
 */
function hidratarHeroDesdeNegocio(datos) {
  if (!datos || typeof datos !== 'object') return;

  const dir = datos.ubicacion?.direccion || '';
  const maps = datos.ubicacion?.mapsUrl || '';
  const tel = datos.contacto?.telefono || '';
  const telLimpio = datos.contacto?.telefonoLimpio || tel.replace(/\D/g, '');

  if (dir) {
    document.querySelectorAll('[data-negocio-direccion], [data-negocio-direccion-sede], [data-negocio-direccion-origen]').forEach(el => {
      el.textContent = dir;
    });
  }

  if (maps) {
    document.querySelectorAll('[data-negocio-maps]').forEach(a => {
      a.setAttribute('href', maps);
    });
  }

  if (tel) {
    document.querySelectorAll('[data-negocio-tel-text]').forEach(el => el.textContent = tel);
  }
  if (telLimpio) {
    document.querySelectorAll('[data-negocio-tel-link]').forEach(a => a.setAttribute('href', `tel:${telLimpio}`));
  }

  const horario = datos.contacto?.horario || '';
  if (horario) {
    document.querySelectorAll('[data-negocio-horario]').forEach(el => el.textContent = horario);
  }
}

/**
 * Selector interactivo de temas clínicos en Hero (Psicología América)
 */
function initSelectorTemas() {
  const grid = document.getElementById('temaSelector') || document.getElementById('districtSelector');
  const info = document.getElementById('temaActualInfo') || document.getElementById('distritoActualInfo');
  const btnWsp = document.getElementById('btnHeroWsp');
  if (!grid) return;

  const botones = grid.querySelectorAll('.hero-district-btn');
  botones.forEach((btn) => {
    btn.addEventListener('click', () => {
      botones.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const infoText = btn.getAttribute('data-info') || '';
      const labelText = btn.getAttribute('data-label') || btn.querySelector('.hero-district-name')?.textContent?.trim() || '';
      const tema = btn.getAttribute('data-tema') || '';

      if (info) {
        info.textContent = infoText;
      }

      if (btnWsp) {
        btnWsp.setAttribute('data-tema', tema);
      }

      try {
        localStorage.setItem('psicologia_motivo_activo', tema);
      } catch (e) {}
    });
  });
}

/**
 * Cotizador Interactivo de Sesiones Terapéuticas (Psicología América)
 */
function initCalculadora() {
  const sServicio = document.getElementById('calcServicio');
  const sModalidad = document.getElementById('calcModalidad');
  const sSesiones = document.getElementById('calcSesiones');
  const dSesiones = document.getElementById('sesionesDisplay');
  const dTotal = document.getElementById('calcTotalResult');
  const gSesiones = document.getElementById('groupSesiones');
  const btnWs = document.getElementById('btnCalcWs');

  if (!sServicio || !sModalidad || !sSesiones || !dTotal || !btnWs) return;

  function recalcular() {
    const selectedOpt = sServicio.options[sServicio.selectedIndex];
    if (!selectedOpt) return;

    const precioBase = parseFloat(selectedOpt.value || '85');
    const esFijo = selectedOpt.getAttribute('data-fijo') === 'true';
    const nombreServicio = selectedOpt.getAttribute('data-nombre') || selectedOpt.text;
    const modalidad = sModalidad.options[sModalidad.selectedIndex]?.text || '';
    const numSesiones = parseInt(sSesiones.value || '1', 10);

    let total = 0;
    if (esFijo) {
      total = precioBase;
      if (gSesiones) gSesiones.style.opacity = '0.35';
    } else {
      if (gSesiones) gSesiones.style.opacity = '1';
      total = precioBase * numSesiones;
      if (numSesiones >= 10 && precioBase === 85) {
        total = 600.00; // Tarifa especial paquete 10 sesiones
      }
    }

    if (dSesiones) {
      dSesiones.textContent = `${numSesiones} ${numSesiones === 1 ? 'sesión' : 'sesiones'}`;
    }

    dTotal.textContent = `S/ ${total.toFixed(2)}`;

    const wsNum = btnWs.getAttribute('data-ws-num') || '51960332958';
    const detalleSesiones = esFijo ? 'programa integral' : `${numSesiones} sesión(es)`;
    const msg = `Hola Lic. Sofía, coticé en su web: ${nombreServicio} (${modalidad}) por ${detalleSesiones}. Total: S/ ${total.toFixed(2)}. Deseo agendar mi cita.`;
    btnWs.href = `https://wa.me/${wsNum}?text=${encodeURIComponent(msg)}`;
  }

  sServicio.addEventListener('change', recalcular);
  sModalidad.addEventListener('change', recalcular);
  sSesiones.addEventListener('input', recalcular);
  recalcular();
}

/**
 * Reconciliación Reactiva Local-First de servicios con Firestore y localStorage (0ms latencia)
 */
export function reconciliarServiciosUI(lista = null) {
  try {
    let prods = lista;
    if (!Array.isArray(prods) || prods.length === 0) {
      const local = localStorage.getItem('wi_servicios') || localStorage.getItem('wi_productos') || localStorage.getItem('gaswii_productos');
      if (!local) return;
      const parsed = JSON.parse(local);
      prods = Array.isArray(parsed) ? parsed : (parsed?.value || []);
    }
    if (!Array.isArray(prods) || prods.length === 0) return;

    prods.forEach((p) => {
      const id = p.id || p.slug;
      if (!id) return;
      const precioNum = Number(p.precioPEN ?? p.precio ?? 0);
      if (precioNum <= 0) return;

      // 1. Tarjetas de Servicios y Talleres (span[data-price-id])
      const priceEls = document.querySelectorAll(`[data-price-id="${id}"]`);
      priceEls.forEach(el => {
        el.textContent = precioNum.toFixed(2);
      });

      // 2. Opciones de Calculadora
      const calcOpt = document.querySelector(`#calcServicio option[data-prod-id="${id}"], #calcServicio option[value="${id}"]`);
      if (calcOpt) {
        calcOpt.value = precioNum;
        const nombre = calcOpt.getAttribute('data-nombre') || p.nombre?.es || p.nombre || '';
        calcOpt.textContent = `${nombre} (S/ ${precioNum.toFixed(2)})`;
      }
    });

    // Si la calculadora está presente, recalcular en vivo
    const sServicio = document.getElementById('calcServicio');
    if (sServicio) {
      sServicio.dispatchEvent(new Event('change'));
    }
  } catch (e) {}
}

function initReconciliacionProductos() {
  reconciliarServiciosUI();

  // Escuchar eventos en vivo emitidos desde /personal
  window.addEventListener('psicologia:servicios-actualizado', (e) => {
    reconciliarServiciosUI(e.detail);
  });
  window.addEventListener('wi:servicios-actualizado', (e) => {
    reconciliarServiciosUI(e.detail);
  });
  window.addEventListener('wi:productos-actualizado', (e) => {
    reconciliarServiciosUI(e.detail);
  });

  // Escuchar cambios entre pestañas del navegador (StorageEvent)
  window.addEventListener('storage', (e) => {
    if (e.key === 'wi_servicios' || e.key === 'wi_productos') {
      reconciliarServiciosUI();
    }
  });
}

/**
 * Inicializador Maestro diferido por wiSmart()
 */
export function initInicioInteractivo() {
  // 1. Activar lazy loading inteligente de imágenes
  imgwii.ver();

  // 2. Reactividad de sesión en Header y Drawer
  try {
    const raw = localStorage.getItem('wiSmile');
    if (raw) actualizarAuthUi(JSON.parse(raw));
  } catch (e) {}

  window.addEventListener('gaswii:auth-change', (e) => {
    actualizarAuthUi(e.detail);
  });

  window.cerrarSesionHeader = async () => {
    const { salir } = await import('@feature/auth/sesion.js');
    await salir();
    actualizarAuthUi(null);
  };

  // 3. Switcher de idiomas
  initLanguageSwitcher();

  // 4. Selector interactivo de temas clínicos en Hero
  initSelectorTemas();

  // 5. Calculadora de duración de gas
  initCalculadora();

  // 6. Sincronización Local-First de productos
  initReconciliacionProductos();

  // 7. Accesibilidad: Cerrar Drawer con tecla Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.cerrarDrawer?.();
    }
  });
}
