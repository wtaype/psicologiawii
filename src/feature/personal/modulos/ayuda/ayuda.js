// src/feature/personal/modulos/ayuda/ayuda.js
// 🎧 Módulo de Ayuda y Mesa de Ayuda: Generador de Tickets de Soporte Técnico
// 100% JS Nativo · Integrado con @widev y Resend API

import { Notificacion, getls, savels } from '@widev';
import { enviarCorreo } from '../correo/dataCorreo.js';
import { obtenerNegocioLocal } from '../negocio/dataNegocio.js';

const STORAGE_KEY_TICKETS = 'wi_tickets_soporte';
const OLD_STORAGE_KEY_TICKETS = 'wi_tickets_soporte_legacy';

/**
 * Obtiene el historial de tickets guardados en localStorage
 */
export function obtenerTicketsLocales() {
  const lista = getls(STORAGE_KEY_TICKETS) || getls(OLD_STORAGE_KEY_TICKETS);
  return Array.isArray(lista) ? lista : [];
}

/**
 * Guarda un nuevo ticket en localStorage
 */
function guardarTicketLocal(ticket) {
  const lista = obtenerTicketsLocales();
  lista.unshift(ticket);
  savels(STORAGE_KEY_TICKETS, lista);
  return lista;
}

/**
 * Genera un código de ticket único (ej: TK-2026-4821)
 */
