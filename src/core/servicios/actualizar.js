// src/core/servicios/actualizar.js
// 🚀 Motor Central de Actualización Universal Zero-Waste (PsicologíaWii Web)
// Centraliza: Local-First (0ms) + Dirty Checking + Firestore Granular + Smart Dock Cloudflare
// Etapa 1: Visualización Inmediata en Vivo (0ms) en pantalla y clientes
// Etapa 2: Smart Dock Cloudflare (Cooldown 30s + Pausa "Espérame" + Auto-deploy 5 min para cuidar cuota de 500 builds)
// 100% Clean Code: Toggle colapsable / expandible a botón flotante con tiempo en borde para máxima comodidad visual.

import { savels, getls, Notificacion } from '@widev';
import { db } from './firebase.js';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { hidratarNegocioEnDOM } from './hidratarNegocio.js';
import './actualizar.css';

// ── CONSTANTES DE TIEMPO Y CONFIGURACIÓN SMART DOCK ──
const COOLDOWN_SEG = 30; // 30s de enfriamiento preventivo antes de habilitar "Actualizar SEO"
const AUTO_DEPLOY_MIN = 5; // 5 minutos de seguridad antes del auto-deploy
const AUTO_DEPLOY_MS = AUTO_DEPLOY_MIN * 60 * 1000;
const DURACION_COMPILACION_MS = 45 * 1000; // 45s estimación dinámica de compilación
const DOCK_STORAGE_KEY = 'cf_smart_dock_state';

let _timerInterval = null;
let _desplegandoEnFondo = false;
let _sondeoActivo = false;

// =============================================================================
// 1. HELPERS DE SESIÓN, FORMATEO Y VISIBILIDAD (ZERO INLINE CSS)
// =============================================================================

function guardarEstadoEnSession(data) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function leerEstadoDeSession() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(DOCK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function limpiarEstadoDeSession() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(DOCK_STORAGE_KEY);
  } catch (e) {}
}

function formatearMinutosSegundos(ms) {
  const totalSeg = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  return `${min}:${seg < 10 ? '0' : ''}${seg} min`;
}

function obtenerMensajeEstado(pct) {
  if (pct < 25) return 'Disparando deploy hook en Cloudflare Pages…';
  if (pct < 55) return 'Compilando páginas estáticas con Astro SSG…';
  if (pct < 80) return 'Optimizando sitemap XML y metadatos Googlebot…';
  if (pct < 100) return 'Propagando HTML estático a la red Edge global…';
  return '¡HTML y Sitemap listos en la red global de Cloudflare! 🎉';
}

function mostrarDock(dock) {
  if (dock) dock.classList.remove('is-hidden');
}

function ocultarDock(dock) {
  if (dock) dock.classList.add('is-hidden');
}

export function colapsarDock(dock, colapsado = true) {
  if (!dock) return;
  if (colapsado) {
    dock.classList.add('is-collapsed');
  } else {
    dock.classList.remove('is-collapsed');
  }
  const estadoObj = leerEstadoDeSession();
  if (estadoObj) {
    guardarEstadoEnSession({
      ...estadoObj,
      colapsado: !!colapsado
    });
  }
}

// =============================================================================
// 2. DOCK FLOTANTE INTELIGENTE (HTML + WITEMA)
// =============================================================================

