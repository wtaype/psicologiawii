// src/feature/personal/modulos/aprender/aprender.js
// Controlador de interactividad para el Módulo Aprender (Layout Split Master-Detail)
// 100% JS Nativo · Integrado con @widev (Notificacion) · Cero dependencias pesadas

import { Notificacion } from '@widev';

export function inicializarAprender() {
  const panel = document.getElementById('panel-aprender');
  if (!panel || panel.dataset.aprenderInit === 'true') return;
  panel.dataset.aprenderInit = 'true';

  const navBtns = panel.querySelectorAll('.ap-nav-item-btn');
  const detailCards = panel.querySelectorAll('.ap-detail-card');
  const searchInput = document.getElementById('aprenderSearchInput');
  const searchCounter = document.getElementById('aprenderSearchCounter');

  // 1. GESTIÓN DE SELECCIÓN DE TEMAS (MASTER-DETAIL SWITCH)
  function seleccionarTema(temaId) {
    if (!temaId) return;

    // Actualizar botones de navegación lateral
    navBtns.forEach((btn) => {
      const match = btn.getAttribute('data-tema-id') === temaId;
      btn.classList.toggle('is-active', match);
    });

    // Actualizar panel de detalle activo
    detailCards.forEach((card) => {
      const match = card.getAttribute('data-card-tema') === temaId;
      card.classList.toggle('is-active', match);
    });

    // En pantallas pequeñas/móviles, scroll suave hacia el detalle
    if (window.innerWidth <= 860) {
      const targetCard = panel.querySelector(`#detail-${temaId}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const temaId = btn.getAttribute('data-tema-id');
      seleccionarTema(temaId);
    });
  });

  // 2. BUSCADOR EN VIVO DE TEMAS Y GUÍAS
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      let visibles = 0;
      let primerVisibleId = null;

      navBtns.forEach((btn) => {
        const temaId = btn.getAttribute('data-tema-id');
        const card = panel.querySelector(`#detail-${temaId}`);
        const textoBusqueda = `${btn.textContent} ${card ? card.textContent : ''}`.toLowerCase();

        const coincide = !q || textoBusqueda.includes(q);
        btn.style.display = coincide ? 'flex' : 'none';

        if (coincide) {
          visibles++;
          if (!primerVisibleId) primerVisibleId = temaId;
        }
      });

      // Actualizar contador visual
      if (searchCounter) {
        searchCounter.innerHTML = q 
          ? `<span>${visibles} encontrados</span>` 
          : `<span>${navBtns.length} temas oficiales</span>`;
      }

      // Si el tema actualmente activo quedó oculto, seleccionar el primer visible
      const activoActual = panel.querySelector('.ap-nav-item-btn.is-active');
      if (activoActual && activoActual.style.display === 'none' && primerVisibleId) {
        seleccionarTema(primerVisibleId);
      }
    });
  }

    // 3. ACORDEÓN DE PREGUNTAS FRECUENTES (FAQ)
    panel.querySelectorAll('.ap-faq-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.ap-faq-item');
        if (!item) return;
        const isOpen = item.classList.contains('is-open');
        item.classList.toggle('is-open', !isOpen);
      });
    });

    // 4. COPIADO RÁPIDO DE ENLACES AL PORTAPAPELES
    panel.querySelectorAll('[data-copy-path]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const path = btn.getAttribute('data-copy-path') || '/';
      const fullUrl = path.startsWith('http') ? path : `${window.location.origin}${path}`;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(fullUrl);
        } else {
          const ta = document.createElement('textarea');
          ta.value = fullUrl;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }

        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> <span>¡Copiado!</span>';
        btn.classList.add('ap-btn-footer-primary');

        Notificacion(`Enlace copiado: ${fullUrl}`, 'success', 2500);

        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.classList.remove('ap-btn-footer-primary');
        }, 1800);
      } catch (err) {
        console.error('Error al copiar:', err);
        Notificacion('No se pudo copiar el enlace', 'warning', 2500);
      }
    });
  });
}

// Inicialización automática
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAprender);
} else {
  inicializarAprender();
}

document.addEventListener('astro:page-load', inicializarAprender);

export default {
  inicializarAprender
};
