// src/feature/personal/personal.js
// Controlador de cliente unificado para Feature Personal (Gaswii Solgas Surquillo)
// 100% JS Nativo · Integrado con @widev y @/feature/auth/sesion.js

import { Notificacion, wiConfirmar, wiTema, getls, savels } from '@widev';
import { salir } from '@/feature/auth/sesion.js';
import { moduloDefecto, esModuloValido } from './modulos.js';

export function inicializarPersonal() {
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
    const nombre = user.nombre || user.usuario;

    if (avatar && (user.foto || user.avatar)) avatar.src = user.foto || user.avatar;
    if (topName && nombre) topName.textContent = nombre;
    if (dropName && nombre) dropName.textContent = nombre;
    if (dropEmail && user.email) dropEmail.textContent = user.email;
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

  navItems.forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.getAttribute('data-panel-target'), true));
  });

  document.querySelectorAll('[data-jump-to]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeDropdown();
      switchPanel(btn.getAttribute('data-jump-to'), true);
    });
  });

  // 4. Sidebar Colapsable
  const btnCollapse = document.getElementById('btnCollapseSidebar');
  const iconCollapse = document.getElementById('iconCollapse');
  const labelCollapse = document.getElementById('labelCollapse');

  btnCollapse?.addEventListener('click', () => {
    const isCollapsed = document.documentElement.classList.toggle('is-collapsed');
    savels('gaswii_sidebar_collapsed', isCollapsed);
    if (iconCollapse && labelCollapse) {
      iconCollapse.className = isCollapsed ? 'fa-solid fa-arrow-right-long' : 'fa-solid fa-arrow-left-long';
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarPersonal);
} else {
  inicializarPersonal();
}