function obtenerOCrearDock() {
  if (typeof document === 'undefined') return null;

  let dock = document.getElementById('cfDeployDock');
  if (dock) return dock;

  dock = document.createElement('div');
  dock.id = 'cfDeployDock';
  dock.className = 'cf-dock-wrap';
  dock.innerHTML = `
    <!-- BOTÓN MINI PILL (Cuando está colapsado para liberar pantalla) -->
    <button type="button" class="cf-dock-pill-btn" id="cfDockPillBtn" title="Clic para expandir panel de despliegue SEO">
      <span class="cf-pill-icon" id="cfPillIcon"><i class="fa-solid fa-cloud-arrow-up"></i></span>
      <span class="cf-pill-label" id="cfPillLabel">SEO</span>
      <span class="cf-pill-time" id="cfPillTime">5:00 min</span>
      <i class="fa-solid fa-chevron-up cf-pill-expand-icon"></i>
    </button>

    <!-- TARJETA COMPLETA (Cuando está expandido) -->
    <div class="cf-dock-card" id="cfDockCard">
      <!-- 1. BANNER EN VIVO (0ms para humanos) -->
      <div class="cf-dock-vivo-banner" id="cfDockVivoBanner">
        <div class="cf-dock-vivo-header">
          <div class="cf-dock-vivo-tag">
            <span class="cf-live-dot"></span>
            <i class="fa-solid fa-bolt"></i>
            <strong>ACTIVO EN VIVO (0ms)</strong>
          </div>
          <div class="cf-dock-header-controls">
            <button type="button" class="cf-dock-btn-control" id="cfDockBtnCollapse" title="Minimizar a botón flotante">
              <i class="fa-solid fa-chevron-down"></i>
            </button>
            <button type="button" class="cf-dock-btn-close" id="cfDockBtnClose" title="Cerrar aviso">&times;</button>
          </div>
        </div>
        <p class="cf-dock-vivo-desc">
          Tus cambios ya están visibles al instante en tu pantalla y para tus clientes.
        </p>
        <div class="cf-dock-action-wrap">
          <a href="/" target="_blank" rel="noopener noreferrer" class="cf-dock-btn-open" id="cfDockBtnOpen">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Ver Web en Vivo (0ms)
          </a>
        </div>
      </div>

      <!-- 2. SECCIÓN DINÁMICA SMART SEO CLOUDFLARE -->
      <div class="cf-dock-seo-section" id="cfDockSeoSection">
      </div>
    </div>
  `;

  document.body.appendChild(dock);

  const btnClose = dock.querySelector('#cfDockBtnClose');
  btnClose?.addEventListener('click', () => {
    ocultarDock(dock);
    detenerProgreso(true);
  });

  const btnCollapse = dock.querySelector('#cfDockBtnCollapse');
  btnCollapse?.addEventListener('click', () => {
    colapsarDock(dock, true);
  });

  const pillBtn = dock.querySelector('#cfDockPillBtn');
  pillBtn?.addEventListener('click', () => {
    colapsarDock(dock, false);
  });

  return dock;
}

