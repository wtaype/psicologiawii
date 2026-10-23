import { getls, savels, avatar, wiTema } from '@widev';
import { salir } from '../auth/sesion.js';
import { inicializarPedidos } from './modulos/01-pedidos/pedidos.js';
import { inicializarDirecciones, renderizarDirecciones } from './modulos/02-direccion/direccion.js';
import { inicializarCuenta } from './modulos/03-cuenta/cuenta.js';
import { inicializarSoporte } from './modulos/04-soporte/soporte.js';
import { esModuloValido, moduloDefecto } from './modulos.js';

function resolverModuloDesdeURL() {
  const parts = location.pathname.split('/').filter(Boolean);
  const cIdx = parts.indexOf('cliente');
  const param = cIdx >= 0 && parts[cIdx + 1];
  return (param && esModuloValido(param)) ? param : moduloDefecto;
}

let moduloActivo = moduloDefecto;

export function cambiarModulo(nuevoModulo, updateUrl = true) {
  if (!esModuloValido(nuevoModulo)) return;
  moduloActivo = nuevoModulo;

  // 1. Alternar Paneles
  document.querySelectorAll('.cl-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${nuevoModulo}`);
  });

  // 2. Alternar items activos en Sidebar
  document.querySelectorAll('.cl-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.panelTarget === nuevoModulo);
  });

  // 3. Alternar items activos en Dock Móvil
  document.querySelectorAll('.cl-m-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panelTarget === nuevoModulo);
  });

  // 4. Sincronizar URL de forma profesional con pushState
  if (updateUrl && history.pushState) {
    const newPath = nuevoModulo === moduloDefecto ? '/cliente' : `/cliente/${nuevoModulo}`;
    if (location.pathname !== newPath) {
      history.pushState({ modulo: nuevoModulo }, '', newPath);
    }
  }

  // 5. Inicializar módulo específico
  if (nuevoModulo === 'pedidos') {
    inicializarPedidos();
  } else if (nuevoModulo === 'direccion') {
    inicializarDirecciones();
  } else if (nuevoModulo === 'cuenta') {
    inicializarCuenta();
  } else if (nuevoModulo === 'soporte') {
    inicializarSoporte();
  }

  // 6. Scroll al inicio si está en móvil
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function inicializarSesionUI() {
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__WI_USER__ : null);
  if (!user || (!user.uid && !user.usuario && !user.nombre)) {
    salir();
    return;
  }

  const nameElem = document.getElementById('topbarUserName');
  const avatarElem = document.getElementById('topbarAvatarLetter');
  const planElem = document.getElementById('topbarUserPlan');
  const ddName = document.getElementById('dropdownUserFullName');
  const ddMail = document.getElementById('dropdownUserEmail');

  const nombreMostrar = user.nombre || user.usuario || 'Cliente';
  if (nameElem) nameElem.textContent = nombreMostrar;
  if (avatarElem) avatarElem.textContent = avatar(nombreMostrar);
  if (planElem) planElem.textContent = user.plan === 'vip' ? 'Cliente MYPE' : (user.plan ? `Plan ${user.plan}` : 'Contribuyente');
  if (ddName) ddName.textContent = user.nombreCompleto || user.nombre || user.usuario || 'Mi Perfil';
  if (ddMail) ddMail.textContent = user.email || user.celular || '';

  // Logout
  const btnLogout = document.getElementById('btnLogoutSession');
  btnLogout?.addEventListener('click', async () => {
    await salir();
  });
}

function inicializarDropdowns() {
  const btnUser = document.getElementById('btnUserChip');
  const menuUser = document.getElementById('menuUserDropdown');

  btnUser?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menuUser?.classList.toggle('open');
    btnUser.classList.toggle('active', isOpen);
    btnUser.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.cl-user-dropdown-container')) {
      menuUser?.classList.remove('open');
      btnUser?.classList.remove('active');
      btnUser?.setAttribute('aria-expanded', 'false');
    }
  });

  // Enlaces de salto directo desde el dropdown
  document.querySelectorAll('[data-jump-to]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.jumpTo;
      if (target) {
        menuUser?.classList.remove('open');
        btnUser?.classList.remove('active');
        btnUser?.setAttribute('aria-expanded', 'false');
        cambiarModulo(target);
      }
    });
  });
}

function inicializarTemaYSidebar() {
  // Conmutador de tema universal con wiTema
  const btnTheme = document.getElementById('btnThemeToggle');
  btnTheme?.addEventListener('click', () => {
    wiTema.toggle();
  });

  // Botón colapsar sidebar idéntico a personal
  const btnCollapse = document.getElementById('btnCollapseSidebar');
  const iconCollapse = document.getElementById('iconCollapse');
  const labelCollapse = document.getElementById('labelCollapse');
  btnCollapse?.addEventListener('click', () => {
    const isCollapsed = document.documentElement.classList.toggle('is-collapsed');
    savels('wi_sidebar_collapsed', isCollapsed);
    if (iconCollapse && labelCollapse) {
      iconCollapse.className = isCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left';
      labelCollapse.textContent = isCollapsed ? 'Expandir' : 'Colapsar';
    }
  });
}

function inicializarNavegacion() {
  // Delegación de eventos para botones de panel
  document.addEventListener('click', (e) => {
    const targetBtn = e.target.closest('[data-panel-target]');
    if (targetBtn) {
      const panelId = targetBtn.dataset.panelTarget;
      cambiarModulo(panelId);
    }
  });

  // Evento personalizado
  document.addEventListener('cambiarModuloCliente', (e) => {
    if (e.detail?.modulo) {
      cambiarModulo(e.detail.modulo);
    }
  });

  // Soporte para navegación con botón Atrás / Adelante del navegador
  window.addEventListener('popstate', (e) => {
    const mod = e.state?.modulo || resolverModuloDesdeURL();
    cambiarModulo(mod, false);
  });
}

function inicializarBuscador() {
  const inputDesktop = document.getElementById('clSearchInput');

  function filtrarProductos(query) {
    const q = query.trim().toLowerCase();
    const cards = document.querySelectorAll('#listaProductosCards .cl-h-card');
    cards.forEach(card => {
      const nombre = (card.dataset.nombre || '').toLowerCase();
      const corto = (card.dataset.nombrecorto || '').toLowerCase();
      const badge = (card.querySelector('.cl-h-badge')?.textContent || '').toLowerCase();
      const precio = (card.dataset.precio || '').toLowerCase();

      const coincide = !q || nombre.includes(q) || corto.includes(q) || badge.includes(q) || precio.includes(q);
      card.style.display = coincide ? 'grid' : 'none';
    });
  }

  function buscarGlobal(query) {
    if (moduloActivo === 'pedidos') {
      filtrarProductos(query);
    } else if (moduloActivo === 'direccion') {
      renderizarDirecciones(query);
      const inputDir = document.getElementById('cdSearchDir');
      if (inputDir && inputDir.value !== query) inputDir.value = query;
    }
  }

  inputDesktop?.addEventListener('input', (e) => {
    buscarGlobal(e.target.value);
  });
}

// Arranque inicial en DOM ready
document.addEventListener('DOMContentLoaded', () => {
  inicializarSesionUI();
  inicializarDropdowns();
  inicializarTemaYSidebar();
  inicializarNavegacion();
  inicializarBuscador();
  inicializarDirecciones();
  inicializarCuenta();
  inicializarSoporte();
  cambiarModulo(resolverModuloDesdeURL(), false);
});
