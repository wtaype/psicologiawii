// src/actualizar.js
// 🚀 Gestor Centralizado de Re-Deploy en Cloudflare y Sincronización Web
// Con Debounce Inteligente, Notificaciones Breves y Cero Bloqueo

let _timerDebounce = null;
let _cocinando = false;

/**
 * Solicita una actualización y re-deploy a Cloudflare con debounce inteligente
 * @param {Object} opciones
 * @param {string} opciones.motivo - Motivo descriptivo del cambio ('negocio', 'productos-precio', etc.)
 * @param {number} opciones.debounceMs - Tiempo de espera para consolidar cambios rápidos (default: 4000ms)
 * @param {boolean} opciones.silencioso - Si es true, omite la notificación visual
 */
export function solicitarActualizacionWeb({
  motivo = 'actualización',
  debounceMs = 4000,
  silencioso = false
} = {}) {
  // Cancelar temporizador previo si se siguen haciendo cambios rápidos (evita spam de builds)
  if (_timerDebounce) {
    clearTimeout(_timerDebounce);
  }

  _timerDebounce = setTimeout(async () => {
    const hookUrl = import.meta.env.PUBLIC_CLOUDFLARE_DEPLOY_HOOK;
    if (!hookUrl) {
      console.warn('[actualizar.js] No se encontró PUBLIC_CLOUDFLARE_DEPLOY_HOOK en .env');
      return;
    }

    try {
      _cocinando = true;

      // Notificación breve y profesional solicitada
      if (!silencioso && typeof window !== 'undefined' && window.Notificacion) {
        window.Notificacion('Actualizando nueva version (max 2min)', 'info', 3500);
      }

      await fetch(hookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' }
      });

      console.log(`[actualizar.js] Re-deploy solicitado con éxito: [${motivo}]`);
    } catch (err) {
      console.warn('[actualizar.js] Error al solicitar deploy:', err?.message || err);
    } finally {
      _cocinando = false;
    }
  }, debounceMs);
}

export default { solicitarActualizacionWeb };