function renderizarSeccionSEO(estadoObj) {
  const dock = obtenerOCrearDock();
  if (!dock) return;
  const seoSection = dock.querySelector('#cfDockSeoSection');
  if (!seoSection) return;

  const { estado, cooldownFin = 0, autoDeployFin = 0 } = estadoObj;
  const ahora = Date.now();

  if (estado === 'pendiente' || estado === 'pausado') {
    const cooldownRestante = Math.max(0, Math.ceil((cooldownFin - ahora) / 1000));
    const autoRestanteMs = Math.max(0, autoDeployFin - ahora);
    const estaEnPausa = estado === 'pausado';

    seoSection.innerHTML = `
      <header class="cf-dock-head">
        <div class="cf-dock-title-wrap">
          <i class="fa-solid fa-cloud-arrow-up cf-dock-icon" id="cfDockIcon"></i>
          <div>
            <strong class="cf-dock-title" id="cfDockTitle">Actualización SEO (Cloudflare)</strong>
            <span class="cf-dock-sub" id="cfDockSub">Recompilación estática para Googlebot</span>
          </div>
        </div>
        <span class="cf-dock-pct cf-dock-pct-pending" id="cfDockPctBadge">
          ${estaEnPausa ? 'Pausado' : 'Pendiente'}
        </span>
      </header>

      ${estaEnPausa ? `
        <div class="cf-dock-pause-view" id="cfDockPauseView">
          <span class="cf-dock-pause-title"><i class="fa-solid fa-mug-hot"></i> ¡Tómate tu tiempo, Wilder!</span>
          <p class="cf-dock-pause-desc">
            Edita tranquilo tus productos, blogs o zonas. Cuando termines todo, presiona <strong>"Actualizar SEO"</strong>. Si te olvidas, el sistema lo compilará automáticamente en <strong id="cfPauseCountdown">${formatearMinutosSegundos(autoRestanteMs)}</strong>.
          </p>
        </div>
      ` : `
        <p class="cf-dock-advice" id="cfDockAdvice">
          ⚠️ <strong>Límite Cloudflare (500/mes):</strong> Si vas a editar más productos, blogs o zonas, hazlo ahora y compila todo en un solo deploy.
        </p>
      `}

      <div class="cf-dock-actions-row">
        <button type="button" class="cf-dock-btn-seo" id="cfDockBtnSeo" ${cooldownRestante > 0 ? 'disabled' : ''}>
          <i class="fa-solid fa-rocket"></i>
          <span id="cfDockBtnSeoTxt">${cooldownRestante > 0 ? `Actualizar SEO (${cooldownRestante}s)` : 'Actualizar SEO Ahora'}</span>
        </button>
        ${!estaEnPausa ? `
          <button type="button" class="cf-dock-btn-wait" id="cfDockBtnWait">
            <i class="fa-solid fa-hourglass-half"></i> ¡Espérame, falta actualizar!
          </button>
        ` : ''}
      </div>

      <p class="cf-dock-countdown-txt">
        <i class="fa-regular fa-clock"></i>
        Se compilará automáticamente en: <strong id="cfDockAutoCountdown">${formatearMinutosSegundos(autoRestanteMs)}</strong>
      </p>
    `;

    // Conectar eventos a los botones
    const btnSeo = seoSection.querySelector('#cfDockBtnSeo');
    const btnWait = seoSection.querySelector('#cfDockBtnWait');

    btnSeo?.addEventListener('click', () => {
      ejecutarDeployCloudflare('click-manual');
    });

    btnWait?.addEventListener('click', () => {
      pausarSmartDock();
    });

  } else if (estado === 'compilando') {
    seoSection.innerHTML = `
      <header class="cf-dock-head">
        <div class="cf-dock-title-wrap">
          <i class="fa-solid fa-cloud-arrow-up cf-dock-icon cf-spin-cloud" id="cfDockIcon"></i>
          <div>
            <strong class="cf-dock-title" id="cfDockTitle">Optimizando SEO en la Nube</strong>
            <span class="cf-dock-sub" id="cfDockSub">Generando HTML estático y sitemap para Googlebot</span>
          </div>
        </div>
        <span class="cf-dock-pct" id="cfDockPct">0%</span>
      </header>

      <div class="cf-dock-bar-track">
        <div class="cf-dock-bar-fill cf-dock-bar-fill-init" id="cfDockBarFill"></div>
      </div>

      <footer class="cf-dock-footer">
        <span class="cf-dock-status-txt" id="cfDockStatusTxt">Iniciando compilación en Cloudflare Pages…</span>
        <span class="cf-dock-timer" id="cfDockTimer">45s</span>
      </footer>
    `;

  } else if (estado === 'listo') {
    seoSection.innerHTML = `
      <header class="cf-dock-head">
        <div class="cf-dock-title-wrap">
          <i class="fa-solid fa-circle-check cf-dock-icon cf-dock-icon-success" id="cfDockIconSuccess"></i>
          <div>
            <strong class="cf-dock-title cf-dock-title-success" id="cfDockTitleSuccess">¡SEO Estático Desplegado!</strong>
            <span class="cf-dock-sub" id="cfDockSub">Googlebot y clientes verán el HTML compilado</span>
          </div>
        </div>
        <span class="cf-dock-pct cf-dock-pct-success" id="cfDockPctSuccess">100%</span>
      </header>

      <div class="cf-dock-bar-track">
        <div class="cf-dock-bar-fill cf-dock-bar-fill-success" id="cfDockBarFillSuccess"></div>
      </div>

      <footer class="cf-dock-footer">
        <span class="cf-dock-status-txt">Sitemap y páginas 100% sincronizadas en Edge CDN 🎉</span>
        <span class="cf-dock-timer">Listo</span>
      </footer>
    `;
  }
}

