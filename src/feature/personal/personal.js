// src/feature/personal/personal.js
// Controlador de cliente unificado para Feature Personal
// 100% JS Nativo · Integrado con @widev y @/feature/auth/sesion.js

import { Notificacion, wiConfirmar, wiTema, getls, savels } from '@widev';
import { salir } from '@/feature/auth/sesion.js';
import { moduloDefecto, esModuloValido } from './modulos.js';
import { inicializarProgresoDeploy } from '@core/servicios/actualizar.js';

export function inicializarPersonal() {
  // Inicializar dock de progreso de despliegue Cloudflare
  inicializarProgresoDeploy();
  // 1. Buscador limpio sin autocompletado nativo del navegador
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.setAttribute('autocomplete', 'off');
    searchInput.value = '';
  }

  // 2. Hidratación de usuario desde wiSmile (Firebase Auth)
  const user = getls('wiSmile');
  if (user) {
    const avatar = document.getElementById('topbarUserImg');
    const topName = document.getElementById('topbarUserName');
    const dropName = document.getElementById('dropdownUserName');
    const dropEmail = document.getElementById('dropdownUserEmail');
    const heroName = document.getElementById('dbHeroUserName');
    const nombre = user.nombre || user.usuario;

    const userFoto = (!user.foto && !user.avatar) || (user.avatar && user.avatar.includes('smile.webp')) ? '/smile.avif' : (user.foto || user.avatar);
    if (avatar) avatar.src = userFoto;
    if (topName && nombre) topName.textContent = nombre;
    if (dropName && nombre) dropName.textContent = nombre;
    if (dropEmail && user.email) dropEmail.textContent = user.email;
    if (heroName && nombre) heroName.textContent = nombre;
  }

  // 3. Navegación y Rutas Dinámicas (/personal/[modulo])
  const navItems = document.querySelectorAll('.ps-nav-item');
  const panels = document.querySelectorAll('.ps-panel');

  function switchPanel(targetId, updateUrl = true) {
    if (!targetId) return;
    navItems.forEach(el => el.classList.toggle('active', el.getAttribute('data-panel-target') === targetId));
    panels.forEach(p => p.classList.toggle('active', p.id === `panel-${targetId}`));

    if (updateUrl && history.pushState) {
      const newPath = targetId === moduloDefecto ? '/personal' : `/personal/${targetId}`;
      if (location.pathname !== newPath) history.pushState({ modulo: targetId }, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Detectar módulo inicial de la URL
  const parts = location.pathname.split('/').filter(Boolean);
  const pIdx = parts.indexOf('personal');
  const param = pIdx >= 0 && parts[pIdx + 1];
  const modInicial = (param && esModuloValido(param)) ? param : moduloDefecto;
  switchPanel(modInicial, false);

  window.addEventListener('popstate', (e) => {
    const p = location.pathname.split('/').filter(Boolean);
    const idx = p.indexOf('personal');
    const paramMod = idx >= 0 && p[idx + 1];
    switchPanel(e.state?.modulo || (paramMod && esModuloValido(paramMod) ? paramMod : moduloDefecto), false);
  });

  // 3.1 Drawer Móvil Off-Canvas
  const sidebarMenu = document.getElementById('sidebarMenu');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const btnMobileToggle = document.getElementById('btnMobileSidebarToggle');
  const btnMobileClose = document.getElementById('btnMobileSidebarClose');

  function openMobileSidebar() {
    sidebarMenu?.classList.add('mobile-open');
    sidebarBackdrop?.classList.add('active');
    document.body.classList.add('ps-locked-scroll');
  }

  function closeMobileSidebar() {
    sidebarMenu?.classList.remove('mobile-open');
    sidebarBackdrop?.classList.remove('active');
    document.body.classList.remove('ps-locked-scroll');
  }

  btnMobileToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sidebarMenu?.classList.contains('mobile-open')) {
      closeMobileSidebar();
    } else {
      openMobileSidebar();
    }
  });

  btnMobileClose?.addEventListener('click', closeMobileSidebar);
  sidebarBackdrop?.addEventListener('click', closeMobileSidebar);

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      closeMobileSidebar();
      switchPanel(btn.getAttribute('data-panel-target'), true);
    });
  });

  document.querySelectorAll('[data-jump-to]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeDropdown();
      closeMobileSidebar();
      switchPanel(btn.getAttribute('data-jump-to'), true);
    });
  });

  // 4. Sidebar Colapsable (Desktop)
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

  // 5. Conmutador de Temas con wiTema
  document.getElementById('btnThemeToggle')?.addEventListener('click', () => {
    wiTema.toggle();
    const t = document.documentElement.dataset.theme;
    Notificacion(`Tema: ${t === 'futuro' ? 'Modo Futuro' : 'Modo Luz'}`, 'info', 1800);
  });

  // 6. Dropdown de Usuario
  const btnUser = document.getElementById('btnUserDropdownTrigger');
  const menuUser = document.getElementById('userDropdownMenu');

  function closeDropdown() {
    menuUser?.classList.remove('active');
    btnUser?.classList.remove('open');
  }

  btnUser?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menuUser?.classList.toggle('active');
    btnUser?.classList.toggle('open', open);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.ps-user-container')) closeDropdown();
  });

  // 7. Cierre de Sesión Seguro con wiConfirmar
  document.getElementById('btnLogoutSession')?.addEventListener('click', async () => {
    closeDropdown();
    const conf = await wiConfirmar('¿Estás seguro de que deseas salir de tu sesión administrativa?', {
      titulo: 'Cerrar Sesión',
      tipo: 'danger',
      siTexto: 'Sí, Salir'
    });
    if (conf) {
      Notificacion('Cerrando sesión...', 'info', 2000);
      setTimeout(salir, 600);
    }
  });

  // 9. Router Universal de Guardado con Atajo Ctrl+S / Cmd+S
  function ejecutarGuardadoUniversal() {
    // A. Prioridad 1: ¿Hay algún modal abierto con botón de guardar?
    const modalAbierto = document.querySelector('.modal-overlay.open, .modal-overlay.active, .modal.open, .modal.active');
    if (modalAbierto) {
      const btnGuardarModal = modalAbierto.querySelector('#prBtnGuardarModal, [id*="GuardarModal"], [id*="guardarModal"], [type="submit"]');
      if (btnGuardarModal && !btnGuardarModal.disabled) {
        btnGuardarModal.click();
        return;
      }
    }

    // B. Prioridad 2: Detectar el panel activo en pantalla
    const panelActivo = document.querySelector('.ps-panel.active') || document.querySelector('.ps-panel');
    const panelId = panelActivo?.id || '';

    if (panelId === 'panel-negocio') {
      const btn = document.getElementById('btnGuardarNegocio');
      if (btn && !btn.disabled) {
        btn.click();
        return;
      }
    }

    if (panelId === 'panel-productos') {
      Notificacion('Todos los productos y precios están guardados y actualizados.', 'info', 2000);
      return;
    }

    if (panelId === 'panel-notepad') {
      const btnNote = document.getElementById('btnSaveNotepadFull') || panelActivo.querySelector('button[type="submit"]');
      if (btnNote && !btnNote.disabled) {
        btnNote.click();
        return;
      }
    }

    // C. Fallback inteligente: buscar el botón de guardar o submit del panel activo
    const btnFallback = panelActivo?.querySelector('button[id*="Guardar"], button[id*="guardar"], button[type="submit"], .ps-btn-primary');
    if (btnFallback && !btnFallback.disabled) {
      btnFallback.click();
      return;
    }

    Notificacion('No hay cambios pendientes por guardar en este módulo.', 'info', 2000);
  }

  // Registrar el atajo universal para todo el panel (Ctrl+S / Cmd+S)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      ejecutarGuardadoUniversal();
    }
  });
}

export function actualizarBadgesSidebar() {
  const badgeClientes = document.getElementById('navBadge_clientes') || document.querySelector('[data-badge-target="clientes"]');
  if (!badgeClientes) return;

  try {
    const clientes = getls('minegocio_crm_clientes');
    if (Array.isArray(clientes)) {
      badgeClientes.textContent = String(clientes.length);
      return;
    }
  } catch (e) {}

  badgeClientes.textContent = '3';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarPersonal);
} else {
  inicializarPersonal();
}