function generarCodigoTicket() {
  const anio = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TK-${anio}-${num}`;
}

/**
 * Obtiene la información técnica del entorno del cliente
 */
function obtenerDiagnosticoSistema() {
  const user = getls('wiSmile') || {};
  const negocio = obtenerNegocioLocal() || {};
  return {
    usuario: user.nombre || user.usuario || 'Usuario Personal',
    emailUsuario: user.email || negocio.identidad?.email || '',
    rol: user.rol || 'Administrador',
    navegador: navigator.userAgent,
    pantalla: `${window.innerWidth}x${window.innerHeight} (Monitor: ${screen.width}x${screen.height})`,
    plataforma: navigator.platform || 'Desconocido',
    conexion: navigator.onLine ? 'En línea (Online)' : 'Sin conexión (Offline)',
    tema: document.documentElement.getAttribute('data-theme') || 'oscuro',
    url: window.location.href,
    fecha: new Date().toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };
}

/**
 * Genera el cuerpo HTML premium para el correo de ticket
 */
function generarHtmlTicket({ codigo, asunto, categoria, prioridad, descripcion, diag }) {
  const colorPrioridad = {
    Baja: '#22c55e',
    Media: '#3b82f6',
    Alta: '#f59e0b',
    Urgente: '#ef4444'
  }[prioridad] || '#3b82f6';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1321; color: #e2e8f0; margin: 0; padding: 24px; }
      .tk-container { max-width: 620px; margin: 0 auto; background: #0e192c; border: 1px solid #21314b; border-radius: 12px; overflow: hidden; }
      .tk-header { background: #142542; padding: 20px 24px; border-bottom: 2px solid #3b82f6; display: flex; align-items: center; justify-content: space-between; }
      .tk-title { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0; }
      .tk-badge { background: ${colorPrioridad}; color: #ffffff; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
      .tk-body { padding: 24px; }
      .tk-section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin: 18px 0 8px; font-weight: 700; }
      .tk-desc-box { background: #14223a; border: 1px solid #21314b; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #f1f5f9; white-space: pre-wrap; }
      .tk-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
      .tk-table td { padding: 8px 12px; border-bottom: 1px solid #1c2b42; color: #cbd5e1; }
      .tk-table td:first-child { font-weight: 600; color: #94a3b8; width: 35%; }
      .tk-footer { background: #09101b; padding: 14px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1c2b42; }
    </style>
  </head>
  <body>
    <div class="tk-container">
      <div class="tk-header">
        <h1 class="tk-title">🎧 Soporte Técnico · Ticket ${codigo}</h1>
        <span class="tk-badge">${prioridad}</span>
      </div>
      <div class="tk-body">
        <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #ffffff;">
          ${asunto}
        </p>

        <div class="tk-section-title">Descripción del Incidente / Consulta</div>
        <div class="tk-desc-box">${descripcion}</div>

        <div class="tk-section-title">Datos del Solicitante</div>
        <table class="tk-table">
          <tr><td>Usuario:</td><td>${diag.usuario} (${diag.rol})</td></tr>
          <tr><td>Correo Solicitante:</td><td>${diag.emailUsuario}</td></tr>
          <tr><td>Categoría:</td><td>${categoria}</td></tr>
          <tr><td>Fecha y Hora:</td><td>${diag.fecha}</td></tr>
        </table>

        <div class="tk-section-title">Diagnóstico Técnico del Sistema</div>
        <table class="tk-table">
          <tr><td>URL / Módulo:</td><td>${diag.url}</td></tr>
          <tr><td>Resolución:</td><td>${diag.pantalla}</td></tr>
          <tr><td>Conexión:</td><td>${diag.conexion}</td></tr>
          <tr><td>Tema / UI:</td><td>${diag.tema}</td></tr>
          <tr><td>Navegador:</td><td style="font-size: 11px; word-break: break-all;">${diag.navegador}</td></tr>
        </table>
      </div>
      <div class="tk-footer">
        Enviado automáticamente desde el Panel de Gestión · ${obtenerNegocioLocal()?.identidad?.nombreComercial || 'Gestión'}
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Renderiza la lista de historial en el DOM
 */
export function renderizarHistorialTickets() {
  const contenedor = document.getElementById('ayudaHistorialLista');
  const contadorEl = document.getElementById('ayudaHistorialCount');
  if (!contenedor) return;

  const tickets = obtenerTicketsLocales();
  if (contadorEl) contadorEl.textContent = tickets.length.toString();

  if (tickets.length === 0) {
    contenedor.innerHTML = `
      <div class="ay-empty-state">
        <i class="fa-solid fa-ticket-simple ay-empty-icon"></i>
        <p class="ay-empty-title">Aún no has generado tickets</p>
        <p class="ay-empty-sub">Completa el formulario lateral para enviar un reporte técnico directo a nuestro equipo.</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = tickets.map(t => {
    const colorBadge = {
      Baja: 'ay-badge-success',
      Media: 'ay-badge-info',
      Alta: 'ay-badge-warning',
      Urgente: 'ay-badge-danger'
    }[t.prioridad] || 'ay-badge-info';

    return `
      <div class="ay-ticket-item" data-ticket-id="${t.codigo}">
        <div class="ay-ticket-item-top">
          <span class="ay-ticket-code">${t.codigo}</span>
          <span class="ay-badge ${colorBadge}">${t.prioridad}</span>
          <span class="ay-ticket-date">${t.fechaLegible || t.fecha}</span>
        </div>
        <div class="ay-ticket-subject">${t.asunto}</div>
        <div class="ay-ticket-cat"><i class="fa-solid fa-tag"></i> ${t.categoria}</div>
        <div class="ay-ticket-desc">${t.descripcion}</div>
        <div class="ay-ticket-footer">
          <span class="ay-ticket-status"><i class="fa-solid fa-circle-check"></i> Enviado a soporte</span>
          <span class="ay-ticket-user"><i class="fa-solid fa-user"></i> ${t.usuario}</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Inicializador del Módulo de Ayuda
 */
export function inicializarModuloAyuda() {
  const panel = document.getElementById('panel-ayuda');
  if (!panel) return;

  // Renderizar historial inicial
  renderizarHistorialTickets();

  // Si ya fue inicializado, evitar duplicar listeners
  if (panel.getAttribute('data-ayuda-init') === 'true') return;
  panel.setAttribute('data-ayuda-init', 'true');

  const form = document.getElementById('formNuevoTicket');
  const btnEnviar = document.getElementById('btnEnviarTicket');

  if (form && btnEnviar) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const asuntoInp = document.getElementById('tkAsunto');
      const categoriaInp = document.getElementById('tkCategoria');
      const prioridadInp = document.getElementById('tkPrioridad');
      const descripcionInp = document.getElementById('tkDescripcion');

      const asunto = asuntoInp?.value?.trim() || '';
      const categoria = categoriaInp?.value || 'Soporte Técnico';
      const prioridad = prioridadInp?.value || 'Media';
      const descripcion = descripcionInp?.value?.trim() || '';

      if (!asunto) {
        Notificacion?.advertencia ? Notificacion.advertencia('Por favor, ingresa el asunto del ticket.') : alert('Ingresa el asunto del ticket.');
        asuntoInp?.focus();
        return;
      }

      if (!descripcion || descripcion.length < 10) {
        Notificacion?.advertencia ? Notificacion.advertencia('Por favor, detalla el problema con al menos 10 caracteres.') : alert('Detalla el problema.');
        descripcionInp?.focus();
        return;
      }

      // Deshabilitar botón durante el envío
      const textoOriginal = btnEnviar.innerHTML;
      btnEnviar.disabled = true;
      btnEnviar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Despachando ticket...';

      try {
        const codigo = generarCodigoTicket();
        const diag = obtenerDiagnosticoSistema();
        const html = generarHtmlTicket({
          codigo,
          asunto,
          categoria,
          prioridad,
          descripcion,
          diag
        });

        // Despachar vía servicio de correo
        const emailDestino = obtenerNegocioLocal()?.contacto?.emailSoporte || obtenerNegocioLocal()?.identidad?.email || 'soporte@widominio.com';
        await enviarCorreo({
          para: emailDestino,
          asunto: `[Ticket ${codigo}] ${asunto} - ${diag.usuario}`,
          mensaje: descripcion,
          html,
          tipo: 'soporte'
        });

        // Registrar en historial local
        guardarTicketLocal({
          codigo,
          asunto,
          categoria,
          prioridad,
          descripcion,
          usuario: diag.usuario,
          fecha: new Date().toISOString(),
          fechaLegible: diag.fecha,
          estado: 'Enviado'
        });

        // Limpiar formulario y re-renderizar
        form.reset();
        renderizarHistorialTickets();

        if (Notificacion?.exito) {
          Notificacion.exito(`¡Ticket ${codigo} enviado exitosamente a soporte!`);
        } else {
          alert(`¡Ticket ${codigo} enviado con éxito!`);
        }
      } catch (err) {
        console.error('[Ayuda] Error al enviar ticket:', err);
        const errMsg = err?.message || 'Error al conectar con el servidor de correo.';
        if (Notificacion?.error) {
          Notificacion.error(`No se pudo enviar el ticket: ${errMsg}`);
        } else {
          alert(`Error: ${errMsg}`);
        }
      } finally {
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
      }
    });
  }
}