// =============================================================================
// 3. TICKER INTELIGENTE Y MÁQUINA DE ESTADOS
// =============================================================================

function iniciarSmartTicker() {
  if (_timerInterval) clearInterval(_timerInterval);

  function tick() {
    const estadoObj = leerEstadoDeSession();
    if (!estadoObj) {
      detenerProgreso(false);
      return;
    }

    const ahora = Date.now();
    const dock = document.getElementById('cfDeployDock');
    if (!dock) return;

    const pillTime = dock.querySelector('#cfPillTime');
    const pillLabel = dock.querySelector('#cfPillLabel');
    const pillIcon = dock.querySelector('#cfPillIcon');

    if (estadoObj.estado === 'pendiente' || estadoObj.estado === 'pausado') {
      const cooldownRestante = Math.max(0, Math.ceil((estadoObj.cooldownFin - ahora) / 1000));
      const autoRestanteMs = Math.max(0, estadoObj.autoDeployFin - ahora);
      const textoTiempo = formatearMinutosSegundos(autoRestanteMs);

      // Actualizar botón de acción SEO
      const btnSeo = dock.querySelector('#cfDockBtnSeo');
      const btnSeoTxt = dock.querySelector('#cfDockBtnSeoTxt');
      if (btnSeo && btnSeoTxt) {
        if (cooldownRestante > 0) {
          btnSeo.disabled = true;
          btnSeoTxt.textContent = `Actualizar SEO (${cooldownRestante}s)`;
        } else {
          btnSeo.disabled = false;
          btnSeoTxt.textContent = 'Actualizar SEO Ahora';
        }
      }

      // Actualizar cuenta regresiva de auto-deploy
      const autoCountEl = dock.querySelector('#cfDockAutoCountdown');
      if (autoCountEl) {
        autoCountEl.textContent = textoTiempo;
      }

      const pauseCountEl = dock.querySelector('#cfPauseCountdown');
      if (pauseCountEl) {
        pauseCountEl.textContent = textoTiempo;
      }

      // Actualizar Mini Pill flotante
      if (pillTime) {
        pillTime.textContent = textoTiempo;
        pillTime.classList.remove('is-compiling');
      }
      if (pillLabel) {
        pillLabel.textContent = estadoObj.estado === 'pausado' ? 'Pausado' : 'SEO';
      }
      if (pillIcon) {
        pillIcon.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i>`;
      }

      // Si vence el tiempo de inactividad de 5 minutos, auto-compilar
      if (autoRestanteMs <= 0) {
        ejecutarDeployCloudflare('auto-deploy-5min');
      }

    } else if (estadoObj.estado === 'compilando') {
      const transcurrido = ahora - (estadoObj.inicioCompilacion || ahora);
      const restante = Math.max(0, DURACION_COMPILACION_MS - transcurrido);
      const pct = Math.min(100, Math.floor((transcurrido / DURACION_COMPILACION_MS) * 100));

      const elPct = dock.querySelector('#cfDockPct');
      const elBar = dock.querySelector('#cfDockBarFill');
      const elStatus = dock.querySelector('#cfDockStatusTxt');
      const elTimer = dock.querySelector('#cfDockTimer');

      if (elPct) elPct.textContent = `${pct}%`;
      if (elBar) elBar.style.width = `${pct}%`;
      if (elStatus) elStatus.textContent = obtenerMensajeEstado(pct);
      if (elTimer) elTimer.textContent = `${Math.ceil(restante / 1000)}s`;

      // Actualizar Mini Pill en compilación
      if (pillTime) {
        pillTime.textContent = `${pct}% (${Math.ceil(restante / 1000)}s)`;
        pillTime.classList.add('is-compiling');
      }
      if (pillLabel) {
        pillLabel.textContent = 'Compilando';
      }
      if (pillIcon) {
        pillIcon.innerHTML = `<i class="fa-solid fa-cloud-arrow-up fa-spin"></i>`;
      }

      if (pct >= 55 && !_sondeoActivo) {
        _sondeoActivo = true;
        verificarWebEnVivo();
      }

      if (pct >= 100) {
        marcarComoListo(dock);
      }
    }
  }

  tick();
  _timerInterval = setInterval(tick, 1000);
}

async function verificarWebEnVivo() {
  try {
    const res = await fetch(`/?_t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    if (res.ok) {
      const estadoObj = leerEstadoDeSession();
      if (estadoObj && estadoObj.estado === 'compilando') {
        const transcurrido = Date.now() - (estadoObj.inicioCompilacion || 0);
        if (transcurrido > 30000) {
          const dock = document.getElementById('cfDeployDock');
          if (dock) marcarComoListo(dock);
        }
      }
    }
  } catch (err) {
  } finally {
    _sondeoActivo = false;
  }
}

function marcarComoListo(dock) {
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }

  const estadoListo = {
    estado: 'listo',
    motivo: 'completado',
    inicioActivacion: Date.now(),
    cooldownFin: 0,
    autoDeployFin: 0,
    inicioCompilacion: 0
  };
  guardarEstadoEnSession(estadoListo);
  renderizarSeccionSEO(estadoListo);

  const pillTime = dock.querySelector('#cfPillTime');
  const pillLabel = dock.querySelector('#cfPillLabel');
  const pillIcon = dock.querySelector('#cfPillIcon');
  if (pillTime) {
    pillTime.textContent = 'Listo 🎉';
    pillTime.classList.add('is-compiling');
  }
  if (pillLabel) {
    pillLabel.textContent = 'Desplegado';
  }
  if (pillIcon) {
    pillIcon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
  }

  setTimeout(() => {
    ocultarDock(dock);
    limpiarEstadoDeSession();
  }, 8000);
}

// =============================================================================
// 4. CONTROLADORES SMART DOCK (ACTIVAR, PAUSAR, EJECUTAR)
// =============================================================================

export function pausarSmartDock() {
  const actual = leerEstadoDeSession();
  if (!actual || actual.estado === 'compilando') return;

  const nuevoEstado = {
    ...actual,
    estado: 'pausado'
  };
  guardarEstadoEnSession(nuevoEstado);

  const dock = obtenerOCrearDock();
  if (dock) {
    mostrarDock(dock);
    renderizarSeccionSEO(nuevoEstado);
  }
}

export function activarSmartDock({ motivo = 'cambios' } = {}) {
  if (typeof window === 'undefined') return;

  const ahora = Date.now();
  const previo = leerEstadoDeSession();

  // Si ya se encuentra en fase de compilación activa, no interrumpir
  if (previo && previo.estado === 'compilando') {
    return;
  }

  // Al guardar un cambio nuevo:
  // 1. Reiniciar cooldown a 30s para proteger la cuota
  // 2. Extender el auto-deploy 5 min más para permitir múltiples ediciones
  // 3. Mantener el modo pausado si Wilder ya lo había pedido
  // 4. Mantener la preferencia de colapsado
  const nuevoEstado = {
    estado: (previo && previo.estado === 'pausado') ? 'pausado' : 'pendiente',
    motivo,
    inicioActivacion: ahora,
    cooldownFin: ahora + (COOLDOWN_SEG * 1000),
    autoDeployFin: ahora + AUTO_DEPLOY_MS,
    inicioCompilacion: 0,
    colapsado: previo ? !!previo.colapsado : false
  };

  guardarEstadoEnSession(nuevoEstado);

  const dock = obtenerOCrearDock();
  if (!dock) return;
  mostrarDock(dock);
  colapsarDock(dock, nuevoEstado.colapsado);

  renderizarSeccionSEO(nuevoEstado);
  iniciarSmartTicker();
}

export async function ejecutarDeployCloudflare(origen = 'manual') {
  if (typeof window === 'undefined') return;

  const ahora = Date.now();
  const previo = leerEstadoDeSession();
  const estadoCompilando = {
    estado: 'compilando',
    motivo: origen,
    inicioActivacion: ahora,
    cooldownFin: 0,
    autoDeployFin: 0,
    inicioCompilacion: ahora,
    colapsado: previo ? !!previo.colapsado : false
  };

  guardarEstadoEnSession(estadoCompilando);

  const dock = obtenerOCrearDock();
  if (dock) {
    mostrarDock(dock);
    colapsarDock(dock, estadoCompilando.colapsado);
    renderizarSeccionSEO(estadoCompilando);
  }

  iniciarSmartTicker();

  // Enviar webhook seguro a Cloudflare Pages
  const hookUrl = import.meta.env.PUBLIC_CLOUDFLARE_DEPLOY_HOOK;
  if (hookUrl && !_desplegandoEnFondo) {
    try {
      _desplegandoEnFondo = true;
      console.log(`[actualizar.js] Disparando redeploy en Cloudflare Pages (${origen})...`);
      await fetch(hookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' }
      });
      console.log('[actualizar.js] Webhook Cloudflare recibido con éxito.');
    } catch (err) {
      console.warn('[actualizar.js] Error al invocar deploy hook:', err);
    } finally {
      _desplegandoEnFondo = false;
    }
  }
}

