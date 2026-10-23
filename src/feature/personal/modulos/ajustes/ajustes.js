// src/feature/personal/modulos/ajustes/ajustes.js
// Controlador Frontend Autónomo del Módulo Ajustes
// Preferencias del Sistema, Temas, Alertas, Seguridad IP & Diagnóstico Local
// 100% JS Nativo · Integrado con @widev

import { Notificacion, wiSpin, wiIp, getls } from '@widev';
import { obtenerAjustes, guardarAjustes, generarBackupCompletoJson } from './dataAjustes.js';

export function inicializarModuloAjustes() {
  const panel = document.getElementById('panel-ajustes');
  if (!panel || panel.dataset.ajustesInit === 'true') return;
  panel.dataset.ajustesInit = 'true';

  // ── Elementos del DOM ──
  const themeSelector = document.getElementById('ajThemeSelector');
  const themeCards = themeSelector?.querySelectorAll('.aj-theme-card');
  const switchSonido = document.getElementById('ajSwitchSonido');
  const switchPush = document.getElementById('ajSwitchPush');
  const btnProbarNotif = document.getElementById('btnAjProbarNotif');
  const btnGuardar = document.getElementById('btnAjGuardar');
  const btnBackupJson = document.getElementById('btnAjBackupJson');

  // Seguridad & Sesión
  const secUsuario = document.getElementById('ajSecUsuario');
  const secIp = document.getElementById('ajSecIp');
  const secUbicacion = document.getElementById('ajSecUbicacion');
  const secIsp = document.getElementById('ajSecIsp');
  const secFecha = document.getElementById('ajSecFecha');

  // Diagnóstico
  const diagNavegador = document.getElementById('ajDiagNavegador');
  const diagSO = document.getElementById('ajDiagSO');
  const diagConexion = document.getElementById('ajDiagConexion');
  const diagCache = document.getElementById('ajDiagCache');

  // ════════════════════════════════════════════════════════════
  // 1. CARGA INICIAL DE PREFERENCIAS
  // ════════════════════════════════════════════════════════════
  function cargarAjustes() {
    const data = obtenerAjustes();

    if (switchSonido) switchSonido.checked = data.sonidoPedidos ?? true;
    if (switchPush) switchPush.checked = data.notificacionesWebPush ?? true;

    // Estado del tema activo
    const temaGuardado = localStorage.getItem('wiTema') || 'sistema';
    actualizarCardsTemaUI(temaGuardado);

    // Cargar seguridad de sesión y diagnóstico
    actualizarSeguridadSesion();
    actualizarDiagnostico();
  }

  // ════════════════════════════════════════════════════════════
  // 2. GESTIÓN Y CAMBIO DE TEMAS VISUALES
  // ════════════════════════════════════════════════════════════
  function actualizarCardsTemaUI(temaActivo) {
    if (!themeCards) return;
    themeCards.forEach(card => {
      const cardTema = card.getAttribute('data-tema');
      if (cardTema === temaActivo) {
        card.classList.add('is-active');
      } else {
        card.classList.remove('is-active');
      }
    });
  }

  function aplicarTema(tema) {
    if (tema === 'sistema') {
      try {
        localStorage.removeItem('wiTema');
      } catch (e) {}
      const esLuz = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      document.documentElement.dataset.theme = esLuz ? 'luz' : 'futuro';
    } else {
      try {
        localStorage.setItem('wiTema', tema);
      } catch (e) {}
      document.documentElement.dataset.theme = tema;
    }

    actualizarCardsTemaUI(tema);
    guardarAjustes({ temaPorDefecto: tema });
    Notificacion(`Tema ${tema.toUpperCase()} aplicado correctamente`, 'success', 2000);
  }

  themeCards?.forEach(card => {
    card.addEventListener('click', () => {
      const tema = card.getAttribute('data-tema');
      if (tema) aplicarTema(tema);
    });
  });

  // ════════════════════════════════════════════════════════════
  // 3. ALERTAS ACÚSTICAS Y NOTIFICACIONES NATIVAS
  // ════════════════════════════════════════════════════════════
  function reproducirChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (err) {
      // Audio context bloqueado o no soportado
    }
  }

  btnProbarNotif?.addEventListener('click', () => {
    reproducirChime();
    Notificacion('🔔 ¡Sonido de campana de alerta reproducido!', 'success', 2000);
  });

  switchSonido?.addEventListener('change', () => {
    const activo = switchSonido.checked;
    guardarAjustes({ sonidoPedidos: activo });
    if (activo) reproducirChime();
    Notificacion(
      activo ? 'Alertas sonoras activadas.' : 'Alertas sonoras silenciadas.',
      activo ? 'success' : 'warning',
      2000
    );
  });

  switchPush?.addEventListener('change', async () => {
    const activo = switchPush.checked;
    if (activo) {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            Notificacion('¡Permiso de notificaciones concedido por el navegador!', 'success', 2500);
            guardarAjustes({ notificacionesWebPush: true });
          } else {
            switchPush.checked = false;
            guardarAjustes({ notificacionesWebPush: false });
            Notificacion('No se concedieron permisos de notificación en el navegador.', 'warning', 3000);
          }
          return;
        } else if (Notification.permission === 'denied') {
          switchPush.checked = false;
          guardarAjustes({ notificacionesWebPush: false });
          Notificacion('Las notificaciones están bloqueadas en la configuración de tu navegador.', 'warning', 3500);
          return;
        }
      }
    }

    guardarAjustes({ notificacionesWebPush: activo });
    Notificacion(
      activo ? 'Notificaciones web activadas.' : 'Notificaciones web desactivadas.',
      activo ? 'success' : 'warning',
      2000
    );
  });

  // ════════════════════════════════════════════════════════════
  // 4. GUARDAR PREFERENCIAS GENERALES
  // ════════════════════════════════════════════════════════════
  btnGuardar?.addEventListener('click', () => {
    wiSpin(btnGuardar, true, 'Guardando...');

    setTimeout(() => {
      guardarAjustes({
        sonidoPedidos: switchSonido?.checked ?? true,
        notificacionesWebPush: switchPush?.checked ?? true
      });

      wiSpin(btnGuardar, false);
      Notificacion('¡Preferencias del sistema guardadas exitosamente!', 'success');
    }, 350);
  });

  // ════════════════════════════════════════════════════════════
  // 5. DESCARGA DE RESPALDO JSON SEGURO
  // ════════════════════════════════════════════════════════════
  btnBackupJson?.addEventListener('click', () => {
    const jsonStr = generarBackupCompletoJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${(window.Wii?.negocio?.nombreCorto || 'consultorio_psicologia').toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Notificacion('¡Copia de seguridad JSON descargada con éxito!', 'success', 2500);
  });

  // ════════════════════════════════════════════════════════════
  // 6. AUDITORÍA DE SEGURIDAD & SESIÓN IP (PUBLIC_IP_TOKEN)
  // ════════════════════════════════════════════════════════════
  async function actualizarSeguridadSesion() {
    // 1. Datos del usuario en sesión desde wiSmile
    const user = getls('wiSmile') || {};
    if (secUsuario) {
      const nombre = user.nombre || user.usuario || 'Wilder';
      const rol = user.rol ? `(${user.rol})` : '(gestor)';
      secUsuario.textContent = `${nombre} ${rol}`;
    }

    if (secFecha) {
      const ahora = new Date();
      secFecha.textContent = ahora.toLocaleDateString('es-PE', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      });
    }

    // 2. Telemetría de IP y geolocalización usando wiIp (con PUBLIC_IP_TOKEN)
    try {
      const ipData = await wiIp();
      if (ipData) {
        if (secIp) {
          secIp.innerHTML = `<i class="fa-solid fa-shield"></i> ${ipData.ip || '127.0.0.1'}`;
        }
        if (secUbicacion) {
          const partes = [ipData.city, ipData.region, ipData.country].filter(Boolean);
          secUbicacion.textContent = partes.join(', ') || 'Lima, PE';
        }
        if (secIsp) {
          secIsp.textContent = ipData.org || 'Red Local / Internet';
        }
      }
    } catch (e) {
      if (secIp) secIp.innerHTML = '<i class="fa-solid fa-shield"></i> 127.0.0.1';
      if (secUbicacion) secUbicacion.textContent = 'Lima, PE';
      if (secIsp) secIsp.textContent = 'Red Local';
    }
  }

  // ════════════════════════════════════════════════════════════
  // 7. DIAGNÓSTICO DEL SISTEMA Y NAVEGADOR (SOLO LECTURA)
  // ════════════════════════════════════════════════════════════
  function actualizarDiagnostico() {
    // Navegador
    if (diagNavegador) {
      const ua = navigator.userAgent;
      let browser = 'Navegador Web';
      if (ua.includes('Edg/')) browser = 'Microsoft Edge';
      else if (ua.includes('Chrome/')) browser = 'Google Chrome';
      else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
      else if (ua.includes('Safari/')) browser = 'Apple Safari';
      diagNavegador.textContent = browser;
    }

    // Plataforma / SO
    if (diagSO) {
      const ua = navigator.userAgent;
      let so = 'Dispositivo Estándar';
      if (ua.includes('Windows NT 10.0')) so = 'Windows 10 / 11 (64-bit)';
      else if (ua.includes('Windows')) so = 'Windows PC';
      else if (ua.includes('Macintosh')) so = 'macOS';
      else if (ua.includes('Android')) so = 'Android';
      else if (ua.includes('iPhone') || ua.includes('iPad')) so = 'iOS';
      else if (ua.includes('Linux')) so = 'Linux';
      diagSO.textContent = so;
    }

    // Caché Local
    if (diagCache) {
      try {
        const claves = Object.keys(localStorage).length;
        diagCache.textContent = `${claves} claves en caché local`;
      } catch (e) {
        diagCache.textContent = 'Almacenamiento Local Activo';
      }
    }

    // Conexión
    actualizarEstadoConexion();
  }

  function actualizarEstadoConexion() {
    if (!diagConexion) return;
    const online = navigator.onLine;
    diagConexion.className = `aj-badge-status ${online ? 'aj-badge-online' : 'aj-badge-tech'}`;
    diagConexion.innerHTML = online 
      ? '<i class="fa-solid fa-circle"></i> En línea' 
      : '<i class="fa-solid fa-circle-exclamation"></i> Fuera de línea';
  }

  window.addEventListener('online', actualizarEstadoConexion);
  window.addEventListener('offline', actualizarEstadoConexion);

  // ════════════════════════════════════════════════════════════
  // 8. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  cargarAjustes();
}
