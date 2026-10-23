// src/feature/redes/redes.js
// ⚡ Controlador Cliente para Feature Redes (Bio-Link Independiente)
// Integración con @widev (wiTema, Notificacion)

import { wiTema, Notificacion } from '@widev';
import { iniciarSincronizacionNegocio } from '../../core/servicios/hidratarNegocio.js';

export function initRedes() {
  // 1. Reactividad de Tema Luz / Futuro
  try {
    wiTema.listen();
  } catch (e) {}

  // 2. Hidratación y Sincronización en Vivo de Redes y Negocio
  try {
    iniciarSincronizacionNegocio();
  } catch (e) {}

  // 2. Botón Copiar Enlace
  const btnCopy = document.getElementById('btnCopiarEnlace');
  if (btnCopy && !btnCopy.dataset.listenerSet) {
    btnCopy.dataset.listenerSet = 'true';

    btnCopy.addEventListener('click', async (e) => {
      e.preventDefault();
      const url = window.location.href;
      const mensaje = btnCopy.dataset.toastMensaje || '¡Enlace copiado al portapapeles!';

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          // Fallback clásico
          const input = document.createElement('input');
          input.value = url;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
        }

        // Feedback Visual en Botón
        btnCopy.classList.add('copiado');
        const icono = btnCopy.querySelector('i');
        const iconoOriginal = icono ? icono.className : 'fa-regular fa-clone';

        if (icono) {
          icono.className = 'fa-solid fa-check';
        }

        // Notificación Toast Elegante
        try {
          Notificacion(mensaje, 'success');
        } catch (err) {
          console.log(mensaje);
        }

        // Restaurar botón después de 2.2 segundos
        setTimeout(() => {
          btnCopy.classList.remove('copiado');
          if (icono) {
            icono.className = iconoOriginal;
          }
        }, 2200);

      } catch (err) {
        console.error('Error al copiar enlace:', err);
        try {
          Notificacion('No se pudo copiar el enlace', 'error');
        } catch (e) {}
      }
    });
  }
}

// Inicialización en DOM y en navegación SPA de Astro
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRedes);
  } else {
    initRedes();
  }
  document.addEventListener('astro:page-load', initRedes);
}

export default initRedes;