export function detenerProgreso(eliminarStorage = true) {
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }
  if (eliminarStorage) {
    limpiarEstadoDeSession();
  }
}

export function inicializarProgresoDeploy() {
  if (typeof window === 'undefined') return;

  const estadoObj = leerEstadoDeSession();
  if (!estadoObj) return;

  const ahora = Date.now();

  if (estadoObj.estado === 'pendiente' || estadoObj.estado === 'pausado') {
    if (ahora < estadoObj.autoDeployFin) {
      // Reanudar estado y ticker existente
      const dock = obtenerOCrearDock();
      if (dock) {
        mostrarDock(dock);
        colapsarDock(dock, !!estadoObj.colapsado);
        renderizarSeccionSEO(estadoObj);
        iniciarSmartTicker();
      }
    } else {
      // Vencieron los 5 minutos mientras navegaba -> compilar automáticamente
      ejecutarDeployCloudflare('auto-deploy-expirado');
    }
  } else if (estadoObj.estado === 'compilando') {
    if ((ahora - (estadoObj.inicioCompilacion || ahora)) < DURACION_COMPILACION_MS) {
      const dock = obtenerOCrearDock();
      if (dock) {
        mostrarDock(dock);
        colapsarDock(dock, !!estadoObj.colapsado);
        renderizarSeccionSEO(estadoObj);
        iniciarSmartTicker();
      }
    } else {
      const dock = obtenerOCrearDock();
      if (dock) {
        mostrarDock(dock);
        marcarComoListo(dock);
      }
    }
  }
}

