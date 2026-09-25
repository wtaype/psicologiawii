// src/feature/personal/modulos/whatsapp/whatsapp.js
// Controlador Frontend Autónomo del Módulo WhatsApp: Centro de Mensajería & Sandbox
// 100% JS Nativo · Integrado con @widev

import { Notificacion, wiSelect } from '@widev';
import { PLANTILLAS_WHATSAPP, formatearPlantilla } from './dataWhatsapp.js';

export function inicializarModuloWhatsapp() {
  const panel = document.getElementById('panel-whatsapp');
  if (!panel || panel.dataset.whatsappInit === 'true') return;
  panel.dataset.whatsappInit = 'true';

  let plantillaActualId = 'tpl_pedido_confirmado';

  // ── Elementos del DOM ──
  const templatesGrid = document.getElementById('waTemplatesGrid');
  const inpCliente = document.getElementById('waInpCliente');
  const inpCelular = document.getElementById('waInpCelular');
  const inpProducto = document.getElementById('waInpProducto');
  const inpMonto = document.getElementById('waInpMonto');
  const inpDireccion = document.getElementById('waInpDireccion');
  const inpChofer = document.getElementById('waInpChofer');
  const inpEta = document.getElementById('waInpEta');
  const textareaMensaje = document.getElementById('waTextareaMensaje');

  // ── Simulador Smartphone ──
  const chatBubbleText = document.getElementById('waChatBubbleText');
  const chatTime = document.getElementById('waChatTime');
  const btnOpenWs = document.getElementById('btnWaOpenWs');
  const btnCopy = document.getElementById('btnWaCopy');

  // ════════════════════════════════════════════════════════════
  // 1. RECOGER PARÁMETROS Y FORMATEAR MENSAJE EN VIVO
  // ════════════════════════════════════════════════════════════
  function obtenerValoresParametros() {
    return {
      cliente: inpCliente?.value?.trim() || 'Wilder Taype',
      producto: inpProducto?.value?.trim() || 'Balón SOLGAS Premium 10 kg',
      monto: inpMonto?.value?.trim() || '65.00',
      metodoPago: 'Yape / Plin',
      direccion: inpDireccion?.value?.trim() || 'Jr. Dante 260, Surquillo',
      chofer: inpChofer?.value?.trim() || 'Juan Quispe (Móvil 02)',
      eta: inpEta?.value?.trim() || '12–15',
      comprobanteTipo: 'Boleta de Venta',
      comprobanteNumero: 'B001-000483',
      fecha: '25 Sep 2026',
      documentoTipo: 'DNI',
      documento: '71779978'
    };
  }

  function actualizarPreviewMensaje(sobrescribirConPlantilla = false) {
    const tpl = PLANTILLAS_WHATSAPP.find(t => t.id === plantillaActualId);
    if (!tpl) return;

    let textoFinal = '';
    if (sobrescribirConPlantilla || !textareaMensaje?.dataset.manualEdit) {
      const vals = obtenerValoresParametros();
      textoFinal = formatearPlantilla(tpl.mensaje, vals);
      if (textareaMensaje) {
        textareaMensaje.value = textoFinal;
        delete textareaMensaje.dataset.manualEdit;
      }
    } else {
      textoFinal = textareaMensaje?.value || '';
    }

    if (chatBubbleText) {
      chatBubbleText.textContent = textoFinal;
    }

    if (chatTime) {
      const now = new Date();
      const horas = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      chatTime.textContent = `${horas}:${mins}`;
    }
  }

  // ════════════════════════════════════════════════════════════
  // 2. RENDERIZADO DEL SELECTOR DE PLANTILLAS
  // ════════════════════════════════════════════════════════════
  function renderizarPlantillas() {
    if (!templatesGrid) return;
    templatesGrid.innerHTML = PLANTILLAS_WHATSAPP.map(tpl => {
      const isActive = tpl.id === plantillaActualId;
      return `
        <div class="wa-tpl-card ${isActive ? 'active' : ''}" data-id="${tpl.id}">
          <div class="wa-tpl-head">
            <i class="${tpl.icono}"></i>
            <span>${tpl.nombre}</span>
          </div>
          <div class="wa-tpl-desc">${tpl.descripcion}</div>
        </div>
      `;
    }).join('');

    templatesGrid.querySelectorAll('.wa-tpl-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        plantillaActualId = id;
        templatesGrid.querySelectorAll('.wa-tpl-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        if (textareaMensaje) delete textareaMensaje.dataset.manualEdit;
        actualizarPreviewMensaje(true);
      });
    });
  }

  // Listeners de actualización en vivo para cada input
  [inpCliente, inpProducto, inpMonto, inpDireccion, inpChofer, inpEta].forEach(el => {
    el?.addEventListener('input', () => {
      if (textareaMensaje) delete textareaMensaje.dataset.manualEdit;
      actualizarPreviewMensaje();
    });
  });

  textareaMensaje?.addEventListener('input', () => {
    textareaMensaje.dataset.manualEdit = 'true';
    if (chatBubbleText) chatBubbleText.textContent = textareaMensaje.value;
  });

  // ════════════════════════════════════════════════════════════
  // 3. ACCIONES DE DISPARO (WA.ME Y COPIAR)
  // ════════════════════════════════════════════════════════════
  btnOpenWs?.addEventListener('click', () => {
    const cel = inpCelular?.value?.replace(/\D/g, '') || '';
    const texto = textareaMensaje?.value || '';

    if (!texto.trim()) {
      Notificacion('El mensaje a enviar no puede estar vacío.', 'warning');
      return;
    }

    const url = cel 
      ? `https://wa.me/51${cel}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;

    window.open(url, '_blank');
  });

  btnCopy?.addEventListener('click', async () => {
    const texto = textareaMensaje?.value || '';
    if (!texto.trim()) return;

    try {
      await navigator.clipboard.writeText(texto);
      Notificacion('¡Mensaje copiado al portapapeles!', 'success');
    } catch (e) {
      Notificacion('No se pudo copiar automáticamente al portapapeles.', 'info');
    }
  });

  // ════════════════════════════════════════════════════════════
  // 4. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  renderizarPlantillas();
  actualizarPreviewMensaje(true);
}