// Retrocompatibilidad con nombres anteriores
export function iniciarProgresoDeploy({ motivo = 'cambios', forzarInicio = false } = {}) {
  if (forzarInicio) {
    ejecutarDeployCloudflare(motivo);
  } else {
    activarSmartDock({ motivo });
  }
}

export function solicitarActualizacionWeb({ motivo = 'actualización' } = {}) {
  activarSmartDock({ motivo });
}

export function dispararDeploySilencioso(motivo = 'cambio') {
  ejecutarDeployCloudflare(motivo);
}

// =============================================================================
// 5. MOTOR CENTRAL DE ACTUALIZACIÓN (LOCAL-FIRST + FIRESTORE + SMART DOCK)
// =============================================================================

export async function actualizarCentral({
  modulo = 'negocio',
  coleccion = 'negocio',
  docId = 'principal',
  storageKey = 'wi_negocio',
  evento = 'wi:negocio-actualizado',
  datos = {},
  listaStorage = undefined,
  redeploy = true,
  mensajeExito = 'Cambios guardados al instante',
  forzarWrite = false
}) {
  // 1. DIRTY CHECKING INTELIGENTE
  if (!forzarWrite) {
    try {
      const previoRaw = getls(storageKey);
      if (previoRaw) {
        if (listaStorage !== undefined && Array.isArray(previoRaw)) {
          const previoItem = previoRaw.find(x => x && (x.id === docId || x.slug === docId));
          if (previoItem && JSON.stringify(previoItem) === JSON.stringify(datos)) {
            Notificacion('No se detectaron cambios en este elemento', 'info', 2000);
            return { ok: true, modificado: false, datos };
          }
        }
      }
    } catch (e) {}
  }

  // 2. LOCAL-FIRST INMEDIATO (0 ms en pantalla tipo App Nativa)
  const aGuardar = listaStorage !== undefined ? listaStorage : datos;
  try {
    savels(storageKey, aGuardar);

    // Guardar en claves alias de retrocompatibilidad
    if (modulo === 'negocio') {
      try { savels('minegocio', aGuardar); } catch (e) {}
      try { savels('gaswii_negocio', aGuardar); } catch (e) {}
    } else if (modulo === 'productos') {
      try { savels('gaswii_productos', aGuardar); } catch (e) {}
      try { savels('wi_servicios', aGuardar); } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      // Evento canónico Workwii
      window.dispatchEvent(new CustomEvent(evento, { detail: aGuardar }));

      // Eventos específicos por módulo
      if (modulo === 'negocio') {
        window.dispatchEvent(new CustomEvent('gaswii:negocio-actualizado', { detail: aGuardar }));
        hidratarNegocioEnDOM(datos);
      } else if (modulo === 'productos') {
        window.dispatchEvent(new CustomEvent('gaswii:productos-actualizado', { detail: aGuardar }));
      } else if (modulo === 'blogs') {
        window.dispatchEvent(new CustomEvent('wi:blogs-actualizado', { detail: aGuardar }));
      }
    }
  } catch (err) {
    console.warn('[actualizarCentral] Error en LocalStorage:', err);
  }

  Notificacion(mensajeExito, 'success', 2500);

  // 3. PERSISTENCIA GRANULAR EN FIRESTORE (En segundo plano)
  try {
    if (db) {
      const docRef = doc(db, coleccion, docId);
      const firestorePayload = {
        ...datos,
        actualizado: serverTimestamp()
      };
      if (!datos.creado) {
        firestorePayload.creado = serverTimestamp();
      }
      await setDoc(docRef, firestorePayload, { merge: true });
    }
  } catch (err) {
    console.warn(`[actualizarCentral] Error silencioso al escribir en ${coleccion}/${docId}:`, err?.message || err);
  }

  // 4. ACTIVAR SMART DOCK (Control de Cuotas Cloudflare + 0ms Live)
  if (redeploy) {
    activarSmartDock({ motivo: modulo });
  }

  return { ok: true, modificado: true, datos };
}

export async function eliminarCentral({
  modulo = 'productos',
  coleccion = 'productos',
  docId = '',
  storageKey = 'wi_productos',
  evento = 'wi:productos-actualizado',
  listaActualizada = [],
  redeploy = true,
  mensajeExito = 'Elemento eliminado con éxito'
}) {
  if (!docId) return { ok: false, error: 'Sin docId' };

  // 1. Local-First inmediato
  try {
    savels(storageKey, listaActualizada);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(evento, { detail: listaActualizada }));
      if (modulo === 'blogs') {
        window.dispatchEvent(new CustomEvent('wi:blogs-actualizado', { detail: listaActualizada }));
      }
    }
  } catch (e) {}

  Notificacion(mensajeExito, 'info', 2500);

  // 2. Eliminar en Firestore
  try {
    if (db) {
      await deleteDoc(doc(db, coleccion, docId));
    }
  } catch (err) {
    console.warn(`[actualizarCentral] Error al eliminar ${coleccion}/${docId}:`, err);
  }

  // 3. Activar Smart Dock consolidado
  if (redeploy) {
    activarSmartDock({ motivo: `eliminar-${modulo}` });
  }

  return { ok: true, modificado: true };
}

export default {
  actualizarCentral,
  eliminarCentral,
  solicitarActualizacionWeb,
  dispararDeploySilencioso,
  iniciarProgresoDeploy,
  detenerProgreso,
  inicializarProgresoDeploy,
  activarSmartDock,
  pausarSmartDock,
  colapsarDock,
  ejecutarDeployCloudflare
};
